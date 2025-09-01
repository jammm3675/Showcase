import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path

from . import models
from .database import engine, get_db

# Create DB tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

from typing import Optional

# --- Pydantic Models ---
class WalletConnectRequest(BaseModel):
    telegram_id: int
    wallet_address: str
    username: Optional[str] = None
    first_name: Optional[str] = None

# --- Path for Frontend ---
# Note: Assumes the frontend is in a sibling directory to 'backend'
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# --- API Endpoints ---
@app.post("/api/connect_wallet")
def connect_wallet(request: WalletConnectRequest, db: Session = Depends(get_db)):
    # For now, we just print the data. DB logic will be expanded later.
    print(f"Received wallet connection: User {request.telegram_id} with wallet {request.wallet_address}")

    # Placeholder: Check if user exists, if not, create one.
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

    return {"users": [
        {"telegram_id": user.telegram_id, "username": user.username, "first_name": user.first_name}
        for user in users
    ]}

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
                preview = item.get("previews", [{}])[0]
                if preview and preview.get("url"):
                    nft_data["image"] = preview.get("url")

            nfts.append(nft_data)

        return {"nfts": nfts}

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
