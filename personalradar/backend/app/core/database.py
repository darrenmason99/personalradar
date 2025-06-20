from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from typing import Optional, Any

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[Any] = None

    @classmethod
    async def connect_db(cls) -> None:
        """Create database connection."""
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        mongodb_db = os.getenv("MONGODB_DB", "personalradar")
        
        cls.client = AsyncIOMotorClient(mongodb_url)
        cls.db = cls.client[mongodb_db]
        
        # Create indexes
        await cls.create_indexes()
        
    @classmethod
    async def close_db(cls) -> None:
        """Close database connection."""
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None

    @classmethod
    async def create_indexes(cls) -> None:
        """Create necessary indexes for collections."""
        # Technologies collection indexes
        await cls.db.technologies.create_index("name", unique=True)
        await cls.db.technologies.create_index("category")
        await cls.db.technologies.create_index("status")
        await cls.db.technologies.create_index("last_assessed")
        await cls.db.technologies.create_index("source")
        await cls.db.technologies.create_index("date_of_assessment")
        await cls.db.technologies.create_index("uri")
        
        # User preferences collection indexes
        await cls.db.user_preferences.create_index("user_id", unique=True)
        
        # Technology assessments collection indexes
        await cls.db.assessments.create_index([("technology_id", 1), ("user_id", 1)], unique=True)
        await cls.db.assessments.create_index("assessment_date")

    @classmethod
    def get_db(cls) -> Any:
        """Get database instance."""
        return cls.db

# Dependency for FastAPI
async def get_database() -> Any:
    return Database.db 