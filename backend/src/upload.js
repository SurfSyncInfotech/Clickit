import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { HttpError } from './auth.js'

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads')
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

// image-only uploader (8 MB, one file)
export const imageUpload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_q, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[f.mimetype]) }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_q, f, cb) => (EXT[f.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG or WEBP images'))),
})

// remove a previously uploaded file (ignores external URLs)
export const removeUpload = (url) => {
  if (typeof url === 'string' && url.startsWith('/uploads/')) fs.unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {})
}
