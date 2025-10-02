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
        from_attributes = True

class ShowcaseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str]
    showcase_nfts: List[ShowcaseNftSchema] = []
    class Config:
        from_attributes = True

class CreateShowcaseRequest(BaseModel):
    telegram_id: int
    title: str
    description: Optional[str] = ""

class AddNftsRequest(BaseModel):
    nfts: List[Nft]

class RemoveNftsRequest(BaseModel):
    nft_addresses: List[str]

class UserProfile(BaseModel):
    telegram_id: int
    wallet_address: Optional[str]
    username: Optional[str]
    first_name: Optional[str]
    class Config:
        from_attributes = True

class UserSearchResult(UserProfile):
    nft_count: int

# --- Security ---
def validate_init_data(init_data: str) -> bool:
    if not BOT_TOKEN:
        print("Warning: TELEGRAM_BOT_TOKEN is not set. Skipping validation.")
        return True
    try:
        parsed_data=sorted([pair.split('=',1) for pair in init_data.split('&') if pair.split('=',1)[0]!='hash'])
        data_check_string="\n".join([f"{k}={unquote(v)}" for k,v in parsed_data])
        init_data_hash=dict(pair.split('=',1) for pair in init_data.split('&')).get('hash')
        if not init_data_hash: return False
        secret_key=hmac.new("WebAppData".encode(),BOT_TOKEN.encode(),hashlib.sha256).digest()
        h=hmac.new(secret_key,data_check_string.encode(),hashlib.sha256)
        return h.hexdigest()==init_data_hash
    except Exception:
        return False

# --- API Endpoints ---
api_router = APIRouter()

@api_router.get("/tonconnect-manifest", response_model=dict)
def serve_manifest_json():
    manifest_path = os.path.join(os.path.dirname(__file__), "static", "tonconnect-manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Manifest file not found.")
    with open(manifest_path, "r") as f:
        return json.load(f)

@api_router.post("/connect_wallet")
def connect_wallet(request: WalletConnectRequest, db: Session = Depends(get_db)):
    if not validate_init_data(request.init_data): raise HTTPException(status_code=403, detail="Invalid initData")
    user=db.query(models.User).filter(models.User.telegram_id==request.telegram_id).first()
    if user:
        user.wallet_address=request.wallet_address;user.username=request.username;user.first_name=request.first_name
    else:
        user=models.User(telegram_id=request.telegram_id,wallet_address=request.wallet_address,username=request.username,first_name=request.first_name)
        db.add(user)
    db.commit();return {"status":"success"}

@api_router.get("/nfts/{wallet_address}", response_model=NftResponse)
def get_nfts(wallet_address: str):
    if wallet_address in nft_cache: return nft_cache[wallet_address]
    url=f"https://tonapi.io/v2/accounts/{wallet_address}/nfts?limit=100&offset=0&indirect_ownership=false"
    try:
        r=requests.get(url);r.raise_for_status();data=r.json()
        nfts=[];[nfts.append(Nft(address=i.get("address",""),name=m.get("name","?"),description=m.get("description",""),image=m.get("image","")or(p[-1].get("url")if(p:=i.get("previews"))else""),collection_name=c.get("name","?")))for i in data.get("nft_items",[])if(m:=i.get("metadata",{}))and(c:=i.get("collection",{}))]
        res={"nfts":nfts};nft_cache[wallet_address]=res;return res
    except Exception as e:print(f"ERR get_nfts: {e}");raise HTTPException(status_code=500,detail="Internal error")

@api_router.get("/profile/{telegram_id}", response_model=UserProfile)
def get_profile(telegram_id: int, db: Session = Depends(get_db)):
    user=db.query(models.User).filter(models.User.telegram_id==telegram_id).first()
    if not user:raise HTTPException(status_code=404,detail="User not found")
    return user

