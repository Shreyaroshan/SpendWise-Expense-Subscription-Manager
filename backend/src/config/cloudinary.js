import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!isConfigured()) {
      reject(new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'spendwise/receipts',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });

const getPublicIdFromSecureUrl = (secureUrl) => {
  try {
    const { pathname } = new URL(secureUrl);
    const uploadMarker = '/upload/';
    const uploadIndex = pathname.indexOf(uploadMarker);
    if (uploadIndex === -1) return null;

    const afterUpload = pathname.slice(uploadIndex + uploadMarker.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, '');

    return withoutExtension || null;
  } catch {
    return null;
  }
};

export const deleteCloudinaryAssetByUrl = async (secureUrl) => {
  if (!secureUrl || !isConfigured()) return false;

  const publicId = getPublicIdFromSecureUrl(secureUrl);
  if (!publicId) return false;

  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  return result?.result === 'ok' || result?.result === 'not found';
};
