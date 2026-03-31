import { createWorker } from "tesseract.js";

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_IMAGE_DIMENSION = 1600;

export interface BetSlipOcrOptions {
  timeoutMs?: number;
  onProgress?: (progress01: number) => void;
}

/**
 * Downscale large photos in-browser so OCR stays responsive.
 */
export async function resizeImageFile(file: File, maxDimension = MAX_IMAGE_DIMENSION): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = Math.max(bitmap.width, bitmap.height);
    const scale = maxSide <= maxDimension ? 1 : maxDimension / maxSide;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not available in this browser.");
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      throw new Error("Could not encode the image for OCR.");
    }
    return blob;
  } finally {
    bitmap.close();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(id);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(id);
        reject(err);
      },
    );
  });
}

/**
 * Run English OCR in the browser (WASM). No image data leaves your device.
 */
export async function runBetSlipOcr(image: Blob | File, options?: BetSlipOcrOptions): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const worker = await createWorker("eng", undefined, {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        options?.onProgress?.(message.progress);
      }
    },
  });

  try {
    const { data } = await withTimeout(
      worker.recognize(image),
      timeoutMs,
      "Reading the slip took too long. Try a smaller or clearer photo.",
    );
    const text = (data.text ?? "").trim();
    if (!text) {
      throw new Error("No text was found in the image. Try a sharper screenshot.");
    }
    return text;
  } finally {
    await worker.terminate();
  }
}
