from datetime import datetime, timedelta, timezone
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from . import models, schemas, ton_api
from .database import create_db_and_tables, get_db

# This will create the .db file and tables on startup if they don't exist
create_db_and_tables()


app = FastAPI(
    title="NFT Showcase API",
    description="Backend for the Telegram Mini App NFT Showcase.",
    version="0.1.0",
)


@app.get("/")
def read_root():
    return {"message": "Telegram Mini App Backend"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/connect", response_model=schemas.User)
def connect_or_update_user(user_data: schemas.UserConnect, db: Session = Depends(get_db)):
    """
    Create a new user or update an existing one based on their Telegram ID.
    """
    db_user = db.query(models.User).filter(models.User.telegram_id == user_data.telegram_id).first()

    if db_user:
        db_user.username = user_data.username
        db_user.wallet_address = user_data.wallet_address
    else:
        db_user = models.User(**user_data.model_dump())
        db.add(db_user)

    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/search", response_model=list[schemas.User])
def search_users(q: str = "", db: Session = Depends(get_db)):
    """
    Search for users by their username (case-insensitive).
    """
    if not q:
        return []

    search_query = f"%{q}%"
    users = db.query(models.User).filter(models.User.username.ilike(search_query)).limit(20).all()
    return users


@app.get("/api/users/{telegram_id}", response_model=schemas.User)
def get_user_profile(telegram_id: int, db: Session = Depends(get_db)):
    """
    Get a user's profile by their Telegram ID.
    """
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/api/users/{telegram_id}/nfts", response_model=list[schemas.NftItem])
async def get_user_nfts(telegram_id: int, db: Session = Depends(get_db)):
    """
    Get a user's NFT collection using a cache-aside strategy.
    """
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    wallet_address = user.wallet_address
    cache_entry = db.query(models.NftCache).filter(models.NftCache.owner_wallet_address == wallet_address).first()

    if cache_entry:
        cache_age = datetime.now(timezone.utc) - cache_entry.cached_at.replace(tzinfo=timezone.utc)
        if cache_age < timedelta(hours=1):
            return cache_entry.nft_data

    fresh_nft_data = await ton_api.get_nfts_for_wallet(wallet_address)

    if fresh_nft_data is not None:
        if cache_entry:
            cache_entry.nft_data = fresh_nft_data
        else:
            cache_entry = models.NftCache(owner_wallet_address=wallet_address, nft_data=fresh_nft_data)
            db.add(cache_entry)

        db.commit()
        return fresh_nft_data
    else:
        if cache_entry:
            return cache_entry.nft_data
        else:
            raise HTTPException(status_code=503, detail="Could not fetch NFT data from provider.")
