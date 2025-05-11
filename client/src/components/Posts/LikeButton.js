import React, { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import styles from "../../CSSfyles/LikeButton.module.css";
import { useUser } from "../UserContext";

export default function LikeButton({ postId, userId, isOwner }) {
    const { isAdmin } = useUser();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showList, setShowList] = useState(false);
    const [likers, setLikers] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:4000/likes/${postId}/${userId}`)
        .then(res => res.json())
        .then(data => {
            setLiked(data.userLiked);
            setLikeCount(data.totalLikes);
        })
        .catch(err => console.error("Error loading like status:", err));
    }, [postId, userId]);
    
    const toggleLike = async () => {
        
        if (loading || isAdmin) return;

        setLoading(true);
    
        const url = liked ? "remove" : "add";
        const res = await fetch(`http://localhost:4000/likes/${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId, user_id: userId }),
        });
    
        if (res.ok) {
            setLiked(!liked);
            setLikeCount(prev => liked ? prev - 1 : prev + 1);
        }
    
        setLoading(false);
    };

    const handleShowLikers = async () => {
        try {
          const res = await fetch(`http://localhost:4000/likes/users/${postId}`);
          const data = await res.json();
          setLikers(data);
          setShowList(true);
        } catch (err) {
          console.error("Failed to fetch likers:", err);
        }
    };

    return (
        <div className={styles.likeContainer}>
            <FaHeart
                className={`${styles.heartIcon} ${liked ? styles.liked : ""}`}
                onClick={!isOwner && !loading && !isAdmin ? toggleLike : undefined}
                title={isOwner ? "You can't like your own post" : liked ? "Unlike" : "Like"}
            />
            <span>{likeCount}</span>
        </div>
    );
}
