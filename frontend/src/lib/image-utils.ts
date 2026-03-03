const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;

function isHeic(file: File): boolean {
    const name = file.name.toLowerCase();
    return (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        name.endsWith(".heic") ||
        name.endsWith(".heif")
    );
}

function drawToJpegDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };
        img.src = url;
    });
}

/**
 * Converts any image file to a JPEG data URL.
 * Handles HEIC/HEIF (via heic2any), WEBP, BMP, TIFF, AVIF, PNG, etc.
 * Resizes images larger than 2048px on either side.
 */
export async function convertImageToJpeg(file: File): Promise<string> {
    let blob: Blob = file;

    if (isHeic(file)) {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: JPEG_QUALITY,
        });
        blob = Array.isArray(result) ? result[0] : result;
    }

    return drawToJpegDataUrl(blob);
}
