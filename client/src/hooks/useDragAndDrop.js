import { useRef, useState } from "react";

/**
 * useDragAndDrop
 *
 * Encapsulates all HTML5 Drag and Drop API logic.
 * Components get clean props without knowing anything about
 * dragstart / dragover / drop events.
 */
export function useDragAndDrop(onMove) {
  const dragging = useRef(null);
  const initialState = {
    draggingCardId: null,
    fromColumnId: null,
    overColumnId: null,
    overPosition: null,
  };
  const [dragState, setDragState] = useState(initialState);
  const dragStateRef = useRef(initialState);

  const updateDragState = (next) => {
    const prev = dragStateRef.current;
    const updated = { ...prev, ...next };
    const unchanged =
      prev.draggingCardId === updated.draggingCardId &&
      prev.fromColumnId === updated.fromColumnId &&
      prev.overColumnId === updated.overColumnId &&
      prev.overPosition === updated.overPosition;
    if (unchanged) return;
    dragStateRef.current = updated;
    setDragState(updated);
  };

  const resetDragState = () => {
    const prev = dragStateRef.current;
    const unchanged =
      prev.draggingCardId === null &&
      prev.fromColumnId === null &&
      prev.overColumnId === null &&
      prev.overPosition === null;
    if (unchanged) return;
    dragStateRef.current = initialState;
    setDragState(initialState);
  };

  const getDragProps = (card, columnId) => ({
    draggable: true,
    onDragStart: (e) => {
      dragging.current = { cardId: card.id, fromColumnId: columnId };
      updateDragState({
        draggingCardId: card.id,
        fromColumnId: columnId,
        overColumnId: columnId,
        overPosition: null,
      });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(card.id));
    },
    onDragEnd: () => {
      dragging.current = null;
      resetDragState();
    },
  });

  const getDropProps = (columnId, position) => ({
    onDragOver: (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      updateDragState({ overColumnId: columnId, overPosition: position ?? 0 });
    },
    onDrop: (e) => {
      e.preventDefault();
      if (!dragging.current) return;
      const { cardId, fromColumnId } = dragging.current;
      if (cardId && (fromColumnId !== columnId || position !== undefined)) {
        onMove(cardId, fromColumnId, columnId, position ?? 0);
      }
      dragging.current = null;
      resetDragState();
    },
  });

  return { getDragProps, getDropProps, dragState };
}
