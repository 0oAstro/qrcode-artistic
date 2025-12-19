import base64
import io

import requests
import segno
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="QR Code Artistic Generator API",
    description="API for generating artistic QR codes with background images",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qrcode-artistic.vercel.app",
        "https://qraft.shauryaa.dev",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:4001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/generate-qr")
async def generate_qr(
    url: str = Form(...),
    scale: int = Form(8),
    kind: str = Form("png"),
    image: UploadFile = File(None),
    background_url: str = Form(None),
):
    try:
        if not url:
            return {"error": "URL parameter is missing"}

        # Create QR code
        qr = segno.make(url, error='h')
        output_buffer = io.BytesIO()

        # Handle three cases: uploaded file, background URL, or no background
        if image:
            # Case 1: Uploaded image file
            image_data = await image.read()
            background_buffer = io.BytesIO(image_data)

            # Generate artistic QR code with uploaded background
            qr.to_artistic(
                background=background_buffer,
                target=output_buffer,
                scale=scale,
                kind=kind
            )
            background_used = "uploaded image"

        elif background_url:
            # Case 2: Background URL
            try:
                response = requests.get(background_url, timeout=10)
                response.raise_for_status()
                background_buffer = io.BytesIO(response.content)

                # Generate artistic QR code with URL background
                qr.to_artistic(
                    background=background_buffer,
                    target=output_buffer,
                    scale=scale,
                    kind=kind
                )
                background_used = "URL image"

            except requests.RequestException as e:
                return {"error": f"Failed to fetch background image from URL: {str(e)}"}

        else:
            # Case 3: No background - generate plain QR code
            qr.save(
                out=output_buffer,
                kind=kind,
                scale=scale
            )
            background_used = "plain QR code"

        output_buffer.seek(0)

        # Convert to base64 for JSON response
        image_bytes = output_buffer.getvalue()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        # Determine media type
        media_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'gif': 'image/gif'
        }
        media_type = media_types.get(kind.lower(), 'image/png')

        # Add timestamp for cache-busting
        import time
        timestamp = int(time.time() * 1000)  # milliseconds precision

        # Create data URL with cache-busting parameter
        data_url = f"data:{media_type};base64,{base64_image}#t={timestamp}"

        return {
            "url": data_url,
            "content": f"QR code generated for {url}",
            "description": f"QR code with {background_used} in {kind.upper()} format"
        }

    except Exception as e:
        return {"error": f"Failed to generate QR code: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
