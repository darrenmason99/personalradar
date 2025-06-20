from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ...services.news_source_service import NewsSourceService
from ...models.news_source import NewsSource, NewsSourceCreate
from ...core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[NewsSource])
async def list_news_sources(db=Depends(get_database)):
    """Get all news sources"""
    service = NewsSourceService(db)
    return await service.list_news_sources()

@router.post("/", response_model=NewsSource)
async def create_news_source(news_source: NewsSourceCreate, db=Depends(get_database)):
    """Create a new news source"""
    service = NewsSourceService(db)
    return await service.create_news_source(news_source)

@router.get("/{news_source_id}", response_model=NewsSource)
async def get_news_source(news_source_id: str, db=Depends(get_database)):
    """Get a specific news source"""
    service = NewsSourceService(db)
    news_source = await service.get_news_source(news_source_id)
    if not news_source:
        raise HTTPException(status_code=404, detail="News source not found")
    return news_source

@router.patch("/{news_source_id}", response_model=NewsSource)
async def update_news_source(news_source_id: str, news_source_data: dict, db=Depends(get_database)):
    """Update a news source"""
    service = NewsSourceService(db)
    updated_news_source = await service.update_news_source(news_source_id, news_source_data)
    if not updated_news_source:
        raise HTTPException(status_code=404, detail="News source not found")
    return updated_news_source

@router.delete("/{news_source_id}")
async def delete_news_source(news_source_id: str, db=Depends(get_database)):
    """Delete a news source"""
    service = NewsSourceService(db)
    success = await service.delete_news_source(news_source_id)
    if not success:
        raise HTTPException(status_code=404, detail="News source not found")
    return {"message": "News source deleted successfully"}

@router.post("/{news_source_id}/check")
async def mark_as_checked(news_source_id: str, db=Depends(get_database)):
    """Mark a news source as checked (update last_checked timestamp)"""
    service = NewsSourceService(db)
    updated_news_source = await service.update_last_checked(news_source_id)
    if not updated_news_source:
        raise HTTPException(status_code=404, detail="News source not found")
    return {"message": "News source marked as checked", "last_checked": updated_news_source.last_checked}

@router.get("/due/checking", response_model=List[NewsSource])
async def get_sources_due_for_checking(db=Depends(get_database)):
    """Get news sources that are due for checking based on their cadence"""
    service = NewsSourceService(db)
    return await service.get_sources_due_for_checking() 