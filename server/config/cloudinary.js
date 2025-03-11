const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: 'djgewcpvr',
  api_key: '766746468168394',
  api_secret: '0gtMHpKVWjS9aTiuckn5t5NbwfM',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "user_uploads", // Folderele din Cloudinary
      resource_type: file.mimetype.startsWith("video") ? "video" : "image", // Detectează tipul de fișier
    };
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
