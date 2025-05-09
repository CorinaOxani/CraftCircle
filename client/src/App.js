import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthRedirect from "./components/AuthRedirect";
import AdditionalInfoForm from "./components/AdditionalInfoForm";
import UserProfile from "./components/Profile/UserProfile";
import ShopPage from "./components/Shop/ShopPage";
import ShoppingCart from "./components/ShoppingCart/Cart";
import Favorites from "./components/Favorites/Favorites";
import { CartProvider } from "./components/CartContex";
import { FavoritesProvider } from "./components/FavoritesContex";
import { UserProvider } from "./components/UserContext";
import FollowersPage from "./components/Profile/FollowersPage";
import FollowingPage from "./components/Profile/FollowingPage";
import MessagesPage from "./components/Messages/MessagesPage";
import AppreciationPage from "./components/Appreciation/AppreciationPage";


import AdminProfile from "./Admin/Pages/AdminProfile";
import ManageCategoriesPage from "./Admin/Pages/ManageCategoriesPage";
import ModeratePostsPage from "./Admin/Pages/ModeratePostsPage";
import ModerateProductsPage from "./Admin/Pages/ModerateProductsPage";
import AdminStatisticsPage from "./Admin/Pages/AdminStatisticsPage.js";


import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <UserProvider>
        <CartProvider>
          <FavoritesProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<h1>Welcome to the Home Page! Add more components here.</h1>} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth-success" element={<AuthRedirect />} />
              <Route path="/additional-info" element={<AdditionalInfoForm />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile/:userId/shop" element={<ShopPage />} />
              <Route path="/shop/:userId" element={<ShopPage />} />
              <Route path="/cart" element={<ShoppingCart />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile/:userId/followers" element={<FollowersPage />} />
              <Route path="/profile/:userId/following" element={<FollowingPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/appreciation" element={<AppreciationPage />} />

              <Route path="/admin_profile/:adminId" element={<AdminProfile />} />
              <Route path="/admin/manage-categories" element={<ManageCategoriesPage />} />
              <Route path="/admin/moderate-posts" element={<ModeratePostsPage />} />
              <Route path="/admin/moderate-products" element={<ModerateProductsPage />} />
              <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
              <Route path="/admin/users/:userId" element={<UserProfile adminMode={true} />} />


              <Route path="/profile/:userId" element={<UserProfile />} />


            </Routes>
            <ToastContainer position="bottom-right" autoClose={2500} />
          </FavoritesProvider>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
