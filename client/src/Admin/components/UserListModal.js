import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/UserListModal.module.css";

const UserListModal = ({ onClose, title, endpoint }) => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const url = endpoint === "all" 
                    ? "http://localhost:4000/admin/statistics/users/all" 
                    : "http://localhost:4000/admin/statistics/users/new";
                const response = await fetch(url);
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
    
        fetchUsers();
    }, [endpoint]);

    const handleUserClick = (userId) => {
        onClose();  // Închide modalul
        navigate(`/admin/users/${userId}`);  // Navighează la pagina profilului
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <button className={styles.closeButton} onClick={onClose}>✖</button>
                <ul className={styles.userList}>
                    {users.map((user) => (
                        <li 
                            key={user.user_id} 
                            onClick={() => handleUserClick(user.user_id)} 
                            className={styles.userItem}
                        >
                            <span>{user.first_name} {user.last_name}</span>
                            <span className={styles.email}>{user.email}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default UserListModal;
