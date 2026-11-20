import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, CircleDashed, ClipboardList, Plus, Search, Trash2, X, CalendarDays, Users } from "lucide-react";

const STATUSES = ["Pending", "InProgress", "Completed"];
const initialForm = { title: "", description: "", assignee: "", dueDate: "" };
const API_URL = "https://task-sgtg.onrender.com";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/tasks`)
      if (!response.ok) throw new Error("Unable to load tasks.");
      setTasks(await response.json());
    } catch (err) {
      setError("Cannot connect to the backend. Make sure the server is running on port 5000.");
    } finally { setLoading(false); }
  }
  useEffect(() => { loadTasks(); }, []);

  const counts = useMemo(() => ({
    All: tasks.length,
    Pending: tasks.filter(t => t.status === "Pending").length,
    InProgress: tasks.filter(t => t.status === "InProgress").length,
    Completed: tasks.filter(t => t.status === "Completed").length
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesStatus = filter === "All" || task.status === filter;
    const text = `${task.title} ${task.description} ${task.assignee}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }), [tasks, filter, query]);

  async function addTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create task.");
      setTasks(current => [data, ...current]);
      setForm(initialForm);
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update task.");
      setTasks(current => current.map(task => task.id === id ? data : task));
    } catch (err) { setError(err.message); }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Could not delete task.");
      setTasks(current => current.filter(task => task.id !== id));
    } catch (err) { setError(err.message); }
  }

  const cards = [
    { label: "Total tasks", value: counts.All, icon: ClipboardList, tone: "violet", filter: "All" },
    { label: "Pending", value: counts.Pending, icon: CircleDashed, tone: "amber", filter: "Pending" },
    { label: "In progress", value: counts.InProgress, icon: Activity, tone: "blue", filter: "InProgress" },
    { label: "Completed", value: counts.Completed, icon: CheckCircle2, tone: "green", filter: "Completed" }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ClipboardList size={22}/></div><span>Project<span className="brand-light">Flow</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><ClipboardList size={18}/> Task overview</button>
      <div className="sidebar-bottom"><div className="profile-avatar">JD</div><div><strong>Jamie Davis</strong><small>Project manager</small></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><span className="eyebrow">WORKSPACE / OVERVIEW</span><h1>Task overview</h1><p className="subtitle">Keep your team moving in the right direction.</p></div>
        <button className="primary-btn" onClick={() => setShowForm(true)}><Plus size={18}/> Add new task</button>
      </header>

      {error && <div className="error-banner">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}

      <section className="stats-grid">
        {cards.map(({label,value,icon:Icon,tone,filter:cardFilter}) => <button key={label} className={`stat-card ${filter === cardFilter ? "selected" : ""}`} onClick={() => setFilter(cardFilter)}>
          <div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={19}/></span></div>
          <strong>{value.toString().padStart(2,"0")}</strong><small>{label === "Total tasks" ? "Across all projects" : "Tasks in this status"}</small>
        </button>)}
      </section>

      <section className="tasks-panel">
        <div className="panel-heading"><div><h2>All tasks</h2><p>Manage and track your team's work</p></div><span className="task-count">{visibleTasks.length} tasks</span></div>
        <div className="toolbar">
          <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks, descriptions, people..." /></div>
          <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option value="All">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s === "InProgress" ? "In progress" : s}</option>)}</select>
        </div>
        {loading ? <div className="empty-state">Loading tasks...</div> : visibleTasks.length === 0 ? <div className="empty-state"><ClipboardList size={30}/><strong>No tasks found</strong><span>Try another filter or add a new task.</span></div> :
          <div className="task-list">{visibleTasks.map(task => <article className="task-row" key={task.id}>
            <div className="task-main"><div className={`task-dot ${task.status}`}></div><div className="task-info"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta">{task.assignee && <span><Users size={13}/>{task.assignee}</span>}{task.dueDate && <span><CalendarDays size={13}/>{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span>}</div></div></div>
            <div className="task-actions"><span className={`status-pill ${task.status}`}>{task.status === "InProgress" ? "In progress" : task.status}</span><select className="status-select" value={task.status} onChange={e => updateStatus(task.id,e.target.value)} aria-label={`Change status for ${task.title}`}>{STATUSES.map(s => <option key={s} value={s}>{s === "InProgress" ? "In progress" : s}</option>)}</select><button className="icon-btn delete-btn" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={17}/></button></div>
          </article>)}</div>}
      </section>
      <footer>ProjectFlow <span>·</span> Simple project management for focused teams</footer>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setShowForm(false); }}><div className="modal">
      <div className="modal-head"><div><span className="eyebrow">TASK MANAGEMENT</span><h2>Create a task</h2><p>Add a new item to your team's workflow.</p></div><button className="icon-btn" onClick={() => setShowForm(false)} aria-label="Close"><X/></button></div>
      <form onSubmit={addTask} className="task-form">
        <label>Task title <b>*</b><input required autoFocus maxLength="100" placeholder="e.g. Prepare project proposal" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>Description<textarea rows="3" placeholder="Add a few details about this task..." value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></label>
        <div className="form-row"><label>Assignee<input placeholder="Name" value={form.assignee} onChange={e => setForm({...form,assignee:e.target.value})}/></label><label>Due date<input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})}/></label></div>
        <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? "Adding..." : <><Plus size={17}/> Add task</>}</button></div>
      </form>
    </div></div>}
  </div>;
}

export default App;
