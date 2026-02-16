/**
 * Pyodide configuration
 * Using CDN loading to avoid bundling issues
 */

export const PYODIDE_VERSION = "0.29.3";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Python packages required for QR code generation
 * These are loaded from the local pyodide installation
 */
export const PYTHON_PACKAGES = [
  "micropip", // For installing additional packages
  "pillow", // qrcode-artistic dependency
];

/**
 * Python packages to install via micropip
 */
export const MICROPIP_PACKAGES = [
  "segno>=1.6.6",
  "qrcode-artistic>=3.0.2",
];

/**
 * Path to the qr_wasm.py module relative to public directory
 */
export const QR_WASM_MODULE_PATH = "/wasm/qr_wasm.py";
