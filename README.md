# Project Management Dashboard

A simple full-stack project/task dashboard built with React (Vite) and Node.js/Express.

## Features
- View all tasks in a dashboard with status counts.
- Add tasks with title, description, assignee and due date.
- Change task status: Pending, InProgress, or Completed.
- Delete tasks.
- Search tasks and filter by status.
- Tasks are saved to `server/data/tasks.json` (no database setup required).

## Requirements
- Node.js 18+ and npm

## Run the application

Open a terminal in the project folder:

```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/tasks

The frontend Vite server proxies `/api` requests to the backend.

## Run backend only
```bash
npm run start
```

## API
- `GET /api/tasks` – list tasks
- `POST /api/tasks` – create a task
- `PATCH /api/tasks/:id` – update task fields/status
- `DELETE /api/tasks/:id` – delete a task

Task status must be one of `Pending`, `InProgress`, `Completed`.
