import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// Ensure upload directories exist
export async function initializeDirectories() {
  const dirs = [
    path.join(UPLOAD_DIR, 'photos', 'vehicle'),
    path.join(UPLOAD_DIR, 'photos', 'goods'),
    path.join(UPLOAD_DIR, 'documents'),
    path.join(UPLOAD_DIR, 'temp')
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

function validateFileType(file: Express.Multer.File, category: 'photo' | 'document'): boolean {
  const allowedTypes = category === 'photo' ? allowedImageTypes : allowedDocumentTypes;
  return allowedTypes.includes(file.mimetype);
}

// Generate unique filename
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

// Multer configuration for local file storage
export const uploadConfig = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const category = (req.body.category || 'photos') as string;
      const subCategory = (req.body.subCategory || 'vehicle') as string;
      const uploadPath = path.join(UPLOAD_DIR, category, subCategory);
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const filename = generateFileName(file.originalname);
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const category = (req.body.category || 'photo') as 'photo' | 'document';
    
    if (!validateFileType(file, category)) {
      cb(new Error(`Invalid file type. Allowed types for ${category}: ${
        category === 'photo' ? allowedImageTypes.join(', ') : allowedDocumentTypes.join(', ')
      }`));
      return;
    }
    
    cb(null, true);
  }
});

// File operations
export class LocalFileStorage {
  private uploadDir: string;

  constructor(uploadDir: string = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  async saveFile(file: Express.Multer.File, category: string, subCategory?: string): Promise<string> {
    const dir = subCategory 
      ? path.join(this.uploadDir, category, subCategory)
      : path.join(this.uploadDir, category);
    
    await fs.mkdir(dir, { recursive: true });
    
    const filename = generateFileName(file.originalname);
    const filepath = path.join(dir, filename);
    
    await fs.writeFile(filepath, file.buffer);
    
    // Return relative path for database storage
    return path.join(category, subCategory || '', filename).replace(/\\/g, '/');
  }

  async getFile(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, relativePath);
    return fs.readFile(fullPath);
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, relativePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn(`Failed to delete file: ${fullPath}`, error);
    }
  }

  async getFileInfo(relativePath: string): Promise<{ size: number; mtime: Date; exists: boolean }> {
    const fullPath = path.join(this.uploadDir, relativePath);
    try {
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        exists: true
      };
    } catch {
      return {
        size: 0,
        mtime: new Date(),
        exists: false
      };
    }
  }

  getPublicUrl(relativePath: string): string {
    // For local development, files are served through Express
    return `/uploads/${relativePath}`;
  }
}

export const fileStorage = new LocalFileStorage();