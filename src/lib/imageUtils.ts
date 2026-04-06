/**
 * Image compression and cropping utilities
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Crop {
  x: number;
  y: number;
}

/**
 * Compress image to reduce file size while maintaining quality
 * Uses canvas API for client-side compression
 */
export async function compressImage(
  imageData: string,
  quality: number = 0.7,
  maxWidth: number = 500,
  maxHeight: number = 500
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with specified quality
      try {
        const compressedData = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedData);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageData;
  });
}

/**
 * Crop image data based on crop area and zoom
 * Returns cropped image as data URL
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: CropArea,
  _rotation: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      try {
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

