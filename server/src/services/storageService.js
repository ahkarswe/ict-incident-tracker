import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const storageProvider = (process.env.ATTACHMENT_STORAGE || 'local').toLowerCase();
const bucket = process.env.S3_BUCKET || '';
const region = process.env.S3_REGION || 'us-east-1';

const createS3Client = () => {
  if (!bucket) {
    throw new Error('S3_BUCKET is required when ATTACHMENT_STORAGE=s3');
  }

  return new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'false') === 'true',
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
          }
        : undefined
  });
};

export const isS3Storage = () => storageProvider === 's3';

export const buildAttachmentUrl = (filename) => {
  if (isS3Storage()) {
    return `${process.env.S3_PUBLIC_BASE_URL || ''}/${filename}`.replace(/\/+$/, '');
  }
  return `/uploads/${filename}`;
};

export const uploadAttachmentBuffer = async ({ buffer, mimetype, originalname }) => {
  if (!isS3Storage()) {
    throw new Error('uploadAttachmentBuffer is only valid for S3 storage');
  }

  const key = `${Date.now()}-${randomUUID()}-${originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype
    })
  );

  return {
    filename: originalname,
    url: buildAttachmentUrl(key),
    mimeType: mimetype,
    label: 'Screenshot'
  };
};
