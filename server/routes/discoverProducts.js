const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/products", async (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  const search = req.query.search?.toLowerCase() || "";
  const categoryName = req.query.category?.toLowerCase();
  const selectedFilter = req.query.filter || "recent";

  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  try {
    let values = []; // paramatri
    let whereParts = []; // WHERE

    // Istoric cautari
    if (search.length >= 3) {
      const last = await pool.query(
        `SELECT search_text FROM product_search_history 
         WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 1`,
        [userId]
      );
      const lastSearch = last.rows[0]?.search_text?.toLowerCase();
      if (lastSearch !== search) {
        await pool.query(
          `INSERT INTO product_search_history (user_id, search_text, searched_at)
           VALUES ($1, $2, NOW())`,
          [userId, search]
        );
      }
    }

    // Aplicam explicit filtrul "followed" doar daca este cerut
    if (selectedFilter === "followed") {
      values.push(userId);
      //caut in coloana user_id din marketplace_items
      whereParts.push(`i.user_id IN (
    SELECT following_id FROM follows WHERE follower_id = $${values.length} 
  )`);
    }

    // Daca nu avem cautare si categorie, putem aplica sugestii (follow + categorii proprii + istoric)
    if (!search && !categoryName && selectedFilter !== "followed") {
      const suggestionParts = [];
      values.push(userId);
      //prima sugestie: urmariti
      let logic = `i.user_id IN (
    SELECT following_id FROM follows WHERE follower_id = $${values.length} 
  )`;

      //a doua sugestie: categorii proprii
      const catRes = await pool.query(`
    SELECT DISTINCT category_id FROM marketplace_items
    WHERE user_id = $1 AND category_id IS NOT NULL
  `, [userId]);

      const categoryIds = catRes.rows.map(r => r.category_id); //extrace id urile categoriilor si le punem in array
      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map((_, i) => `$${values.length + i + 1}`).join(", ");//creaza un string cu $1, $2, $3...
        logic += ` OR i.category_id IN (${placeholders})`;// adauga conditia pentru categoriile proprii
        values.push(...categoryIds);
      }

      suggestionParts.push(`(${logic})`);// adauga conditia pentru urmariti si categoriile proprii


      // a treia sugestie: istoric cautari
      // cauta in baza de date ultimele 3 cautari ale utilizatorului
      const history = await pool.query(`
    SELECT search_text FROM product_search_history
    WHERE user_id = $1
    GROUP BY search_text
    ORDER BY MAX(searched_at) DESC
    LIMIT 3
  `, [userId]);

      const keywords = history.rows.map(r => `%${r.search_text.toLowerCase()}%`); // extrage cautarile si le transforma in %cautare% pentru a fi folosite in LIKE
      if (keywords.length > 0) {
        const offset = values.length;// retine pozitia de start pentru a nu suprascrie valorile anterioare
        // creeaza conditii pentru fiecare cuvant cheie. daca apare in titlu sau descriere, se adauga in sugestii
        const keywordConditions = keywords.map((_, i) => `
      LOWER(i.title) LIKE $${offset + i + 1}
      OR LOWER(i.description) LIKE $${offset + i + 1}
    `);
        values.push(...keywords);
        suggestionParts.push(`(${keywordConditions.join(" OR ")})`); // adauga toate conditiile de cautare in sugestii cu OR
      }

      if (suggestionParts.length > 0) {
        whereParts.push(`(${suggestionParts.join(" OR ")})`);// adauga toate sugestiile in WHERE cu OR
      }
    }

    // Search explicit
    if (search) {
      values.push(`%${search}%`); 
      whereParts.push(`(
        LOWER(i.title) LIKE $${values.length}
        OR LOWER(i.description) LIKE $${values.length}
      )`);
    }

    // Categorie
    if (categoryName) {
      values.push(`%${categoryName}%`);
      whereParts.push(`EXISTS (
        SELECT 1 FROM categories c
        WHERE c.category_id = i.category_id
        AND LOWER(c.name) LIKE $${values.length}
      )`);
    }

    // Excludem produsele proprii
    values.push(userId);
    whereParts.push(`i.user_id != $${values.length}`);

    // Construim interogarea SQL
    let query = `
      SELECT 
        i.item_id,
        i.user_id,
        i.title,
        i.description,
        i.price,
        i.created_at,
        i.stock,
        i.category_id,
        u.first_name,
        u.last_name,
        u.profile_picture
      FROM marketplace_items i 
      JOIN accounts u ON u.user_id = i.user_id
    `;

    if (whereParts.length > 0) {
      query += ` WHERE ${whereParts.join(" AND ")}`;
    }

    if (selectedFilter === "price_asc") {
      query += ` ORDER BY i.price ASC`;
    } else if (selectedFilter === "price_desc") {
      query += ` ORDER BY i.price DESC`;
    } else {
      query += ` ORDER BY i.created_at DESC`;
    }
    query += ` LIMIT 50`;


    const result = await pool.query(query, values); // executa interogarea
    const items = result.rows; 

    const enrichedItems = await Promise.all(// asteapta sa se rezolve toate promisiunile
      items.map(async (item) => {
        const images = await pool.query(
          `SELECT image_url FROM shop_item_images 
           WHERE item_id = $1 ORDER BY image_id ASC`,
          [item.item_id]
        );//adauga imaginile pt fiecare item
        return {
          ...item,
          images: images.rows.map(img => img.image_url)
        };//creeaza obiectul cu item si imaginile
      })
    );

    res.json(enrichedItems);
  } catch (err) {
    console.error("Error fetching discover products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
