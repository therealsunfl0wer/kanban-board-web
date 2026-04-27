import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .getBoards()
      .then(({ boards }) => {
        if (mounted) {
          setBoards(boards);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const { board } = await api.createBoard({ title: newTitle });
    setBoards((prev) => [board, ...prev]);
    setNewTitle("");
    navigate(`/board/${board.id}`);
  };

  const handleDelete = async (boardId) => {
    await api.deleteBoard(boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <div className="logo">Djira</div>
            <div className="section-title">Your boards</div>
          </div>
          <div className="header-right">
            <span className="username">{user?.username}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>

        <div className="create-board-form">
          <input
            className="input"
            placeholder="New board title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            Create
          </button>
        </div>

        <div className="boards-grid">
          {loading && <div className="empty-state">Loading…</div>}
          {!loading && boards.length === 0 && (
            <div className="empty-state">No boards yet</div>
          )}
          {boards.map((board) => (
            <div
              key={board.id}
              className="board-card"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <span className="board-card-title">{board.title}</span>
              <button
                className="board-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(board.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
