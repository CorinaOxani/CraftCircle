const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
