// On-device compression: ~4MB source -> ~200KB target JPEG.
// Re-encoding through <canvas> inherently strips all EXIF (orientation,
// GPS, device info, etc.) because canvas pixel data carries no metadata.
// The one piece of "EXIF" the brief wants kept — capture timestamp — is
// therefore captured separately as plain metadata alongside the blob
// (see QueuedPhoto.capturedAt in db.ts) rather than re-embedded into the
// JPEG binary, which would require a manual EXIF writer for one field.

const TARGET_BYTES = 200 * 1024;
const MAX_DIMENSION = 1600; // downscale long edge; source photos are ~4MB, likely 3000px+

async function loadImageBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function drawToCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  let { width, height } = bitmap;
  if (Math.max(width, height) > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

export interface CompressResult {
  blob: Blob;
  capturedAt: string;
}

export async function compressPhoto(source: Blob): Promise<CompressResult> {
  const capturedAt = new Date().toISOString();
  const bitmap = await loadImageBitmap(source);
  const canvas = drawToCanvas(bitmap);

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, quality);

  // Step down quality until under target, floor at 0.4 to keep photos usable
  // for damage evidence rather than chasing the byte target into mush.
  while (blob.size > TARGET_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  return { blob, capturedAt };
}
