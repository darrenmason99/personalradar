from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from ...models.technology_discovery import TechnologyDiscovery, TechnologyDiscoveryCreate
from ...services.technology_discovery_service import TechnologyDiscoveryService
from ...services.news_source_service import NewsSourceService
from ...services.tech_discovery_agent import TechDiscoveryAgent
from ...core.database import get_database

router = APIRouter()

async def get_discovery_service() -> TechnologyDiscoveryService:
    db = await get_database()
    return TechnologyDiscoveryService(db)

async def get_news_source_service() -> NewsSourceService:
    db = await get_database()
    return NewsSourceService(db)

async def get_discovery_agent() -> TechDiscoveryAgent:
    db = await get_database()
    discovery_service = TechnologyDiscoveryService(db)
    news_source_service = NewsSourceService(db)
    return TechDiscoveryAgent(news_source_service, discovery_service)

@router.get("/", response_model=List[TechnologyDiscovery])
async def list_discoveries(
    news_source_id: Optional[str] = Query(None, description="Filter by news source ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_confidence: Optional[float] = Query(0.0, description="Minimum confidence score"),
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """List technology discoveries with optional filters"""
    if category:
        discoveries = await discovery_service.get_discoveries_by_category(category)
    elif min_confidence > 0.0:
        discoveries = await discovery_service.get_high_confidence_discoveries(min_confidence)
    else:
        discoveries = await discovery_service.list_discoveries(news_source_id, status)
    
    return discoveries

@router.get("/{discovery_id}", response_model=TechnologyDiscovery)
async def get_discovery(
    discovery_id: str,
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Get a specific technology discovery"""
    discovery = await discovery_service.get_discovery(discovery_id)
    if not discovery:
        raise HTTPException(status_code=404, detail="Discovery not found")
    return discovery

@router.post("/", response_model=TechnologyDiscovery)
async def create_discovery(
    discovery: TechnologyDiscoveryCreate,
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Create a new technology discovery"""
    return await discovery_service.create_discovery(discovery)

@router.patch("/{discovery_id}/status")
async def update_discovery_status(
    discovery_id: str,
    status: str,
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Update the status of a technology discovery"""
    discovery = await discovery_service.update_discovery_status(discovery_id, status)
    if not discovery:
        raise HTTPException(status_code=404, detail="Discovery not found")
    return discovery

@router.delete("/{discovery_id}")
async def delete_discovery(
    discovery_id: str,
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Delete a technology discovery"""
    success = await discovery_service.delete_discovery(discovery_id)
    if not success:
        raise HTTPException(status_code=404, detail="Discovery not found")
    return {"message": "Discovery deleted successfully"}

@router.post("/run-discovery")
async def run_technology_discovery(
    news_source_id: Optional[str] = Query(None, description="Run discovery for specific news source"),
    agent: TechDiscoveryAgent = Depends(get_discovery_agent),
    news_source_service: NewsSourceService = Depends(get_news_source_service)
):
    """Run technology discovery for news sources"""
    try:
        if news_source_id:
            # Run discovery for specific source
            news_source = await news_source_service.get_news_source(news_source_id)
            if not news_source:
                raise HTTPException(status_code=404, detail="News source not found")
            
            discoveries = await agent.discover_technologies_from_source(news_source)
            return {
                "message": f"Discovery completed for {news_source.name}",
                "discoveries_count": len(discoveries),
                "discoveries": discoveries
            }
        else:
            # Run discovery for all active sources
            results = await agent.run_discovery_for_all_sources()
            total_discoveries = sum(len(discoveries) for discoveries in results.values())
            
            return {
                "message": "Discovery completed for all active sources",
                "total_discoveries": total_discoveries,
                "results_by_source": results
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")

@router.get("/new-since/{news_source_id}")
async def get_new_discoveries_since(
    news_source_id: str,
    days: int = Query(7, description="Number of days to look back"),
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Get new discoveries for a news source since a specific date"""
    since_date = datetime.utcnow() - timedelta(days=days)
    discoveries = await discovery_service.get_new_discoveries_since(news_source_id, since_date)
    return {
        "news_source_id": news_source_id,
        "since_date": since_date.isoformat(),
        "discoveries_count": len(discoveries),
        "discoveries": discoveries
    }

@router.get("/stats/summary")
async def get_discovery_stats(
    discovery_service: TechnologyDiscoveryService = Depends(get_discovery_service)
):
    """Get summary statistics for technology discoveries"""
    all_discoveries = await discovery_service.list_discoveries()
    
    # Calculate stats
    total_discoveries = len(all_discoveries)
    by_status = {}
    by_category = {}
    by_confidence = {"high": 0, "medium": 0, "low": 0}
    
    for discovery in all_discoveries:
        # Status stats
        by_status[discovery.status] = by_status.get(discovery.status, 0) + 1
        
        # Category stats
        if discovery.category:
            by_category[discovery.category] = by_category.get(discovery.category, 0) + 1
        
        # Confidence stats
        if discovery.confidence_score >= 0.8:
            by_confidence["high"] += 1
        elif discovery.confidence_score >= 0.5:
            by_confidence["medium"] += 1
        else:
            by_confidence["low"] += 1
    
    return {
        "total_discoveries": total_discoveries,
        "by_status": by_status,
        "by_category": by_category,
        "by_confidence": by_confidence
    } 