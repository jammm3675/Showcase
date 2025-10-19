import hmac
import hashlib
import json
from urllib.parse import unquote
import requests
import uvicorn
from cachetools import TTLCache
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import asyncio
import httpx
from contextlib import asynccontextmanager

# Official TON SDK
from tonutils.tonconnect import TonConnect

# Collage imports
from PIL import Image
from io import BytesIO
import uuid
import math
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from . import models, wallets
from .database import engine, get_db, Base
from .ton_client import TonClient
from .getgems import GetGemsClient

# --- Keep-Alive Logic for Render ---

async def keep_alive():
    """
    A background task to prevent the Render free tier instance from spinning down.
    Pings the service's health check endpoint every 14 minutes.
    """
    await asyncio.sleep(10)  # Initial delay to allow the app to start up fully

    render_url = os.getenv("RENDER_EXTERNAL_URL")
    if not render_url:
        print("Keep-alive: RENDER_EXTERNAL_URL not found. Skipping keep-alive task.")
        return

    healthcheck_url = f"{render_url}/api/healthcheck"

    while True:
        try:
            print(f"Keep-alive: Pinging {healthcheck_url}...")
            async with httpx.AsyncClient() as client:
                response = await client.get(healthcheck_url, timeout=10)
            response.raise_for_status()
            print(f"Keep-alive: Ping successful. Status: {response.status_code}")
        except Exception as e:
            print(f"Keep-alive: An unexpected error occurred: {e}")

        await asyncio.sleep(840)  # 14 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup: Starting keep-alive task.")
    task = asyncio.create_task(keep_alive())
    yield
    print("Application shutdown: Keep-alive task will be cancelled.")
    task.cancel()

# --- App and DB Setup ---
Base.metadata.create_all(bind=engine)
app = FastAPI(lifespan=lifespan)

# --- Globals & Cache ---
BOT_TOKEN = os.getenv("BOT_TOKEN")
TONCENTER_API_KEY = os.getenv("TONCENTER_API_KEY")
nft_cache = TTLCache(maxsize=500, ttl=300)

ton_client = TonClient(toncenter_api_key=TONCENTER_API_KEY)
getgems_client = GetGemsClient(ton_client=ton_client)

# --- Pydantic Models ---
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


class CreateSaleRequest(BaseModel):
    price: int


class CreateSaleResponse(BaseModel):
    sale_link: str


class SaleData(BaseModel):
    price: int
    seller: str
    marketplace: str


# --- API Endpoints ---
api_router = APIRouter()

@api_router.get("/healthcheck")
def health_check():
    """A simple endpoint for the keep-alive task to ping."""
    return {"status": "ok"}

@api_router.get("/tonconnect-manifest", response_model=dict)
def serve_manifest_json():
    manifest_path = os.path.join(os.path.dirname(__file__), "static", "tonconnect-manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Manifest file not found.")
    with open(manifest_path, "r") as f:
        return json.load(f)

@api_router.post("/connect_wallet")
def connect_wallet(request: wallets.WalletConnectRequest, db: Session = Depends(get_db)):
    return wallets.verify_wallet(
        request=request,
        db=db,
        bot_token=BOT_TOKEN,
    )

@api_router.get("/nfts/{wallet_address}", response_model=NftResponse)
def get_nfts(wallet_address: str):
    if wallet_address in nft_cache: return nft_cache[wallet_address]
    headers = {"Authorization": f"Bearer {TONCENTER_API_KEY}"}
    url=f"https://toncenter.com/api/v2/getNfts?address={wallet_address}&limit=100&offset=0"
    try:
        r=requests.get(url, headers=headers);r.raise_for_status();data=r.json()
        nfts=[];[nfts.append(Nft(address=i.get("address",""),name=m.get("name","?"),description=m.get("description",""),image=m.get("image","")or(p[-1].get("url")if(p:=i.get("previews"))else""),collection_name=c.get("name","?")))for i in data.get("result", {}).get("nft_items",[])if(m:=i.get("metadata",{}))and(c:=i.get("collection",{}))]
        res={"nfts":nfts};nft_cache[wallet_address]=res;return res
    except Exception as e:print(f"ERR get_nfts: {e}");raise HTTPException(status_code=500,detail="Internal error")


@api_router.post("/nfts/{nft_address}/sale", response_model=CreateSaleResponse)
def create_nft_sale(nft_address: str, request: CreateSaleRequest):
    sale_link = getgems_client.create_sale_link(nft_address, request.price)
    return CreateSaleResponse(sale_link=sale_link)


@api_router.get("/nfts/{nft_address}/sale_data", response_model=SaleData)
async def get_nft_sale_data(nft_address: str):
    sale_data = await getgems_client.get_sale_data(nft_address)
    if not sale_data:
        raise HTTPException(status_code=404, detail="Sale data not found")
    return SaleData(**sale_data)


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
    db.query(models.ShowcaseNft).filter(models.ShowcaseNft.showcase_id == showcase_id).delete()
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
app.include_router(api_router, prefix="/api")
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__=="__main__":uvicorn.run(app,host="0.0.0.0",port=8080)