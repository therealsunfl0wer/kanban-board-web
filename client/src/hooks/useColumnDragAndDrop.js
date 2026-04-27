import { useRef } from "react";

export function useColumnDragAndDrop(onMove) {
  const dragging = useRef(null);

  const getDragProps = (columnId, fromIndex) => ({
    draggable: true,
    onDragStart: (event) => {
      dragging.current = { columnId, fromIndex };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/x-kanban-column",
        String(columnId),
      );
      event.dataTransfer.setData("text/plain", String(columnId));
    },
    onDragEnd: () => {
      dragging.current = null;
    },
  });

  const getDropProps = (columnId, toIndex) => ({
    onDragOver: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      const { columnId: draggedId, fromIndex } = dragging.current;
      dragging.current = null;
      if (draggedId === columnId && fromIndex === toIndex) return;
      onMove(draggedId, fromIndex, toIndex);
    },
  });

  const getDropZoneProps = (toIndex) => ({
    onDragOver: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event) => {
      if (!dragging.current) return;
      event.preventDefault();
      const { columnId: draggedId, fromIndex } = dragging.current;
      dragging.current = null;
      onMove(draggedId, fromIndex, toIndex);
    },
  });

  return { getDragProps, getDropProps, getDropZoneProps };
}
