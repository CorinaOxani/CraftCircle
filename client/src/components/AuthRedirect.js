import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");
    const isNewUser = params.get("isNewUser") === "true"; 

    if (userId) {
      localStorage.setItem("user_id", userId);

      if (isNewUser) {
        localStorage.setItem("isNewUser", "true"); 
        navigate("/additional-info");
      } else {
        localStorage.removeItem("isNewUser"); 
        navigate(`/`); 
      }
    }
  }, [navigate]);

  return <div>Redirecting...</div>; // Afișează un mesaj scurt de redirecționare
}
