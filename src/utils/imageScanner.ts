export interface CompressedImageResult {
  base64: string;
  dataUrl: string;
  mimeType: 'image/jpeg';
}

export async function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.84
): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('יש לבחור קובץ תמונה תקין (JPG, PNG או WebP).');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error('לא ניתן לקרוא את קובץ התמונה שנבחר.'));
      image.src = objectUrl;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('שגיאה בעיבוד התמונה בדפדפן.');
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1] ?? '';

    if (!base64) {
      throw new Error('שגיאה בהמרת התמונה לשליחה.');
    }

    return {
      base64,
      dataUrl,
      mimeType: 'image/jpeg',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
