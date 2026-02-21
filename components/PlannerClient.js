'use client';
// components/PlannerClient.js
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';

// ─── Utility functions ────────────────────────────────────────
function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const isToday   = ds => ds === isoDate();
const isOverdue = t => {
  if (t.done || !t.date) return false;
  return new Date(t.time ? `${t.date}T${t.time}` : `${t.date}T23:59`) < new Date();
};
const fmtDate = ds => ds
  ? new Date(ds + 'T00:00:00').toLocaleDateString('ru-RU', { day:'numeric', month:'short' })
  : '';
const priorityLabel = p => p===1?'Срочно':p===2?'Средний':'Низкий';

function countdown(t) {
  if (!t.date) return null;
  const diff = new Date(t.time ? `${t.date}T${t.time}` : `${t.date}T23:59`) - new Date();
  if (diff < 0) return { label:'Просрочено', cls:'overdue' };
  const hrs  = Math.floor(diff / 36e5);
  const mins = Math.floor((diff % 36e5) / 60e3);
  const days = Math.floor(hrs / 24);
  if (days > 7)  return { label:`${days}д`, cls:'ok' };
  if (days > 0)  return { label:`${days}д ${hrs%24}ч`, cls: days < 2 ? 'urgent' : 'soon' };
  if (hrs  > 0)  return { label:`${hrs}ч ${mins}м`, cls: hrs < 4 ? 'urgent' : 'soon' };
  return { label:`${mins}м`, cls:'urgent' };
}

