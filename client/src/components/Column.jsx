import { Card } from "./Card";
import { useBoard } from "../context/BoardContext";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

export function Column({
  column,
  isFocused,
  isDimmed,
  focusedCardId,
  onFocusColumn,
  onFocusCard,
  dragHandleProps,
  dropProps,
}) {
  const { moveCard, deleteColumn } = useBoard();
  const { getDragProps, getDropProps } = useDragAndDrop(moveCard);

  const hasFocusedCard =
    focusedCardId && column.cards.some((card) => card.id === focusedCardId);

  return (
    <div
      className={`column ${isFocused ? "is-focused" : ""} ${
        isDimmed ? "is-dimmed" : ""
      } ${hasFocusedCard ? "has-focused-card" : ""}`}
      {...getDropProps(column.id, column.cards.length)}
    >
      <div
        className="column-header"
        role="button"
        tabIndex={0}
        onClick={() => onFocusColumn?.(column.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onFocusColumn?.(column.id);
          }
        }}
        {...dragHandleProps}
        {...dropProps}
      >
        <span className="column-title">{column.title}</span>
        <div className="column-header-actions">
          <span className="column-count">{column.cards.length}</span>
          <button
            className="column-delete"
            onClick={(event) => {
              event.stopPropagation();
              deleteColumn(column.id);
            }}
            title="Delete column"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="cards-list">
        {column.cards.map((card, i) => (
          <div key={card.id} {...getDropProps(column.id, i)}>
            <Card
              card={card}
              dragProps={getDragProps(card, column.id)}
              isFocused={focusedCardId === card.id}
              isDimmed={Boolean(focusedCardId) && focusedCardId !== card.id}
              onFocus={() => onFocusCard(column.id, card.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
