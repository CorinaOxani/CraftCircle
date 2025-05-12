import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "../components/UserContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { userId } = useUser();

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

  // Fetch la fiecare schimbare de utilizator
  useEffect(() => {
    fetchFavoritesCount();
  }, [userId]);

  return (
    <FavoritesContext.Provider value={{ favoritesCount, fetchFavoritesCount, setFavoritesCount }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
