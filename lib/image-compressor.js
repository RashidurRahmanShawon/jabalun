// Client-side high-quality image compressor for e-commerce products.
// Compresses photos under target KB (default: 250KB) using modern WebP canvas encoding
// without visible quality degradation.

const MAX_KB = 250;
const MAX_DIMENSION = 1600;

export async function compressProductImage(file, options = {}) {
  const targetBytes = (options.maxKb || MAX_KB) * 1024;
  const maxDim = options.maxDimension || MAX_DIMENSION;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("ফাইলটি পড়া যায়নি।"));
    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error("ছবির ফরম্যাটটি সঠিক নয়।"));
      img.onload = async () => {
        try {
          // 1. Calculate optimal aspect ratio dimensions
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          // 2. Draw on high-precision canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("ক্যানভাস ইনিশিয়ালাইজ করা যায়নি।"));
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // 3. Adaptive compression loop targeting < 250KB
          // Start at 0.88 quality (virtually visually lossless for WebP)
          let quality = 0.88;
          let blob = null;
          let mime = "image/webp";

          // Helper to get blob from canvas
          const getBlob = (q, format) =>
            new Promise((res) => canvas.toBlob(res, format, q));

          blob = await getBlob(quality, mime);

          // Fallback to jpeg if browser doesn't support canvas webp export
          if (!blob || blob.type !== "image/webp") {
            mime = "image/jpeg";
            blob = await getBlob(quality, mime);
          }

          // Step down quality if image exceeds target bytes (down to 0.65 minimum)
          while (blob && blob.size > targetBytes && quality > 0.60) {
            quality -= 0.08;
            blob = await getBlob(quality, mime);
          }

          // If still over 250KB, reduce dimensions by 15% and re-render
          if (blob && blob.size > targetBytes) {
            const scaledWidth = Math.round(width * 0.85);
            const scaledHeight = Math.round(height * 0.85);
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            blob = await getBlob(0.78, mime);
          }

          if (!blob) {
            return reject(new Error("ছবি অপ্টিমাইজ করা সম্ভব হয়নি।"));
          }

          const originalKb = Math.round(file.size / 1024);
          const compressedKb = Math.round(blob.size / 1024);
          const savedPercent = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

          const ext = mime === "image/webp" ? ".webp" : ".jpg";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${baseName}${ext}`, { type: mime });

          resolve({
            file: compressedFile,
            previewUrl: URL.createObjectURL(blob),
            originalKb,
            compressedKb,
            savedPercent,
            width: canvas.width,
            height: canvas.height,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

