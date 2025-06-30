from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from ..models.technology_discovery import TechnologyDiscovery, TechnologyDiscoveryCreate, TechnologyDiscoveryInDB
from ..core.database import Database

class TechnologyDiscoveryService:
    def __init__(self, db: Database):
        self.db = db
        self.collection = db.technology_discoveries

    def _fix_id(self, doc):
        if doc and '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])
        return doc

    async def create_discovery(self, discovery: TechnologyDiscoveryCreate) -> TechnologyDiscovery:
        now = datetime.utcnow()
        discovery_dict = discovery.model_dump()
        discovery_dict["created_at"] = now
        discovery_dict["updated_at"] = now
        
        result = await self.collection.insert_one(discovery_dict)
        created_discovery = await self.collection.find_one({"_id": result.inserted_id})
        return TechnologyDiscovery(**self._fix_id(created_discovery))

    async def get_discovery(self, discovery_id: str) -> Optional[TechnologyDiscovery]:
        discovery = await self.collection.find_one({"_id": ObjectId(discovery_id)})
        return TechnologyDiscovery(**self._fix_id(discovery)) if discovery else None

    async def list_discoveries(self, news_source_id: Optional[str] = None, status: Optional[str] = None) -> List[TechnologyDiscovery]:
        filter_query = {}
        if news_source_id:
            filter_query["news_source_id"] = news_source_id
        if status:
            filter_query["status"] = status
        
        discoveries = []
        cursor = self.collection.find(filter_query).sort("discovered_at", -1)
        async for doc in cursor:
            discoveries.append(TechnologyDiscovery(**self._fix_id(doc)))
        return discoveries

    async def get_new_discoveries_since(self, news_source_id: str, since_date: datetime) -> List[TechnologyDiscovery]:
        """Get discoveries for a news source since a specific date"""
        discoveries = []
        cursor = self.collection.find({
            "news_source_id": news_source_id,
            "discovered_at": {"$gte": since_date}
        }).sort("discovered_at", -1)
        
        async for doc in cursor:
            discoveries.append(TechnologyDiscovery(**self._fix_id(doc)))
        return discoveries

    async def update_discovery_status(self, discovery_id: str, status: str) -> Optional[TechnologyDiscovery]:
        result = await self.collection.update_one(
            {"_id": ObjectId(discovery_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        if result.modified_count:
            updated_discovery = await self.collection.find_one({"_id": ObjectId(discovery_id)})
            return TechnologyDiscovery(**self._fix_id(updated_discovery))
        return None

    async def delete_discovery(self, discovery_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(discovery_id)})
        return result.deleted_count > 0

    async def get_discoveries_by_category(self, category: str) -> List[TechnologyDiscovery]:
        discoveries = []
        cursor = self.collection.find({"category": category}).sort("discovered_at", -1)
        async for doc in cursor:
            discoveries.append(TechnologyDiscovery(**self._fix_id(doc)))
        return discoveries

    async def get_high_confidence_discoveries(self, min_confidence: float = 0.7) -> List[TechnologyDiscovery]:
        discoveries = []
        cursor = self.collection.find({"confidence_score": {"$gte": min_confidence}}).sort("discovered_at", -1)
        async for doc in cursor:
            discoveries.append(TechnologyDiscovery(**self._fix_id(doc)))
        return discoveries 