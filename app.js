const API = 'https://jsonplaceholder.typicode.com/todos?userId=1';
let tasks = [];
let filter = 'all';
let nextId = 1000;

// ── GET: Cargar tareas desde la API ──
async function loadTasks() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const data = await res.json();
    tasks = data.slice(0, 15); // mostramos 15 para no saturar
    render();
  } catch (err) {
    showError('No se pudieron cargar las tareas: ' + err.message);
    render();
  }
}

// ── POST: Agregar nueva tarea ──
async function addTask() {
  const input = document.getElementById('newTask');
  const title = input.value.trim();
  if (!title) { toast('✍️ Escribe una tarea primero'); return; }

  input.disabled = true;
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, completed: false, userId: 1 })
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const newTask = await res.json();
    // JSONPlaceholder siempre devuelve id:201, usamos uno local único
    newTask.id = ++nextId;
    tasks.unshift(newTask);
    input.value = '';
    render();
    toast('✅ Tarea agregada');
  } catch (err) {
    showError('No se pudo agregar la tarea: ' + err.message);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ── PUT: Alternar estado completado/pendiente ──
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const prev = task.completed;
  task.completed = !prev;
  render();
  try {
    await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, completed: task.completed })
    });
    toast(task.completed ? '🎉 ¡Tarea completada!' : '↩️ Marcada como pendiente');
  } catch {
    task.completed = prev; // revertir si falla
    render();
    showError('No se pudo actualizar la tarea.');
  }
}

// ── DELETE: Eliminar tarea ──
async function deleteTask(id) {
  const prev = [...tasks];
  tasks = tasks.filter(t => t.id !== id);
  render();
  try {
    await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      method: 'DELETE'
    });
    toast('🗑️ Tarea eliminada');
  } catch {
    tasks = prev; // revertir si falla
    render();
    showError('No se pudo eliminar la tarea.');
  }
}

// ── Cambiar filtro activo ──
function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

// ── Renderizar la lista de tareas ──
function render() {
  const list = document.getElementById('taskList');
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;

  // Actualizar estadísticas
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = total - done;

  // Filtrar tareas según pestaña activa
  let visible = tasks;
  if (filter === 'done')    visible = tasks.filter(t => t.completed);
  if (filter === 'pending') visible = tasks.filter(t => !t.completed);

  // Estado vacío
  if (!visible.length) {
    list.innerHTML = `
      <div class="empty">
        <div class="icon">${filter === 'done' ? '🎉' : '📭'}</div>
        ${filter === 'done' ? 'No hay tareas completadas aún.' : 'No hay tareas aquí.'}
      </div>`;
    return;
  }

  // Generar tarjetas
  list.innerHTML = visible.map(t => `
    <div class="task-card ${t.completed ? 'done' : 'pending'}">
      <div class="card-top">
        <div class="card-body">
          <div class="status-badge">
            <span class="dot"></span>
            ${t.completed ? 'Completada' : 'Pendiente'}
          </div>
          <div class="task-title">${escHtml(t.title)}</div>
        </div>
      </div>
      <div class="card-bottom">
        <span class="task-id">TAREA #${t.id}</span>
        <div class="card-actions">
          <button class="btn-toggle" onclick="toggleTask(${t.id})" title="${t.completed ? 'Marcar pendiente' : 'Completar'}">
            ${t.completed
              ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                   <polyline points="9,14 12,17 22,7"/>
                   <path d="M21,12v7a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V5a2,2,0,0,1,2-2h11"/>
                 </svg>`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                   <polyline points="20,6 9,17 4,12"/>
                 </svg>`
            }
          </button>
          <button class="btn-delete" onclick="deleteTask(${t.id})" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6l-1,14H6L5,6"/>
              <path d="M10,11v6M14,11v6"/>
              <path d="M9,6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Utilidades ──
function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Inicialización ──
document.getElementById('newTask').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

loadTasks();