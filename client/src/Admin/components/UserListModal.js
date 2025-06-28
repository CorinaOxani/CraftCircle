import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/UserListModal.module.css";

const UserListModal = ({ onClose, title, endpoint }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
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
                setFilteredUsers(data); 
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
    
        fetchUsers();
    }, [endpoint]);

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const filtered = users.filter(user => 
            user.first_name.toLowerCase().includes(term) ||
            user.last_name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            String(user.user_id).includes(term)
        );
        setFilteredUsers(filtered);
    };

    const handleUserClick = (userId) => {
        onClose();  
        navigate(`/admin/users/${userId}`); 
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <button className={styles.closeButton} onClick={onClose}>✖</button>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by name, email, or ID..."
                    className={styles.searchBar}
                />
                <ul className={styles.userList}>
                    {filteredUsers.map((user) => (
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
