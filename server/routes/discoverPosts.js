const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/posts", async (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  const search = req.query.search?.toLowerCase() || "";
  const categoryName = req.query.category?.toLowerCase();
  const selectedFilter = req.query.filter || "recent";

  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  try {
    // Salavam în istoricul de cautare
    if (search.length >= 3) {
      const lastSearch = await pool.query(
        `SELECT search_text FROM post_search_history 
         WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 1`,
        [userId]
      );
      const lastQuery = lastSearch.rows[0]?.search_text?.toLowerCase();
      if (lastQuery !== search) {
        await pool.query(
          `INSERT INTO post_search_history (user_id, search_text, searched_at)
           VALUES ($1, $2, NOW())`,
          [userId, search]
        );
      }
    }

    let values = []; // paramatri
    let whereParts = []; // WHERE

    //  Followed + categorii proprii + istoric (dacă nu e search/categorie)
    if (!search && !categoryName) {
      if (selectedFilter === "followed") { //// Aplicam explicit filtrul "followed" doar daca este cerut
        values.push(userId);
        //caut in coloana user_id din posts
        whereParts.push(`p.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = $${values.length}
    )`);
      } else {
        const suggestionParts = []; //lista de sugestii

        // Sugestia 1: urmariti
        const followOffset = values.length + 1;
        let logic = `p.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = $${followOffset}
    )`;
        values.push(userId);

        // Sugestia 2: categorii proprii
        // Cautam categoriile proprii ale utilizatorului
        const catRes = await pool.query(`
      SELECT DISTINCT category_id FROM posts
      WHERE user_id = $1 AND category_id IS NOT NULL
    `, [userId]);

        const categoryIds = catRes.rows.map(r => r.category_id); //extrace id urile categoriilor si le punem in array
        if (categoryIds.length > 0) {
          const catPlaceholders = categoryIds.map((_, i) => `$${values.length + i + 1}`).join(", ");//creaza un string cu $1, $2, $3...
          logic += ` OR p.category_id IN (${catPlaceholders})`; // adauga conditia pentru categoriile proprii
          values.push(...categoryIds);
        }

        suggestionParts.push(`(${logic})`); // adauga conditia pentru urmariti si categoriile proprii

        // Sugestia 3: istoric cautari
        // Cautam ultimele 3 cautari ale utilizatorului
        const history = await pool.query(
          `SELECT search_text FROM post_search_history 
        WHERE user_id = $1 
        GROUP BY search_text 
        ORDER BY MAX(searched_at) DESC 
        LIMIT 3
        `,
          [userId]
        );

        const keywords = history.rows.map(r => `%${r.search_text.toLowerCase()}%`);
        if (keywords.length > 0) {
          const keywordOffset = values.length;// offset pentru a nu suprascrie valorile anterioare
           // creeaza conditii pentru fiecare cuvant cheie. daca apare in titlu sau descriere, se adauga in sugestii
          const keywordConditions = keywords.map((_, i) => `
        LOWER(p.content) LIKE $${keywordOffset + i + 1}
        OR LOWER(u.first_name || ' ' || u.last_name) LIKE $${keywordOffset + i + 1}
      `);
          values.push(...keywords);
          suggestionParts.push(`(${keywordConditions.join(" OR ")})`);// adauga toate conditiile de cautare in sugestii cu OR
        }
        whereParts.push(`(${suggestionParts.join(" OR ")})`); // adauga toate sugestiile in WHERE cu OR
      }
    }

    // Cautare postari
    // Cautam in continutul postarii sau numele utilizatorului
    if (search) {
      values.push(`%${search}%`);
      whereParts.push(`(
        LOWER(p.content) LIKE $${values.length}
        OR LOWER(u.first_name || ' ' || u.last_name) LIKE $${values.length}
      )`);
    }

    // Filtru dupa categorie
    if (categoryName) {
      values.push(`%${categoryName}%`);
      whereParts.push(`EXISTS (
        SELECT 1 FROM categories c
        WHERE c.category_id = p.category_id
        AND LOWER(c.name) LIKE $${values.length}
      )`);
    }

    // Doar follow (explicit)
    if (selectedFilter === "followed") {
      values.push(userId);
      whereParts.push(`p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $${values.length}
      )`);
    }

    // excludem postarile proprii
    values.push(userId);
    whereParts.push(`p.user_id != $${values.length}`);

    let query = `
      SELECT 
        p.post_id,
        p.user_id,
        p.content,
        p.created_at,
        p.category_id,
        u.first_name,
        u.last_name,
        u.profile_picture,
        COALESCE(l.like_count, 0) AS like_count
      FROM posts p
      JOIN accounts u ON u.user_id = p.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS like_count
        FROM likes
        GROUP BY post_id
      ) l ON l.post_id = p.post_id
    `;

    if (whereParts.length > 0) {
      query += ` WHERE ${whereParts.join(" AND ")}`;
    }

    if (selectedFilter === "liked") {
      query += " ORDER BY like_count DESC, p.created_at DESC";
    } else {
      query += " ORDER BY p.created_at DESC";
    }

    query += " LIMIT 50";

    const postsResult = await pool.query(query, values);// executa interogarea
    const posts = postsResult.rows;// extrage postarile

    // Media
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const media = await pool.query(
          `SELECT file_url, file_type FROM post_media 
           WHERE post_id = $1 ORDER BY media_id ASC`,
          [post.post_id]
        );//adauga imaginile pt fiecare item
        return {
          ...post,
          media_urls: media.rows.map(m => ({
            url: m.file_url,// creeaza obiectul cu url si tipul fisierului
            type: m.file_type,
          })),
        };
      })
    );

    res.json(enrichedPosts);
  } catch (err) {
    console.error("Error fetching discover posts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category_id, name FROM categories ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
