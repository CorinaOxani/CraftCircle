const express = require("express");
const { cloudinary, upload } = require("../config/cloudinary"); 
const pool = require("../config/database");
const router = express.Router();

router.post("/upload-profile", upload.single("file"), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = req.file.path;

    const userResult = await pool.query("SELECT profile_picture FROM accounts WHERE user_id = $1", [user_id]);
    const oldImageUrl = userResult.rows[0]?.profile_picture;

    if (oldImageUrl) {
      const filePath = oldImageUrl.split("/user_uploads/")[1]; 
      if (filePath) {
        const publicId = `user_uploads/${filePath.split(".")[0]}`; 
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        console.log(`Old profile picture deleted from Cloudinary: ${publicId}`);
      }
    }


    await pool.query("UPDATE accounts SET profile_picture = $1 WHERE user_id = $2", [fileUrl, user_id]);

    res.json({ imageUrl: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading profile picture" });
  }
});

router.post("/upload-post", upload.array("files", 10), async (req, res) => {
  try {
    const { user_id, content } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required." });
    }


    const postResult = await pool.query(
      "INSERT INTO posts (user_id, content, created_at) VALUES ($1, $2, NOW()) RETURNING post_id",
      [user_id, content || null]
    );

    const postId = postResult.rows[0].post_id;


    for (const file of files) {
      await pool.query(
        "INSERT INTO post_media (post_id, file_url, file_type) VALUES ($1, $2, $3)",
        [postId, file.path, file.mimetype.startsWith("image") ? "image" : "video"]
      );
    }

    res.json({ message: "Post added successfully!", postId });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading post." });
  }
});


router.get("/user-posts/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const posts = await pool.query(
      `SELECT p.post_id, p.user_id, p.content, p.created_at,
              json_agg(pm.file_url) AS media_urls
       FROM posts p
       LEFT JOIN post_media pm ON p.post_id = pm.post_id
       WHERE p.user_id = $1
       GROUP BY p.post_id
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    res.json(posts.rows);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Error fetching user posts." });
  }
});

module.exports = router;
