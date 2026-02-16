# Plan: Convert Python Backend to WebAssembly (WASM)

## Executive Summary

Convert the FastAPI backend (QR code generation with `segno` + `qrcode-artistic`) to WebAssembly using Pyodide, enabling client-side QR generation without server dependencies.

---

## Current Architecture

### Backend (`backend/main.py`)
```python
# Core libraries
import segno                # QR code generation
# qrcode-artistic plugin (registered via segno)

# Three generation modes:
1. Plain QR: qr.save(out, kind, scale)
2. Artistic QR (file): qr.to_artistic(background=BytesIO, target, scale, kind)
3. Artistic QR (url): requests.get(url) -> qr.to_artistic(...)

# Input: url, scale, kind, image (file) or background_url
# Output: base64 data URL
```

### Dependencies (via `uv`)
```toml
segno>=1.6.6              # QR code generation
qrcode-artistic>=3.0.2    # Artistic QR plugin (segno writer)
```

---

## WASM Architecture

### Approach: Pyodide + segno + qrcode-artistic

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Pyodide Runtime (loaded lazily)              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Python Packages (loaded from Pyodide CDN)          │  │  │
│  │  │  - segno (QR generation)                            │  │  │
│  │  │  - qrcode-artistic (artistic QR plugin)             │  │  │
│  │  │  - Pillow (image processing, qrcode-artistic dep)   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  qr_wasm.py (our wrapper module)                    │  │  │
│  │  │  - Replicates backend API                           │  │  │
│  │  │  - Handles JS<->Python data conversion              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan (Ralph Loop)

### R1: Setup & Environment ✅
**Goal**: Create WASM module structure with `uv`

**Deliverables**:
- `wasm/` directory with `pyproject.toml`
- `qr_wasm.py` wrapper module
- Development setup documentation

**Tasks**:
1. ✅ Create `wasm/pyproject.toml` with segno + qrcode-artistic deps
2. ✅ Create `wasm/qr_wasm.py` with API matching backend
3. ⏳ Create Pyodide loader utilities
4. ⏳ Test local Python execution

### R2: Core QR Generation
**Goal**: Port `segno.make()` + `qr.save()` to WASM

**Requirements**:
- Match backend API: `segno.make(content, error='h')`
- Support same output formats: png, jpg, gif
- Return base64 data URL (match backend response format)

**Implementation**:
```python
# qr_wasm.py
def generate_qr_plain(url: str, scale: int = 8, kind: str = "png") -> str:
    """Generate plain QR code, returns data URL"""
    qr = segno.make(url, error='h')
    buffer = io.BytesIO()
    qr.save(out=buffer, kind=kind, scale=scale)
    # ... convert to base64 data URL
```

### R3: Artistic QR with Backgrounds
**Goal**: Port `qr.to_artistic()` to WASM

**Requirements**:
- Accept background image as bytes
- Use same scale/kind parameters as backend
- Handle `qrcode-artistic` plugin loading in Pyodide

**Challenges**:
- `qrcode-artistic` must be registered as segno plugin
- May need to import explicitly: `import qrcode_artistic`

**Implementation**:
```python
def generate_qr_artistic(
    url: str,
    background_bytes: bytes,
    scale: int = 8,
    kind: str = "png"
) -> str:
    """Generate artistic QR with background"""
    import qrcode_artistic  # Ensure plugin is loaded
    qr = segno.make(url, error='h')
    bg_buffer = io.BytesIO(background_bytes)
    output = io.BytesIO()
    qr.to_artistic(background=bg_buffer, target=output, scale=scale, kind=kind)
    # ... convert to base64 data URL
```

### R4: Frontend Integration
**Goal**: Integrate WASM into `PixelQrGenerator.tsx`

**Requirements**:
1. Lazy load Pyodide (only when needed)
2. Show loading state during Pyodide init
3. Feature flag for WASM vs server API
4. Graceful fallback to server on error

**Implementation**:
```typescript
// lib/pyodide.ts
export async function loadPyodide() {
  const pyodide = await loadPyodide({ indexURL: "..." });
  await pyodide.loadPackage(["segno", "pillow"]);
  // Load our custom module
  await pyodide.runPythonAsync(`
    import sys
    sys.path.insert(0, "${wasmModulePath}")
    import qr_wasm
  `);
  return pyodide;
}

// hooks/usePyodide.ts
export function usePyodize() {
  const [ready, setReady] = useState(false);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  // ... lazy loading logic
}

// components/PixelQrGenerator.tsx
const generateQr = async () => {
  if (useWasm && pyodide) {
    // Use WASM
    const result = await pyodide.runPythonAsync(`
      qr_wasm.generate_qr("${url}", ${scale}, "${kind}")
    `);
  } else {
    // Fallback to server
    const response = await fetch("/api/generate-qr", ...);
  }
};
```

### R5: Optimization & Polish
**Goal**: Optimize bundle, UX, and error handling

