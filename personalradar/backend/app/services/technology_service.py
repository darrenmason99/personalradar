from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from ..models.technology import Technology, TechnologyCreate
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

class TechnologyService:
    def __init__(self, db: AsyncIOMotorClient) -> None:
        self.collection = db.technologies

    async def create_technology(self, tech_data: TechnologyCreate) -> Technology:
        tech_dict = tech_data.model_dump()
        tech_dict["created_at"] = datetime.utcnow()
        tech_dict["updated_at"] = datetime.utcnow()
        # Ensure all new fields are present
        tech_dict.setdefault("source", "")
        tech_dict.setdefault("date_of_assessment", datetime.utcnow())
        tech_dict.setdefault("uri", None)
        try:
            result = await self.collection.insert_one(tech_dict)
            tech_dict["_id"] = str(result.inserted_id)
            return Technology(**tech_dict)
        except DuplicateKeyError:
            # Optionally, you can raise a custom exception or return None or a message
            raise ValueError(f"Technology with name '{tech_data.name}' already exists.")

    async def list_technologies(self) -> List[Technology]:
        techs = []
        async for doc in self.collection.find():
            doc["_id"] = str(doc["_id"])
            techs.append(Technology(**doc))
        return techs

    async def update_technology(self, tech_id: str, update_data: Dict[str, Any]) -> Optional[Technology]:
        update_data["updated_at"] = datetime.utcnow()
        # Ensure all new fields are present in update
        update_data.setdefault("source", "")
        update_data.setdefault("date_of_assessment", datetime.utcnow())
        update_data.setdefault("uri", None)
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(tech_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
            return Technology(**result)
        return None

    async def delete_technology(self, tech_id: str) -> Optional[Technology]:
        result = await self.collection.find_one_and_delete({"_id": ObjectId(tech_id)})
        if result:
            result["_id"] = str(result["_id"])
            return Technology(**result)
        return None

    # Optionally, add update and delete methods here 