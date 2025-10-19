from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from . import models

# Official TON SDK
from tonutils.tonconnect import TonConnect


class WalletConnectRequest(BaseModel):
    telegram_id: int
    wallet_address: str
    username: str | None = None
    first_name: str | None = None
    init_data: str


def verify_wallet(
    request: WalletConnectRequest,
    db: Session,
    bot_token: str,
):
    is_valid = TonConnect.verify_telegram_authorization(
        token=bot_token,
        init_data=request.init_data,
    )
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid initData")

    user = db.query(models.User).filter(models.User.telegram_id == request.telegram_id).first()

    if user:
        user.wallet_address = request.wallet_address
        user.username = request.username
        user.first_name = request.first_name
    else:
        user = models.User(
            telegram_id=request.telegram_id,
            wallet_address=request.wallet_address,
            username=request.username,
            first_name=request.first_name
        )
        db.add(user)

    db.commit()

    return {"status": "success"}
