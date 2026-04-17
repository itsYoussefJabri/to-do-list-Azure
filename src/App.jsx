import { useEffect, useMemo, useState } from 'react'
import './App.css'

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

function App() {
  const [visitMessage, setVisitMessage] = useState('Checking your visit history...')
  const [todoTitle, setTodoTitle] = useState('')
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const now = Date.now()
    const previousVisitRaw = localStorage.getItem('lastVisit')
    const previousVisit = previousVisitRaw ? Number(previousVisitRaw) : null
    const visitCount = Number(localStorage.getItem('visitCount') || '0') + 1

    if (previousVisit && Number.isFinite(previousVisit)) {
      const diff = now - previousVisit
      setVisitMessage(
        `Welcome back. You visited ${formatDuration(diff)} ago. This is visit #${visitCount}.`,
      )
    } else {
      setVisitMessage('Welcome. This is your first visit on this browser.')
    }

    localStorage.setItem('lastVisit', String(now))
    localStorage.setItem('visitCount', String(visitCount))
  }, [])

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos],
  )

  async function loadTodos() {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }

      const data = await response.json()
      setTodos(data)
    } catch {
      setError('Could not load todos from JSON storage.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTodos()
  }, [])

  async function addTodo(event) {
    event.preventDefault()
    const trimmed = todoTitle.trim()

    if (!trimmed) {
      return
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })

      if (!response.ok) {
        throw new Error('Failed to create todo')
      }

      const created = await response.json()
      setTodos((current) => [created, ...current])
      setTodoTitle('')
    } catch {
      setError('Could not create todo item.')
    }
  }

  async function toggleTodo(todo) {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      const updated = await response.json()
      setTodos((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      )
    } catch {
      setError('Could not update todo item.')
    }
  }

  async function removeTodo(todoId) {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }

      setTodos((current) => current.filter((entry) => entry.id !== todoId))
    } catch {
      setError('Could not delete todo item.')
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="tag">React + JSON file storage.</p>
        <h1>Visit Difference + Todo List</h1>
        <p className="subtext">{visitMessage}</p>
      </header>

      <section className="panel">
        <h2>Add Todo</h2>
        <form className="todo-form" onSubmit={addTodo}>
          <input
            value={todoTitle}
            onChange={(event) => setTodoTitle(event.target.value)}
            placeholder="Write a task"
            aria-label="Todo title"
          />
          <button type="submit">Add</button>
        </form>
        <p className="meta">
          {completedCount}/{todos.length} completed
        </p>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Todo Items</h2>
        {loading ? (
          <p>Loading todos...</p>
        ) : todos.length === 0 ? (
          <p>No todos yet. Add your first item above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                  />
                  <span className={todo.completed ? 'done' : ''}>{todo.title}</span>
                </label>
                <button
                  type="button"
                  className="delete"
                  onClick={() => removeTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App