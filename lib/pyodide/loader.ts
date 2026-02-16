/**
 * Pyodide loader utilities for QR code generation
 * Uses dynamic import from CDN to avoid bundling issues
 */

import {
  MICROPIP_PACKAGES,
  PYODIDE_INDEX_URL,
  PYTHON_PACKAGES,
} from "./config";
import type { PyodideInterface } from "./types";

let pyodidePromise: Promise<PyodideInterface> | null = null;
let pyodideInstance: PyodideInterface | null = null;

/**
 * Load Pyodide and initialize the QR code generation module
 */
export async function loadPyodide(): Promise<PyodideInterface> {
  // Return cached instance if available
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing promise if already loading
  if (pyodidePromise) {
    return pyodidePromise;
  }

  console.log("[Pyodide] Starting load from CDN:", PYODIDE_INDEX_URL);

  pyodidePromise = (async () => {
    try {
      // Load Pyodide script from CDN (avoid double-inject)
      if (
        typeof (globalThis as { loadPyodide?: unknown }).loadPyodide !==
        "function"
      ) {
        const existingScript = document.querySelector(
          `script[src="${PYODIDE_INDEX_URL}pyodide.js"]`,
        );
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              console.log("[Pyodide] Script loaded");
              resolve();
            };
            script.onerror = () =>
              reject(new Error("Failed to load Pyodide script"));
            document.head.appendChild(script);
          });
        }
      }

      const loadPyodideGlobal = (
        globalThis as {
          loadPyodide?: (options: {
            indexURL: string;
          }) => Promise<PyodideInterface>;
        }
      ).loadPyodide;
      if (typeof loadPyodideGlobal !== "function") {
        throw new Error(
          "Pyodide global load function not available after script load",
        );
      }

      // Initialize Pyodide
      const pyodide = await loadPyodideGlobal({ indexURL: PYODIDE_INDEX_URL });
      console.log("[Pyodide] Instance created");

      // Load packages
      console.log("[Pyodide] Loading packages:", PYTHON_PACKAGES);
      await pyodide.loadPackage(PYTHON_PACKAGES);
      console.log("[Pyodide] Base packages loaded");

      // Install Python packages
      console.log("[Pyodide] Installing Python packages:", MICROPIP_PACKAGES);
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install(${JSON.stringify(MICROPIP_PACKAGES)})
        print("Python packages installed successfully")
      `);
      console.log("[Pyodide] Python packages installed");

      pyodideInstance = pyodide as PyodideInterface;
      console.log("[Pyodide] ✓ Fully initialized");
      return pyodide as PyodideInterface;
    } catch (error) {
      console.error("[Pyodide] ✗ Error:", error);
      pyodidePromise = null;
      throw error;
    }
  })();

  return pyodidePromise;
}

/**
 * Generate a QR code using Pyodide
 * Uses inline Python code instead of loading external module
 */
export async function generateQR(
  pyodide: PyodideInterface,
  options: {
    url: string;
    scale?: number;
    kind?: "png" | "jpg" | "gif";
    background?: ArrayBuffer;
  },
): Promise<{
  url: string;
  content: string;
  description: string;
}> {
  const { url, scale = 8, kind = "png", background } = options;

  console.log("[QR Gen] Generating QR:", {
    url,
    scale,
    kind,
    hasBackground: !!background,
  });

  // Build Python code inline (no external module loading issues)
  let pythonCode: string;

  if (background) {
    // Convert to base64 for Python
    const base64Bg = arrayBufferToBase64(background);
    pythonCode = `
      import base64
      import io
      import time
      import segno
      import qrcode_artistic

      # Create QR code
      qr = segno.make("${escapePythonString(url)}", error='h')

      # Decode background
      bg_bytes = base64.b64decode("${base64Bg}")
      bg_buffer = io.BytesIO(bg_bytes)

      # Generate artistic QR
      output = io.BytesIO()
      qr.to_artistic(background=bg_buffer, target=output, scale=${scale}, kind="${kind}")

      # Convert to base64
      output.seek(0)
      image_bytes = output.getvalue()
      base64_image = base64.b64encode(image_bytes).decode('utf-8')

      media_type = "image/png"
      if "${kind}" == "jpg" or "${kind}" == "jpeg":
        media_type = "image/jpeg"
      elif "${kind}" == "gif":
        media_type = "image/gif"

      timestamp = int(time.time() * 1000)
      data_url = f"data:{media_type};base64,{base64_image}#t={timestamp}"

      {
          "url": data_url,
          "content": "QR code generated for ${escapePythonString(url)}",
          "description": f"QR code with uploaded image in ${kind.toUpperCase()} format"
      }
    `;
  } else {
    // Plain QR code
    pythonCode = `
      import io
      import time
      import base64
      import segno

      # Create QR code
      qr = segno.make("${escapePythonString(url)}", error='h')

      # Generate QR
      output = io.BytesIO()
      qr.save(out=output, kind="${kind}", scale=${scale})

      # Convert to base64
      output.seek(0)
      image_bytes = output.getvalue()
      base64_image = base64.b64encode(image_bytes).decode('utf-8')

      media_type = "image/png"
      if "${kind}" == "jpg" or "${kind}" == "jpeg":
        media_type = "image/jpeg"
      elif "${kind}" == "gif":
        media_type = "image/gif"

      timestamp = int(time.time() * 1000)
      data_url = f"data:{media_type};base64,{base64_image}#t={timestamp}"

      {
          "url": data_url,
          "content": "QR code generated for ${escapePythonString(url)}",
          "description": f"QR code in ${kind.toUpperCase()} format"
      }
    `;
  }

  try {
    const result = await pyodide.runPythonAsync(pythonCode);

    // Convert result
    if (result && typeof result === "object" && "toJs" in result) {
      const jsResult = (result as { toJs: () => unknown }).toJs();
      console.log("[QR Gen] ✓ Success");
      return jsResult as {
        url: string;
        content: string;
        description: string;
      };
    }

    throw new Error("Invalid result from Python");
  } catch (error) {
    console.error("[QR Gen] ✗ Error:", error);
    throw error;
  }
}

/**
 * Escape string for Python
 */
function escapePythonString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Safely convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 1024;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Check if Pyodide is available in the current browser
 */
export function isPyodideSupported(): boolean {
  return (
    typeof WebAssembly === "object" && typeof WebAssembly.compile === "function"
  );
}

/**
 * Reset the Pyodide instance
 */
export function resetPyodide(): void {
  pyodidePromise = null;
  pyodideInstance = null;
}