@api_router.get("/search/users", response_model=List[UserSearchResult])
def search_users(query: str, db: Session = Depends(get_db)):
    if not query:return[]
    users=db.query(models.User).filter(models.User.username.ilike(f"%{query}%")).limit(10).all()
    res=[]
    for u in users:
        try:
            nfts_res=get_nfts(u.wallet_address);nft_count=len(nfts_res['nfts'])
        except:nft_count=0
        res.append(UserSearchResult(telegram_id=u.telegram_id,wallet_address=u.wallet_address,username=u.username,first_name=u.first_name,nft_count=nft_count))
    return res

@api_router.post("/showcases", response_model=ShowcaseSchema)
def create_showcase(request: CreateShowcaseRequest, db: Session = Depends(get_db)):
    user=db.query(models.User).filter(models.User.telegram_id==request.telegram_id).first()
    if not user:raise HTTPException(status_code=404,detail="User not found")
    sc=models.Showcase(title=request.title,description=request.description,user_id=user.id)
    db.add(sc);db.commit();db.refresh(sc);return sc

@api_router.get("/users/{telegram_id}/showcases", response_model=List[ShowcaseSchema])
def get_user_showcases(telegram_id: int, db: Session = Depends(get_db)):
    user=db.query(models.User).filter(models.User.telegram_id==telegram_id).first()
    if not user:raise HTTPException(status_code=404,detail="User not found")
    return user.showcases

@api_router.get("/showcases/{showcase_id}", response_model=ShowcaseSchema)
def get_showcase(showcase_id: int, db: Session = Depends(get_db)):
    sc=db.query(models.Showcase).filter(models.Showcase.id==showcase_id).first()
    if not sc:raise HTTPException(status_code=404,detail="Showcase not found")
    return sc

@api_router.put("/showcases/{showcase_id}/nfts", response_model=ShowcaseSchema)
def update_showcase_nfts(showcase_id: int, request: AddNftsRequest, db: Session = Depends(get_db)):
    sc = db.query(models.Showcase).filter(models.Showcase.id == showcase_id).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Showcase not found")

    # Clear existing NFTs for this showcase
    db.query(models.ShowcaseNft).filter(models.ShowcaseNft.showcase_id == showcase_id).delete()

    # Add the new set of NFTs
    for nft in request.nfts:
        db_nft = models.ShowcaseNft(
            showcase_id=showcase_id,
            nft_address=nft.address,
            name=nft.name,
            description=nft.description,
            image=nft.image,
            collection_name=nft.collection_name
        )
        db.add(db_nft)

    db.commit()
    db.refresh(sc)
    return sc

@api_router.post("/showcases/{showcase_id}/export")
async def export_showcase(showcase_id: int, db: Session = Depends(get_db)):
    sc=db.query(models.Showcase).filter(models.Showcase.id==showcase_id).first()
    if not sc:raise HTTPException(status_code=404,detail="Showcase not found")
    urls=[n.image for n in sc.showcase_nfts if n.image]
    if not urls:raise HTTPException(status_code=400,detail="No images in showcase")
    try:
        imgs=[Image.open(BytesIO(requests.get(u).content)).convert("RGBA") for u in urls]
    except Exception as e:raise HTTPException(status_code=500,detail=f"Failed to download images: {e}")
    d=math.ceil(math.sqrt(len(imgs)));s=256;g=10;cs=d*s+(d-1)*g
    clg=Image.new("RGBA",(cs,cs));[clg.paste(i.resize((s,s)),(n%d*(s+g),n//d*(s+g))) for n,i in enumerate(imgs)]
    buf=BytesIO();clg.save(buf,"PNG");buf.seek(0)
    return StreamingResponse(buf,media_type="image/png",headers={'Content-Disposition':'attachment; filename="collage.png"'})

# --- Static Files Serving ---
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    print(f"Warning: Static dir {STATIC_DIR} not found.")

# --- API Router ---
# The API router should be included before the static files mount
# to ensure the API routes are not overridden.
app.include_router(api_router, prefix="/api")
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__=="__main__":uvicorn.run(app,host="0.0.0.0",port=8080)
