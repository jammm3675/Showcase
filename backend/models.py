from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    """
    Represents a user who has connected their wallet to the app.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)  # Telegram username, can be optional
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, telegram_id={self.telegram_id}, wallet='{self.wallet_address}')>"


class NftCache(Base):
    """
    Stores the cached JSON response of a user's NFT collection
    to avoid hitting the external API on every request.
    """
    __tablename__ = "nft_cache"

    id = Column(Integer, primary_key=True, index=True)
    # The wallet address of the owner of these NFTs
    owner_wallet_address = Column(String, unique=True, index=True, nullable=False)
    # The raw JSON data from the TON API
    nft_data = Column(JSON, nullable=False)
    # The timestamp of the last cache update
    cached_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<NftCache(owner_wallet_address='{self.owner_wallet_address}', cached_at='{self.cached_at}')>"
