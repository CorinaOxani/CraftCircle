import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/ShopPage.module.css";
import ProfileHeader from "../Profile/ProfileHeader";
import ProfilePictureDisplay from "../Profile/ProfilePictureDisplay";
import ProfileStats from "../Profile/ProfileStats";
import ProductForm from "./ProductForm";
import ProductCard from "./ProductCard";
import { useUser } from "../UserContext";



export default function ShopPage() {
    const params = useParams();
    const navigate = useNavigate();
    const { userId: loggedInUserId } = useUser();
    const userId = parseInt(params.userId) || loggedInUserId;
    const [editingProductId, setEditingProductId] = useState(null);
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [isPostingProduct, setIsPostingProduct] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get("highlight");
    const [isFollowingChanged, setIsFollowingChanged] = useState(false);



    const isOwnShop = parseInt(userId) === parseInt(loggedInUserId);

    useEffect(() => {
        if (!userId) {
        navigate("/login");
        return;
        }

        fetch(`http://localhost:4000/users/${userId}`)
        .then((res) => res.json())
        .then(setUser)
        .catch(() => navigate("/"));
    }, [userId, navigate]);

    useEffect(() => {
        fetch(`http://localhost:4000/shop/user-products/${userId}`)
        .then((res) => res.json())
        .then((data) => {
            const productsWithIndex = data.map((product) => ({
            ...product,
            currentIndex: 0
            }));
            setProducts(productsWithIndex);
        })
        .catch((err) => console.error("Error loading products:", err));
    }, [userId]);

    useEffect(() => {
        if (highlightId && products.length > 0) {
          const el = document.getElementById(`product-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add(styles.highlightedCard);
      
            const timeout = setTimeout(() => {
              el.classList.remove(styles.highlightedCard);
            }, 3000);
      
            return () => clearTimeout(timeout);
          }
        }
      }, [highlightId, products]);
      
    const handleAddProduct = async ({ title, description, price, files }) => {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        files.forEach((file) => formData.append("images", file));
    
        try {
        setIsPostingProduct(true); 
    
        const response = await fetch("http://localhost:4000/shop/add-product", {
            method: "POST",
            body: formData,
        });
    
        const result = await response.json();
    
        if (response.ok) {
            const updated = await fetch(`http://localhost:4000/shop/user-products/${userId}`);
            const updatedData = await updated.json();
            setProducts(updatedData.map((p) => ({ ...p, currentIndex: 0 })));
        } else {
            console.error("Error:", result.error);
        }
        } catch (err) {
        console.error("Upload error:", err);
        } finally {
        setIsPostingProduct(false); 
        }
    };
    
    const handleNext = (itemId) => {
        setProducts((prev) =>
        prev.map((product) =>
            product.item_id === itemId
            ? {
                ...product,
                currentIndex:
                    (product.currentIndex + 1) % product.images.length, 
                }
            : product
        )
        );
    };
    
    const handlePrev = (itemId) => {
        setProducts((prev) =>
        prev.map((product) =>
            product.item_id === itemId
            ? {
                ...product,
                currentIndex:
                    (product.currentIndex - 1 + product.images.length) % product.images.length,
                }
            : product
        )
        );
    };

    const handleDeleteProduct = async (productId) => {
        try {
        const res = await fetch(`http://localhost:4000/shop/delete-product/${productId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            setProducts((prev) => prev.filter((p) => p.item_id !== productId));
        } else {
            console.error("Delete failed");
        }
        } catch (err) {
        console.error("Error deleting product:", err);
        }
    };
    
    const handleEditProduct = (productId) => {
        setEditingProductId(productId);
    };

    const handleReportProduct = async (productId, reportedUserId) => {
        const user_id = localStorage.getItem("user_id");
        try {
        const res = await fetch(`http://localhost:4000/shop/report-product/${productId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id, reported_user_id: reportedUserId }),
        });
    
        const data = await res.json();
        alert(data.message === "Already reported"
            ? "You already reported this product."
            : "Thanks! We'll review this product.");
        } catch (err) {
        console.error("Error reporting product:", err);
        alert("Error reporting product.");
        }
    };
    
    

    if (!user) return <p>Loading shop...</p>;

    return (
        <div className={styles.shopContainer}>
        <Navbar />
        <ProfilePictureDisplay user={user} />
        <div className={styles.shopHeader}>
            <ProfileHeader user={user} />
            {!isOwnShop && (
            <p className={styles.shopDescription}>
                Welcome to {user.first_name}'s shop!
            </p>
            )}
        </div>
        <ProfileStats
            user={user}
            setUser={setUser}
            navigate={navigate}
            isOwner={isOwnShop}
            isFollowingChanged={isFollowingChanged}
            setIsFollowingChanged={setIsFollowingChanged}
            />

        {isOwnShop && (
            <ProductForm
                userId={userId}
                onSubmitProduct={handleAddProduct}
                isPosting={isPostingProduct} 
            />
            )}

        <div className={styles.productsGrid}>
            {products.map((product) => (
            <ProductCard
            key={product.item_id}
            product={product}
            isOwner={isOwnShop}
            isEditing={editingProductId === product.item_id}
            setIsEditing={setEditingProductId}
            onNext={handleNext}
            onPrev={handlePrev}
            onDeleteProduct={handleDeleteProduct}
            onEditProduct={handleEditProduct}
            onReportProduct={() => handleReportProduct(product.item_id, product.user_id)} 
            id={`product-${product.item_id}`}
            />  
            ))}
        </div>
        </div>
    );
}
