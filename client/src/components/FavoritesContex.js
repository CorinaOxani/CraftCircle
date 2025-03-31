import { createContext, useContext, useState, useEffect } from "react";

const FavoritesContex = createContext();

export function FavoritesProvider({ children }) {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const userId = localStorage.getItem("user_id");

  const fetchFavoritesCount = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:4000/favorites/user-favorites/${userId}`);
      const data = await res.json();
      setFavoritesCount(data.length);
    } catch (err) {
      console.error("Error fetching favorites count:", err);
    }
  };

  useEffect(() => {
    fetchFavoritesCount();
  }, [userId]);

  return (
    <FavoritesContex.Provider value={{ favoritesCount, fetchFavoritesCount }}>
      {children}
    </FavoritesContex.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContex);
}
