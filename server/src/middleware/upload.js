import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { isS3Storage } from '../services/storageService.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!isS3Storage() && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = isS3Storage()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      }
    });

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});
