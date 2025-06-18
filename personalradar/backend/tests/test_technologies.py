import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import status
from app.main import app
from motor.motor_asyncio import AsyncIOMotorClient
from app.api.v1 import technologies as technologies_module
from app.services.technology_service import TechnologyService
from app.models.technology import TechnologyCreate
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
    await db.technologies.create_index("name", unique=True)
    yield db
    await db.technologies.delete_many({})
    client.close()

@pytest.mark.asyncio
async def test_create_and_list_technology(test_db):
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

@pytest.mark.asyncio
async def test_create_technology_duplicate(test_db):
    service = TechnologyService(test_db)
    app.dependency_overrides[technologies_module.get_technology_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        tech_data = {
            "name": "Kubernetes",
            "quadrant": "Platforms",
            "ring": "Adopt",
            "description": "Container orchestration platform"
        }
        # First creation should succeed
        create_resp1 = await ac.post("/api/v1/technologies/", json=tech_data)
        assert create_resp1.status_code == status.HTTP_201_CREATED
        # Second creation should fail with 409
        create_resp2 = await ac.post("/api/v1/technologies/", json=tech_data)
        assert create_resp2.status_code == status.HTTP_409_CONFLICT
        assert "already exists" in create_resp2.json()["detail"]
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_update_and_delete_technology(test_db):
    service = TechnologyService(test_db)
    # Create a technology
    tech_data = TechnologyCreate(
        name="Docker",
        quadrant="Tools",
        ring="Adopt",
        description="Containerization platform"
    )
    created = await service.create_technology(tech_data)
    tech_id = created.id
    # Update the technology
    update_fields = {"description": "Updated description", "ring": "Trial"}
    updated = await service.update_technology(tech_id, update_fields)
    assert updated is not None
    assert updated.description == "Updated description"
    assert updated.ring == "Trial"
    # Delete the technology
    deleted = await service.delete_technology(tech_id)
    assert deleted is not None
    assert deleted.id == tech_id
    # Ensure it is gone
    techs = await service.list_technologies()
    assert all(t.id != tech_id for t in techs)

@pytest.mark.asyncio
async def test_update_and_delete_technology_api(test_db):
    service = TechnologyService(test_db)
    app.dependency_overrides[technologies_module.get_technology_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create a technology
        tech_data = {
            "name": "Terraform",
            "quadrant": "Tools",
            "ring": "Trial",
            "description": "IaC tool"
        }
        create_resp = await ac.post("/api/v1/technologies/", json=tech_data)
        assert create_resp.status_code == status.HTTP_201_CREATED
        created = create_resp.json()
        tech_id = created["_id"]
        # Update the technology
        update_data = {"description": "Updated IaC tool", "ring": "Adopt"}
        update_resp = await ac.patch(f"/api/v1/technologies/{tech_id}", json=update_data)
        assert update_resp.status_code == status.HTTP_200_OK
        updated = update_resp.json()
        assert updated["description"] == "Updated IaC tool"
        assert updated["ring"] == "Adopt"
        # Delete the technology
        delete_resp = await ac.delete(f"/api/v1/technologies/{tech_id}")
        assert delete_resp.status_code == status.HTTP_200_OK
        deleted = delete_resp.json()
        assert deleted["_id"] == tech_id
        # Ensure it is gone
        get_resp = await ac.get("/api/v1/technologies/")
        techs = get_resp.json()
        assert all(t["_id"] != tech_id for t in techs)
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_update_and_delete_technology_api_edge_cases(test_db):
    service = TechnologyService(test_db)
    app.dependency_overrides[technologies_module.get_technology_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Update non-existent technology
        fake_id = "5f43a1e1e1e1e1e1e1e1e1e1"
        update_resp = await ac.patch(f"/api/v1/technologies/{fake_id}", json={"description": "Should not work"})
        assert update_resp.status_code == status.HTTP_404_NOT_FOUND
        # 2. Delete non-existent technology
        delete_resp = await ac.delete(f"/api/v1/technologies/{fake_id}")
        assert delete_resp.status_code == status.HTTP_404_NOT_FOUND
        # 3. Update with no fields (should not change anything)
        tech_data = {
            "name": "EdgeCaseTech",
            "quadrant": "Tools",
            "ring": "Trial",
            "description": "Edge case test"
        }
        create_resp = await ac.post("/api/v1/technologies/", json=tech_data)
        assert create_resp.status_code == status.HTTP_201_CREATED
        created = create_resp.json()
        tech_id = created["_id"]
        update_resp = await ac.patch(f"/api/v1/technologies/{tech_id}", json={})
        assert update_resp.status_code == status.HTTP_200_OK
        updated = update_resp.json()
        assert updated["name"] == tech_data["name"]
        # 4. Update with invalid field (should ignore or not break)
        update_resp = await ac.patch(f"/api/v1/technologies/{tech_id}", json={"not_a_field": "value"})
        assert update_resp.status_code == status.HTTP_200_OK
        updated = update_resp.json()
        assert "not_a_field" not in updated
        # 5. Delete twice (second should return 404)
        delete_resp1 = await ac.delete(f"/api/v1/technologies/{tech_id}")
        assert delete_resp1.status_code == status.HTTP_200_OK
        delete_resp2 = await ac.delete(f"/api/v1/technologies/{tech_id}")
        assert delete_resp2.status_code == status.HTTP_404_NOT_FOUND
    app.dependency_overrides.clear()

# @pytest.mark.asyncio
# async def test_db_fixture_resolution(test_db):
#     print('MINIMAL TEST: type(test_db):', type(test_db))
#     print('MINIMAL TEST: test_db:', test_db) 