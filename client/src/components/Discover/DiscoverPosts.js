import React, { useEffect, useState } from "react";
import PostCard from "./PostCard";
import styles from "../../CSSfyles/DiscoverPage.module.css";
import { useUser } from "../UserContext";
import FiltersBar from "./FiltersBar";
import { postFilters } from "./filters";

export default function DiscoverPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const { userId } = useUser();

  useEffect(() => {
    fetch("http://localhost:4000/discover/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);


  useEffect(() => {
    if (!userId) return;

    const queryParams = new URLSearchParams({
      user_id: userId,
      filter: selectedFilter,
      search: searchQuery,
    });

    if (selectedCategory) {
      queryParams.append("category", selectedCategory);
    }

    fetch(`http://localhost:4000/discover/posts?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("Expected array but got:", data);
          setPosts([]);
        }
      })
      .catch((err) => {
        console.error("Error loading posts:", err);
        setPosts([]);
      });
  }, [userId, selectedFilter, searchQuery, selectedCategory]);

  return (
    <>
      <FiltersBar
        filters={postFilters}
        selected={selectedFilter}
        onSelect={setSelectedFilter}
      />

      <div className={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by username or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.categoryAutocomplete}>
          <input
            type="text"
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.searchInput}
          />
          {selectedCategory && (
            <div className={styles.suggestionList}>
              {categories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(selectedCategory.toLowerCase())&&
                  cat.name.toLowerCase() !== selectedCategory.toLowerCase()
                )
                .map((cat) => (
                  <div
                    key={cat.category_id}
                    className={styles.suggestionItem}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {posts.map((post) => (
          <PostCard key={post.post_id} post={post} />
        ))}
      </div>
    </>
  );
}
