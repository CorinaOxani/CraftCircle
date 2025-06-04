import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "../components/UserContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { userId } = useUser();
  const [favoriteItems, setFavoriteItems] = useState({});

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
  const fetchFavoritesItems = async () => {
  if (!userId) return;
  try {
    const res = await fetch(`http://localhost:4000/favorites/user-favorites/${userId}`);
    const data = await res.json();

    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.seller_id]) {
        grouped[item.seller_id] = {
          sellerName: item.seller_name,
          items: [],
        };
      }
      grouped[item.seller_id].items.push(item);
    });
    setFavoriteItems(grouped);
    setFavoritesCount(data.length); // actualizezi și countul
  } catch (err) {
    console.error("Error fetching favorites:", err);
  }
};

  // Fetch la fiecare schimbare de utilizator
  useEffect(() => {
    fetchFavoritesCount();
    fetchFavoritesItems();
  }, [userId]);

  return (
    <FavoritesContext.Provider
      value={{
        favoritesCount,
        fetchFavoritesCount,
        setFavoritesCount,
        favoriteItems,
        fetchFavoritesItems,
        setFavoriteItems
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
