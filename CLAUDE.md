# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a QR code artistic generation project with **dual execution modes**:

1. **Client-side WASM** (default in development): QR codes generated in the browser using Pyodide
2. **Server-side Python**: Fallback API for production or unsupported browsers

- **Frontend**: Next.js 14 React application with App Router
- **WASM Runtime**: Pyodide 0.29.3 for Python in the browser
- **Backend (optional)**: Python API using Vercel Functions
- **UI Framework**: Modern component-based interface with shadcn/ui

## Development Commands

**Frontend Development:**
```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
```

**Python/WASM Development:**
```bash
cd wasm
uv sync           # Install Python dependencies for WASM module
uv run python -c "import qr_wasm; print(qr_wasm.generate_qr('test'))"  # Test locally
```

**Package management:**
- Frontend: `pnpm`
- Python/WASM: `uv`

## Architecture

### Dual Execution Modes

The application supports two QR code generation methods:

#### 1. Client-side WASM (Default in Dev)
- **Technology**: Pyodide + segno + qrcode-artistic running in WebAssembly
- **Benefits**: Privacy (no data sent to server), offline support, faster for repeated use
- **Limitations**: 8-10MB initial load, requires modern browser with WebAssembly
- **Trigger**: Automatic in development, or via `NEXT_PUBLIC_USE_WASM=true`

#### 2. Server-side Python
- **Technology**: FastAPI + segno + qrcode-artistic on Vercel Functions
- **Benefits**: Works on all browsers, no initial download
- **Trigger**: Manual toggle in UI, or when WASM fails/is unavailable

### Frontend Application
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **UI Components**: Extensive shadcn/ui component library
- **Main Component**: `PixelQrGenerator` handles QR generation with WASM/Server toggle
- **Special Effects**: Uses `@paper-design/shaders-react` for dithering background effects

### WASM Integration (`lib/pyodide/`)
- **Loader**: `loader.ts` - Loads Pyodide from CDN, installs Python packages
- **Types**: `types.ts` - TypeScript definitions for Pyodide API
- **Config**: `config.ts` - Pyodide version, CDN URLs, package lists
- **Hook**: `hooks/use-pyodide.ts` - React hook for managing Pyodide state

### Backend API (Optional)
- **Runtime**: Python 3.9 configured in vercel.json
- **QR Generation**: Uses Segno + qrcode-artistic libraries
- **API Endpoint**: `/api/generate-qr` for artistic QR code generation
- **Purpose**: Fallback for browsers without WebAssembly support

