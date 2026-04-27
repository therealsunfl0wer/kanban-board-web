import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBoard } from "../context/BoardContext";

const PRIORITY_COLORS = {
  low: "var(--priority-low)",
  medium: "var(--priority-medium)",
  high: "var(--priority-high)",
};

export function Card({ card, dragProps, isFocused, isDimmed, onFocus }) {
  const { deleteCard } = useBoard();
  const [hovered, setHovered] = useState(false);

  const description = card.description?.trim()
    ? card.description
    : "_No description yet._";

  return (
    <div
      className={`card ${isFocused ? "card--focused" : ""} ${
        isDimmed ? "card--dimmed" : ""
      }`}
      {...dragProps}
      onClick={() => {
        if (!isFocused) onFocus?.();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="card-priority-bar"
        style={{ background: PRIORITY_COLORS[card.priority] }}
      />
      <div className="card-body">
        <p className="card-title">{card.title}</p>
        {!isFocused && card.description && (
          <div className="card-markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {description}
            </ReactMarkdown>
          </div>
        )}
        {isFocused && (
          <div className="card-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {description}
            </ReactMarkdown>
          </div>
        )}
        <div className="card-footer">
          <span
            className="card-badge"
            style={{ color: PRIORITY_COLORS[card.priority] }}
          >
            {card.priority}
          </span>
          <div className="card-actions">
            {(hovered || isFocused) && (
              <button
                className="card-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteCard(card.id);
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
