import { useRef, useState } from "react";

export function useColumnDragAndDrop(onMove) {
  const dragging = useRef(null);
  const initialState = {
    draggingColumnId: null,
    fromIndex: null,
    overColumnId: null,
    overIndex: null,
  };
  const [dragState, setDragState] = useState(initialState);
  const dragStateRef = useRef(initialState);

  const updateDragState = (next) => {
    const prev = dragStateRef.current;
    const updated = { ...prev, ...next };
    const unchanged =
      prev.draggingColumnId === updated.draggingColumnId &&
      prev.fromIndex === updated.fromIndex &&
      prev.overColumnId === updated.overColumnId &&
      prev.overIndex === updated.overIndex;
    if (unchanged) return;
    dragStateRef.current = updated;
    setDragState(updated);
  };

  const resetDragState = () => {
    const prev = dragStateRef.current;
    const unchanged =
      prev.draggingColumnId === null &&
      prev.fromIndex === null &&
      prev.overColumnId === null &&
      prev.overIndex === null;
    if (unchanged) return;
    dragStateRef.current = initialState;
    setDragState(initialState);
  };

  const getDragProps = (columnId, fromIndex) => ({
    draggable: true,
    onDragStart: (event) => {
      dragging.current = { columnId, fromIndex };
      updateDragState({
        draggingColumnId: columnId,
        fromIndex,
        overColumnId: columnId,
        overIndex: fromIndex,
      });
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/x-kanban-column",
        String(columnId),
      );
      event.dataTransfer.setData("text/plain", String(columnId));
    },
    onDragEnd: () => {
      dragging.current = null;
      resetDragState();
    },
  });

  const getDropProps = (columnId, toIndex) => ({
    onDragOver: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      updateDragState({ overColumnId: columnId, overIndex: toIndex });
    },
    onDrop: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      const { columnId: draggedId, fromIndex } = dragging.current;
      dragging.current = null;
      if (draggedId === columnId && fromIndex === toIndex) {
        resetDragState();
        return;
      }
      onMove(draggedId, fromIndex, toIndex);
      resetDragState();
    },
  });

  const getDropZoneProps = (toIndex) => ({
    onDragOver: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      updateDragState({ overColumnId: null, overIndex: toIndex });
    },
    onDrop: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      const { columnId: draggedId, fromIndex } = dragging.current;
      dragging.current = null;
      onMove(draggedId, fromIndex, toIndex);
      resetDragState();
    },
  });

  return { getDragProps, getDropProps, getDropZoneProps, dragState };
}
