/**
 * Pyodide type definitions for QR code generation
 */

export interface GenerateQROptions {
  url: string;
  scale?: number;
  kind?: "png" | "jpg" | "gif";
  background?: ArrayBuffer;
}

export interface QRResult {
  url: string;
  content: string;
  description: string;
}

export interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (packages: string | string[]) => Promise<void>;
  setStdout: (batched: (str: string) => void) => void;
  setStderr: (batched: (str: string) => void) => void;
  toPy: (jsObject: unknown) => unknown;
  toJs: () => unknown;
  globals: unknown;
  _module: unknown;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
  };
}

export interface LoadPyodideOptions {
  indexURL?: string;
  packageCacheDir?: string;
}

export interface LoadPyodideResult {
  Pyodide: {
    loadPackage: (packages: string | string[]) => Promise<void>;
    version: string;
  };
  loadPyodide: (options?: LoadPyodideOptions) => Promise<PyodideInterface>;
}
