from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from ..models.news_source import NewsSource, NewsSourceCreate, NewsSourceInDB
from ..core.database import Database

class NewsSourceService:
    def __init__(self, db: Database):
        self.db = db
        self.collection = db.database.news_sources

    def _fix_id(self, doc):
        if doc and '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])
        return doc

    async def create_news_source(self, news_source: NewsSourceCreate) -> NewsSource:
        now = datetime.utcnow()
        news_source_dict = news_source.dict()
        news_source_dict["created_at"] = now
        news_source_dict["updated_at"] = now
        
        result = await self.collection.insert_one(news_source_dict)
        created_news_source = await self.collection.find_one({"_id": result.inserted_id})
        return NewsSource(**self._fix_id(created_news_source))

    async def get_news_source(self, news_source_id: str) -> Optional[NewsSource]:
        news_source = await self.collection.find_one({"_id": ObjectId(news_source_id)})
        return NewsSource(**self._fix_id(news_source)) if news_source else None

    async def list_news_sources(self) -> List[NewsSource]:
        news_sources = []
        cursor = self.collection.find({})
        async for doc in cursor:
            news_sources.append(NewsSource(**self._fix_id(doc)))
        return news_sources

    async def update_news_source(self, news_source_id: str, news_source_data: dict) -> Optional[NewsSource]:
        news_source_data["updated_at"] = datetime.utcnow()
        result = await self.collection.update_one(
            {"_id": ObjectId(news_source_id)},
            {"$set": news_source_data}
        )
        if result.modified_count:
            updated_news_source = await self.collection.find_one({"_id": ObjectId(news_source_id)})
            return NewsSource(**self._fix_id(updated_news_source))
        return None

    async def delete_news_source(self, news_source_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(news_source_id)})
        return result.deleted_count > 0

    async def update_last_checked(self, news_source_id: str) -> Optional[NewsSource]:
        result = await self.collection.update_one(
            {"_id": ObjectId(news_source_id)},
            {"$set": {"last_checked": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )
        if result.modified_count:
            updated_news_source = await self.collection.find_one({"_id": ObjectId(news_source_id)})
            return NewsSource(**self._fix_id(updated_news_source))
        return None

    async def get_sources_due_for_checking(self) -> List[NewsSource]:
        """Get sources that are due for checking based on their cadence"""
        now = datetime.utcnow()
        pipeline = [
            {
                "$addFields": {
                    "days_since_last_check": {
                        "$cond": {
                            "if": {"$eq": ["$last_checked", None]},
                            "then": 999,  # Never checked, so it's due
                            "else": {
                                "$divide": [
                                    {"$subtract": [now, "$last_checked"]},
                                    1000 * 60 * 60 * 24  # Convert milliseconds to days
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$match": {
                    "$expr": {
                        "$gte": ["$days_since_last_check", "$cadence_days"]
                    },
                    "is_active": True
                }
            }
        ]
        
        news_sources = []
        cursor = self.collection.aggregate(pipeline)
        async for doc in cursor:
            news_sources.append(NewsSource(**self._fix_id(doc)))
        return news_sources 