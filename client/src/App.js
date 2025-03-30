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
import { CartProvider } from "./components/CartContex";
import Favorites from "./components/Favorites/Favorites"

function App() {
  return (
    <Router>
      <div className="App">
        <CartProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth-success" element={<AuthRedirect />} />
            <Route path="/additional-info" element={<AdditionalInfoForm />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/profile/:userId" element={<UserProfile />} /> 
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/profile/:userId/shop" element={<ShopPage />} />
            <Route path="/cart" element={<ShoppingCart />} /> 
            <Route path="/favorites" element={<Favorites/>}/>

            <Route
              path="/"
              element={
                <h1>Welcome to the Home Page! Add more components here.</h1>
              }
            />
          </Routes>
        </CartProvider>
        <ToastContainer position="bottom-right" autoClose={2500} />
      </div>
    </Router>
  );
}

export default App;
