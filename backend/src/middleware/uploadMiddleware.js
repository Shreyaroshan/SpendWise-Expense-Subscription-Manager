import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpe?g|png|gif|webp)$/i;
  if (!file.mimetype.startsWith('image/') || !allowedExts.test(file.originalname)) {
    cb(new Error('Only image files are allowed'));
    return;
  }
  cb(null, true);
};

export const uploadReceiptFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('receipt');
