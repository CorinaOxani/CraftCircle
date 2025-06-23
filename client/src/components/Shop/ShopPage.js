import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/ShopPage.module.css";
import ProfileHeader from "../Profile/ProfileHeader";
import ProfileStats from "../Profile/ProfileStats";
import ProductForm from "./ProductForm";
import ProductCard from "./ProductCard";
import { useUser } from "../UserContext";
import AdminNavbar from "../../Admin/components/AdminNavbar";
import { useToast } from "../../utils/ToastContext";
import SmartProfilePicture from "../Profile/SmartProfilePicture";


export default function ShopPage() {
    const navigate = useNavigate();
    const { userId: loggedInUserId, isAdmin } = useUser();
    const { userId: paramUserId } = useParams();
    const userId = parseInt(paramUserId);
    const [editingProductId, setEditingProductId] = useState(null);
    const [user, setUser] = useState(null); //cel logat
    const [products, setProducts] = useState([]);
    const [isPostingProduct, setIsPostingProduct] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get("highlight");
    const [isFollowingChanged, setIsFollowingChanged] = useState(false);
    const { showToast } = useToast();


    const isOwnShop = userId === parseInt(loggedInUserId);

    useEffect(() => {
        if (loggedInUserId == null) return; //nu se incarca nimic

        fetch(`http://localhost:4000/users/${userId}`)
            .then((res) => res.json())
            .then(setUser)
            .catch(() => navigate("/login"));
    }, [loggedInUserId, navigate, userId]);

    useEffect(() => {
        console.log("Fetching products for user:", userId);

        fetch(`http://localhost:4000/shop/user-products/${userId}`) //cerere get pentru obtinerea produselor uderId-ului din param
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const productsWithIndex = data.map((product) => ({
                        ...product,
                        currentIndex: 0//pentru controlul caruselului de imagini
                    }));
                    //console.log("Products loaded:", productsWithIndex);
                    setProducts(productsWithIndex);
                } else {
                    //console.error("not array but:", data);
                    setProducts([]);
                }
            })
            .catch((err) => console.error("Error loading products:", err));
    }, [userId]);

    useEffect(() => {
        if (highlightId && products.length > 0) { //avem un highlightId si products este populat
            const el = document.getElementById(`product-${highlightId}`);//caut in DOM elem cu id = "product-id"
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" }); //face scroll pana ajunge cu el pe centru
                el.classList.add(styles.highlightedCard); //classList permite sa adaugi o clasa CSS direct pe un obiect HTML 

                const timeout = setTimeout(() => {
                    el.classList.remove(styles.highlightedCard);
                }, 3000);

                return () => clearTimeout(timeout);
            }
        }
    }, [highlightId, products]);

    const handleAddProduct = async ({ title, description, price, files, category_id }) => {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("category_id", category_id);

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
                setProducts(updatedData.map((p) => ({ ...p, currentIndex: 0 }))); //se actualizeaza lista de produse dupa ce se adauga unul nou
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
            prev.map((product) =>//parcurge array ul 
                product.item_id === itemId
                    ? {
                        ...product, //creeaza o copie a acelui produs, dar cu alt currentIndex
                        currentIndex:
                            (product.currentIndex + 1) % product.images.length,//pt parcurgere circulara
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
                setProducts((prev) => prev.filter((p) => p.item_id !== productId)); //se creeaza o lista noua cu tot ce era inainte inafara de produsul sters
                showToast("Post deleted successfully!");
            } else {
                console.error("Delete failed");
                showToast("Failed to delete post.");
            }
        } catch (err) {
            console.error("Error deleting product:", err);
            showToast("An error occurred while deleting the post.");
        }
    };

    const handleEditProduct = (productId) => {
        setEditingProductId(productId);
    };

    if (!user) {
        return (
            <div className={styles.shopContainer}>
                {isAdmin ? <AdminNavbar /> : <Navbar />}
                <p>Loading shop...</p>
            </div>
        );
    }

    return (
        <div className={styles.shopContainer}>
            {isAdmin ? <AdminNavbar /> : <Navbar />}
            <SmartProfilePicture user={user} />
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
                {products.map((product) => ( //pentru fiecare produs din array
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
                        id={`product-${product.item_id}`}
                    />
                ))}
            </div>
            {products.length === 0 && (
                <p className={styles.emptyStateMessage}>
                    {isOwnShop
                        ? "You haven't added any products yet. Start uploading your creations!"
                        : "This user hasn't listed any products yet."}
                </p>
            )}
        </div>
    );
}