**Tasks**:
1. Bundle size optimization (tree-shaking, compression)
2. Web Worker for large generations (avoid blocking UI)
3. Progress indicators for long operations
4. Cross-browser testing
5. Error handling and fallback logic

---

## Key Technical Decisions

### 1. Use Existing Libraries ✓
- `segno` - Core QR generation (already using)
- `qrcode-artistic` - Artistic QR plugin (already using)
- No need to rewrite core logic

### 2. Pyodide Package Loading
```python
# Packages available in Pyodide:
- segno: ✓ Available
- pillow: ✓ Available (required by qrcode-artistic)
- qrcode-artistic: ✓ Pure Python, should work

# Loading strategy:
await pyodide.loadPackage(["micropip", "pillow"])
await pyodide.runPythonAsync(`
    import micropip
    await micropip.install("segno")
    await micropip.install("qrcode-artistic")
`)
```

### 3. Data Flow
```
Frontend                    Pyodide (WASM)
─────────────────────────────────────────────────────
File Upload  →  ArrayBuffer  →  Python bytes
                          ↓
                    QR generation
                          ↓
              Base64 string  →  Data URL
                          ↓
                   Display image
```

---

## File Structure

```
wasm/
├── pyproject.toml           # uv project config (for local dev/testing)
├── qr_wasm.py              # Main QR generation module
├── README.md               # WASM module documentation
└── tests/
    ├── test_qr_wasm.py     # Python unit tests (run locally with uv)
    └── test_browser.py     # Pyodide browser tests

lib/
├── pyodide/
│   ├── loader.ts           # Pyodide loading utilities
│   ├── config.ts           # Configuration (CDN URLs, etc.)
│   └── types.ts            # TypeScript definitions
└── pyodide-worker.ts       # Web Worker wrapper

hooks/
└── use-pyodide.ts          # React hook for Pyodide state

components/
└── PixelQrGenerator.tsx     # Updated with WASM integration

public/
└── wasm/
    └── qr_wasm.py          # Served to Pyodide
```

---

## Dependencies

### Python (in wasm/pyproject.toml)
```toml
[project]
name = "qrcode-wasm"
version = "0.1.0"
dependencies = [
    "segno>=1.6.6",
    "qrcode-artistic>=3.0.2",
]

[tool.uv]
dev-dependencies = [
    "pytest>=7.0.0",
    "pyright>=1.1.0",
]
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "pyodide": "^0.29.3"
  }
}
```

**Note**: Using local npm package instead of CDN for better:
- Self-contained deployment (no external CDN dependency)
- Offline support after initial load
- Better caching and performance
- Version control and security

---

## API Design

### Python Module (`qr_wasm.py`)
```python
# Match backend API exactly

def generate_qr(
    url: str,
    scale: int = 8,
    kind: str = "png",
    background: Optional[bytes] = None,
) -> dict:
    """
    Generate QR code (plain or artistic).

    Returns dict matching backend response:
    {
        "url": "data:image/png;base64,...",
        "content": "QR code generated for ...",
        "description": "QR code with ... in ... format"
    }
    """
```

### JavaScript/TypeScript Interface
```typescript
interface GenerateQROptions {
  url: string;
  scale?: number;
  kind?: "png" | "jpg" | "gif";
  background?: ArrayBuffer;  // From file upload
}

interface QRResult {
  url: string;           // data URL
  content: string;
  description: string;
}

async function generateQR(
  pyodide: PyodideInterface,
  options: GenerateQROptions
): Promise<QRResult>;
```

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Pyodide bundle size (~8MB) | Lazy loading, CDN caching, compression |
| First load delay | Show loading spinner, preload in background |
| qrcode-artistic plugin registration | Explicit import in qr_wasm.py |
| Image bytes conversion | Use pyodide.runPython with toJs() |
| CORS for image URLs | Keep server endpoint as fallback for URLs |
| Memory usage | Web Worker, explicit cleanup |

---

## Testing Strategy

### Local Testing (with `uv`)
```bash
cd wasm
uv run pytest tests/
uv run python -c "import qr_wasm; print(qr_wasm.generate_qr('test'))"
```

### Browser Testing
1. Load Pyodide in test page
2. Test all three generation modes
3. Measure performance
4. Test error handling

### Integration Testing
1. A/B test WASM vs server
2. Verify output identical
3. Performance comparison

---

## Rollout Plan

1. **Phase 1**: Feature flag `NEXT_PUBLIC_USE_WASM=false`
2. **Phase 2**: Enable for 10% of users (monitor errors)
3. **Phase 3**: Enable for 50% (performance metrics)
4. **Phase 4**: Default to WASM with server fallback
5. **Phase 5**: Consider deprecating server endpoint

---

## Success Metrics

- **Bundle Size**: < 10MB (gzipped) for initial load
- **First Load**: < 5 seconds (Pyodide + packages)
- **Generation Time**: < 2 seconds (p95)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+
- **Cost Reduction**: 90%+ reduction in server calls

---

*Last Updated: 2025-02-16*
*Status: Ready for Implementation*
