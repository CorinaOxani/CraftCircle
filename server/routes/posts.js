const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { cloudinary } = require("../config/cloudinary");

// Obține postările unui utilizator
router.get("/", async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const result = await pool.query(
            "SELECT post_id, content, image_url, created_at FROM posts WHERE user_id = $1 ORDER BY created_at DESC",
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 🔹 Ruta pentru ștergerea unei postări
router.delete("/:postId", async (req, res) => {
    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
    }

    try {
        console.log("Checking if post exists with ID:", postId);

        // 🔹 Verifică dacă postarea există
        const postCheck = await pool.query("SELECT * FROM posts WHERE post_id = $1", [postId]);

        if (postCheck.rows.length === 0) {
            console.error("Post not found, cannot delete:", postId);
            return res.status(404).json({ error: "Post not found" });
        }

        // 🔹 Obține URL-urile fișierelor asociate postării
        const mediaFiles = await pool.query("SELECT file_url, file_type FROM post_media WHERE post_id = $1", [postId]);

        // 🔹 Șterge fișierele din Cloudinary
        for (const file of mediaFiles.rows) {
            const fileUrl = file.file_url;

            // 🔹 Extrage `public_id` corect (presupunând că fișierele sunt salvate în `user_uploads/`)
            const filePath = fileUrl.split('/user_uploads/')[1]; 
            if (!filePath) {
                console.error(`Invalid Cloudinary URL: ${fileUrl}`);
                continue; // Sari peste această iterație dacă URL-ul nu este corect
            }

            const publicId = `user_uploads/${filePath.split('.')[0]}`; 
            const resourceType = file.file_type === "video" ? "video" : "image"; 

            try {
                const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                console.log(`Deleted from Cloudinary: ${publicId}`, result);
            } catch (cloudinaryError) {
                console.error("Cloudinary delete error:", cloudinaryError);
            }
        }

        // 🔹 Șterge fișierele asociate din `post_media`
        await pool.query("DELETE FROM post_media WHERE post_id = $1", [postId]);

        // 🔹 Șterge postarea din `posts`
        const deletePost = await pool.query("DELETE FROM posts WHERE post_id = $1 RETURNING *", [postId]);

        console.log("Post deleted successfully:", deletePost.rows[0]);

        res.json({ message: "Post deleted successfully", deletedPost: deletePost.rows[0] });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.put("/:postId", async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;

    if (isNaN(postId) || !content) {
        return res.status(400).json({ error: "Invalid post ID or empty content" });
    }

    try {
        const updatePost = await pool.query(
            "UPDATE posts SET content = $1 WHERE post_id = $2 RETURNING *",
            [content, postId]
        );

        if (updatePost.rowCount === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({ message: "Post updated successfully", updatedPost: updatePost.rows[0] });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/:postId/report", async (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body;
  
    if (!user_id || !postId) {
      return res.status(400).json({ error: "Missing postId or user_id" });
    }
  
    try {

      const existing = await pool.query(
        "SELECT * FROM post_reports WHERE user_id = $1 AND post_id = $2",
        [user_id, postId]
      );
  
      if (existing.rows.length > 0) {
        return res.status(200).json({ message: "Already reported" });
      }
  

      await pool.query("INSERT INTO post_reports (user_id, post_id) VALUES ($1, $2)", [user_id, postId]);
      await pool.query("UPDATE posts SET report_count = report_count + 1 WHERE post_id = $1", [postId]);
  
      res.status(200).json({ message: "Report submitted" });
    } catch (error) {
      console.error("Error reporting post:", error);
      res.status(500).json({ error: "Failed to report post" });
    }
  });
  


module.exports = router;
