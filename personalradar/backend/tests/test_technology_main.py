import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import status
from app.main import app
from motor.motor_asyncio import AsyncIOMotorClient
from app.api.v1 import technologies as technologies_module
from app.services.technology_service import TechnologyService
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test database configuration
TEST_MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
TEST_DB_NAME = "test_radar_db"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    client = AsyncIOMotorClient(TEST_MONGODB_URL)
    db = client[TEST_DB_NAME]
    await db.technologies.delete_many({})
    yield db
    await db.technologies.delete_many({})
    client.close()

@pytest.mark.asyncio
async def test_create_and_list_technology_main(test_db):
    service = TechnologyService(test_db)
    app.dependency_overrides[technologies_module.get_technology_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        tech_data = {
            "name": "Kubernetes",
            "quadrant": "Platforms",
            "ring": "Adopt",
            "description": "Container orchestration platform"
        }
        create_resp = await ac.post("/api/v1/technologies/", json=tech_data)
        assert create_resp.status_code == status.HTTP_201_CREATED
        created = create_resp.json()
        assert created["name"] == tech_data["name"]
        assert created["quadrant"] == tech_data["quadrant"]
        assert created["ring"] == tech_data["ring"]
        assert created["description"] == tech_data["description"]
        assert "_id" in created
        assert "created_at" in created
        assert "updated_at" in created
        list_resp = await ac.get("/api/v1/technologies/")
        assert list_resp.status_code == status.HTTP_200_OK
        techs = list_resp.json()
        assert len(techs) == 1
        assert any(t["name"] == "Kubernetes" for t in techs)
    app.dependency_overrides.clear() 