import express from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distPath = path.join(projectRoot, "dist");
const dataPath =
  process.env.TODOS_FILE || path.join(projectRoot, "data", "todos.json");
const port = Number(process.env.PORT || 80);

const app = express();
app.use(express.json());

async function ensureDataFile() {
  const dir = path.dirname(dataPath);
  await mkdir(dir, { recursive: true });

  try {
    await readFile(dataPath, "utf-8");
  } catch {
    await writeFile(dataPath, "[]\n", "utf-8");
  }
}

async function readTodos() {
  await ensureDataFile();
  const raw = await readFile(dataPath, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTodos(todos) {
  await writeFile(dataPath, `${JSON.stringify(todos, null, 2)}\n`, "utf-8");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/todos", async (_req, res) => {
  const todos = await readTodos();
  res.json(todos);
});

app.post("/api/todos", async (req, res) => {
  const title = String(req.body?.title || "").trim();

  if (!title) {
    res.status(400).json({ message: "title is required" });
    return;
  }

  const todos = await readTodos();
  const todo = {
    id: randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(todo);
  await writeTodos(todos);
  res.status(201).json(todo);
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const completed = Boolean(req.body?.completed);
  const todos = await readTodos();
  const todo = todos.find((entry) => entry.id === id);

  if (!todo) {
    res.status(404).json({ message: "todo not found" });
    return;
  }

  todo.completed = completed;
  await writeTodos(todos);
  res.json(todo);
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const todos = await readTodos();
  const filtered = todos.filter((entry) => entry.id !== id);

  if (filtered.length === todos.length) {
    res.status(404).json({ message: "todo not found" });
    return;
  }

  await writeTodos(filtered);
  res.status(204).send();
});

app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`server is running on http://0.0.0.0:${port}`);
});
