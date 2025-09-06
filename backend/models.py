from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    wallet_address = Column(String, index=True)
    username = Column(String)
    first_name = Column(String)

    showcases = relationship("Showcase", back_populates="user")

class Showcase(Base):
    __tablename__ = "showcases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="showcases")
    showcase_nfts = relationship("ShowcaseNft", back_populates="showcase", cascade="all, delete-orphan")

class ShowcaseNft(Base):
    __tablename__ = "showcase_nfts"

    id = Column(Integer, primary_key=True, index=True)
    showcase_id = Column(Integer, ForeignKey("showcases.id"), nullable=False)

    # NFT Data Snapshot
    nft_address = Column(String, nullable=False)
    name = Column(String)
    description = Column(Text)
    image = Column(String)
    collection_name = Column(String)

    showcase = relationship("Showcase", back_populates="showcase_nfts")