// ─── Task Card ────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const cd = countdown(task);
  const ov = isOverdue(task);
  return (
    <div
      className={`task-card p${task.priority}${task.done?' done':''}${ov?' overdue':''}`}
      draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
    >
      <div className={`task-checkbox${task.done?' checked':''}`} onClick={() => onToggle(task.id)}>
        {task.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>}
      </div>
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className={`priority-badge p${task.priority}`}>{priorityLabel(task.priority)}</span>
          {task.date && <span className="task-meta-item">📅 {fmtDate(task.date)}{task.time ? ' ' + task.time.slice(0,5) : ''}</span>}
          {cd && <span className={`countdown ${cd.cls}`}>⏱ {cd.label}</span>}
        </div>
      </div>
      <div className="task-actions">
        <button className="task-action-btn"        onClick={() => onEdit(task)}>✏️</button>
        <button className="task-action-btn delete" onClick={() => onDelete(task.id)}>🗑️</button>
      </div>
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────
function TaskModal({ task, prefillDate, onClose, onSave }) {
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    date:        task?.date        || prefillDate || isoDate(),
    time:        task?.time?.slice(0,5) || '',
    priority:    task?.priority    || 2,
  });
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }));

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Введите название'); return; }
    setBusy(true);
    try {
      await onSave({ ...form, priority: parseInt(form.priority), date: form.date||null, time: form.time||null });
      onClose();
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{task ? 'Редактировать' : 'Новая задача'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div style={{color:'#ff8080',fontSize:13,marginBottom:4}}>⚠️ {err}</div>}
            <div className="form-group">
              <label className="form-label">Название</label>
              <input className="form-input" value={form.title} onChange={set('title')} placeholder="Что нужно сделать?" autoFocus/>
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea className="form-input" value={form.description} onChange={set('description')} rows={2} style={{resize:'vertical'}}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Дата</label>
                <input className="form-input" type="date" value={form.date} onChange={set('date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Время</label>
                <input className="form-input" type="time" value={form.time} onChange={set('time')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Приоритет</label>
              <div className="priority-select">
                {[1,2,3].map(p => (
                  <div key={p} className={`priority-option${form.priority==p?` selected-p${p}`:''}`} data-p={p} onClick={() => set('priority')(p)}>
                    {p===1?'🔴 Срочно':p===2?'🟡 Средний':'🟢 Низкий'}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy?'⏳...':'✓ Сохранить'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mobile Header ────────────────────────────────────────────
function MobileHeader({ view, user, onAdd, search, setSearch, calMode, setCalMode }) {
  const titles = { today: 'Сегодня', list: 'Задачи', calendar: 'Календарь' };
  return (
    <div className="mobile-header">
      <div className="mobile-header-top">
        <div className="mobile-logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#mlg)"/>
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <defs><linearGradient id="mlg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#7c6af7"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
          </svg>
          <span>Chronicle</span>
        </div>
        <div className="mobile-header-actions">
          {view === 'calendar' && (
            <div className="view-tabs">
              {['month','day'].map((m,i)=>(
                <button key={m} className={`view-tab${calMode===m?' active':''}`} onClick={()=>setCalMode(m)}>
                  {['Месяц','День'][i]}
                </button>
              ))}
            </div>
          )}
          <button className="btn-primary mobile-add-btn" onClick={onAdd}>+</button>
        </div>
      </div>
      {view === 'list' && (
        <div className="search-bar mobile-search">
          🔍<input placeholder="Поиск задач..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────
function BottomNav({ view, setView, setFilter }) {
  const items = [
    { id:'today',    icon:'🏠', label:'Сегодня' },
    { id:'list',     icon:'📋', label:'Задачи' },
    { id:'calendar', icon:'📅', label:'Календарь' },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button
          key={it.id}
          className={`bottom-nav-item${view===it.id?' active':''}`}
          onClick={() => { setView(it.id); setFilter(null); }}
        >
          <span className="bottom-nav-icon">{it.icon}</span>
          <span className="bottom-nav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Main Planner ─────────────────────────────────────────────
export default function PlannerClient({ user }) {
  const { tasks, loading, createTask, updateTask, toggleDone, deleteTask, moveTask } = useTasks();

  const [view,    setView]    = useState('today');
  const [calMode, setCalMode] = useState('month');
  const [calDate, setCalDate] = useState(new Date());
  const [filter,  setFilter]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const done     = tasks.filter(t => t.done).length;
  const overdue  = tasks.filter(t => isOverdue(t)).length;
  const todayCnt = tasks.filter(t => isToday(t.date) && !t.done).length;
  const pct      = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  async function handleSave(data) {
    if (modal?.task) { await updateTask(modal.task.id, data); showToast('Задача обновлена'); }
    else             { await createTask(data); showToast('Задача создана'); }
  }
  async function handleDelete(id) { await deleteTask(id); showToast('Удалено', 'error'); }
  async function handleDrop(e, ds) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    await moveTask(id, ds);
    showToast(`Перенесено на ${fmtDate(ds)}`);
  }

  function navCal(dir) {
    const d = new Date(calDate);
    if (calMode==='month') d.setMonth(d.getMonth()+dir);
    else                   d.setDate(d.getDate()+dir);
    setCalDate(d);
  }

  useEffect(() => {
    const h = e => { if ((e.metaKey||e.ctrlKey)&&e.key==='k') { e.preventDefault(); setModal({}); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  function card(t) {
    return <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={t => setModal({ task:t })} onDelete={handleDelete}/>;
  }

  function filtered() {
    let ts = [...tasks];
    if (filter) ts = ts.filter(t => t.priority === filter);
    if (search) ts = ts.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    return ts.sort((a,b) => {
      const ao=isOverdue(a), bo=isOverdue(b);
      if (ao&&!bo) return -1; if (!ao&&bo) return 1;
      if (a.done&&!b.done) return 1; if (!a.done&&b.done) return -1;
      if (a.date&&b.date) return a.date.localeCompare(b.date)||a.priority-b.priority;
      if (a.date) return -1; if (b.date) return 1;
      return a.priority-b.priority;
    });
  }

  function viewToday() {
    const today = isoDate();
    const todayT    = tasks.filter(t => t.date===today||((!t.date)&&!t.done)).sort((a,b)=>a.priority-b.priority);
    const overdueT  = tasks.filter(t => isOverdue(t)&&t.date!==today).sort((a,b)=>a.priority-b.priority);
    const upcomingT = tasks.filter(t => !t.done&&t.date&&t.date>today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
    return (
      <>
        {overdueT.length > 0 && (
          <div className="tasks-section">
            <div className="tasks-section-header">
              <div className="tasks-section-title" style={{color:'var(--p1)'}}>⚠️ Просрочено <span className="badge">{overdueT.length}</span></div>
            </div>
            {overdueT.map(card)}
          </div>
        )}
        <div className="tasks-section">
          <div className="tasks-section-header">
            <div className="tasks-section-title">
              Сегодня <span className="badge">{todayT.length}</span>
            </div>
            <button className="btn-ghost" style={{fontSize:12,padding:'5px 10px'}} onClick={()=>setModal({prefillDate:today})}>+ Добавить</button>
          </div>
          {todayT.length ? todayT.map(card) : <div className="empty-state"><p>Всё готово на сегодня! 🎉</p></div>}
        </div>
        {upcomingT.length > 0 && (
          <div className="tasks-section">
            <div className="tasks-section-header"><div className="tasks-section-title">Ближайшие <span className="badge">{upcomingT.length}</span></div></div>
            {upcomingT.map(card)}
          </div>
        )}
      </>
    );
  }

  function viewList() {
    const ts = filtered();
    const active = ts.filter(t => !t.done);
    const doneTs = ts.filter(t => t.done);
    return (
      <>
        <div className="filter-bar">
          {[null,1,2,3].map(p=>(
            <div key={p} className={`filter-chip${filter===p?' active':''}`} onClick={()=>setFilter(p)}>
              {p===null?'Все':p===1?'🔴 Срочно':p===2?'🟡 Средний':'🟢 Низкий'}
            </div>
          ))}
        </div>
        {!ts.length
          ? <div className="empty-state"><p>Задач не найдено</p></div>
          : <>
              {active.length>0 && <div className="tasks-section"><div className="tasks-section-header"><div className="tasks-section-title">Активные <span className="badge">{active.length}</span></div></div>{active.map(card)}</div>}
              {doneTs.length>0 && <div className="tasks-section"><div className="tasks-section-header"><div className="tasks-section-title" style={{color:'var(--text-dim)'}}>Завершённые <span className="badge">{doneTs.length}</span></div></div>{doneTs.map(card)}</div>}
            </>
        }
      </>
    );
  }

  function viewMonth() {
    const y=calDate.getFullYear(), m=calDate.getMonth();
    let start = new Date(y,m,1);
    start.setDate(start.getDate()-((start.getDay()+6)%7));
    const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const dayNames=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    const todayStr = isoDate();
    const cells=[];
    const cur=new Date(start);
    for(let i=0;i<42;i++){
      const ds=isoDate(cur);
      cells.push({ ds, d:cur.getDate(), other:cur.getMonth()!==m, tod:ds===todayStr, tasks:tasks.filter(t=>t.date===ds).slice(0,2) });
      cur.setDate(cur.getDate()+1);
    }
    return (
      <>
        <div className="calendar-header">
          <div className="cal-nav">
            <button onClick={()=>navCal(-1)}>◀</button>
            <div className="cal-title">{months[m]} {y}</div>
            <button onClick={()=>navCal(1)}>▶</button>
          </div>
          <button className="cal-today" onClick={()=>setCalDate(new Date())}>Сегодня</button>
        </div>
        <div className="month-grid">
          <div className="month-days-header">{dayNames.map(d=><div key={d} className="month-day-name">{d}</div>)}</div>
          <div className="month-body">
            {cells.map(c=>(
              <div key={c.ds}
                className={`month-cell${c.other?' other-month':''}${c.tod?' today':''}${c.tasks.length?' has-tasks':''}`}
                onClick={()=>{setCalDate(new Date(c.ds+'T00:00:00'));setCalMode('day');}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over');}}
                onDragLeave={e=>e.currentTarget.classList.remove('drag-over')}
                onDrop={e=>handleDrop(e,c.ds)}
              >
                <div className="cell-date">{c.d}</div>
                <div className="cell-tasks">
                  {c.tasks.map(t=>(
                    <div key={t.id} className={`cell-task-chip p${t.priority}${t.done?' done':''}`}
                      draggable onDragStart={e=>{e.stopPropagation();e.dataTransfer.setData('taskId',t.id);}}
                      title={t.title}>{t.title}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function viewDay() {
    const ds = isoDate(calDate);
    const label = calDate.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
    const dayTasks = tasks.filter(t=>t.date===ds).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||a.priority-b.priority);
    return (
      <>
        <div className="calendar-header">
          <div className="cal-nav">
            <button onClick={()=>navCal(-1)}>◀</button>
            <div className="cal-title" style={{fontSize:15}}>{label}</div>
            <button onClick={()=>navCal(1)}>▶</button>
          </div>
          <button className="cal-today" onClick={()=>setCalDate(new Date())}>Сегодня</button>
          <button className="btn-ghost" style={{marginLeft:'auto',fontSize:12}} onClick={()=>setModal({prefillDate:ds})}>+ Задача</button>
        </div>
        {dayTasks.length
          ? <div className="tasks-section">{dayTasks.map(card)}</div>
          : <div className="empty-state"><p>Нет задач. <span style={{color:'var(--accent2)',cursor:'pointer'}} onClick={()=>setModal({prefillDate:ds})}>Добавить?</span></p></div>
        }
      </>
    );
  }

  function renderContent() {
    if (loading) return <div className="empty-state"><p>⏳ Загрузка...</p></div>;
    if (view==='today')    return viewToday();
    if (view==='list')     return viewList();
    if (view==='calendar') return calMode==='month' ? viewMonth() : viewDay();
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {/* SIDEBAR — desktop only */}
        <aside className={`sidebar${sidebarOpen?' open':''}`}>
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#lg1)"/>
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <defs><linearGradient id="lg1" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#7c6af7"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
            </svg>
            Chronicle
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Обзор</div>
            {[
              { id:'today',    label:'Сегодня',    icon:'🏠' },
              { id:'list',     label:'Все задачи', icon:'📋' },
              { id:'calendar', label:'Календарь',  icon:'📅' },
            ].map(it=>(
              <div key={it.id} className={`nav-item${view===it.id?' active':''}`} onClick={()=>{setView(it.id);setFilter(null);setSidebarOpen(false);}}>
                <span>{it.icon}</span>{it.label}
              </div>
            ))}
            <div className="nav-section" style={{marginTop:8}}>Приоритеты</div>
            {[{p:1,l:'Срочные',c:'var(--p1)'},{p:2,l:'Средние',c:'var(--p2)'},{p:3,l:'Низкий',c:'var(--p3)'}].map(it=>(
              <div key={it.p} className={`nav-item${filter===it.p?' active':''}`} onClick={()=>{setView('list');setFilter(it.p);setSidebarOpen(false);}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:it.c,display:'inline-block'}}/>
                {it.l}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              {user.image
                ? <Image src={user.image} alt="avatar" width={32} height={32} className="user-avatar" style={{borderRadius:'50%',flexShrink:0}}/>
                : <div className="user-avatar-fallback">{(user.name||user.email||'U')[0].toUpperCase()}</div>
              }
              <div className="user-info">
                <div className="user-name">{user.name || 'Пользователь'}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <button className="logout-btn" onClick={()=>signOut({callbackUrl:'/auth'})} title="Выйти">↩</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="val">{tasks.length}</div><div className="lbl">Всего</div></div>
              <div className="stat-card"><div className="val">{done}</div><div className="lbl">Готово</div></div>
              <div className="stat-card"><div className="val" style={overdue>0?{color:'var(--p1)'}:{}}>{overdue}</div><div className="lbl">Просрочено</div></div>
              <div className="stat-card"><div className="val">{todayCnt}</div><div className="lbl">Сегодня</div></div>
            </div>
            <div className="progress-bar" style={{marginTop:12}}>
              <div className="progress-fill" style={{width:`${pct}%`}}/>
            </div>
            <div style={{fontSize:11,color:'var(--text-dim)',marginTop:5,textAlign:'center'}}>{pct}% завершено</div>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <div className="mobile-only">
          <MobileHeader
            view={view}
            user={user}
            onAdd={() => setModal({})}
            search={search}
            setSearch={setSearch}
            calMode={calMode}
            setCalMode={setCalMode}
          />
        </div>

        {/* MAIN */}
        <main className="main">
          {/* Desktop topbar */}
          <div className="topbar desktop-only">
            <h1>{view==='today'?'Сегодня':view==='list'?'Все задачи':'Календарь'}</h1>
            <div className="topbar-actions">
              {view==='list' && (
                <div className="search-bar">
                  🔍<input placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
              )}
              {view==='calendar' && (
                <div className="view-tabs">
                  {['month','day'].map((m,i)=>(
                    <button key={m} className={`view-tab${calMode===m?' active':''}`} onClick={()=>setCalMode(m)}>
                      {['Месяц','День'][i]}
                    </button>
                  ))}
                </div>
              )}
              <button className="btn-primary" onClick={()=>setModal({})}>+ Новая задача</button>
            </div>
          </div>

          <div className="content">{renderContent()}</div>
        </main>

        {/* BOTTOM NAV — mobile only */}
        <div className="mobile-only">
          <BottomNav view={view} setView={setView} setFilter={setFilter} />
        </div>
      </div>

      {modal && <TaskModal task={modal.task} prefillDate={modal.prefillDate} onClose={()=>setModal(null)} onSave={handleSave}/>}

      {toast && (
        <div className="toast" style={{borderColor: toast.type==='error'?'rgba(239,68,68,0.3)':'rgba(34,197,94,0.3)'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:toast.type==='error'?'var(--p1)':'var(--p3)',flexShrink:0}}/>
          {toast.msg}
        </div>
      )}
    </>
  );
}

const STYLES = `
:root{--bg:#0a0a0f;--surface:rgba(255,255,255,0.04);--surface2:rgba(255,255,255,0.07);--border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);--text:#f0eefc;--text-muted:#8a87a8;--text-dim:#4f4d66;--accent:#7c6af7;--accent2:#a78bfa;--accent-glow:rgba(124,106,247,0.25);--p1:#ef4444;--p2:#f97316;--p3:#22c55e;--p1-bg:rgba(239,68,68,0.12);--p2-bg:rgba(249,115,22,0.12);--p3-bg:rgba(34,197,94,0.12);--radius:12px;--radius-lg:20px;--shadow:0 8px 32px rgba(0,0,0,0.4);--font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;--transition:0.18s cubic-bezier(0.4,0,0.2,1);--bottom-nav-h:64px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6;min-height:100vh}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 50% at 20% 10%,rgba(124,106,247,0.12) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 90%,rgba(167,139,250,0.08) 0%,transparent 60%),var(--bg);pointer-events:none}
button{cursor:pointer;border:none;background:none;font:inherit;color:inherit}
input,textarea{font:inherit;color:inherit;background:transparent;border:none;outline:none;width:100%}

/* ── Layout ── */
.app{display:flex;height:100vh;overflow:hidden;flex-direction:column}
@media(min-width:769px){.app{flex-direction:row}}
.mobile-only{display:block}
.desktop-only{display:none}
@media(min-width:769px){.mobile-only{display:none}.desktop-only{display:flex}}

/* ── Sidebar (desktop) ── */
.sidebar{width:260px;flex-shrink:0;background:rgba(10,10,15,0.7);backdrop-filter:blur(24px);border-right:1px solid var(--border);display:none;flex-direction:column;padding:24px 0;z-index:10}
@media(min-width:769px){.sidebar{display:flex}}
.sidebar-logo{padding:0 24px 28px;font-family:var(--font-display);font-size:22px;font-weight:800;background:linear-gradient(135deg,var(--accent2),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:flex;align-items:center;gap:10px}
.sidebar-nav{flex:1;padding:0 12px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:var(--radius);font-size:14px;font-weight:500;color:var(--text-muted);transition:all var(--transition);cursor:pointer}
.nav-item:hover{background:var(--surface);color:var(--text)}
.nav-item.active{background:var(--accent-glow);color:var(--accent2);border:1px solid rgba(124,106,247,0.2)}
.nav-section{font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;padding:16px 14px 6px}
.sidebar-footer{padding:16px 24px 0;border-top:1px solid var(--border);margin-top:12px}
.user-card{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border)}
.user-avatar-fallback{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c6af7,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.user-info{flex:1;min-width:0}
.user-name{font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-email{font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.logout-btn{flex-shrink:0;padding:5px;border-radius:7px;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:14px;transition:all var(--transition)}
.logout-btn:hover{background:rgba(239,68,68,0.1);color:var(--p1);border-color:rgba(239,68,68,0.3)}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px}
.stat-card .val{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text)}
.stat-card .lbl{font-size:11px;color:var(--text-muted);margin-top:1px}
.progress-bar{height:4px;background:var(--surface);border-radius:2px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:2px;transition:width 0.5s}

/* ── Mobile Header ── */
.mobile-header{background:rgba(10,10,15,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:12px 16px;position:sticky;top:0;z-index:20}
.mobile-header-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mobile-logo{display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-size:16px;font-weight:800;background:linear-gradient(135deg,var(--accent2),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.mobile-header-actions{display:flex;align-items:center;gap:8px}
.mobile-add-btn{padding:8px 16px!important;font-size:18px!important;line-height:1;border-radius:10px!important}
.mobile-search{margin-top:10px}

/* ── Bottom Navigation ── */
.bottom-nav{position:fixed;bottom:0;left:0;right:0;height:var(--bottom-nav-h);background:rgba(10,10,15,0.95);backdrop-filter:blur(24px);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;z-index:20;padding-bottom:env(safe-area-inset-bottom)}
.bottom-nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 20px;border-radius:12px;color:var(--text-dim);transition:all var(--transition);flex:1}
.bottom-nav-item.active{color:var(--accent2)}
.bottom-nav-icon{font-size:20px;line-height:1}
.bottom-nav-label{font-size:10px;font-weight:600;letter-spacing:0.3px}
.bottom-nav-item.active .bottom-nav-icon{transform:translateY(-2px)}

/* ── Main ── */
.main{flex:1;overflow-y:auto;display:flex;flex-direction:column;padding-bottom:var(--bottom-nav-h)}
@media(min-width:769px){.main{padding-bottom:0}}
.main::-webkit-scrollbar{width:6px}
.main::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* ── Desktop Topbar ── */
.topbar{display:flex;align-items:center;gap:16px;padding:20px 32px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:5;background:rgba(10,10,15,0.85);backdrop-filter:blur(20px)}
.topbar h1{font-family:var(--font-display);font-size:20px;font-weight:700;flex:1}
.topbar-actions{display:flex;align-items:center;gap:10px}

/* ── Content ── */
.content{flex:1;padding:16px}
@media(min-width:769px){.content{padding:28px 32px}}

/* ── Buttons ── */
.view-tabs{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:3px;gap:2px}
.view-tab{padding:6px 14px;border-radius:8px;font-size:13px;font-weight:500;color:var(--text-muted);transition:all var(--transition)}
.view-tab.active{background:var(--accent-glow);color:var(--accent2);border:1px solid rgba(124,106,247,0.2)}
.btn-primary{display:flex;align-items:center;gap:8px;background:var(--accent);color:#fff;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;transition:all var(--transition);box-shadow:0 4px 16px rgba(124,106,247,0.3);white-space:nowrap}
.btn-primary:hover{background:var(--accent2);transform:translateY(-1px)}
.btn-primary:disabled{opacity:0.7;cursor:not-allowed;transform:none}
.btn-ghost{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:500;color:var(--text-muted);border:1px solid var(--border);transition:all var(--transition)}
.btn-ghost:hover{background:var(--surface);color:var(--text)}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 14px;font-size:13px;color:var(--text-muted);transition:all var(--transition)}
.search-bar:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
@media(min-width:769px){.search-bar{min-width:200px}}

/* ── Tasks ── */
.tasks-section{margin-bottom:24px}
.tasks-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.tasks-section-title{font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-muted);display:flex;align-items:center;gap:8px}
.badge{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:1px 8px;font-size:11px;color:var(--text-muted)}
.task-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;transition:all var(--transition);cursor:grab;position:relative;overflow:hidden;animation:fadeIn 0.2s ease}
.task-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px}
.task-card.p1::before{background:var(--p1)}.task-card.p2::before{background:var(--p2)}.task-card.p3::before{background:var(--p3)}
.task-card:hover{border-color:var(--border2);background:var(--surface2);box-shadow:var(--shadow)}
@media(min-width:769px){.task-card:hover{transform:translateX(2px)}}
.task-card.overdue{border-color:rgba(239,68,68,0.3)}
.task-card.done .task-title{text-decoration:line-through;color:var(--text-dim)}
.task-checkbox{width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all var(--transition);cursor:pointer;min-width:20px}
.task-checkbox.checked{background:var(--accent);border-color:var(--accent)}
.task-body{flex:1;min-width:0}
.task-title{font-size:14px;font-weight:500;margin-bottom:5px;line-height:1.4}
.task-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)}
.task-meta-item{display:flex;align-items:center;gap:4px}
.priority-badge{padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.priority-badge.p1{background:var(--p1-bg);color:var(--p1)}.priority-badge.p2{background:var(--p2-bg);color:var(--p2)}.priority-badge.p3{background:var(--p3-bg);color:var(--p3)}
.countdown{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;display:inline-flex;align-items:center;gap:4px}
.countdown.urgent{background:var(--p1-bg);color:var(--p1)}.countdown.soon{background:var(--p2-bg);color:var(--p2)}.countdown.ok{background:var(--p3-bg);color:var(--p3)}.countdown.overdue{background:rgba(239,68,68,0.2);color:#ff6b6b}
.task-actions{display:flex;align-items:center;gap:4px}
@media(min-width:769px){.task-actions{opacity:0;transition:opacity var(--transition)}.task-card:hover .task-actions{opacity:1}}
.task-action-btn{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:all var(--transition);font-size:14px}
.task-action-btn:hover{background:var(--surface2)}.task-action-btn.delete:hover{background:rgba(239,68,68,0.15);color:var(--p1)}

/* ── Modal ── */
.modal-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;padding:0}
@media(min-width:769px){.modal-overlay{align-items:center;padding:20px}}
.modal{background:#11111c;border:1px solid var(--border2);border-radius:var(--radius-lg) var(--radius-lg) 0 0;width:100%;max-width:100%;box-shadow:0 -10px 60px rgba(0,0,0,0.6);overflow:hidden;animation:modalInMobile 0.3s cubic-bezier(0.4,0,0.2,1);max-height:92vh;overflow-y:auto}
@media(min-width:769px){.modal{border-radius:var(--radius-lg);max-width:520px;max-height:none;animation:modalIn 0.25s cubic-bezier(0.4,0,0.2,1)}}
.modal-header{padding:20px 20px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
@media(min-width:769px){.modal-header{padding:22px 24px 0}}
.modal-title{font-family:var(--font-display);font-size:16px;font-weight:700}
.modal-close{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:all var(--transition)}
.modal-close:hover{background:var(--surface2);color:var(--text)}
.modal-body{padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px}
@media(min-width:769px){.modal-body{padding:16px 24px 24px}}
.modal-footer{padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end}
@media(min-width:769px){.modal-footer{padding:0 24px 24px}}
.form-group{display:flex;flex-direction:column;gap:6px}
.form-label{font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-muted)}
.form-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:14px;transition:all var(--transition);color:var(--text)}
.form-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.priority-select{display:flex;gap:8px}
.priority-option{flex:1;padding:8px 4px;border-radius:9px;border:1.5px solid var(--border);text-align:center;font-size:12px;font-weight:600;cursor:pointer;transition:all var(--transition);color:var(--text-muted)}
.priority-option.selected-p1{border-color:var(--p1);background:var(--p1-bg);color:var(--p1)}
.priority-option.selected-p2{border-color:var(--p2);background:var(--p2-bg);color:var(--p2)}
.priority-option.selected-p3{border-color:var(--p3);background:var(--p3-bg);color:var(--p3)}

/* ── Filter ── */
.filter-bar{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.filter-chip{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--border);color:var(--text-muted);transition:all var(--transition);cursor:pointer;white-space:nowrap}
.filter-chip:hover{border-color:var(--border2);color:var(--text)}.filter-chip.active{background:var(--accent-glow);border-color:var(--accent);color:var(--accent2)}
.empty-state{text-align:center;padding:60px 20px;color:var(--text-dim);font-size:14px}

/* ── Calendar ── */
.calendar-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.cal-nav{display:flex;align-items:center;gap:6px}
.cal-nav button{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);transition:all var(--transition)}
.cal-nav button:hover{background:var(--surface2);color:var(--text)}
.cal-title{font-family:var(--font-display);font-size:15px;font-weight:700;min-width:0}
@media(min-width:769px){.cal-title{font-size:18px;min-width:200px}}
.cal-today{font-size:12px;font-weight:600;padding:5px 12px;border-radius:7px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);transition:all var(--transition)}
.cal-today:hover{background:var(--surface2);color:var(--text)}
.month-grid{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
.month-days-header{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border)}
.month-day-name{padding:8px 4px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim)}
@media(min-width:769px){.month-day-name{padding:12px 8px;font-size:11px}}
.month-body{display:grid;grid-template-columns:repeat(7,1fr)}
.month-cell{min-height:52px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:5px 4px;cursor:pointer;transition:background var(--transition);position:relative}
@media(min-width:769px){.month-cell{min-height:110px;padding:8px}}
.month-cell:nth-child(7n){border-right:none}
.month-cell:hover{background:var(--surface2)}
.month-cell.other-month .cell-date{color:var(--text-dim)}
.month-cell.today .cell-date{background:var(--accent);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
@media(min-width:769px){.month-cell.today .cell-date{width:26px;height:26px}}
.cell-date{font-size:12px;font-weight:600;width:24px;height:24px;display:flex;align-items:center;justify-content:center;margin-bottom:2px;border-radius:50%}
@media(min-width:769px){.cell-date{font-size:13px;width:26px;height:26px;margin-bottom:4px}}
.cell-tasks{display:flex;flex-direction:column;gap:2px}
.cell-task-chip{font-size:9px;font-weight:500;padding:2px 4px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:grab;display:none}
@media(min-width:480px){.cell-task-chip{display:block}}
.cell-task-chip.p1{background:var(--p1-bg);color:var(--p1)}.cell-task-chip.p2{background:var(--p2-bg);color:var(--p2)}.cell-task-chip.p3{background:var(--p3-bg);color:var(--p3)}
.cell-task-chip.done{opacity:0.4;text-decoration:line-through}
.month-cell.has-tasks::after{content:'';position:absolute;bottom:4px;right:4px;width:5px;height:5px;border-radius:50%;background:var(--accent);opacity:0.7}
@media(min-width:480px){.month-cell.has-tasks::after{display:none}}
.month-cell.drag-over{background:rgba(124,106,247,0.1);outline:1px dashed var(--accent)}

/* ── Toast ── */
.toast{position:fixed;bottom:calc(var(--bottom-nav-h) + 12px);left:50%;transform:translateX(-50%);z-index:200;background:#1a1a2e;border:1px solid;border-radius:12px;padding:12px 18px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:toastIn 0.3s ease;color:var(--text);font-family:var(--font-body);white-space:nowrap}
@media(min-width:769px){.toast{bottom:24px;left:auto;right:24px;transform:none}}

/* ── Animations ── */
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes modalInMobile{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@media(min-width:769px){@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}}
`;
