from tonutils.client import TonapiClient
from tonutils.tl.types import Cell, Boc
from tonutils.parse import TlParser
from .ton_client import TonClient


class GetGemsClient:
    def __init__(self, ton_client: TonClient):
        self.ton_client = ton_client

    def create_sale_link(self, nft_address: str, price: int):
        # This is a placeholder implementation.
        # The actual implementation will require interacting with the getgems.io smart contracts.
        return f"https://getgems.io/nft/{nft_address}/sale?price={price}"

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
