const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const multer = require('multer');
const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const { AppError } = require('../utils/errorhandling');

const uploadsRoot = path.join(process.cwd(), 'uploads');
const tempDirectory = path.join(uploadsRoot, 'temp');
if (!fs.existsSync(tempDirectory)) {
  fs.mkdirSync(tempDirectory, { recursive: true });
}

const hasRealCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  if (
    cloudName === 'your_cloud_name' ||
    apiKey === 'your_api_key' ||
    apiSecret === 'your_api_secret'
  ) {
    return false;
  }

  return true;
};

const configureCloudinary = () => {
  if (!hasRealCloudinaryConfig()) {
    throw new AppError('Cloudinary environment variables are missing', 500);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new AppError('Only jpg, jpeg, png, and webp images are allowed', 400), false);
  }
  return cb(null, true);
};

const multerHost = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadSingle = (fieldName) => multerHost.single(fieldName);
const uploadFields = (fields) => multerHost.fields(fields);

const uploadStream = (buffer, folder, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    configureCloudinary();
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(new AppError(error.message || 'Cloudinary upload failed', 500));
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const removeLocalFile = async (localFilePath) => {
  if (!localFilePath) {
    return;
  }
  await fsPromises.unlink(localFilePath).catch(() => null);
};

const buildPublicBaseUrl = () => {
  const explicit = process.env.BACKEND_PUBLIC_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  return `http://localhost:${process.env.PORT || 5000}`;
};

const saveLocalBuffer = async (buffer, folder, extension = 'webp') => {
  const relativeDirectory = path.join('uploads', ...String(folder || 'misc').split('/').filter(Boolean));
  const targetDirectory = path.join(process.cwd(), relativeDirectory);
  await fsPromises.mkdir(targetDirectory, { recursive: true });

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  const absolutePath = path.join(targetDirectory, fileName);
  await fsPromises.writeFile(absolutePath, buffer);

  const relativePath = path.join(relativeDirectory, fileName).replace(/\\/g, '/');
  return {
    secureUrl: `${buildPublicBaseUrl()}/${relativePath}`,
    publicId: `local:${relativePath}`,
  };
};

const optimizeAndUpload = async (localFilePath, folder) => {
  const optimizedBuffer = await sharp(localFilePath)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  let result;
  if (hasRealCloudinaryConfig()) {
    result = await uploadStream(optimizedBuffer, folder, 'image');
    result = {
      secureUrl: result.secure_url,
      publicId: result.public_id,
    };
  } else {
    result = await saveLocalBuffer(optimizedBuffer, folder, 'webp');
  }

  await removeLocalFile(localFilePath);
  return result;
};

const uploadBufferAsImage = async (buffer, folder) => {
  if (hasRealCloudinaryConfig()) {
    const result = await uploadStream(buffer, folder, 'image');
    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
    };
  }

  return saveLocalBuffer(buffer, folder, 'png');
};

const removeFromCloudinary = async (publicId) => {
  if (!publicId) {
    return;
  }

  if (String(publicId).startsWith('local:')) {
    const relativePath = String(publicId).replace(/^local:/, '');
    const localPath = path.join(process.cwd(), relativePath);
    await fsPromises.unlink(localPath).catch(() => null);
    return;
  }

  if (!hasRealCloudinaryConfig()) {
    return;
  }

  configureCloudinary();
  await cloudinary.uploader.destroy(publicId).catch(() => null);
};

module.exports = {
  uploadSingle,
  uploadFields,
  optimizeAndUpload,
  uploadBufferAsImage,
  removeLocalFile,
  removeFromCloudinary,
  hasRealCloudinaryConfig,
};
