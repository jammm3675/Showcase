from tonutils.client import TonapiClient
from tonutils.tl.types import Cell, Boc
from tonutils.parse import TlParser
from tonutils.wallet import WalletV4R2
from .ton_client import TonClient


class GetGemsClient:
    def __init__(self, ton_client: TonClient):
        self.ton_client = ton_client

    def create_sale_link(self, nft_address: str, price: int):
        # This is a simplified implementation. The actual implementation would be more complex
        # and would require interacting with the getgems.io smart contracts to get the correct
        # marketplace address and payload structure.
        marketplace_address = "EQBYTuYbLf8INxFtD8tQeNk5ZLy-nAX9ahQbG_yl1qQ-GEMS"  # getgems.io marketplace

        # Create the sale payload
        payload = Cell()
        payload.bits.write_uint(1, 32)  # op
        payload.bits.write_uint(0, 64)  # query_id
        payload.bits.write_address(nft_address)
        payload.bits.write_coins(price)

        # Create the transaction
        tx = {
            "to": marketplace_address,
            "value": 100000000,  # 0.1 TON for gas
            "payload": payload.to_boc().hex(),
        }

        # Create the deep link
        return f"ton://transfer/{tx['to']}?amount={tx['value']}&bin={tx['payload']}"

    async def get_sale_data(self, nft_address: str):
        account_state = await self.ton_client.get_account_state(nft_address)
        if not account_state.data:
            return None

        try:
            parser = TlParser(Boc(account_state.data).top_cell())
            # This is a simplified parsing logic. The actual logic will be more complex and
            # will depend on the specific smart contract version.
            price = parser.load_coins()
            seller = parser.load_address()
            marketplace = parser.load_address()

            return {
                "price": price,
                "seller": seller.to_string(True),
                "marketplace": marketplace.to_string(True),
            }
        except Exception as e:
            print(f"Error parsing sale data: {e}")
            return None