### Key Features
- **Dual Input Modes**: File upload and URL input for background images
- **HEIC Support**: Automatic conversion of HEIC images to JPEG
- **WASM/Server Toggle**: Switch between local and server generation
- **Drag & Drop**: Full drag-and-drop support for file uploads
- **Clipboard Support**: Copy generated QR codes to clipboard
- **Progress Tracking**: Visual progress bars for long operations
- **Privacy Mode**: WASM mode processes everything locally

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_USE_WASM=true          # Enable WASM by default (true for development)
NEXT_PUBLIC_API_URL=http://localhost:4002  # Fallback API URL for server mode
```

## Component Architecture

### Main Components
- `PixelQrGenerator`: Main app with WASM/Server toggle, QR generation, image upload
- `hooks/use-pyodide`: Manages Pyodide loading and state
- `lib/pyodide/`: Pyodide integration layer
- `components/ui/`: shadcn/ui components

### State Management
- `useWasm`: Toggle between WASM and Server modes
- `pyodide`: Pyodide instance (when WASM is active)
- `pyodideLoading`: Loading state for Pyodide initialization
- `pyodideReady`: Whether Pyodide is ready to use
- `imageBytes`: ArrayBuffer of uploaded image (for WASM mode)

## Pyodide/WASM Architecture

```
Browser (http://localhost:3000)
├── Load Pyodide script from CDN (https://cdn.jsdelivr.net/pyodide/v0.29.3/full/)
├── Load packages: micropip, pillow
├── Install Python packages via micropip:
│   ├── segno>=1.6.6 (QR code generation)
│   └── qrcode-artistic>=3.0.2 (artistic QR plugin)
└── Generate QR using inline Python code
```

### Why Inline Python Code?

The QR generation code is embedded directly in the JavaScript (in `lib/pyodide/loader.ts`) rather than loading external `.py` files because:
- **No file system access issues** - avoids CORS/404 errors
- **Faster** - no extra HTTP requests for Python modules
- **Simpler** - self-contained, easier to debug
- **Tested** - matches the approach used in `/test-wasm.html`

## File Structure

```
app/
├── api/generate-qr/           # Python API endpoint (optional fallback)
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
└── globals.css                # Global styles

components/
├── PixelQrGenerator.tsx       # Main app component with WASM integration
└── ui/                        # shadcn/ui components

lib/
├── pyodide/                   # Pyodide integration
│   ├── loader.ts              # Load Pyodide from CDN, generate QR
│   ├── config.ts              # Pyodide version, packages
│   └── types.ts               # TypeScript definitions
└── utils.ts                   # Utility functions

hooks/
└── use-pyodide.ts             # React hook for Pyodide state

wasm/
├── qr_wasm.py                 # Python QR module (for local testing with uv)
├── pyproject.toml             # uv project config
└── README.md                  # WASM module docs

public/
└── wasm/
    └── qr_wasm.py             # Served for testing (not used by Next.js integration)
```

## Development Workflow

### Testing WASM Functionality

1. **Start Dev Server:**
   ```bash
   pnpm dev  # Runs on http://localhost:3000
   ```

2. **Open Browser Console** (F12) and look for:
   - `[usePyodide]` - Hook lifecycle logs
   - `[Pyodide]` - Pyodide loading logs
   - `[QR Gen]` - QR generation logs
   - `[App]` - Component state logs

3. **Test QR Generation:**
   - Enter a URL in the "QR Code Content" field
   - Click "Run" or press Cmd+Enter
   - Check console for `[QR Gen] ✓ Success`

### Testing Python Module Locally (with uv)

```bash
cd wasm
uv sync
uv run python -c "import qr_wasm; result = qr_wasm.generate_qr('https://example.com', scale=5, kind='png'); print('Data URL length:', len(result['url']))"
```

### Standalone WASM Test Page

Visit `http://localhost:3000/test-wasm.html` for a simplified test page that:
- Loads Pyodide from CDN
- Installs segno and qrcode-artistic
- Generates a test QR code
- Shows all console output inline

## Troubleshooting

### WASM Shows "Loading..." Forever

**Check console for:**
- `[Pyodide] Starting load from CDN:` - Should see CDN URL
- `[Pyodide] Script loaded` - Script loaded successfully
- `[Pyodide] Instance created` - Pyodide initialized
- `[Pyodide] Installing Python packages:` - Installing segno/qrcode-artistic

**Common issues:**
- **CORS blocked**: CDN might be blocked by network/corporate firewall
- **Script load failed**: Check browser console for specific error
- **Package install failed**: micropip might not be able to download packages

### "Maximum Call Stack Size Exceeded"

**Cause:** Scale value too high (was 24, now 8) or large image causing stack overflow during base64 conversion.

**Fixed by:**
- Reduced scale from 24 to 8 (max 12 in Python code)
- Process base64 encoding in chunks (1024 bytes at a time)

### QR Generation Works in `/test-wasm.html` But Not in Next.js

**Cause:** Module loading issues - Next.js might not be serving `/wasm/qr_wasm.py` correctly.

**Solution:** Already fixed - now uses inline Python code instead of external modules.

## Deployment

### Vercel Deployment

WASM mode works out of the box on Vercel:
- Pyodide loads from CDN (jsdelivr)
- No special configuration needed
- Falls back to server API automatically if WASM fails

### Build Process

```bash
pnpm build  # Production build
```

The build:
1. Excludes `pyodide` from webpack bundle (configured in `next.config.mjs`)
2. Compiles React/TypeScript components
3. Generates optimized production bundle
4. Pyodide is loaded at runtime from CDN

## Current Implementation Status

The project provides:
- ✅ Client-side QR generation using Pyodide/WebAssembly
- ✅ Server-side QR generation as fallback
- ✅ User-toggleable WASM/Server modes
- ✅ Artistic QR codes with background images
- ✅ File upload and URL input for backgrounds
- ✅ HEIC to JPEG conversion
- ✅ Download and clipboard functionality
- ✅ Responsive design with modern aesthetics
- ✅ Privacy-focused (WASM mode processes locally)
- ✅ Offline support after initial load

## Python Dependencies (WASM)

```toml
# wasm/pyproject.toml
[project]
name = "qrcode-wasm"
version = "0.1.0"
dependencies = [
    "segno>=1.6.6",
    "qrcode-artistic>=3.0.2",
]
```

These are loaded via Pyodide's micropip at runtime, not bundled with the app.
