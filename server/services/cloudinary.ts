import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../_core/env';

let isConfigured = false;

/**
 * Initialize Cloudinary with credentials
 */
function initializeCloudinary() {
  if (isConfigured) return;

  if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
    throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local');
  }

  cloudinary.config({
    cloud_name: ENV.cloudinaryCloudName,
    api_key: ENV.cloudinaryApiKey,
    api_secret: ENV.cloudinaryApiSecret,
  });

  isConfigured = true;
  console.log('[Cloudinary] Client initialized successfully');
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadFile(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  folder: string = 'fellowship-applications'
): Promise<{ publicId: string; url: string; secureUrl: string }> {
  initializeCloudinary();

  try {
    console.log(`[Cloudinary] Uploading: ${fileName}`);

    // Convert buffer to base64
    const base64File = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

    // Remove file extension from fileName to avoid double extensions
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      folder,
      resource_type: 'auto', // Automatically detect file type
      public_id: `${Date.now()}-${sanitizedName}`,
    });

    console.log(`[Cloudinary] ✓ Upload successful: ${fileName}`);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
  initializeCloudinary();

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] ✓ Deleted: ${publicId}`);
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    throw error;
  }
}

/**
 * Get file metadata from Cloudinary
 */
export async function getFileMetadata(publicId: string) {
  initializeCloudinary();

  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('[Cloudinary] Get metadata error:', error);
    throw error;
  }
}
