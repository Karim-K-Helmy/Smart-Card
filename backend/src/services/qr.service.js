const crypto = require('crypto');
const QRCode = require('qrcode');
const { uploadBufferAsImage } = require('./MulterLocally');

const generateCardCode = () => crypto.randomBytes(6).toString('hex').toUpperCase();

const buildProfileLink = (slug) => {
  const base = process.env.PUBLIC_PROFILE_BASE_URL || 'http://localhost:3000/profile';
  return `${base}/${slug}`;
};

const buildQrPayload = ({ slug, cardCode }) => `${buildProfileLink(slug)}?card=${cardCode}`;

const generateQrAssets = async ({ slug, cardCode }) => {
  const qrCodeValue = buildQrPayload({ slug, cardCode });
  const qrBuffer = await QRCode.toBuffer(qrCodeValue, {
    type: 'png',
    width: 500,
    margin: 2,
  });

  const uploaded = await uploadBufferAsImage(qrBuffer, 'linestart/qr-codes');

  return {
    qrCodeValue,
    qrCodeImage: uploaded.secureUrl,
    qrCodeImagePublicId: uploaded.publicId,
    shortLink: buildProfileLink(slug),
  };
};

module.exports = {
  generateCardCode,
  buildProfileLink,
  generateQrAssets,
};
