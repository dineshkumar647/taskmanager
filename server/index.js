import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "tasks.json");
const statuses = ["Pending", "InProgress", "Completed"];

app.use(cors());
app.use(express.json());

function readTasks() {
  try {
    if (!fs.existsSync(dataFile)) return [];
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    console.error("Could not read task data:", error);
    return [];
  }
}
function saveTasks(tasks) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/tasks", (_req, res) => {
  res.json(readTasks().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post("/api/tasks", (req, res) => {
  const { title, description = "", assignee = "", dueDate = "" } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ message: "Task title is required." });
  const tasks = readTasks();
  const task = {
    id: randomUUID(),
    title: String(title).trim(),
    description: String(description).trim(),
    assignee: String(assignee).trim(),
    dueDate,
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(task => task.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Task not found." });

  const updates = {};
  for (const field of ["title", "description", "assignee", "dueDate", "status"]) {
    if (field in req.body) updates[field] = req.body[field];
  }
  if (updates.status && !statuses.includes(updates.status)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    return res.status(400).json({ message: "Task title cannot be empty." });
  }
  tasks[index] = { ...tasks[index], ...updates };
  if (updates.title !== undefined) tasks[index].title = String(updates.title).trim();
  saveTasks(tasks);
  res.json(tasks[index]);
});

app.delete("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const remaining = tasks.filter(task => task.id !== req.params.id);
  if (remaining.length === tasks.length) return res.status(404).json({ message: "Task not found." });
  saveTasks(remaining);
  res.json({ message: "Task deleted." });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`));
