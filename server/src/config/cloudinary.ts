import 'dotenv/config';

/**
 * Cloudinary (product photos). Optional: without these, the admin panel
 * still works and you paste image links instead of uploading.
 *
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...
 *
 * Find all three on the Cloudinary dashboard, under "API Keys".
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;
const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || null;
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || null;

export const cloudinaryConfig = {
  enabled: Boolean(cloudName && apiKey && apiSecret),
  cloudName,
  apiKey,
  apiSecret,
  folder: 'voltnest/products',
};
