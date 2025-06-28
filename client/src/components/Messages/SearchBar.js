import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/Messages.module.css";

export default function SearchBar({ userId, onSearchResults, clearSearch, existingConversations = [] }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clearSearch) {
      setQuery("");
    }
  }, [clearSearch]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setLoading(true);

    if (value.trim() === "") {
      onSearchResults([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/messages/search?userId=${userId}&query=${encodeURIComponent(value)}`
      );
      const data = await res.json();

      // Adauga last_message_preview din conversations daca exista
      const updatedResults = data.map((user) => {
        const match = existingConversations.find(c => c.user_id === user.user_id);
        return {
          ...user,
          isSelf: parseInt(user.user_id) === parseInt(userId),
          conversation_id: match?.conversation_id || null,
          last_message_preview: match?.last_message_preview || null,
        };
      });

      onSearchResults(updatedResults);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.searchBarWrapper}>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for users..."
        className={styles.searchInput}
      />
      {loading && <div className={styles.loading}>Searching...</div>}
    </div>
  );
}
