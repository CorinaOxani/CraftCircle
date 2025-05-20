// FiltersBar.js
import React from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css";

export default function FiltersBar({ filters, selected, onSelect }) {
  return (
    <div className={styles.filterBar}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`${styles.filterButton} ${
            selected === filter.id ? styles.activeFilter : ""
          }`}
          onClick={() => onSelect(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
