"""
QR Code WASM Module

A WebAssembly-compatible QR code generation library using Pyodide.
Provides client-side QR code generation with optional artistic backgrounds.
"""

__version__ = "0.1.0"

from .qr_generator import QRCodeGenerator

__all__ = ["QRCodeGenerator"]
