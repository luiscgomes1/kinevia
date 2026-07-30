import multer from 'multer';
import path from 'path';

const MAGIC_BYTES: Record<string, number[][]> = {
  '.png': [[0x89, 0x50, 0x4E, 0x47]],
  '.jpg': [[0xFF, 0xD8]],
  '.jpeg': [[0xFF, 0xD8]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]],
}

function checkMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext]
  if (!signatures) return false
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  )
}

function isWebp(buffer: Buffer): boolean {
  return buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    cb(new Error('Formato de imagem inválido. Use PNG, JPG, GIF ou WebP.'));
    return
  }
  cb(null, true);
};

export const uploadImagem = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function validarImagemBuffer(buffer: Buffer, originalname: string): boolean {
  const ext = path.extname(originalname).toLowerCase()
  if (!MAGIC_BYTES[ext]) return false
  if (ext === '.webp') return isWebp(buffer)
  return checkMagicBytes(buffer, ext)
}
