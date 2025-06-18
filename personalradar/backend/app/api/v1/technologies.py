from fastapi import APIRouter, Depends, HTTPException, status
from ...core.database import Database
from ...models.technology import Technology, TechnologyCreate
from ...services.technology_service import TechnologyService
from typing import List, Dict

router = APIRouter()

async def get_technology_service() -> TechnologyService:
    db = Database.get_db()
    return TechnologyService(db)

@router.post("/", response_model=Technology, status_code=status.HTTP_201_CREATED)
async def create_technology(
    tech: TechnologyCreate,
    service: TechnologyService = Depends(get_technology_service)
) -> Technology:
    try:
        return await service.create_technology(tech)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("/", response_model=List[Technology])
async def list_technologies(
    service: TechnologyService = Depends(get_technology_service)
) -> List[Technology]:
    return await service.list_technologies()

@router.patch("/{tech_id}", response_model=Technology)
async def update_technology(tech_id: str, update_data: Dict, service: TechnologyService = Depends(get_technology_service)):
    updated = await service.update_technology(tech_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technology not found")
    return updated

@router.delete("/{tech_id}", response_model=Technology)
async def delete_technology(
    tech_id: str,
    service: TechnologyService = Depends(get_technology_service)
) -> Technology:
    deleted = await service.delete_technology(tech_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technology not found")
    return deleted 