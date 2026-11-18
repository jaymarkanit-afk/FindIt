// Resizing photos in the browser before they are saved, as the old app's
// resizePhoto() did: at most maxWidth wide, JPEG at about 80%, transparent
// areas white. The result is a data: URL (what localStorage can hold; the
// backend will take the file instead). Uses an off-screen canvas only.

export const PHOTO_MAX_WIDTH = 1200; // post and featured photos
export const BACKGROUND_MAX_WIDTH = 1600;
const PHOTO_QUALITY = 0.8;

function readAsDataUrl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => resolve(img);
    img.src = src;
  });
}

// Resolves to a JPEG data: URL, or null when the file is not a readable image
export async function resizePhoto(file: Blob, maxWidth: number = PHOTO_MAX_WIDTH): Promise<string | null> {
  const dataUrl = await readAsDataUrl(file);
  const img = dataUrl ? await loadImage(dataUrl) : null;
  if (!img || !img.width || !img.height) return null;
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
}

// Several files at once; unreadable ones come back as null
export function resizePhotos(files: readonly Blob[], maxWidth: number = PHOTO_MAX_WIDTH): Promise<(string | null)[]> {
  return Promise.all(files.map((file) => resizePhoto(file, maxWidth)));
}
