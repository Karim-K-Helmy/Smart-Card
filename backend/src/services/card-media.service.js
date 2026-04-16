const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { AppError } = require('../utils/errorhandling');

const CARD_ASSETS_DIR = path.resolve(__dirname, '../../../frontend/dist/assets/cards');
const CARD_BACK_PATH = path.join(CARD_ASSETS_DIR, 'card_back.jpeg');
const STAR_FACE_PATH = path.join(CARD_ASSETS_DIR, 'Start_face.jpeg');
const PRO_FACE_PATH = path.join(CARD_ASSETS_DIR, 'pro_face.jpeg');

const WHITE_BOX = {
  left: 118,
  top: 439,
  width: 319,
  height: 319,
  padding: 14,
};

const fileExists = (filePath) => fs.existsSync(filePath);

const ensureAssetsExist = () => {
  const missing = [CARD_BACK_PATH, STAR_FACE_PATH, PRO_FACE_PATH].filter((filePath) => !fileExists(filePath));
  if (missing.length) {
    throw new AppError(`Missing card assets: ${missing.join(', ')}`, 500);
  }
};

const pickFrontFace = (planCode) => {
  if (String(planCode || '').toUpperCase() === 'PRO') {
    return PRO_FACE_PATH;
  }
  return STAR_FACE_PATH;
};

const generateSquareCodeBuffer = async (value) => {
  return QRCode.toBuffer(String(value || '').trim(), {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 1,
    width: WHITE_BOX.width - WHITE_BOX.padding * 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
};

const buildMergedBackImage = async ({ qrValue }) => {
  ensureAssetsExist();

  const qrBuffer = await generateSquareCodeBuffer(qrValue);
  const qrSize = WHITE_BOX.width - WHITE_BOX.padding * 2;

  return sharp(CARD_BACK_PATH)
    .composite([
      {
        input: qrBuffer,
        left: WHITE_BOX.left + WHITE_BOX.padding,
        top: WHITE_BOX.top + WHITE_BOX.padding,
      },
    ])
    .png()
    .toBuffer();
};

const readImageSize = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width || 591,
    height: metadata.height || 1064,
  };
};

const addImagePage = async (doc, imagePathOrBuffer) => {
  const size = Buffer.isBuffer(imagePathOrBuffer)
    ? await sharp(imagePathOrBuffer).metadata()
    : await readImageSize(imagePathOrBuffer);

  const width = size.width || 591;
  const height = size.height || 1064;

  doc.addPage({ size: [width, height], margin: 0 });
  doc.image(imagePathOrBuffer, 0, 0, { width, height });
};

const buildCardPdf = async ({ planCode, qrValue }) => {
  ensureAssetsExist();

  const mergedBackBuffer = await buildMergedBackImage({ qrValue });
  const frontFacePath = pickFrontFace(planCode);

  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ autoFirstPage: false, compress: true });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      await addImagePage(doc, frontFacePath);
      await addImagePage(doc, mergedBackBuffer);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  buildMergedBackImage,
  buildCardPdf,
};
