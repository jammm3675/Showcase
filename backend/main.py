import requests
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path
import hmac
import hashlib
from decouple import config
from cachetools import TTLCache

from . import models
from .database import engine, get_db

# Create DB tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Cache setup ---
# Cache for 5 minutes, holding up to 500 entries
nft_cache = TTLCache(maxsize=500, ttl=300)

BOT_TOKEN = config("TELEGRAM_BOT_TOKEN", default="")

from typing import Optional

# --- Security ---
def validate_init_data(init_data: str) -> dict:
    if not BOT_TOKEN:
        print("Warning: TELEGRAM_BOT_TOKEN is not set. Skipping validation.")
        # In a real production environment, you should probably raise an exception here.
        # For this project, we'll allow it but log a warning.
        # This is because the user might be running the app locally without a bot token.
        return {k: v for k, v in (pair.split('=') for pair in init_data.split('&'))}

    try:
        data_check_string = '&'.join(sorted([
            f"{k}={v}" for k, v in (pair.split('=') for pair in init_data.split('&'))
            if k != 'hash'
        ]))
        secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
        h = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256)

        parsed_data = {k: v for k, v in (pair.split('=') for pair in init_data.split('&'))}

        if h.hexdigest() != parsed_data['hash']:
            raise HTTPException(status_code=403, detail="Invalid initData")

        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid initData format: {e}")

# --- Pydantic Models ---
class WalletConnectRequest(BaseModel):
    telegram_id: int
    wallet_address: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    init_data: str # The raw initData string from Telegram

# --- Path for Frontend ---
# Note: Assumes the frontend is in a sibling directory to 'backend'
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# --- API Endpoints ---
@app.post("/api/connect_wallet")
def connect_wallet(request: WalletConnectRequest, db: Session = Depends(get_db)):
    validated_data = validate_init_data(request.init_data)

    # Ensure the user from initData matches the request
    user_data = next((v for k, v in validated_data.items() if k.startswith('user')), None)
    if user_data:
        import json
        user_json = json.loads(user_data)
        if int(user_json['id']) != request.telegram_id:
            raise HTTPException(status_code=403, detail="Telegram ID mismatch")

    print(f"Received wallet connection: User {request.telegram_id} with wallet {request.wallet_address}")

    db_user = db.query(models.User).filter(models.User.telegram_id == request.telegram_id).first()
    if db_user:
        # Update user data
        db_user.wallet_address = request.wallet_address
        db_user.username = request.username
        db_user.first_name = request.first_name
    else:
        # Create new user
        db_user = models.User(
            telegram_id=request.telegram_id,
            wallet_address=request.wallet_address,
            username=request.username,
            first_name=request.first_name
        )
        db.add(db_user)

    db.commit()
    db.refresh(db_user)

    return {"status": "success", "message": "Wallet connected successfully."}


@app.get("/api/search/users")
def search_users(query: str, db: Session = Depends(get_db)):
    if not query:
        return {"users": []}

    search_query = f"%{query}%"
    users = db.query(models.User).filter(models.User.username.ilike(search_query)).limit(10).all()

    users_with_nft_count = []
    for user in users:
        try:
            # This will be slow if we have many users in search results,
            # but for a limit of 10 it should be acceptable.
            # A better solution would be to store nft_count in our DB and update it periodically.
            nfts_data = get_nfts(user.wallet_address)
            nft_count = len(nfts_data.get("nfts", []))
        except HTTPException:
            # If we fail to get NFTs for a user, we'll just show 0
            nft_count = 0

        users_with_nft_count.append({
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "nft_count": nft_count
        })

    return {"users": users_with_nft_count}

@app.get("/api/profile/{telegram_id}")
def get_profile(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "wallet_address": user.wallet_address
    }


@app.get("/api/nfts/{wallet_address}")
def get_nfts(wallet_address: str):
    if wallet_address in nft_cache:
        print(f"Returning cached NFTs for {wallet_address}")
        return nft_cache[wallet_address]

    # TonAPI endpoint to get NFTs for a given account
    tonapi_url = f"https://tonapi.io/v2/accounts/{wallet_address}/nfts?limit=100&offset=0&indirect_ownership=false"

    try:
        response = requests.get(tonapi_url)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()

        nfts = []
        for item in data.get("nft_items", []):
            nft_data = {
                "address": item.get("address"),
                "name": item.get("metadata", {}).get("name", "No Name"),
                "description": item.get("metadata", {}).get("description", "No Description"),
                "image": item.get("metadata", {}).get("image", "default_image_url_here"),
                "collection_name": item.get("collection", {}).get("name", "No Collection")
            }
            # Use a preview image if available and 'image' is missing
            if nft_data["image"] == "default_image_url_here":
                if item.get("previews"):
                    # Find a preview with a good resolution
                    for p in reversed(item.get("previews")):
                         if 'resolution' in p and p['resolution'] in ['100x100', '500x500']:
                                nft_data["image"] = p.get("url")
                                break
                    if nft_data["image"] == "default_image_url_here":
                        nft_data["image"] = item.get("previews")[-1].get("url")


            nfts.append(nft_data)

        result = {"nfts": nfts}
        nft_cache[wallet_address] = result
        print(f"Cached NFTs for {wallet_address}")
        return result

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Error contacting TonAPI: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")


# --- Serve Frontend ---
@app.get("/tonconnect-manifest.json")
async def serve_manifest():
    manifest_path = FRONTEND_DIR / "tonconnect-manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=404, detail="Manifest not found")
    return FileResponse(manifest_path)

@app.get("/")
async def serve_frontend():
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.is_file():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_path)
