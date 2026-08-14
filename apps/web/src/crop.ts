export type CropState = {
  offsetX: number;
  offsetY: number;
  zoom: number;
  cropSize: number;
  imageWidth: number;
  imageHeight: number;
};

export const OUTPUT_SIZE = 512;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function minCoveredZoom(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
) {
  return cropSize / Math.min(imageWidth, imageHeight);
}

export function constrainCrop(state: CropState): CropState {
  const minZoom = minCoveredZoom(
    state.imageWidth,
    state.imageHeight,
    state.cropSize,
  );
  const zoom = Math.max(state.zoom, minZoom);
  const renderedWidth = state.imageWidth * zoom;
  const renderedHeight = state.imageHeight * zoom;
  const maxX = Math.max(0, (renderedWidth - state.cropSize) / 2);
  const maxY = Math.max(0, (renderedHeight - state.cropSize) / 2);

  return {
    ...state,
    zoom,
    offsetX: clamp(state.offsetX, -maxX, maxX),
    offsetY: clamp(state.offsetY, -maxY, maxY),
  };
}

export function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

export async function createCroppedImage(
  sourceUrl: string,
  state: CropState,
): Promise<Blob> {
  const constrained = constrainCrop(state);
  const image = await createImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available');
  }

  const scale = OUTPUT_SIZE / constrained.cropSize;
  const drawWidth = constrained.imageWidth * constrained.zoom * scale;
  const drawHeight = constrained.imageHeight * constrained.zoom * scale;
  const drawX = OUTPUT_SIZE / 2 + constrained.offsetX * scale - drawWidth / 2;
  const drawY = OUTPUT_SIZE / 2 + constrained.offsetY * scale - drawHeight / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create cropped image'));
        return;
      }

      resolve(blob);
    }, 'image/webp');
  });
}
