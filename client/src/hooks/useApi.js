// api facade
const BASE = "/api";

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const hasBody = options.body !== undefined;

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // auth
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // boards
  getBoards: () => request("/boards"),
  createBoard: (body) => request("/boards", { method: "POST", body }),
  getBoard: (id) => request(`/boards/${id}`),
  deleteBoard: (id) => request(`/boards/${id}`, { method: "DELETE" }),

  // cards
  createCard: (body) => request("/cards", { method: "POST", body }),
  updateCard: (id, body) => request(`/cards/${id}`, { method: "PATCH", body }),
  moveCard: (id, body) =>
    request(`/cards/${id}/move`, { method: "PATCH", body }),
  deleteCard: (id) => request(`/cards/${id}`, { method: "DELETE" }),

  // columns
  createColumn: (body) => request("/cards/columns", { method: "POST", body }),
  deleteColumn: (id) => request(`/cards/columns/${id}`, { method: "DELETE" }),
  moveColumn: (id, body) =>
    request(`/cards/columns/${id}/move`, { method: "PATCH", body }),
};
