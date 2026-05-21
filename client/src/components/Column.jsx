import { Card } from "./Card";
import { useBoard } from "../context/BoardContext";

export function Column({
  column,
  isFocused,
  isDimmed,
  focusedCardId,
  onFocusColumn,
  onFocusCard,
  dragHandleProps,
  dropProps,
  cardDragProps,
  cardDropProps,
  cardDragState,
  columnDragState,
}) {
  const { deleteColumn } = useBoard();
  const getCardDragProps = cardDragProps ?? (() => ({}));
  const getCardDropProps = cardDropProps ?? (() => ({}));

  const hasFocusedCard =
    focusedCardId && column.cards.some((card) => card.id === focusedCardId);

  const isCardDropTarget = cardDragState?.overColumnId === column.id;
  const isColumnDropTarget = columnDragState?.overColumnId === column.id;
  const isDraggingColumn = columnDragState?.draggingColumnId === column.id;

  const isCardOverPosition = (position) =>
    cardDragState?.overColumnId === column.id &&
    cardDragState?.overPosition === position;

  return (
    <div
      className={`column ${isFocused ? "is-focused" : ""} ${
        isDimmed ? "is-dimmed" : ""
      } ${hasFocusedCard ? "has-focused-card" : ""} ${
        isCardDropTarget ? "is-card-drop-target" : ""
      } ${isColumnDropTarget ? "is-column-drop-target" : ""} ${
        isDraggingColumn ? "is-column-dragging" : ""
      }`}
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
          <div
            key={card.id}
            className={`card-drop-slot ${
              isCardOverPosition(i) ? "is-over" : ""
            }`}
            {...getCardDropProps(column.id, i)}
          >
            <Card
              card={card}
              dragProps={getCardDragProps(card, column.id)}
              isFocused={focusedCardId === card.id}
              isDimmed={Boolean(focusedCardId) && focusedCardId !== card.id}
              isDragging={cardDragState?.draggingCardId === card.id}
              onFocus={() => onFocusCard(column.id, card.id)}
            />
          </div>
        ))}
        <div
          className={`card-drop-slot card-drop-slot--end ${
            isCardOverPosition(column.cards.length) ? "is-over" : ""
          }`}
          {...getCardDropProps(column.id, column.cards.length)}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
