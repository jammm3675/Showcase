import hmac
import hashlib
import json
from urllib.parse import unquote
import requests
import uvicorn
from cachetools import TTLCache
from decouple import config
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
import os

# Collage imports
from PIL import Image
from io import BytesIO
import uuid
import math
from fastapi.responses import FileResponse, HTMLResponse
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
class WalletConnectRequest(BaseModel):
    telegram_id: int
    wallet_address: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    init_data: str

class Nft(BaseModel):
    address: str
    name: str
    description: str
    image: str
    collection_name: str

class NftResponse(BaseModel):
    nfts: List[Nft]

class ShowcaseNftSchema(BaseModel):
    id: int
    nft_address: str
    name: str
    description: str
    image: str
    collection_name: str
    class Config:
        orm_mode = True

class ShowcaseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str]
    showcase_nfts: List[ShowcaseNftSchema] = []
    class Config:
        orm_mode = True

class CreateShowcaseRequest(BaseModel):
    telegram_id: int
    title: str
    description: Optional[str] = ""

# --- Security ---
def validate_init_data(init_data: str) -> bool:
    if not BOT_TOKEN:
        print("Warning: TELEGRAM_BOT_TOKEN is not set. Skipping validation.")
        return True
    try:
        parsed_data = sorted([pair.split('=', 1) for pair in init_data.split('&') if pair.split('=', 1)[0] != 'hash'])
        data_check_string = "\n".join([f"{k}={unquote(v)}" for k, v in parsed_data])
        init_data_hash = dict(pair.split('=', 1) for pair in init_data.split('&')).get('hash')
        if not init_data_hash: return False
        secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
        h = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256)
        return h.hexdigest() == init_data_hash
    except Exception:
        return False


# --- API Endpoints ---
api_router = FastAPI()

@api_router.post("/connect_wallet")
def connect_wallet(request: WalletConnectRequest, db: Session = Depends(get_db)):
    if not validate_init_data(request.init_data):
        raise HTTPException(status_code=403, detail="Invalid initData: Validation failed")
    # ... (user creation/update logic)
    db_user = db.query(models.User).filter(models.User.telegram_id == request.telegram_id).first()
    if db_user:
        db_user.wallet_address = request.wallet_address
        db_user.username = request.username
        db_user.first_name = request.first_name
    else:
        db_user = models.User(telegram_id=request.telegram_id, wallet_address=request.wallet_address, username=request.username, first_name=request.first_name)
        db.add(db_user)
    db.commit()
    return {"status": "success"}

@api_router.get("/nfts/{wallet_address}", response_model=NftResponse)
def get_nfts(wallet_address: str):
    # ... (get nfts logic)
    if wallet_address in nft_cache: return nft_cache[wallet_address]
    tonapi_url = f"https://tonapi.io/v2/accounts/{wallet_address}/nfts?limit=100&offset=0&indirect_ownership=false"
    try:
        response = requests.get(tonapi_url)
        response.raise_for_status()
        data = response.json()
        nfts = [Nft(address=item.get("address",""), name=item.get("metadata",{}).get("name","No Name"), description=item.get("metadata",{}).get("description","No Description"), image=item.get("metadata",{}).get("image","") or (item.get("previews",[])[-1].get("url") if item.get("previews") else ""), collection_name=item.get("collection",{}).get("name","No Collection")) for item in data.get("nft_items",[])]
        result = {"nfts": nfts}; nft_cache[wallet_address] = result; return result
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/showcases", response_model=ShowcaseSchema)
def create_showcase(request: CreateShowcaseRequest, db: Session = Depends(get_db)):
    # ... (create showcase logic)
    db_user = db.query(models.User).filter(models.User.telegram_id == request.telegram_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    new_showcase = models.Showcase(title=request.title, description=request.description, user_id=db_user.id)
    db.add(new_showcase); db.commit(); db.refresh(new_showcase); return new_showcase

@api_router.get("/users/{telegram_id}/showcases", response_model=List[ShowcaseSchema])
def get_user_showcases(telegram_id: int, db: Session = Depends(get_db)):
    # ... (get showcases logic)
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    return db_user.showcases

@api_router.post("/showcases/{showcase_id}/export")
async def export_showcase(showcase_id: int, db: Session = Depends(get_db)):
    # ... (export logic)
    db_showcase = db.query(models.Showcase).filter(models.Showcase.id == showcase_id).first()
    if not db_showcase: raise HTTPException(status_code=404, detail="Showcase not found")
    image_urls = [nft.image for nft in db_showcase.showcase_nfts if nft.image]
    if not image_urls: raise HTTPException(status_code=400, detail="No images in showcase")
    images = [Image.open(BytesIO(requests.get(url).content)).convert("RGBA") for url in image_urls]
    grid_dim = math.ceil(math.sqrt(len(images))); img_size=256; gap=10; canvas_size=grid_dim*img_size+(grid_dim-1)*gap
    collage = Image.new("RGBA",(canvas_size,canvas_size)); [collage.paste(img.resize((img_size,img_size)),(i%grid_dim*(img_size+gap),i//grid_dim*(img_size+gap))) for i,img in enumerate(images)]
    filename=f"/tmp/{uuid.uuid4()}.png"; collage.save(filename,"PNG"); return FileResponse(filename,media_type="image/png")

app.include_router(api_router, prefix="/api")

# --- Static Files Serving ---
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if not os.path.exists(STATIC_DIR):
    print(f"Warning: Static directory not found at {STATIC_DIR}. Frontend may not be built.")

app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="static_assets")

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_react_app(full_path: str):
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(content="<h1>Frontend not built. Run 'npm run build' in frontend-react.</h1>", status_code=404)
    return HTMLResponse(content=open(index_path).read(), status_code=200)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
