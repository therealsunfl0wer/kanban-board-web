import { createContext, useContext, useReducer, useCallback } from "react";
import { api } from "../hooks/useApi";

const BoardContext = createContext(null);

function boardReducer(state, action) {
  switch (action.type) {
    case "SET_BOARD":
      return action.board;

    case "ADD_CARD": {
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.card.column_id
            ? { ...col, cards: [...col.cards, action.card] }
            : col,
        ),
      };
    }

    case "MOVE_CARD": {
      const { cardId, fromColumnId, toColumnId, position } = action;
      const fromColumn = state.columns.find((col) => col.id === fromColumnId);
      if (!fromColumn) return state;

      const fromIndex = fromColumn.cards.findIndex((c) => c.id === cardId);
      if (fromIndex === -1) return state;

      const movedCard = {
        ...fromColumn.cards[fromIndex],
        column_id: toColumnId,
      };

      const columnsWithout = state.columns.map((col) => {
        if (col.id === fromColumnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        return col;
      });

      return {
        ...state,
        columns: columnsWithout.map((col) => {
          if (col.id === toColumnId) {
            const cards = [...col.cards];
            let insertAt = position ?? 0;
            if (fromColumnId === toColumnId && fromIndex < insertAt) {
              insertAt -= 1;
            }
            insertAt = Math.max(0, Math.min(insertAt, cards.length));
            cards.splice(insertAt, 0, movedCard);
            return { ...col, cards };
          }
          return col;
        }),
      };
    }

    case "DELETE_CARD":
      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== action.cardId),
        })),
      };

    case "UPDATE_CARD":
      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === action.card.id ? { ...card, ...action.card } : card,
          ),
        })),
      };

    case "ADD_COLUMN":
      return {
        ...state,
        columns: [...state.columns, { ...action.column, cards: [] }],
      };

    case "DELETE_COLUMN":
      return {
        ...state,
        columns: state.columns.filter((col) => col.id !== action.columnId),
      };

    case "MOVE_COLUMN": {
      const { columnId, toIndex } = action;
      const columns = [...state.columns];
      const currentIndex = columns.findIndex((col) => col.id === columnId);
      if (currentIndex === -1) return state;

      const [moved] = columns.splice(currentIndex, 1);
      let insertAt = toIndex ?? 0;
      if (currentIndex < insertAt) {
        insertAt -= 1;
      }
      insertAt = Math.max(0, Math.min(insertAt, columns.length));
      columns.splice(insertAt, 0, moved);

      return { ...state, columns };
    }

    default:
      return state;
  }
}

export function BoardProvider({ children }) {
  const [board, dispatch] = useReducer(boardReducer, null);

  const loadBoard = useCallback(async (id) => {
    const { board } = await api.getBoard(id);
    dispatch({ type: "SET_BOARD", board });
  }, []);

  const addCard = useCallback(
    async (columnId, title, description, priority) => {
      const { card } = await api.createCard({
        column_id: columnId,
        title,
        description,
        priority,
      });
      dispatch({ type: "ADD_CARD", card });
    },
    [],
  );

  const moveCard = useCallback(
    async (cardId, fromColumnId, toColumnId, position) => {
      dispatch({
        type: "MOVE_CARD",
        cardId,
        fromColumnId,
        toColumnId,
        position,
      });
      await api.moveCard(cardId, { column_id: toColumnId, position });
    },
    [],
  );

  const deleteCard = useCallback(async (cardId) => {
    dispatch({ type: "DELETE_CARD", cardId });
    await api.deleteCard(cardId);
  }, []);

  const updateCard = useCallback(async (cardId, updates) => {
    const { card } = await api.updateCard(cardId, updates);
    dispatch({ type: "UPDATE_CARD", card });
  }, []);

  const addColumn = useCallback(async (boardId, title) => {
    const { column } = await api.createColumn({ board_id: boardId, title });
    dispatch({ type: "ADD_COLUMN", column });
  }, []);

  const deleteColumn = useCallback(async (columnId) => {
    dispatch({ type: "DELETE_COLUMN", columnId });
    await api.deleteColumn(columnId);
  }, []);

  const moveColumn = useCallback(async (columnId, fromIndex, toIndex) => {
    dispatch({ type: "MOVE_COLUMN", columnId, fromIndex, toIndex });
    await api.moveColumn(columnId, { position: toIndex });
  }, []);

  return (
    <BoardContext.Provider
      value={{
        board,
        loadBoard,
        addCard,
        moveCard,
        deleteCard,
        updateCard,
        addColumn,
        deleteColumn,
        moveColumn,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export const useBoard = () => useContext(BoardContext);
