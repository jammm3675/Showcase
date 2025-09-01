import httpx
from typing import List, Dict, Any, Optional

TONAPI_URL = "https://tonapi.io/v2"

async def get_nfts_for_wallet(wallet_address: str) -> Optional[List[Dict[str, Any]]]:
    """
    Fetches the NFT items for a given wallet address from TonAPI.

    :param wallet_address: The address of the wallet to check.
    :return: A list of NFT item dictionaries, or None if an error occurs.
    """
    # We request a large limit to get all NFTs, up to 1000.
    # indirect_ownership=false means we only get NFTs directly owned by the wallet.
    api_url = f"{TONAPI_URL}/accounts/{wallet_address}/nfts?limit=1000&offset=0&indirect_ownership=false"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(api_url)

            # Raise an exception for bad status codes (4xx or 5xx)
            response.raise_for_status()

            data = response.json()
            return data.get("nft_items", [])

        except httpx.RequestError as exc:
            # Handle request errors (e.g., network issues)
            print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
            return None
        except httpx.HTTPStatusError as exc:
            # Handle HTTP status errors (e.g., 404 Not Found, 500 Server Error)
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            return None
        except Exception as exc:
            # Handle other potential errors, like JSON decoding
            print(f"An unexpected error occurred: {exc}")
            return None
