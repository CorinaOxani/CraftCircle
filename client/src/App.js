import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/LoginRegister/Register.js";
import Login from "./components/LoginRegister/Login.js";
import AuthRedirect from "./components/AuthRedirect";
import AdditionalInfoForm from "./components/LoginRegister/AdditionalInfoForm";
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
import OrdersPage from "./components/Orders/OrdersPage";
import DiscoverPage from "./components/Discover/DiscoverPage.js"
import { ToastProvider } from "./utils/ToastContext.js";


import AdminProfile from "./Admin/Pages/AdminProfile";
import ManageCategoriesPage from "./Admin/Pages/ManageCategoriesPage";
import ModeratePostsPage from "./Admin/Pages/ModeratePostsPage";
import ModerateProductsPage from "./Admin/Pages/ModerateProductsPage";
import AdminStatisticsPage from "./Admin/Pages/AdminStatisticsPage.js";
import AdminOrdersPage from "./Admin/Pages/AdminOrdersPage.js";
import ModerateUsersPage from "./Admin/Pages/ModerateUsersPage.js";


import { useEffect } from "react";
import { useLocation } from "react-router-dom";

//scroll to top on route change
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
            <ToastProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Navigate to="/register" />} />
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
                <Route path="/messages/:user_id" element={<MessagesPage />} />
                <Route path="/appreciation" element={<AppreciationPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/discover" element={<DiscoverPage />} />

                <Route path="/admin_profile/:adminId" element={<AdminProfile />} />
                <Route path="/admin/manage-categories" element={<ManageCategoriesPage />} />
                <Route path="/admin/moderate-posts" element={<ModeratePostsPage />} />
                <Route path="/admin/moderate-products" element={<ModerateProductsPage />} />
                <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
                <Route path="/admin/users/:userId" element={<UserProfile adminMode={true} />} />
                <Route path="/admin/orders" element={<AdminOrdersPage/>} />
                <Route path="/admin/moderate-users" element={<ModerateUsersPage/>} />

              </Routes>
              
              <ToastContainer position="bottom-right" autoClose={2500} />
            </ToastProvider>
          </FavoritesProvider>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
