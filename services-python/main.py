from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import requests
from PIL import Image, ImageDraw
from io import BytesIO
import uuid
import math

app = FastAPI()

class CollageRequest(BaseModel):
    image_urls: list[str]

@app.post("/api/export/collage")
async def create_collage(request: CollageRequest):
    if not request.image_urls:
        raise HTTPException(status_code=400, detail="Please provide at least one image URL.")

    images = []
    for url in request.image_urls:
        try:
            response = requests.get(url)
            response.raise_for_status()
            # Use BytesIO to handle the image data in memory
            img = Image.open(BytesIO(response.content)).convert("RGBA")
            images.append(img)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process image at {url}: {e}")

    if not images:
        raise HTTPException(status_code=400, detail="No valid images could be processed.")

    # Determine grid size (e.g., 2x2 for up to 4, 3x3 for up to 9, etc.)
    grid_dim = math.ceil(math.sqrt(len(images)))

    # Define image and collage parameters
    img_size = 256
    gap = 10
    canvas_size = grid_dim * img_size + (grid_dim - 1) * gap

    collage = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

    # Paste images into the grid
    for i, img in enumerate(images):
        if i >= grid_dim * grid_dim:
            break # Stop if we have more images than grid cells

        row = i // grid_dim
        col = i % grid_dim

        # Resize and paste
        img = img.resize((img_size, img_size))
        x = col * (img_size + gap)
        y = row * (img_size + gap)
        collage.paste(img, (x, y))

    # Save to a temporary file in a writable directory
    filename = f"/tmp/{uuid.uuid4()}.png"
    collage.save(filename, "PNG")

    return FileResponse(filename, media_type="image/png", filename="showcase_collage.png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
