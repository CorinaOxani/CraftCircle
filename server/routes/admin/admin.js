const express = require("express");
const router = express.Router();
const pool = require("../../config/database"); 
const bcrypt = require("bcrypt");
const multer = require("multer");
const { cloudinary, upload } = require("../../config/cloudinary"); 
const path = require("path");


router.get("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        "SELECT admin_id, first_name, last_name, email, profile_picture, country, city, birthdate, created_at FROM admins WHERE admin_id = $1",
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching admin:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

// POST /admin/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email.endsWith("@craft.com")) {
    return res.status(403).json({ error: "Access restricted to admin accounts." });
  }

  try {
    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Admin account not found." });
    }

    const admin = result.rows[0];

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    res.json({
      admin: {
        admin_id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        profile_picture: admin.profile_picture,
      }
    });
  } catch (err) {
    console.error("Login admin error:", err);
    res.status(500).json({ error: "Server error." });
  }
});
router.get("/:adminId/actions", async (req, res) => {
  const { adminId } = req.params;

  try {
    const result = await pool.query(
      "SELECT deleted_users, deleted_posts, deleted_products FROM admins WHERE admin_id = $1",
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching admin actions:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/upload-admin-profile", upload.single("file"), async (req, res) => {
    try {
      const { admin_id } = req.body;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
      const fileUrl = req.file.path;
  
      const result = await pool.query("SELECT profile_picture FROM admins WHERE admin_id = $1", [admin_id]);
      const oldImageUrl = result.rows[0]?.profile_picture;
  
    
      if (oldImageUrl?.includes("res.cloudinary.com") && oldImageUrl.includes("/admin_uploads/")) {
        const filePath = oldImageUrl.split("/admin_uploads/")[1];
        const publicId = `admin_uploads/${filePath.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        console.log("Deleted old admin image:", publicId);
      }
  
    
      await pool.query("UPDATE admins SET profile_picture = $1 WHERE admin_id = $2", [fileUrl, admin_id]);
  
      res.json({ imageUrl: fileUrl });
    } catch (error) {
      console.error("Admin profile upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

module.exports = router;
