# QR Code WASM Module

Client-side QR code generation using Pyodide.

This module replicates the backend API for generating QR codes in the browser.

## Usage

```python
from qr_wasm import generate_qr

# Plain QR code
result = generate_qr(url="https://example.com", scale=8, kind="png")

# Artistic QR code with background
with open("background.png", "rb") as f:
    bg_bytes = f.read()
result = generate_qr(url="https://example.com", scale=8, kind="png", image=bg_bytes)
```

## Dependencies

- segno>=1.6.6
- qrcode-artistic>=3.0.2

## Development

```bash
uv sync
uv run python -c "import qr_wasm; print(qr_wasm.generate_qr('test'))"
```
