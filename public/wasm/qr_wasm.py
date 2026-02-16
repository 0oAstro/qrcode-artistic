"""
QR Code WASM Module

Replicates the backend API for client-side QR code generation using Pyodide.
Matches the exact behavior of backend/main.py

Dependencies:
    segno>=1.6.6
    qrcode-artistic>=3.0.2
"""

import base64
import io
import time
from typing import Optional

import segno
# Import qrcode-artistic to register the to_artistic plugin
import qrcode_artistic  # noqa: F401


def generate_qr(
    url: str,
    scale: int = 8,
    kind: str = "png",
    image: Optional[bytes] = None,
    background_url: Optional[str] = None,
) -> dict:
    """
    Generate QR code (plain or artistic) matching backend API.

    This function replicates the exact behavior of the FastAPI endpoint
    in backend/main.py for client-side execution.

    Args:
        url: QR code target URL/content
        scale: QR code scale factor (default: 8, max 12 for WASM)
        kind: Output format (png, jpg, gif) (default: "png")
        image: Background image as bytes (from file upload)
        background_url: Background image URL (requires requests/fetch)

    Returns:
        dict with keys:
            - url: data URL (e.g., "data:image/png;base64,...")
            - content: Description string
            - description: Detailed description

    Raises:
        ValueError: If URL is empty
        Exception: If QR generation fails
    """
    if not url:
        raise ValueError("URL parameter is missing")

    # Limit scale for WASM to avoid memory issues
    scale = min(scale, 12)

    # Create QR code with high error correction (same as backend)
    qr = segno.make(url, error='h')
    output_buffer = io.BytesIO()

    # Handle three cases: uploaded file, background URL, or no background
    # This matches the backend logic exactly
    if image:
        # Case 1: Uploaded image file
        background_buffer = io.BytesIO(image)

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
        # Note: In browser, use JavaScript fetch instead of Python requests
        # This is handled at the interface level
        raise NotImplementedError(
            "background_url not supported in WASM - use fetch in JS and pass bytes"
        )

    else:
        # Case 3: No background - generate plain QR code
        qr.save(
            out=output_buffer,
            kind=kind,
            scale=scale
        )
        background_used = "plain QR code"

    output_buffer.seek(0)

    # Convert to base64 for JSON response (same as backend)
    image_bytes = output_buffer.getvalue()

    # Process in chunks to avoid stack overflow
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    # Determine media type (same as backend)
    media_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'gif': 'image/gif'
    }
    media_type = media_types.get(kind.lower(), 'image/png')

    # Add timestamp for cache-busting (same as backend)
    timestamp = int(time.time() * 1000)  # milliseconds precision

    # Create data URL with cache-busting parameter (same as backend)
    data_url = f"data:{media_type};base64,{base64_image}#t={timestamp}"

    return {
        "url": data_url,
        "content": f"QR code generated for {url}",
        "description": f"QR code with {background_used} in {kind.upper()} format"
    }


def generate_qr_plain(
    url: str,
    scale: int = 8,
    kind: str = "png",
) -> dict:
    """
    Generate plain QR code without background.

    Convenience wrapper for generate_qr() with no background.
    """
    return generate_qr(url=url, scale=scale, kind=kind, image=None)


def generate_qr_with_background_bytes(
    url: str,
    background_bytes: bytes,
    scale: int = 8,
    kind: str = "png",
) -> dict:
    """
    Generate artistic QR code with background image bytes.

    Convenience wrapper for generate_qr() with background image.
    Use this when you have the background as bytes (e.g., from file upload).
    """
    return generate_qr(url=url, scale=scale, kind=kind, image=background_bytes)


# For direct testing when run with Python
if __name__ == "__main__":
    # Test plain QR generation
    result = generate_qr_plain("https://example.com", scale=10, kind="png")
    print(f"Generated QR: {result['description']}")
    print(f"Data URL length: {len(result['url'])}")

    # Test with background if image available
    try:
        with open("test_background.png", "rb") as f:
            bg_bytes = f.read()
        result = generate_qr_with_background_bytes(
            "https://example.com",
            bg_bytes,
            scale=10,
            kind="png"
        )
        print(f"Generated artistic QR: {result['description']}")
    except FileNotFoundError:
        print("No test background image found, skipping artistic test")
