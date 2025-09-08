import hmac
import hashlib
import json
from urllib.parse import unquote
import requests
import uvicorn
from cachetools import TTLCache
from decouple import config
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import os

# Collage imports
from PIL import Image
from io import BytesIO
import uuid
import math
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine, get_db, Base

# --- App and DB Setup ---
Base.metadata.create_all(bind=engine)
app = FastAPI()

# --- Globals & Cache ---
BOT_TOKEN = config("TELEGRAM_BOT_TOKEN", default="")
nft_cache = TTLCache(maxsize=500, ttl=300)

# --- Pydantic Models ---
# ... (existing models)
class Nft(BaseModel):
    address: str
    name: str
    description: str
    image: str
    collection_name: str

class AddNftsRequest(BaseModel):
    nfts: List[Nft]

# ... (other models)

# --- API Endpoints ---
api_router = APIRouter()

# ... (existing endpoints)

@api_router.post("/showcases/{showcase_id}/nfts", response_model=ShowcaseSchema)
def add_nfts_to_showcase(showcase_id: int, request: AddNftsRequest, db: Session = Depends(get_db)):
    db_showcase = db.query(models.Showcase).filter(models.Showcase.id == showcase_id).first()
    if not db_showcase:
        raise HTTPException(status_code=404, detail="Showcase not found")

    for nft_data in request.nfts:
        # Check if this NFT is already in the showcase to avoid duplicates
        exists = db.query(models.ShowcaseNft).filter_by(showcase_id=showcase_id, nft_address=nft_data.address).first()
        if not exists:
            db_showcase_nft = models.ShowcaseNft(
                showcase_id=showcase_id,
                nft_address=nft_data.address,
                name=nft_data.name,
                description=nft_data.description,
                image=nft_data.image,
                collection_name=nft_data.collection_name,
            )
            db.add(db_showcase_nft)

    db.commit()
    db.refresh(db_showcase)
    return db_showcase

# ... (rest of the file)
# Note: I will replace the full file content to avoid breaking it. This is just showing the new part.
# The actual tool call will have the full file.
