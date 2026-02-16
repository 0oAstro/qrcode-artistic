"""
QR Code Generator Module

Core QR code generation functionality for WebAssembly.
This module is designed to work with Pyodide in the browser.
"""

import io
import base64
from typing import Optional, Literal

try:
    import segno
except ImportError:
    raise ImportError("segno is required. Install with: uv add segno")


class QRCodeGenerator:
    """
    Generate QR codes with optional artistic backgrounds.

    Designed for WebAssembly/Pyodide execution in the browser.
    """

    def __init__(self, content: str, error: Literal["L", "M", "Q", "H"] = "H"):
        """
        Initialize QR code generator.

        Args:
            content: The text/URL to encode in the QR code
            error: Error correction level (L=7%, M=15%, Q=25%, H=30%)
        """
        if not content:
            raise ValueError("QR code content cannot be empty")

        self.content = content
        self.error = error
        self._qr = segno.make(content, error=error.lower())

    def to_buffer(
        self,
        scale: int = 10,
        kind: Literal["png", "svg", "text"] = "png",
    ) -> bytes:
        """
        Generate QR code as bytes.

        Args:
            scale: Module scale factor (larger = bigger QR code)
            kind: Output format (png, svg, or text/terminal)

        Returns:
            QR code as bytes
        """
        buffer = io.BytesIO()
        self._qr.save(out=buffer, kind=kind, scale=scale)
        return buffer.getvalue()

    def to_base64(
        self,
        scale: int = 10,
        kind: Literal["png", "svg"] = "png",
    ) -> str:
        """
        Generate QR code as base64 data URL.

        Args:
            scale: Module scale factor
            kind: Output format

        Returns:
            Data URL string (e.g., "data:image/png;base64,...")
        """
        buffer = io.BytesIO()
        self._qr.save(out=buffer, kind=kind, scale=scale)
        image_bytes = buffer.getvalue()

        if kind == "svg":
            # SVG is text, not binary
            b64 = base64.b64encode(image_bytes.encode()).decode("utf-8")
            return f"data:image/svg+xml;base64,{b64}"
        else:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            return f"data:image/png;base64,{b64}"

    def to_artistic_buffer(
        self,
        background: bytes,
        scale: int = 10,
        kind: Literal["png", "jpg", "jpeg", "gif"] = "png",
    ) -> bytes:
        """
        Generate artistic QR code with background image.

        Args:
            background: Background image as bytes
            scale: Module scale factor
            kind: Output format

        Returns:
            Combined image as bytes
        """
        bg_buffer = io.BytesIO(background)
        output_buffer = io.BytesIO()

        self._qr.to_artistic(
            background=bg_buffer,
            target=output_buffer,
            scale=scale,
            kind=kind
        )

        return output_buffer.getvalue()

    def to_artistic_base64(
        self,
        background: bytes,
        scale: int = 10,
        kind: Literal["png", "jpg", "jpeg", "gif"] = "png",
    ) -> str:
        """
        Generate artistic QR code as base64 data URL.

        Args:
            background: Background image as bytes
            scale: Module scale factor
            kind: Output format

        Returns:
            Data URL string
        """
        image_bytes = self.to_artistic_buffer(background, scale, kind)
        b64 = base64.b64encode(image_bytes).decode("utf-8")

        media_types = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
        }
        media_type = media_types.get(kind.lower(), "image/png")

        return f"data:{media_type};base64,{b64}"

    @property
    def size(self) -> tuple[int, int]:
        """Get QR code dimensions (modules)."""
        return self._qr.size

    @property
    def version(self) -> int:
        """Get QR code version (size indicator)."""
        return self._qr.version


def generate_qr(
    content: str,
    scale: int = 10,
    error: str = "H",
    kind: str = "png",
    background: Optional[bytes] = None,
) -> str:
    """
    Convenience function to generate QR code as data URL.

    Args:
        content: Text/URL to encode
        scale: Module scale factor
        error: Error correction level
        kind: Output format
        background: Optional background image bytes

    Returns:
        Data URL string
    """
    qr = QRCodeGenerator(content, error=error)

    if background:
        return qr.to_artistic_base64(background, scale, kind)
    else:
        return qr.to_base64(scale, kind)
