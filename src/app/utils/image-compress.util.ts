/** Taille cible max pour les images uploadées (200 Ko). */
export const MAX_IMAGE_BYTES = 200 * 1024;

/**
 * Compresse une image si elle dépasse maxBytes (défaut 200 Ko).
 * Retourne le fichier original s'il est déjà sous la limite ou non compressible.
 */
export async function compressImageIfNeeded(
  file: File,
  maxBytes: number = MAX_IMAGE_BYTES
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  if (file.size <= maxBytes) {
    return file;
  }

  const image = await loadImageElement(file);
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  const maxDimension = 2048;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let quality = 0.88;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 14; attempt++) {
    blob = await drawToJpegBlob(image, width, height, quality);
    if (blob && blob.size <= maxBytes) {
      return toJpegFile(file, blob);
    }
    if (quality > 0.4) {
      quality -= 0.08;
    } else if (width > 400 && height > 400) {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
      quality = 0.82;
    } else {
      break;
    }
  }

  if (blob && blob.size < file.size) {
    return toJpegFile(file, blob);
  }

  return file;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire l\'image'));
    };
    img.src = url;
  });
}

function drawToJpegBlob(
  source: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.resolve(null);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

function toJpegFile(original: File, blob: Blob): File {
  const baseName = original.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}
