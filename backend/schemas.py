from pydantic import BaseModel
from typing import Optional

# Pydantic models (Schemas) for API data validation and serialization

class UserBase(BaseModel):
    """
    Base schema for a user, contains common fields.
    """
    telegram_id: int
    username: Optional[str] = None
    wallet_address: str


class UserConnect(UserBase):
    """
    Schema for the request body when a user connects their wallet.
    Inherits all fields from UserBase.
    """
    pass


class User(UserBase):
    """
    Schema for representing a User in API responses.
    Includes the database ID.
    """
    id: int

    class Config:
        """
        Pydantic's configuration class.
        'from_attributes = True' allows the model to be created from ORM objects.
        """
        from_attributes = True


# Schemas for NFT Data returned by our API

class NftPreview(BaseModel):
    url: str
    resolution: str

class NftItem(BaseModel):
    address: str
    name: Optional[str] = "Untitled NFT"
    description: Optional[str] = "No description available."
    previews: Optional[list[NftPreview]] = []

    class Config:
        from_attributes = True
