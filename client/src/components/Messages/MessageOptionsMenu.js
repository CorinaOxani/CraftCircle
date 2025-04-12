import React from "react";
import styles from "../../CSSfyles/Messages.module.css";

const MessageOptionsMenu = React.forwardRef(
  ({ isOpen, onToggle, onDelete, onDeleteForAll, isOwn = true }, ref) => {
    return (
      <div ref={ref}>
        <button
          className={isOwn ? styles.menuButton : styles.menuButtonLeft}
          onClick={onToggle}
        >
          ⋮
        </button>
        {isOpen && (
          <div className={styles.optionsMenu}>
            <button onClick={onDelete}>Delete for me</button>
            {isOwn && onDeleteForAll && (
              <button onClick={onDeleteForAll}>Delete for everyone</button>
            )}
          </div>
        )}
      </div>
    );
  }
);


export default MessageOptionsMenu;
