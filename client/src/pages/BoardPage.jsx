import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BoardProvider, useBoard } from "../context/BoardContext";
import { Column } from "../components/Column";
import { api } from "../hooks/useApi";
import { useColumnDragAndDrop } from "../hooks/useColumnDragAndDrop";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    board,
    loadBoard,
    addColumn,
    addCard,
    updateCard,
    moveCard,
    deleteCard,
    moveColumn,
  } = useBoard();
  const [newColTitle, setNewColTitle] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [focusedColumnId, setFocusedColumnId] = useState(null);
  const [focusedCardId, setFocusedCardId] = useState(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [cardDraft, setCardDraft] = useState(() => ({
    title: "",
    description: "",
    priority: "medium",
    boardId: Number(id),
    columnId: null,
  }));
  const [editDraft, setEditDraft] = useState(() => ({
    title: "",
    description: "",
    priority: "medium",
    columnId: null,
  }));
  const [boards, setBoards] = useState([]);
  const [draftColumns, setDraftColumns] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingDraftColumns, setLoadingDraftColumns] = useState(false);

  const {
    getDragProps: getColumnDragProps,
    getDropProps: getColumnDropProps,
    getDropZoneProps: getColumnDropZoneProps,
  } = useColumnDragAndDrop(moveColumn);

  const { getDragProps: getCardDragProps, getDropProps: getCardDropProps } =
    useDragAndDrop(moveCard);

  const clearFocus = useCallback(() => {
    setFocusedColumnId(null);
    setFocusedCardId(null);
  }, []);

  const closeOverlays = useCallback(() => {
    clearFocus();
    setIsCreatingCard(false);
    setIsEditingCard(false);
  }, [clearFocus]);

  useEffect(() => {
    loadBoard(id).catch(() => navigate("/dashboard"));
    clearFocus();
    setIsCreatingCard(false);
    setIsEditingCard(false);
    setAddingCol(false);
  }, [id, loadBoard, navigate, clearFocus]);

  useEffect(() => {
    let active = true;
    api
      .getBoards()
      .then(({ boards: items }) => {
        if (active) setBoards(items);
      })
      .finally(() => {
        if (active) setLoadingBoards(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!board || isCreatingCard) return;
    setCardDraft((prev) => ({
      ...prev,
      boardId: Number(board.id),
      columnId: prev.columnId ?? board.columns[0]?.id ?? null,
    }));
  }, [board, isCreatingCard]);

  useEffect(() => {
    if (!isCreatingCard || !cardDraft.boardId) return;

    let active = true;

    const applyColumns = (columns) => {
      if (!active) return;
      setDraftColumns(columns);
      setCardDraft((prev) => {
        const hasColumn = columns.some((col) => col.id === prev.columnId);
        return {
          ...prev,
          columnId: hasColumn ? prev.columnId : (columns[0]?.id ?? null),
        };
      });
    };

    if (board && Number(cardDraft.boardId) === Number(board.id)) {
      setLoadingDraftColumns(false);
      applyColumns(board.columns);
      return () => {
        active = false;
      };
    }

    setLoadingDraftColumns(true);
    api
      .getBoard(cardDraft.boardId)
      .then(({ board: selectedBoard }) => applyColumns(selectedBoard.columns))
      .finally(() => {
        if (active) setLoadingDraftColumns(false);
      });

    return () => {
      active = false;
    };
  }, [isCreatingCard, cardDraft.boardId, board]);

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    await addColumn(Number(id), newColTitle);
    setNewColTitle("");
    setAddingCol(false);
  };

  const openCreateCard = (columnId) => {
    if (!board) return;
    clearFocus();
    setAddingCol(false);
    setCardDraft({
      title: "",
      description: "",
      priority: "medium",
      boardId: Number(board.id),
      columnId: columnId ?? board.columns[0]?.id ?? null,
    });
    setIsCreatingCard(true);
  };

  const handleCreateCard = async () => {
    if (!cardDraft.title.trim() || !cardDraft.columnId) return;

    if (board && Number(cardDraft.boardId) === Number(board.id)) {
      await addCard(
        cardDraft.columnId,
        cardDraft.title,
        cardDraft.description,
        cardDraft.priority,
      );
    } else {
      await api.createCard({
        column_id: cardDraft.columnId,
        title: cardDraft.title,
        description: cardDraft.description,
        priority: cardDraft.priority,
      });
    }

    setIsCreatingCard(false);
  };

  const focusedCardData = useMemo(() => {
    if (!board) return null;
    return board.columns.reduce((result, col) => {
      const card = col.cards.find((item) => item.id === focusedCardId);
      return card ? { card, column: col } : result;
    }, null);
  }, [board, focusedCardId]);

  useEffect(() => {
    if (!focusedCardData) {
      setIsEditingCard(false);
      return;
    }
    if (isEditingCard) return;
    setEditDraft({
      title: focusedCardData.card.title ?? "",
      description: focusedCardData.card.description ?? "",
      priority: focusedCardData.card.priority ?? "medium",
      columnId: focusedCardData.column.id,
    });
  }, [focusedCardData, isEditingCard]);

  const startEditCard = () => {
    if (!focusedCardData) return;
    setIsEditingCard(true);
  };

  const cancelEditCard = () => {
    if (!focusedCardData) {
      setIsEditingCard(false);
      return;
    }
    setEditDraft({
      title: focusedCardData.card.title ?? "",
      description: focusedCardData.card.description ?? "",
      priority: focusedCardData.card.priority ?? "medium",
      columnId: focusedCardData.column.id,
    });
    setIsEditingCard(false);
  };

  const handleSaveCard = async () => {
    if (!focusedCardData) return;
    const trimmedTitle = editDraft.title.trim();
    if (!trimmedTitle) return;

    const fromColumnId = focusedCardData.column.id;
    const toColumnId = editDraft.columnId ?? fromColumnId;

    if (toColumnId !== fromColumnId) {
      const targetColumn = board?.columns.find((col) => col.id === toColumnId);
      const position = targetColumn ? targetColumn.cards.length : 0;
      await moveCard(
        focusedCardData.card.id,
        fromColumnId,
        toColumnId,
        position,
      );
    }

    await updateCard(focusedCardData.card.id, {
      title: trimmedTitle,
      description: editDraft.description,
      priority: editDraft.priority,
    });

    setIsEditingCard(false);
  };

  const isCardFocusMode = Boolean(focusedCardData);
  const isCardOverlayMode = isCardFocusMode || isCreatingCard;
  const isColumnFocusMode = Boolean(focusedColumnId) && !isCardOverlayMode;
  const isFocusMode = isCardOverlayMode || isColumnFocusMode;

  const pathColumn = focusedCardData?.column
    ? focusedCardData.column
    : (board?.columns.find((col) => col.id === focusedColumnId) ?? null);

  const handlePathBoardClick = () => {
    closeOverlays();
  };

  const handlePathColumnClick = (columnId) => {
    if (!columnId) return;
    setIsCreatingCard(false);
    setIsEditingCard(false);
    setFocusedCardId(null);
    setFocusedColumnId(columnId);
  };

  const handleFocusColumn = (columnId) => {
    if (isCreatingCard) return;
    setFocusedCardId(null);
    setFocusedColumnId((prev) => (prev === columnId ? null : columnId));
  };

  const handleFocusCard = (columnId, cardId) => {
    if (isCreatingCard) return;
    if (focusedCardId === cardId) {
      clearFocus();
      return;
    }
    setFocusedColumnId(columnId);
    setFocusedCardId(cardId);
  };

  useEffect(() => {
    if (focusedCardId && !focusedCardData) clearFocus();
  }, [focusedCardId, focusedCardData, clearFocus]);

  useEffect(() => {
    if (!isFocusMode) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeOverlays();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, closeOverlays]);

  if (!board) return <div className="loading">Loading board…</div>;

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="board-title-block">
          <nav className="board-path" aria-label="Board path">
            <button className="board-path-link" onClick={handlePathBoardClick}>
              {board.title}
            </button>
            {pathColumn && (
              <>
                <span className="board-path-sep">/</span>
                <button
                  className="board-path-link"
                  onClick={() => handlePathColumnClick(pathColumn.id)}
                >
                  {pathColumn.title}
                </button>
              </>
            )}
            {focusedCardData && (
              <>
                <span className="board-path-sep">/</span>
                <span className="board-path-current">
                  {focusedCardData.card.title}
                </span>
              </>
            )}
            {isCreatingCard && (
              <>
                <span className="board-path-sep">/</span>
                <span className="board-path-current">New card</span>
              </>
            )}
          </nav>
        </div>
        <div className="board-header-actions">
          {isFocusMode && (
            <button className="btn btn-ghost" onClick={closeOverlays}>
              {isCreatingCard ? "Close editor" : "Exit focus"}
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() =>
              openCreateCard(pathColumn?.id ?? board.columns[0]?.id)
            }
          >
            + New card
          </button>
          {!isCardOverlayMode && (
            <button
              className="btn btn-ghost"
              onClick={() => setAddingCol(true)}
            >
              + New Column
            </button>
          )}
        </div>
      </header>

      <div className="board-content">
        <div
          className={`board-columns ${
            isColumnFocusMode ? "focus-mode" : ""
          } ${isCardOverlayMode ? "card-focus-mode" : ""}`}
        >
          {board.columns.map((col, index) => (
            <Column
              key={col.id}
              column={col}
              isFocused={isColumnFocusMode && focusedColumnId === col.id}
              isDimmed={isColumnFocusMode && focusedColumnId !== col.id}
              focusedCardId={focusedCardId}
              onFocusColumn={handleFocusColumn}
              onFocusCard={handleFocusCard}
              dragHandleProps={getColumnDragProps(col.id, index)}
              dropProps={getColumnDropProps(col.id, index)}
            />
          ))}

          <div
            className="column-drop-zone"
            {...getColumnDropZoneProps(board.columns.length)}
            aria-hidden="true"
          />

          {addingCol && !isCardOverlayMode && (
            <div className="column new-column-form">
              <input
                autoFocus
                className="input"
                placeholder="Column name"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              />
              <div className="add-card-actions">
                <button className="btn btn-primary" onClick={handleAddColumn}>
                  Add
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setAddingCol(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {isCreatingCard && (
          <div className="card-focus-view card-editor-view">
            <div className="card-focus-header">
              <div className="card-focus-heading">
                <div className="card-focus-meta">New card</div>
                <h2 className="card-focus-title">Create a card</h2>
              </div>
              <div className="card-focus-actions">
                <button className="btn btn-ghost" onClick={closeOverlays}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateCard}>
                  Create
                </button>
              </div>
            </div>
            <div className="card-focus-body">
              <div className="card-editor-fields">
                <div className="card-editor-row">
                  <div className="card-editor-field">
                    <label className="card-editor-label">Title</label>
                    <input
                      className="input"
                      value={cardDraft.title}
                      onChange={(event) =>
                        setCardDraft((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="card-editor-row">
                  <div className="card-editor-field">
                    <label className="card-editor-label">Board</label>
                    <select
                      className="input"
                      disabled={loadingBoards}
                      value={cardDraft.boardId ?? ""}
                      onChange={(event) =>
                        setCardDraft((prev) => ({
                          ...prev,
                          boardId: Number(event.target.value),
                        }))
                      }
                    >
                      {boards.length === 0 && (
                        <option value="" disabled>
                          No boards available
                        </option>
                      )}
                      {boards.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="card-editor-field">
                    <label className="card-editor-label">Column</label>
                    <select
                      className="input"
                      disabled={
                        loadingDraftColumns || draftColumns.length === 0
                      }
                      value={cardDraft.columnId ?? ""}
                      onChange={(event) =>
                        setCardDraft((prev) => ({
                          ...prev,
                          columnId: Number(event.target.value),
                        }))
                      }
                    >
                      {draftColumns.length === 0 && (
                        <option value="" disabled>
                          No columns available
                        </option>
                      )}
                      {draftColumns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="card-editor-field">
                    <label className="card-editor-label">Priority</label>
                    <select
                      className="input"
                      value={cardDraft.priority}
                      onChange={(event) =>
                        setCardDraft((prev) => ({
                          ...prev,
                          priority: event.target.value,
                        }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="card-editor-row">
                  <div className="card-editor-field">
                    <label className="card-editor-label">Description</label>
                    <textarea
                      className="input"
                      rows={8}
                      placeholder="Write your notes in markdown…"
                      value={cardDraft.description}
                      onChange={(event) =>
                        setCardDraft((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCardFocusMode && focusedCardData && (
          <div className="card-focus-view">
            <div className="card-focus-header">
              <div className="card-focus-heading">
                <div className="card-focus-meta">
                  <span className="card-focus-column">
                    {focusedCardData.column.title}
                  </span>
                  <span
                    className="card-focus-priority"
                    data-priority={focusedCardData.card.priority}
                  >
                    {focusedCardData.card.priority}
                  </span>
                </div>
                <h2 className="card-focus-title">
                  {focusedCardData.card.title}
                </h2>
              </div>
              <div className="card-focus-actions">
                <button className="btn btn-ghost" onClick={closeOverlays}>
                  Back to board
                </button>
                {isEditingCard ? (
                  <>
                    <button className="btn btn-ghost" onClick={cancelEditCard}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveCard}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button className="btn btn-ghost" onClick={startEditCard}>
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    await deleteCard(focusedCardData.card.id);
                    closeOverlays();
                  }}
                >
                  Delete card
                </button>
              </div>
            </div>
            <div className="card-focus-body">
              {isEditingCard ? (
                <div className="card-editor-fields">
                  <div className="card-editor-row">
                    <div className="card-editor-field">
                      <label className="card-editor-label">Title</label>
                      <input
                        className="input"
                        value={editDraft.title}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="card-editor-row">
                    <div className="card-editor-field">
                      <label className="card-editor-label">Column</label>
                      <select
                        className="input"
                        value={editDraft.columnId ?? ""}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            columnId: Number(event.target.value),
                          }))
                        }
                      >
                        {board.columns.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="card-editor-field">
                      <label className="card-editor-label">Priority</label>
                      <select
                        className="input"
                        value={editDraft.priority}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            priority: event.target.value,
                          }))
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="card-editor-row">
                    <div className="card-editor-field">
                      <label className="card-editor-label">Description</label>
                      <textarea
                        className="input"
                        rows={10}
                        placeholder="Write your notes in markdown…"
                        value={editDraft.description}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {focusedCardData.card.description?.trim()
                      ? focusedCardData.card.description
                      : "_No description yet._"}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <BoardProvider>
      <BoardView />
    </BoardProvider>
  );
}
