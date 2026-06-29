import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret',
  },
});

/**
 * Uploads a file buffer to S3 or local storage as fallback.
 * @param {Express.Multer.File} file - Multer file object
 * @param {string} folder - Destination folder in the bucket ('pets' or 'users')
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadToS3 = async (file, folder = 'pets') => {
  // Check if AWS credentials are configured
  const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && 
                          process.env.AWS_SECRET_ACCESS_KEY && 
                          process.env.AWS_S3_BUCKET;

  if (!isAWSConfigured) {
    console.warn('[S3] AWS credentials not configured. Using local storage fallback.');
    return uploadToLocal(file, folder);
  }

  // Sanitize filename and generate UUID to prevent collisions and directory traversal
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const key = `${folder}/${uuidv4()}.${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    console.log(`[S3] Starting upload for ${key}...`);
    await s3Client.send(new PutObjectCommand(params));
    console.log(`[S3] Successful upload for ${key}`);
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`[S3] Failed upload for ${key}:`, error.message);
    throw error;
  }
};

/**
 * Uploads a file to local storage (fallback when S3 is not configured)
 * @param {Express.Multer.File} file - Multer file object
 * @param {string} folder - Destination folder ('pets' or 'users')
 * @returns {Promise<string>} The local URL of the uploaded image
 */
const uploadToLocal = async (file, folder = 'pets') => {
  try {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    console.log(`[Local] File saved to ${filePath}`);
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('[Local] Failed to save file locally:', error.message);
    throw new Error('Local storage upload failed');
  }
};

/**
 * Deletes a file from S3 based on its public URL.
 * @param {string} url - Public S3 URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (url) => {
  if (!url) return;
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    console.warn('[S3] AWS_S3_BUCKET not configured. Skipping S3 deletion.');
    return;
  }

  // Ensure the URL belongs to our bucket before attempting deletion
  if (!url.includes(bucketName)) {
    console.log(`[S3] Skipping deletion: URL ${url} does not belong to bucket ${bucketName}`);
    return;
  }

  try {
    // Extract key from URL
    // e.g. https://bucket.s3.region.amazonaws.com/pets/uuid.jpg
    const bucketUrlPart = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
    const key = url.replace(bucketUrlPart, '');

    console.log(`[S3] Starting deletion for key: ${key}...`);
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    console.log(`[S3] Successful deletion for key: ${key}`);
  } catch (error) {
    console.error(`[S3] Failed deletion for URL ${url}:`, error.message);
    // Do not throw the error here to avoid blocking database updates/deletions if S3 cleanup fails
  }
};
