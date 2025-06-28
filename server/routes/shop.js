const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { cloudinary } = require("../config/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({ storage });

function extractPublicIdFromUrl(url) {
  try {
    const afterUpload = url.split("/upload/")[1]; 
    const parts = afterUpload.split("/");
    
   
    if (parts[0].startsWith("v")) {
      parts.shift(); 
    }

    const withoutExtension = parts.join("/").split(".")[0]; 
    return withoutExtension;
  } catch (err) {
    console.warn("Failed to extract public_id from URL:", url);
    return null;
  }
}



router.post("/add-product", upload.array("images"), async (req, res) => {
  const { user_id, title, description, price, category_id } = req.body;

  if (!user_id || !title || !price) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO marketplace_items (user_id, title, description, price, created_at, category_id)
       VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING item_id`,
      [user_id, title, description, price, category_id || null]
    );

    const item_id = result.rows[0].item_id;

    const files = req.files || [];
    for (const file of files) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: "shop_items",
        public_id: uuidv4(),
      });

      await pool.query(
        `INSERT INTO shop_item_images (item_id, image_url)
         VALUES ($1, $2)`,
        [item_id, uploadResult.secure_url]
      );
    }

    res.status(201).json({ success: true, item_id });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//  Produse ale unui utilizator
router.get("/user-products/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const productsResult = await pool.query(
      `SELECT * FROM marketplace_items WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const items = productsResult.rows;
    const itemIds = items.map((item) => item.item_id);
    if (itemIds.length === 0) return res.json([]);

    const imagesResult = await pool.query(
      `SELECT * FROM shop_item_images WHERE item_id = ANY($1::int[])`,
      [itemIds]
    );

    const imageMap = {};
    imagesResult.rows.forEach((img) => {
      if (!imageMap[img.item_id]) {
        imageMap[img.item_id] = [];
      }
      imageMap[img.item_id].push(img.image_url);
    });

    const finalItems = items.map((item) => ({
      ...item,
      images: imageMap[item.item_id] || [],
    }));

    res.json(finalItems);
  } catch (err) {
    console.error("Error fetching user products:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

//  Report produs
router.post("/report-product/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { user_id, reported_user_id } = req.body;

  if (!user_id || !reported_user_id) {
    return res.status(400).json({ error: "Missing user_id or reported_user_id" });
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM product_reports WHERE item_id = $1 AND user_id = $2`,
      [itemId, user_id]
    );

    if (existing.rows.length > 0) {
      return res.json({ message: "Already reported" });
    }

    await pool.query(
      `INSERT INTO product_reports (item_id, user_id, reported_user_id)
       VALUES ($1, $2, $3)`,
      [itemId, user_id, reported_user_id]
    );

    res.json({ message: "Report submitted" });
  } catch (error) {
    console.error("Error reporting product:", error);
    res.status(500).json({ error: "Failed to report product" });
  }
});

//  stergere produs + imagini Cloudinary
router.delete("/delete-product/:itemId", async (req, res) => {
  const { itemId } = req.params;

  try {
    // sterge din coș și favorite
    await pool.query(`DELETE FROM shopping_cart WHERE item_id = $1`, [itemId]);
    await pool.query(`DELETE FROM favorites WHERE item_id = $1`, [itemId]);

    // sterge imaginile din Cloudinary
    const imagesRes = await pool.query(
      `SELECT image_url FROM shop_item_images WHERE item_id = $1`,
      [itemId]
    );

    for (const { image_url } of imagesRes.rows) {
      const publicId = extractPublicIdFromUrl(image_url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("Could not delete from Cloudinary:", publicId, err.message);
        }
      }
    }

    // sterge imaginile din baza de date
    await pool.query(`DELETE FROM shop_item_images WHERE item_id = $1`, [itemId]);
    await pool.query(`DELETE FROM product_reports WHERE item_id = $1`, [itemId]);

    // sterge produsul din baza de date
    const result = await pool.query(
      `DELETE FROM marketplace_items WHERE item_id = $1`,
      [itemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Trimite un singur mesaj de succes
    res.status(200).json({ message: "Product deleted successfully." });

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});


router.put("/update-product", upload.array("newImages"), async (req, res) => {
  const { item_id, title, description, price, stock, imagesToDelete } = req.body;

  if (!item_id || !title || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Actualizare date
    await pool.query(
      `UPDATE marketplace_items
       SET title = $1, description = $2, price = $3, stock = $4
       WHERE item_id = $5`,
      [title, description, price, stock || "yes", item_id]
    );
    

    const toDelete = JSON.parse(imagesToDelete || "[]");
    for (const url of toDelete) {
      const publicId = extractPublicIdFromUrl(url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("Cloudinary deletion failed:", publicId, err.message);
        }

        await pool.query(
          `DELETE FROM shop_item_images WHERE item_id = $1 AND image_url = $2`,
          [item_id, url]
        );
      }
    }

    const files = req.files || [];
    for (const file of files) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: "shop_items",
        public_id: uuidv4(),
      });

      await pool.query(
        `INSERT INTO shop_item_images (item_id, image_url)
         VALUES ($1, $2)`,
        [item_id, uploadResult.secure_url]
      );
    }

    res.json({ message: "Product updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.post("/add-to-cart", async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM shopping_cart WHERE user_id = $1 AND item_id = $2`,
      [user_id, product_id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE shopping_cart
         SET quantity = quantity + $1
         WHERE user_id = $2 AND item_id = $3`,
        [quantity, user_id, product_id]
      );
    } else {

      const productData = await pool.query(
        `SELECT user_id FROM marketplace_items WHERE item_id = $1`,
        [product_id]
      );
      const seller_id = productData.rows[0]?.user_id;

      await pool.query(
        `INSERT INTO shopping_cart (user_id, item_id, seller_id, quantity, added_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [user_id, product_id, seller_id, quantity]
      );
    }

    res.json({ message: "Product added to cart." });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
