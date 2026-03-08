/**
 * Image Utility Functions
 * ───────────────────────
 * Handles client-side image processing before upload. Converts ALL image
 * formats (including iPhone HEIC/HEIF) to standard JPEG, and resizes
 * oversized images to keep uploads fast and storage costs low.
 *
 * Used by: Report page (item photos) and Claim page (proof images).
 */

// Maximum pixel dimension — images larger than this are scaled down
const MAX_DIMENSION = 2048;
// JPEG compression quality (0.0 = worst, 1.0 = best)
const JPEG_QUALITY = 0.85;

/**
 * Checks if a file is in Apple's HEIC/HEIF format (common on iPhones).
 * These formats aren't supported by browsers, so we convert them to JPEG.
 */
function isHeic(file: File): boolean {
    const name = file.name.toLowerCase();
    return (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        name.endsWith(".heic") ||
        name.endsWith(".heif")
    );
}

/**
 * Draws an image blob onto an HTML canvas and exports it as a JPEG data URL.
 * If the image exceeds MAX_DIMENSION on either side, it is scaled down
 * proportionally to fit within the limit.
 */
function drawToJpegDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            // Calculate scaled dimensions if image is too large
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            // Draw the image onto a canvas at the target dimensions
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);
            // Export the canvas contents as a JPEG data URL
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
 * Main export — converts any image file to a JPEG data URL.
 * Handles HEIC/HEIF (via heic2any library), WEBP, BMP, TIFF, AVIF, PNG, etc.
 * Resizes images larger than 2048px on either side.
 *
 * @param file - The File object from an <input type="file"> element
 * @returns A base64-encoded JPEG data URL string
 */
export async function convertImageToJpeg(file: File): Promise<string> {
    let blob: Blob = file;

    // If the file is HEIC/HEIF (iPhone format), convert it to JPEG first
    if (isHeic(file)) {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: JPEG_QUALITY,
        });
        blob = Array.isArray(result) ? result[0] : result;
    }

    // Draw to canvas and export as JPEG data URL
    return drawToJpegDataUrl(blob);
}
