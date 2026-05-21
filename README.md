# Kanban Board
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)![NodeJS](https://img.shields.io/badge/node.js-6DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white)

## Setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run development servers

In two separate terminals:

```bash
# Terminal 1 - backend (port 3000)
cd server && npm run dev

# Terminal 2 - frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173

## Deployment

### Build the client

```bash
cd client && npm run build
```

### Run the server

```bash
# Required
export NODE_ENV=production
export JWT_SECRET="your-strong-secret"

# Optional
export PORT=3000
export HOST=0.0.0.0
export CLIENT_DIST_DIR="/absolute/path/to/client/dist"
export CORS_ORIGINS="https://your-app.example"
export CORS_ALLOW_ALL=false

cd server && npm start
```

### Separate client hosting (optional)

If you host the client separately, set the API base at build time:

```bash
export VITE_API_BASE_URL="https://api.your-app.example"
cd client && npm run build
```
