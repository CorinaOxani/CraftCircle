import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthRedirect from "./components/AuthRedirect"; 
import AdditionalInfoForm from "./components/AdditionalInfoForm";
//import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth-success" element={<AuthRedirect />} />
          <Route path="/additional-info" element={<AdditionalInfoForm />} />
          <Route
            path="/"
            element={
              <h1>Welcome to the Home Page! Add more components here.</h1>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
