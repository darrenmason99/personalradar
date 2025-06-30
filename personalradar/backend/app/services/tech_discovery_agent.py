import asyncio
from curl_cffi.requests import AsyncSession
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import openai
from ..models.news_source import NewsSource
from ..models.technology_discovery import TechnologyDiscoveryCreate
from ..services.news_source_service import NewsSourceService
from ..services.technology_discovery_service import TechnologyDiscoveryService
from ..core.config import settings

logger = logging.getLogger(__name__)

class TechDiscoveryAgent:
    def __init__(self, news_source_service: NewsSourceService, discovery_service: TechnologyDiscoveryService):
        self.news_source_service = news_source_service
        self.discovery_service = discovery_service
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
    async def discover_technologies_from_source(self, news_source: NewsSource) -> List[TechnologyDiscoveryCreate]:
        """Main method to discover technologies from a news source"""
        try:
            logger.info(f"Starting technology discovery for {news_source.name}")
            
            # Scrape articles from the news source
            articles = await self._scrape_articles(news_source.url)
            logger.info(f"Found {len(articles)} articles from {news_source.name}")
            
            discoveries = []
            
            for article in articles:
                try:
                    # Extract technologies from each article using AI
                    article_discoveries = await self._extract_technologies_from_article(
                        article, news_source
                    )
                    discoveries.extend(article_discoveries)
                except Exception as e:
                    logger.error(f"Error processing article {article.get('url', 'unknown')}: {e}")
                    continue
            
            # Filter out duplicates and save discoveries
            unique_discoveries = await self._deduplicate_discoveries(discoveries, news_source.id)
            
            # Save to database
            saved_discoveries = []
            for discovery in unique_discoveries:
                try:
                    saved_discovery = await self.discovery_service.create_discovery(discovery)
                    saved_discoveries.append(saved_discovery)
                except Exception as e:
                    logger.error(f"Error saving discovery {discovery.name}: {e}")
            
            logger.info(f"Successfully discovered {len(saved_discoveries)} new technologies from {news_source.name}")
            return saved_discoveries
            
        except Exception as e:
            logger.error(f"Error discovering technologies from {news_source.name}: {e}")
            return []

    async def _scrape_articles(self, base_url: str) -> List[Dict[str, Any]]:
        """Scrape articles from a news source"""
        try:
            async with AsyncSession() as session:
                response = await session.get(base_url, impersonate="chrome120", timeout=30)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch {base_url}: {response.status_code}")
                    return []
                
                html = response.text
                soup = BeautifulSoup(html, 'html.parser')
                
                articles = []
                
                # Common selectors for article links
                selectors = [
                    'a[href*="/article"]',
                    'a[href*="/post"]',
                    'a[href*="/story"]',
                    'a[href*="/news"]',
                    'article a',
                    '.article a',
                    '.post a',
                    '.story a'
                ]
                
                for selector in selectors:
                    links = soup.select(selector)
                    for link in links[:20]:  # Limit to first 20 articles
                        href = link.get('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            title = link.get_text(strip=True)
                            
                            if self._is_valid_article_url(full_url, base_url) and title:
                                articles.append({
                                    'url': full_url,
                                    'title': title,
                                    'base_url': base_url
                                })
                
                # Remove duplicates
                unique_articles = []
                seen_urls = set()
                for article in articles:
                    if article['url'] not in seen_urls:
                        unique_articles.append(article)
                        seen_urls.add(article['url'])
                
                return unique_articles[:10]  # Return max 10 articles
                
        except Exception as e:
            logger.error(f"Error scraping {base_url}: {e}")
            return []

    async def _extract_technologies_from_article(self, article: Dict[str, Any], news_source: NewsSource) -> List[TechnologyDiscoveryCreate]:
        """Use AI to extract technologies from an article"""
        try:
            # Get article content
            content = await self._get_article_content(article['url'])
            if not content:
                return []
            
            # Use AI to extract technologies
            technologies = await self._ai_extract_technologies(
                article['title'], 
                content, 
                article['url']
            )
            
            discoveries = []
            for tech in technologies:
                discovery = TechnologyDiscoveryCreate(
                    name=tech['name'],
                    description=tech['description'],
                    source_url=news_source.url,
                    news_source_id=news_source.id,
                    discovered_at=datetime.utcnow(),
                    article_title=article['title'],
                    article_url=article['url'],
                    confidence_score=tech['confidence'],
                    category=tech['category']
                )
                discoveries.append(discovery)
            
            return discoveries
            
        except Exception as e:
            logger.error(f"Error extracting technologies from article: {e}")
            return []

    async def _get_article_content(self, url: str) -> Optional[str]:
        """Get the main content of an article"""
        try:
            async with AsyncSession() as session:
                response = await session.get(url, impersonate="chrome120", timeout=30)
                if response.status_code != 200:
                    return None
                
                html = response.text
                soup = BeautifulSoup(html, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Try to find main content
                content_selectors = [
                    'article',
                    '.article-content',
                    '.post-content',
                    '.story-content',
                    '.entry-content',
                    'main',
                    '.content'
                ]
                
                content = ""
                for selector in content_selectors:
                    elements = soup.select(selector)
                    if elements:
                        content = ' '.join([elem.get_text() for elem in elements])
                        break
                
                if not content:
                    # Fallback to body text
                    content = soup.get_text()
                
                # Clean up content
                content = re.sub(r'\s+', ' ', content).strip()
                return content[:5000]  # Limit content length
        
        except Exception as e:
            logger.error(f"Error getting article content from {url}: {e}")
            return None

    async def _ai_extract_technologies(self, title: str, content: str, url: str) -> List[Dict[str, Any]]:
        """Use OpenAI to extract technologies from article content"""
        try:
            prompt = f"""
            Analyze the following technology article and extract any new or emerging technologies mentioned.
            
            Article Title: {title}
            Article URL: {url}
            Article Content: {content[:3000]}
            
            For each technology you identify, provide:
            1. Technology name (be specific)
            2. Brief description of what it is/does
            3. Category (AI/ML, Programming Language, Framework, Tool, Platform, Database, etc.)
            4. Confidence score (0.0-1.0) based on how clearly it's described
            
            Only include technologies that are:
            - New or emerging
            - Clearly described in the article
            - Not just mentioned in passing
            
            Return your response as a JSON array of objects with these fields:
            - name: string
            - description: string
            - category: string
            - confidence: float (0.0-1.0)
            
            If no relevant technologies are found, return an empty array.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a technology analyst. Extract only new or emerging technologies from articles. Be precise and avoid false positives."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            result = response.choices[0].message.content
            if result:
                import json
                try:
                    technologies = json.loads(result)
                    if isinstance(technologies, list):
                        return technologies
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse AI response as JSON: {result}")
            
            return []
            
        except Exception as e:
            logger.error(f"Error in AI extraction: {e}")
            return []

    async def _deduplicate_discoveries(self, discoveries: List[TechnologyDiscoveryCreate], news_source_id: str) -> List[TechnologyDiscoveryCreate]:
        """Remove duplicate discoveries based on name and source"""
        # Get existing discoveries for this source
        existing_discoveries = await self.discovery_service.list_discoveries(news_source_id=news_source_id)
        existing_names = {d.name.lower() for d in existing_discoveries}
        
        unique_discoveries = []
        seen_names = set()
        
        for discovery in discoveries:
            name_lower = discovery.name.lower()
            if name_lower not in existing_names and name_lower not in seen_names:
                unique_discoveries.append(discovery)
                seen_names.add(name_lower)
        
        return unique_discoveries

    def _is_valid_article_url(self, url: str, base_url: str) -> bool:
        """Check if URL is a valid article URL"""
        try:
            parsed_url = urlparse(url)
            parsed_base = urlparse(base_url)
            
            # Must be from same domain
            if parsed_url.netloc != parsed_base.netloc:
                return False
            
            # Must have a path (not just domain)
            if not parsed_url.path or parsed_url.path == '/':
                return False
            
            # Avoid common non-article paths
            exclude_patterns = [
                '/tag/', '/category/', '/author/', '/about/', '/contact/',
                '/privacy/', '/terms/', '/login/', '/signup/', '/search'
            ]
            
            for pattern in exclude_patterns:
                if pattern in parsed_url.path:
                    return False
            
            return True
            
        except Exception:
            return False

    async def run_discovery_for_all_sources(self) -> Dict[str, List[TechnologyDiscoveryCreate]]:
        """Run technology discovery for all active news sources"""
        try:
            # Get all active news sources
            news_sources = await self.news_source_service.list_news_sources()
            active_sources = [source for source in news_sources if source.is_active]
            
            results = {}
            
            for source in active_sources:
                try:
                    discoveries = await self.discover_technologies_from_source(source)
                    results[source.name] = discoveries
                    
                    # Update last checked time
                    await self.news_source_service.update_last_checked(source.id)
                    
                except Exception as e:
                    logger.error(f"Error processing source {source.name}: {e}")
                    results[source.name] = []
            
            return results
            
        except Exception as e:
            logger.error(f"Error in run_discovery_for_all_sources: {e}")
            return {} 