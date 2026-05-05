import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const activeId = id ? Number(id) : null;

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    setCreating(false);
    navigate(`/board/${board.id}`);
  };

  const handleDelete = async (boardId) => {
    await api.deleteBoard(boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (activeId === boardId) navigate("/dashboard");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo">Djira</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <span>Boards</span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setCreating(true)}
          >
            +
          </button>
        </div>

        {creating && (
          <div className="sidebar-create">
            <input
              autoFocus
              className="input"
              placeholder="Board name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="sidebar-create-actions">
              <button className="btn btn-primary" onClick={handleCreate}>
                Create
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="sidebar-board-list">
          {loading && <span className="sidebar-muted">Loading…</span>}
          {!loading && boards.length === 0 && (
            <span className="sidebar-muted">No boards yet</span>
          )}
          {boards.map((board) => (
            <div
              key={board.id}
              className={`sidebar-board ${activeId === board.id ? "active" : ""}`}
            >
              <button
                className="sidebar-board-link"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                {board.title}
              </button>
              <button
                className="sidebar-board-delete"
                onClick={() => handleDelete(board.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <span className="username">{user?.username}</span>
        <button className="btn btn-ghost btn-full" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
