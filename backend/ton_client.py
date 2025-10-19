import os
import asyncio
from tonutils.tonconnect import TonConnect
from tonutils.adnl import AdnlTransport
from tonutils.tl.types import AccountAddress, AccountState, RawFullAccountState, Transaction, Message, Cell
from tonutils.client import TonapiClient


class TonClient:
    def __init__(self, toncenter_api_key: str):
        self.toncenter_api_key = toncenter_api_key
        self.client = TonapiClient(
            api_key=toncenter_api_key,
        )

    async def get_account_state(self, address: str) -> RawFullAccountState:
        return await self.client.get_account_state(address)

    async def get_transactions(self, address: str, limit: int = 10, to_lt: int = None, hash: str = None):
        return await self.client.get_transactions(address, limit, to_lt=to_lt, hash=hash)

    async def send_boc(self, boc: Cell):
        return await self.client.send_boc(boc)
