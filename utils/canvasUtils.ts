// utils/canvasUtils.ts

// ─── CONFIG ───────────────────────────────────────────────
const MAX_DIMENSION = 1920; // max width or height in pixels
const JPEG_QUALITY = 0.8; // 0-1, good balance of size vs quality

// ─── HELPERS ──────────────────────────────────────────────
export const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", (error) => reject(error));
		image.setAttribute("crossOrigin", "anonymous");
		image.src = url;
	});

/**
 * Compress an image File/Blob by resizing to fit within MAX_DIMENSION
 * and re-encoding as JPEG at JPEG_QUALITY.
 * Returns a new File ready for upload.
 */
export async function compressImage(
	file: File,
	maxDimension = MAX_DIMENSION,
	quality = JPEG_QUALITY,
): Promise<File> {
	const url = URL.createObjectURL(file);
	try {
		const image = await createImage(url);

		let { width, height } = image;

		// Scale down if either dimension exceeds the limit
		if (width > maxDimension || height > maxDimension) {
			const ratio = Math.min(maxDimension / width, maxDimension / height);
			width = Math.round(width * ratio);
			height = Math.round(height * ratio);
		}

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return file; // fallback: return original

		ctx.drawImage(image, 0, 0, width, height);

		return new Promise((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						resolve(file); // fallback
						return;
					}
					const compressed = new File([blob], file.name || "compressed.jpg", {
						type: "image/jpeg",
					});
					resolve(compressed);
				},
				"image/jpeg",
				quality,
			);
		});
	} finally {
		URL.revokeObjectURL(url);
	}
}

// ─── CROP + COMPRESS ──────────────────────────────────────
export async function getCroppedImg(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<File | null> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) return null;

	// Calculate target dimensions (respect max dimension)
	let targetWidth = pixelCrop.width;
	let targetHeight = pixelCrop.height;

	if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
		const ratio = Math.min(
			MAX_DIMENSION / targetWidth,
			MAX_DIMENSION / targetHeight,
		);
		targetWidth = Math.round(targetWidth * ratio);
		targetHeight = Math.round(targetHeight * ratio);
	}

	canvas.width = targetWidth;
	canvas.height = targetHeight;

	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		targetWidth,
		targetHeight,
	);

	return new Promise((resolve) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) return resolve(null);
				const file = new File([blob], "cropped-image.jpg", {
					type: "image/jpeg",
				});
				resolve(file);
			},
			"image/jpeg",
			JPEG_QUALITY,
		);
	});
}
