import { useRef } from "react";

/**
 * useDragAndDrop
 *
 * Encapsulates all HTML5 Drag and Drop API logic.
 * Components get clean props without knowing anything about
 * dragstart / dragover / drop events.
 */
export function useDragAndDrop(onMove) {
  const dragging = useRef(null);

  const getDragProps = (card, columnId) => ({
    draggable: true,
    onDragStart: (e) => {
      dragging.current = { cardId: card.id, fromColumnId: columnId };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(card.id));
    },
    onDragEnd: () => {
      dragging.current = null;
    },
  });

  const getDropProps = (columnId, position) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e) => {
      e.preventDefault();
      if (!dragging.current) return;
      const { cardId, fromColumnId } = dragging.current;
      if (cardId && (fromColumnId !== columnId || position !== undefined)) {
        onMove(cardId, fromColumnId, columnId, position ?? 0);
      }
      dragging.current = null;
    },
  });

  return { getDragProps, getDropProps };
}
