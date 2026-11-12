import { createHash } from 'node:crypto';
import { cloudinaryConfig } from '../../config/cloudinary';
import { AppError } from '../../shared/errors/AppError';

/**
 * The browser uploads the photo straight to Cloudinary (so big files never pass
 * through our server), using a signature only our server can make. The secret
 * never leaves the server.
 */
export const uploadsService = {
  isEnabled: () => cloudinaryConfig.enabled,

  sign() {
    if (!cloudinaryConfig.enabled) {
      throw new AppError(503, 'Photo upload isn’t set up yet. Paste an image link instead, or add the Cloudinary keys to .env.', 'UPLOADS_DISABLED');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = cloudinaryConfig.folder;
    // Cloudinary's rule: sort the parameters, join as a=b&c=d, add the secret, SHA-1 it
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1').update(toSign + cloudinaryConfig.apiSecret).digest('hex');
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      apiKey: cloudinaryConfig.apiKey!,
      timestamp,
      folder,
      signature,
    };
  },
};
