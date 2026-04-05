'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════════
//  THEMES
// ═══════════════════════════════════════════════════════════════════
const THEMES = {
  void: {
    name: 'Void',
    emoji: '🌑',
    bg: '#070708',
    bgGrad: 'radial-gradient(ellipse 80% 60% at 20% 40%, #0f0f18 0%, #070708 60%)',
    card: 'rgba(255,255,255,0.025)',
    cardHover: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.06)',
    cardBorderHover: 'rgba(245,75,100,0.4)',
    primary: '#F54B64',
    primaryEnd: '#F78361',
    primaryRgb: '245,75,100',
    text: '#FFFFFF',
    textMuted: '#555',
    textSub: '#999',
    accent: '#F54B64',
    glow: 'rgba(245,75,100,0.25)',
    surface: 'rgba(255,255,255,0.04)',
    sidebar: 'rgba(0,0,0,0.4)',
    inputBg: 'rgba(255,255,255,0.04)',
    overlay: 'rgba(0,0,0,0.85)',
    danger: '#FF4466',
    success: '#00E887',
  },
  meaCulpa: {
    name: 'Mea Culpa',
    emoji: '🕯️',
    bg: '#08030a',
    bgGrad: 'radial-gradient(ellipse 80% 70% at 50% 30%, #180510 0%, #08030a 70%)',
    card: 'rgba(140,10,50,0.06)',
    cardHover: 'rgba(140,10,50,0.12)',
    cardBorder: 'rgba(160,20,60,0.12)',
    cardBorderHover: 'rgba(200,30,80,0.5)',
    primary: '#C8143C',
    primaryEnd: '#8B0000',
    primaryRgb: '200,20,60',
    text: '#F5E0E8',
    textMuted: '#6a3040',
    textSub: '#a06070',
    accent: '#C8143C',
    glow: 'rgba(200,20,60,0.3)',
    surface: 'rgba(140,10,50,0.08)',
    sidebar: 'rgba(8,3,10,0.7)',
    inputBg: 'rgba(140,10,50,0.07)',
    overlay: 'rgba(4,0,6,0.9)',
    danger: '#FF2244',
    success: '#00CC77',
  },
  nebula: {
    name: 'Nebula',
    emoji: '🌌',
    bg: '#03040e',
    bgGrad: 'radial-gradient(ellipse 90% 60% at 70% 20%, #0a0620 0%, #03040e 65%)',
    card: 'rgba(100,80,220,0.05)',
    cardHover: 'rgba(100,80,220,0.1)',
    cardBorder: 'rgba(120,100,240,0.1)',
    cardBorderHover: 'rgba(150,120,255,0.45)',
    primary: '#8B5CF6',
    primaryEnd: '#6366F1',
    primaryRgb: '139,92,246',
    text: '#EDE9FF',
    textMuted: '#4a4570',
    textSub: '#8885AA',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.28)',
    surface: 'rgba(100,80,220,0.06)',
    sidebar: 'rgba(3,4,14,0.7)',
    inputBg: 'rgba(100,80,220,0.06)',
    overlay: 'rgba(2,2,10,0.9)',
    danger: '#FF4488',
    success: '#34EEA0',
  },
  sakura: {
    name: 'Sakura',
    emoji: '🌸',
    bg: '#07040a',
    bgGrad: 'radial-gradient(ellipse 80% 60% at 40% 60%, #150812 0%, #07040a 65%)',
    card: 'rgba(255,100,160,0.04)',
    cardHover: 'rgba(255,100,160,0.09)',
    cardBorder: 'rgba(255,130,180,0.1)',
    cardBorderHover: 'rgba(255,150,200,0.45)',
    primary: '#FF6B9D',
    primaryEnd: '#FF4488',
    primaryRgb: '255,107,157',
    text: '#FFE8F5',
    textMuted: '#7a3055',
    textSub: '#BB8899',
    accent: '#FF6B9D',
    glow: 'rgba(255,107,157,0.25)',
    surface: 'rgba(255,100,160,0.05)',
    sidebar: 'rgba(7,4,10,0.7)',
    inputBg: 'rgba(255,100,160,0.05)',
    overlay: 'rgba(5,2,7,0.9)',
    danger: '#FF3366',
    success: '#00F0A0',
  },
}

// ═══════════════════════════════════════════════════════════════════
//  RANK / XP SYSTEM (Solo Leveling)
// ═══════════════════════════════════════════════════════════════════
const RANKS = [
  { rank: 'E', min: 0,    max: 100,  color: '#777',    glow: '#444',    label: 'Novice Hunter' },
  { rank: 'D', min: 100,  max: 300,  color: '#5CB85C', glow: '#2d7a30', label: 'Iron Will' },
  { rank: 'C', min: 300,  max: 600,  color: '#5BC0DE', glow: '#1a7fa0', label: 'Steel Mind' },
  { rank: 'B', min: 600,  max: 1000, color: '#9F5CE8', glow: '#6c35b0', label: 'Shadow Walker' },
  { rank: 'A', min: 1000, max: 1500, color: '#F0A30A', glow: '#b07000', label: 'Raid Commander' },
  { rank: 'S', min: 1500, max: 2200, color: '#E63946', glow: '#900020', label: 'Monarch' },
  { rank: 'SS',min: 2200, max: 3000, color: '#FFD700', glow: '#CC8800', label: 'Shadow Sovereign' },
  { rank: 'SSS',min:3000, max: Infinity, color: '#E040FB', glow: '#9900CC', label: 'Sung Jin-Woo' },
]

function getRank(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

function getXP(priority) {
  return { high: 50, medium: 25, low: 10 }[priority] || 15
}

function xpToNextRank(xp) {
  const rank = getRank(xp)
  if (rank.max === Infinity) return { progress: 100, needed: 0 }
  const progress = ((xp - rank.min) / (rank.max - rank.min)) * 100
  return { progress: Math.min(progress, 100), needed: rank.max - xp }
}

// ═══════════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════════
const PRIORITY_CONFIG = {
  high:   { label: 'Высокий', color: '#FF4466', icon: '🔴', xp: 50 },
  medium: { label: 'Средний', color: '#F0A30A', icon: '🟡', xp: 25 },
  low:    { label: 'Низкий',  color: '#5CB85C', icon: '🟢', xp: 10 },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDaysLeft(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  const due = new Date(dateStr)
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  return diff
}

function getDaysLeftLabel(days) {
  if (days === null) return ''
  if (days < 0) return `просрочено на ${Math.abs(days)}д`
  if (days === 0) return 'сегодня!'
  if (days === 1) return 'завтра'
  return `через ${days}д`
}

function getDaysColor(days, t) {
  if (days === null) return t.textMuted
  if (days < 0) return t.danger
  if (days <= 1) return '#FF6644'
  if (days <= 3) return '#F0A30A'
  return t.success
}

// ═══════════════════════════════════════════════════════════════════
//  DEFAULT FOLDERS
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_FOLDERS = [
  { id: 'all',     name: 'Все задачи',  emoji: '🌐', color: '#777' },
  { id: 'today',   name: 'Сегодня',     emoji: '⚡', color: '#F0A30A' },
  { id: 'urgent',  name: 'Срочные',     emoji: '🔥', color: '#FF4466' },
]

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function PlannerClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [themeKey, setThemeKey] = useState('void')
  const t = THEMES[themeKey]

  // XP / Rank
  const [xp, setXp] = useState(0)
  const [levelUpData, setLevelUpData] = useState(null)
  const [floatingXP, setFloatingXP] = useState([])

  // Navigation
  const [activeFolder, setActiveFolder] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Create task form
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', due_date: '', priority: 'medium', folder_id: '' })
  const [formError, setFormError] = useState('')

  // Create folder form
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [folderForm, setFolderForm] = useState({ name: '', emoji: '📁', color: '#8B5CF6' })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // TG connect
  const [showTgPanel, setShowTgPanel] = useState(false)
  const [tgChatId, setTgChatId] = useState('')
  const [tgSaved, setTgSaved] = useState(false)

  // Theme panel
  const [showThemePanel, setShowThemePanel] = useState(false)

  // Settings panel
  const [showSettings, setShowSettings] = useState(false)

  // Particle refs
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem('chronicle_theme') || 'void'
    const savedXP = parseInt(localStorage.getItem('chronicle_xp') || '0')
    const savedTg = localStorage.getItem('chronicle_tg_chat_id') || ''
    if (THEMES[savedTheme]) setThemeKey(savedTheme)
    setXp(savedXP)
    setTgChatId(savedTg)
    loadData()
  }, [])

  useEffect(() => {
    applyTheme(t)
  }, [t])

  function applyTheme(theme) {
    const root = document.documentElement
    root.style.setProperty('--bg', theme.bg)
    root.style.setProperty('--bg-grad', theme.bgGrad)
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--primary-end', theme.primaryEnd)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--text-muted', theme.textMuted)
    root.style.setProperty('--glow', theme.glow)
  }

  // ── Star field canvas ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const count = 120
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      alpha: Math.random() * 0.6 + 0.1,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const primary = t.primary
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${hexToRgb(primary)},${p.alpha})`
        ctx.fill()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [t.primary])

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    return `${r},${g},${b}`
  }

  // ── Data Loading ────────────────────────────────────────────────
  async function loadData() {
    setLoading(true)
    try {
      const [tasksRes, foldersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/folders'),
      ])
      const tasksData = await tasksRes.json()
      const foldersData = await foldersRes.json()
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setFolders(Array.isArray(foldersData) ? foldersData : [])

      localStorage.setItem('chronicle_tasks_cache', JSON.stringify(tasksData))
      localStorage.setItem('chronicle_folders_cache', JSON.stringify(foldersData))
    } catch (err) {
      const cachedTasks = localStorage.getItem('chronicle_tasks_cache')
      const cachedFolders = localStorage.getItem('chronicle_folders_cache')
      if (cachedTasks) setTasks(JSON.parse(cachedTasks))
      if (cachedFolders) setFolders(JSON.parse(cachedFolders))
    }
    setLoading(false)
  }

  // ── Task CRUD ───────────────────────────────────────────────────
  async function createTask(e) {
    e.preventDefault()

    if (!formData.title.trim()) {
      setFormError('Введи название задания')
      return
    }
    setFormError('')

    // БАГ #1 ИСПРАВЛЕН: используем folder_id из формы, а не activeFolder
    // Если в форме выбрана папка — берём её.
    // Если не выбрана — пробуем взять activeFolder (только если это реальная папка, не системная).
    const SYSTEM_FOLDERS = ['all', 'today', 'urgent']
    const folderIdFromForm = formData.folder_id ? String(formData.folder_id) : null
    const folderIdFromNav = !SYSTEM_FOLDERS.includes(activeFolder) ? String(activeFolder) : null
    const finalFolderId = folderIdFromForm || folderIdFromNav || null

    const newTask = {
      title: formData.title.trim(),
      due_date: formData.due_date || null,
      priority: formData.priority,
      folder_id: finalFolderId,
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        // Сервер возвращает { error: '...' }, а не { message: '...' }
        setFormError(errorData.error || errorData.message || `Ошибка сервера: ${res.status}`)
        return
      }

      const created = await res.json()
      const updated = [created, ...tasks]
      setTasks(updated)
      localStorage.setItem('chronicle_tasks_cache', JSON.stringify(updated))

      setFormData({ title: '', due_date: '', priority: 'medium', folder_id: '' })
      setShowForm(false)

    } catch (err) {
      setFormError('Ошибка соединения с сервером')
      console.error('Create task error:', err)
    }
  }

  async function toggleTask(task) {
    const wasCompleted = task.completed
    const updated = tasks.map(tk => tk.id === task.id ? { ...tk, completed: !tk.completed } : tk)
    setTasks(updated)
    localStorage.setItem('chronicle_tasks_cache', JSON.stringify(updated))

    if (!wasCompleted) {
      const earned = getXP(task.priority)
      const oldXp = xp
      const newXp = xp + earned
      const oldRank = getRank(oldXp)
      const newRank = getRank(newXp)
      setXp(newXp)
      localStorage.setItem('chronicle_xp', String(newXp))

      const id = Date.now()
      setFloatingXP(prev => [...prev, { id, xp: earned }])
      setTimeout(() => setFloatingXP(prev => prev.filter(x => x.id !== id)), 2000)

      if (oldRank.rank !== newRank.rank) {
        setLevelUpData(newRank)
        setTimeout(() => setLevelUpData(null), 4000)
      }
    } else {
      const lost = getXP(task.priority)
      const newXp = Math.max(0, xp - lost)
      setXp(newXp)
      localStorage.setItem('chronicle_xp', String(newXp))
    }

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !wasCompleted }),
      })
    } catch {
      setTasks(tasks)
    }
  }

  async function deleteTask(id) {
    const updated = tasks.filter(tk => tk.id !== id)
    setTasks(updated)
    localStorage.setItem('chronicle_tasks_cache', JSON.stringify(updated))
    setDeleteConfirm(null)
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    } catch {}
  }

  // ── Folder CRUD ─────────────────────────────────────────────────
  async function createFolder(e) {
    e.preventDefault()
    if (!folderForm.name.trim()) return

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderForm),
      })

      // БАГ #2 ИСПРАВЛЕН: проверяем res.ok перед тем как читать данные
      if (!res.ok) {
        console.error('Create folder error:', res.status)
        return
      }

      const created = await res.json()

      // Доп. защита: проверяем что пришёл объект с id
      if (!created || !created.id) {
        console.error('Create folder: invalid response', created)
        return
      }

      const updated = [...folders, created]
      setFolders(updated)
      localStorage.setItem('chronicle_folders_cache', JSON.stringify(updated))
      setFolderForm({ name: '', emoji: '📁', color: '#8B5CF6' })
      setShowFolderForm(false)
    } catch (err) {
      console.error('Create folder exception:', err)
    }
  }

  async function deleteFolder(id) {
    const updated = folders.filter(f => f.id !== id)
    setFolders(updated)
    if (activeFolder === String(id)) setActiveFolder('all')
    try {
      await fetch(`/api/folders/${id}`, { method: 'DELETE' })
    } catch {}
  }

  // ── TG Connect ──────────────────────────────────────────────────
  async function saveTgChatId() {
    localStorage.setItem('chronicle_tg_chat_id', tgChatId)
    try {
      await fetch('/api/tg-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: tgChatId }),
      })
    } catch {}
    setTgSaved(true)
    setTimeout(() => setTgSaved(false), 2000)
  }

  async function handleSignOut() {
    try {
      await signOut({ redirect: false })
    } finally {
      router.replace('/auth')
      router.refresh()
    }
  }

  // ── Debug ───────────────────────────────────────────────────────
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  async function runDebug() {
    const results = {}
    results.clientSession = session
      ? `✅ есть (id: ${session.user?.id || '❌ НЕТ ID — auth.js не исправлен!'})`
      : '❌ нет сессии на клиенте'

    try {
      const r = await fetch('/api/tasks')
      const body = await r.text()
      results.getTasks = `${r.status} ${r.statusText}`
      if (!r.ok) results.getTasksBody = body.slice(0, 300)
    } catch(e) { results.getTasks = `fetch error: ${e.message}` }

    try {
      const r = await fetch('/api/folders')
      const body = await r.text()
      results.getFolders = `${r.status} ${r.statusText}`
      if (!r.ok) results.getFoldersBody = body.slice(0, 300)
    } catch(e) { results.getFolders = `fetch error: ${e.message}` }

    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '__debug__', priority: 'low' }),
      })
      const body = await r.text()
      results.postTask = `${r.status} ${r.statusText}`
      results.postTaskBody = body.slice(0, 300)
      if (r.ok) {
        try {
          const c = JSON.parse(body)
          if (c?.id) {
            await fetch(`/api/tasks/${c.id}`, { method: 'DELETE' })
            results.postTask += ' (тест удалён)'
          }
        } catch {}
      }
    } catch(e) { results.postTask = `fetch error: ${e.message}` }

    setDebugInfo(results)
    setShowDebug(true)
  }

  // ── Filtered tasks ──────────────────────────────────────────────
  const filteredTasks = tasks.filter(task => {
    if (activeFolder === 'urgent') {
      const days = getDaysLeft(task.due_date)
      return days !== null && days <= 1 && !task.completed
    }
    if (activeFolder === 'today') {
      const days = getDaysLeft(task.due_date)
      return days === 0
    }
    if (activeFolder === 'all') return true
    return String(task.folder_id) === String(activeFolder)
  })

  const completedCount = tasks.filter(tk => tk.completed).length
  const totalCount = tasks.length
  const rankInfo = getRank(xp)
  const { progress: xpProgress, needed: xpNeeded } = xpToNextRank(xp)
  const allFolders = [...DEFAULT_FOLDERS, ...folders]

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* Global styles */}
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap);

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: var(--bg, #070708);
          color: var(--text, #fff);
          font-family: 'DM Sans', sans-serif;
          min-height: 100%;
          overflow-x: hidden;
        }

        :root {
          --bg: #070708;
          --primary: #F54B64;
          --primary-end: #F78361;
          --text: #fff;
          --text-muted: #555;
          --glow: rgba(245,75,100,0.25);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatXP {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
        @keyframes levelUp {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
          20%  { opacity: 1; transform: translate(-50%,-50%) scale(1.05); }
          80%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(0.9); }
        }
        @keyframes rankGlow {
          0%, 100% { text-shadow: 0 0 20px currentColor; }
          50%       { text-shadow: 0 0 60px currentColor, 0 0 100px currentColor; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }

        .task-card { animation: fadeUp 0.35s ease forwards; }
        .task-card:hover { transform: translateY(-2px); }
        .folder-item { animation: fadeUp 0.25s ease forwards; }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile-overlay { display: none !important; }
          .sidebar-desktop { display: flex !important; }
          .mobile-sidebar-btn { display: none !important; }
        }

        .app-root {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }

        input, select, button { font-family: 'DM Sans', sans-serif; }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary), var(--primary-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          /* БАГ #4 ИСПРАВЛЕН: fallback цвет для браузеров без поддержки */
          color: var(--primary);
        }

        .shimmer-btn {
          background: linear-gradient(90deg,
            var(--primary) 0%,
            var(--primary-end) 40%,
            #fff8 50%,
            var(--primary-end) 60%,
            var(--primary) 100%);
          background-size: 200% auto;
        }
        .shimmer-btn:hover { animation: shimmer 1.5s linear infinite; }

        .xp-bar-fill { transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); }

        .delete-confirm-card { animation: shake 0.4s ease; }

        .task-complete-line {
          text-decoration-thickness: 1px;
          text-decoration-color: rgba(255,255,255,0.3);
        }

        /* БАГ #4 ИСПРАВЛЕН: Chronicle логотип — явный градиент без потери текста */
        .logo-text {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--primary), var(--primary-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: var(--primary);
          display: inline-block;
        }

        /* Кнопки сайдбара — hover эффект */
        .sidebar-action-btn:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>

      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
          opacity: 0.4,
        }}
      />

      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0,
        background: t.bgGrad,
        zIndex: 0,
      }} />

      {/* ── LEVEL UP MODAL ── */}
      {levelUpData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: t.overlay,
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '48px 64px',
            textAlign: 'center',
            border: `2px solid ${levelUpData.color}44`,
            boxShadow: `0 0 80px ${levelUpData.glow}`,
            animation: 'levelUp 4s ease forwards',
          }}>
            <div style={{ fontSize: 14, color: t.textSub, letterSpacing: '0.3em', marginBottom: 12, fontFamily: 'Cinzel, serif' }}>
              РАНГ ПОВЫШЕН
            </div>
            <div style={{
              fontSize: 96,
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              color: levelUpData.color,
              animation: 'rankGlow 1s ease-in-out infinite',
              lineHeight: 1,
            }}>
              {levelUpData.rank}
            </div>
            <div style={{ fontSize: 20, color: t.text, marginTop: 16, fontFamily: 'Cinzel, serif' }}>
              {levelUpData.label}
            </div>
            {[1,2,3].map(i => (
              <div key={i} style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 200, height: 200,
                borderRadius: '50%',
                border: `2px solid ${levelUpData.color}`,
                transform: 'translate(-50%,-50%)',
                animation: `pulseRing ${0.8 + i * 0.4}s ease-out ${i * 0.2}s infinite`,
                pointerEvents: 'none',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── FLOATING XP ── */}
      {floatingXP.map(item => (
        <div key={item.id} style={{
          position: 'fixed',
          bottom: 120,
          right: 32,
          zIndex: 500,
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 22,
          color: t.primary,
          textShadow: `0 0 20px ${t.glow}`,
          animation: 'floatXP 2s ease forwards',
          pointerEvents: 'none',
        }}>
          +{item.xp} XP
        </div>
      ))}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: t.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
          padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} className="delete-confirm-card" style={{
            background: t.card,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.danger}44`,
            borderRadius: 20,
            padding: '32px 40px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: `0 0 60px ${t.danger}22`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: t.text, marginBottom: 8 }}>
              Удалить задание?
            </div>
            <div style={{ color: t.textSub, fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
              «{deleteConfirm.title}» будет удалено навсегда.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                background: t.surface,
                border: `1px solid ${t.cardBorder}`,
                color: t.textSub,
                borderRadius: 12,
                padding: '10px 24px',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}>
                Отмена
              </button>
              <button onClick={() => deleteTask(deleteConfirm.id)} style={{
                background: `linear-gradient(135deg, ${t.danger}, #AA1133)`,
                border: 'none',
                color: '#fff',
                borderRadius: 12,
                padding: '10px 24px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: `0 4px 20px ${t.danger}44`,
                transition: 'all 0.2s',
              }}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME PANEL ── */}
      {showThemePanel && (
        <div onClick={() => setShowThemePanel(false)} style={{
          position: 'fixed', inset: 0, zIndex: 700,
          background: t.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
          padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.card,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 24,
            padding: 32,
            maxWidth: 480,
            width: '100%',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: t.text, marginBottom: 24, textAlign: 'center' }}>
              Выбери тему
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries(THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => {
                  setThemeKey(key)
                  localStorage.setItem('chronicle_theme', key)
                  setShowThemePanel(false)
                }} style={{
                  background: theme.bg,
                  border: `2px solid ${themeKey === key ? theme.primary : theme.cardBorder}`,
                  borderRadius: 16,
                  padding: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: themeKey === key ? `0 0 24px ${theme.glow}` : 'none',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{theme.emoji}</div>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{theme.name}</div>
                  <div style={{
                    height: 4, borderRadius: 4, marginTop: 10,
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryEnd})`,
                  }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TG CONNECT PANEL ── */}
      {showTgPanel && (
        <div onClick={() => setShowTgPanel(false)} style={{
          position: 'fixed', inset: 0, zIndex: 700,
          background: t.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
          padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.card,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 24,
            padding: 32,
            maxWidth: 480,
            width: '100%',
          }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📬</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: t.text, marginBottom: 8, textAlign: 'center' }}>
              Telegram уведомления
            </div>
            <div style={{ color: t.textSub, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Получай уведомления за 1 день и за 1 час до дедлайна.<br/>
              Найди свой Chat ID через @userinfobot в Telegram.
            </div>
            <div style={{ marginBottom: 8, color: t.textSub, fontSize: 13 }}>Твой Telegram Chat ID:</div>
            <input
              value={tgChatId}
              onChange={e => setTgChatId(e.target.value)}
              placeholder="Например: 123456789"
              style={{
                width: '100%',
                background: t.inputBg,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 12,
                padding: '12px 16px',
                color: t.text,
                fontSize: 15,
                outline: 'none',
                marginBottom: 16,
              }}
            />
            <button onClick={saveTgChatId} style={{
              width: '100%',
              background: `linear-gradient(135deg, ${t.primary}, ${t.primaryEnd})`,
              border: 'none',
              color: '#fff',
              borderRadius: 12,
              padding: '13px 0',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: `0 4px 24px ${t.glow}`,
            }}>
              {tgSaved ? '✅ Сохранено!' : 'Сохранить'}
            </button>
            <div style={{ marginTop: 16, color: t.textMuted, fontSize: 12, textAlign: 'center' }}>
              Также убедись что TELEGRAM_BOT_TOKEN добавлен в .env
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div onClick={e => e.stopPropagation()}>
            <Sidebar
              t={t} allFolders={allFolders} activeFolder={activeFolder}
              setActiveFolder={f => { setActiveFolder(f); setSidebarOpen(false) }}
              tasks={tasks} folders={folders}
              showFolderForm={showFolderForm} setShowFolderForm={setShowFolderForm}
              folderForm={folderForm} setFolderForm={setFolderForm}
              createFolder={createFolder} deleteFolder={deleteFolder}
              session={session}
              onSignOut={handleSignOut}
              rankInfo={rankInfo} xp={xp} xpProgress={xpProgress} xpNeeded={xpNeeded}
              setShowThemePanel={setShowThemePanel}
              setShowTgPanel={setShowTgPanel}
              isMobile
            />
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="app-root" style={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* ── SIDEBAR DESKTOP ── */}
        <div className="sidebar-desktop" style={{ display: 'flex' }}>
          <Sidebar
            t={t} allFolders={allFolders} activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            tasks={tasks} folders={folders}
            showFolderForm={showFolderForm} setShowFolderForm={setShowFolderForm}
            folderForm={folderForm} setFolderForm={setFolderForm}
            createFolder={createFolder} deleteFolder={deleteFolder}
            session={session}
            onSignOut={handleSignOut}
            rankInfo={rankInfo} xp={xp} xpProgress={xpProgress} xpNeeded={xpNeeded}
            setShowThemePanel={setShowThemePanel}
            setShowTgPanel={setShowTgPanel}
          />
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="main-content" style={{
          flex: 1,
          marginLeft: 0,
          padding: '32px 24px',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 36,
            gap: 16,
          }}>
            <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} style={{
              background: t.surface,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 10,
              padding: '8px 12px',
              color: t.text,
              cursor: 'pointer',
              fontSize: 18,
            }}>
              ☰
            </button>

            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 'clamp(20px, 4vw, 32px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}>
                <span className="gradient-text">
                  {allFolders.find(f => f.id === activeFolder || String(f.id) === String(activeFolder))?.emoji || '🌐'}
                  {' '}
                  {allFolders.find(f => f.id === activeFolder || String(f.id) === String(activeFolder))?.name || 'Все задачи'}
                </span>
              </div>
              <div style={{ color: t.textSub, fontSize: 13, marginTop: 4 }}>
                {filteredTasks.filter(tk => !tk.completed).length} активных · {completedCount}/{totalCount} выполнено
              </div>
            </div>

            <button onClick={() => setShowForm(!showForm)} className="shimmer-btn" style={{
              background: `linear-gradient(135deg, ${t.primary}, ${t.primaryEnd})`,
              border: 'none',
              color: '#fff',
              borderRadius: 14,
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: `0 4px 24px ${t.glow}`,
              display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 18 }}>{showForm ? '✕' : '+'}</span>
              <span>{showForm ? 'Отмена' : 'Задание'}</span>
            </button>

            {/* Кнопка диагностики — удали после починки */}
            <button onClick={runDebug} title="Диагностика" style={{
              background: 'rgba(255,255,100,0.1)',
              border: '1px solid rgba(255,255,100,0.3)',
              color: '#FFD700',
              borderRadius: 14,
              padding: '12px 14px',
              cursor: 'pointer',
              fontSize: 16,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              🔍
            </button>
          </div>

          {/* ── CREATE TASK FORM ── */}
          {/* ── DEBUG PANEL (удали после того как всё заработает) ── */}
          {showDebug && debugInfo && (
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,100,0.4)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#fff',
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#FFD700', fontWeight: 700 }}>🔍 Диагностика</span>
                <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              {Object.entries(debugInfo).map(([key, val]) => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <span style={{ color: '#aaa' }}>{key}: </span>
                  <span style={{ color: val?.includes?.('❌') || val?.includes?.('401') || val?.includes?.('500') ? '#FF4466' : val?.includes?.('✅') || val?.includes?.('200') || val?.includes?.('201') ? '#00E887' : '#FFD700' }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div style={{
              background: t.card,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${t.cardBorderHover}`,
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              animation: 'fadeUp 0.3s ease',
              boxShadow: `0 0 40px ${t.glow}`,
            }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: t.text, marginBottom: 20 }}>
                ✦ Новое задание
              </div>
              <form onSubmit={createTask}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Название задания..."
                    autoFocus
                    style={{
                      background: t.inputBg,
                      border: `1px solid ${formError ? t.danger : t.cardBorder}`,
                      borderRadius: 12,
                      padding: '13px 16px',
                      color: t.text,
                      fontSize: 15,
                      outline: 'none',
                      width: '100%',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  {formError && <div style={{ color: t.danger, fontSize: 13 }}>{formError}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: t.textSub, fontSize: 12, marginBottom: 6 }}>Дата</div>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        style={{
                          background: t.inputBg,
                          border: `1px solid ${t.cardBorder}`,
                          borderRadius: 12,
                          padding: '11px 14px',
                          color: t.text,
                          fontSize: 14,
                          outline: 'none',
                          width: '100%',
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ color: t.textSub, fontSize: 12, marginBottom: 6 }}>Приоритет</div>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        style={{
                          background: t.inputBg,
                          border: `1px solid ${t.cardBorder}`,
                          borderRadius: 12,
                          padding: '11px 14px',
                          color: t.text,
                          fontSize: 14,
                          outline: 'none',
                          width: '100%',
                        }}
                      >
                        <option value="high">🔴 Высокий (+50 XP)</option>
                        <option value="medium">🟡 Средний (+25 XP)</option>
                        <option value="low">🟢 Низкий (+10 XP)</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ color: t.textSub, fontSize: 12, marginBottom: 6 }}>Папка</div>
                      <select
                        value={formData.folder_id}
                        onChange={e => setFormData({ ...formData, folder_id: e.target.value })}
                        style={{
                          background: t.inputBg,
                          border: `1px solid ${t.cardBorder}`,
                          borderRadius: 12,
                          padding: '11px 14px',
                          color: t.text,
                          fontSize: 14,
                          outline: 'none',
                          width: '100%',
                        }}
                      >
                        <option value="">Без папки</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" style={{
                    background: `linear-gradient(135deg, ${t.primary}, ${t.primaryEnd})`,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '13px 0',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: `0 4px 20px ${t.glow}`,
                    transition: 'all 0.2s',
                  }}>
                    Создать задание ✦
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── TASK LIST ── */}
          {loading ? (
            <LoadingState t={t} />
          ) : filteredTasks.length === 0 ? (
            <EmptyState t={t} activeFolder={activeFolder} setShowForm={setShowForm} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.filter(task => !task.completed).map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  t={t}
                  index={i}
                  onToggle={() => toggleTask(task)}
                  onDelete={() => setDeleteConfirm({ id: task.id, title: task.title })}
                  folders={folders}
                />
              ))}

              {filteredTasks.filter(task => task.completed).length > 0 && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    margin: '16px 0 8px',
                  }}>
                    <div style={{ flex: 1, height: 1, background: `${t.cardBorder}` }} />
                    <div style={{ color: t.textMuted, fontSize: 12, letterSpacing: '0.1em' }}>
                      ВЫПОЛНЕНО ({filteredTasks.filter(tk => tk.completed).length})
                    </div>
                    <div style={{ flex: 1, height: 1, background: `${t.cardBorder}` }} />
                  </div>
                  {filteredTasks.filter(task => task.completed).map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      t={t}
                      index={i}
                      onToggle={() => toggleTask(task)}
                      onDelete={() => setDeleteConfirm({ id: task.id, title: task.title })}
                      folders={folders}
                      completed
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════
function Sidebar({
  t, allFolders, activeFolder, setActiveFolder,
  tasks, folders,
  showFolderForm, setShowFolderForm,
  folderForm, setFolderForm,
  createFolder, deleteFolder,
  session,
  onSignOut,   // БАГ #3 ИСПРАВЛЕН: переименовали с signOut → onSignOut чтобы не путать с импортом
  rankInfo, xp, xpProgress, xpNeeded,
  setShowThemePanel, setShowTgPanel,
  isMobile,
}) {
  return (
    <div style={{
      width: isMobile ? '280px' : '260px',
      height: '100vh',
      position: isMobile ? 'fixed' : 'sticky',
      top: 0, left: 0,
      background: t.sidebar,
      backdropFilter: 'blur(24px)',
      borderRight: `1px solid ${t.cardBorder}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      zIndex: isMobile ? 201 : 10,
      animation: isMobile ? 'slideIn 0.3s ease' : 'none',
      overflowY: 'auto',
    }}>
      {/* БАГ #4 ИСПРАВЛЕН: логотип "Chronicle" теперь виден — используем класс logo-text */}
      <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${t.cardBorder}` }}>
        <span className="logo-text">Chronicle</span>
        <div style={{ color: t.textMuted, fontSize: 11, marginTop: 2, letterSpacing: '0.05em' }}>
          {session?.user?.email}
        </div>
      </div>

      {/* Rank panel */}
      <div style={{
        margin: '16px 12px',
        background: t.card,
        border: `1px solid ${rankInfo.color}33`,
        borderRadius: 16,
        padding: 16,
        boxShadow: `0 0 24px ${rankInfo.glow}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ color: t.textSub, fontSize: 11, letterSpacing: '0.15em', marginBottom: 4 }}>РАНГ</div>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 28,
              fontWeight: 700,
              color: rankInfo.color,
              textShadow: `0 0 20px ${rankInfo.glow}`,
              lineHeight: 1,
            }}>
              {rankInfo.rank}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: t.textSub, fontSize: 11, letterSpacing: '0.15em', marginBottom: 4 }}>XP</div>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 20 }}>{xp.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ color: t.textSub, fontSize: 11, marginBottom: 8 }}>{rankInfo.label}</div>
        <div style={{ background: t.surface, borderRadius: 8, height: 6, overflow: 'hidden' }}>
          <div className="xp-bar-fill" style={{
            height: '100%',
            width: `${xpProgress}%`,
            background: `linear-gradient(90deg, ${rankInfo.color}, ${t.primary})`,
            borderRadius: 8,
            boxShadow: `0 0 8px ${rankInfo.glow}`,
          }} />
        </div>
        {xpNeeded > 0 && (
          <div style={{ color: t.textMuted, fontSize: 11, marginTop: 6, textAlign: 'right' }}>
            {xpNeeded} XP до следующего ранга
          </div>
        )}
      </div>

      {/* Folders */}
      <div style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        <div style={{ color: t.textMuted, fontSize: 11, letterSpacing: '0.15em', padding: '8px 12px 4px' }}>
          РАЗДЕЛЫ
        </div>
        {allFolders.map(folder => {
          const isBuiltin = ['all','today','urgent'].includes(folder.id)
          const count = tasks.filter(task => {
            if (folder.id === 'all') return true
            if (folder.id === 'urgent') return getDaysLeft(task.due_date) <= 1 && !task.completed
            if (folder.id === 'today') return getDaysLeft(task.due_date) === 0
            return String(task.folder_id) === String(folder.id)
          }).length
          const isActive = String(activeFolder) === String(folder.id)

          return (
            <div key={folder.id} className="folder-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 12,
              marginBottom: 2,
              cursor: 'pointer',
              background: isActive ? t.surface : 'transparent',
              border: `1px solid ${isActive ? t.cardBorderHover : 'transparent'}`,
              transition: 'all 0.15s',
              boxShadow: isActive ? `0 0 16px ${t.glow}` : 'none',
            }} onClick={() => setActiveFolder(folder.id)}>
              <span style={{ fontSize: 16 }}>{folder.emoji}</span>
              <span style={{
                flex: 1,
                color: isActive ? t.text : t.textSub,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
              }}>{folder.name}</span>
              <span style={{
                color: isActive ? t.primary : t.textMuted,
                fontSize: 12,
                fontWeight: 600,
              }}>{count}</span>
              {!isBuiltin && (
                <button onClick={e => { e.stopPropagation(); deleteFolder(folder.id) }} style={{
                  background: 'none', border: 'none',
                  color: t.textMuted, cursor: 'pointer',
                  fontSize: 14, padding: '2px 4px',
                  opacity: 0.6, transition: 'opacity 0.2s',
                }}>✕</button>
              )}
            </div>
          )
        })}

        {/* Add folder */}
        {showFolderForm ? (
          <form onSubmit={createFolder} style={{ padding: '8px 4px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={folderForm.emoji}
                onChange={e => setFolderForm({ ...folderForm, emoji: e.target.value })}
                style={{
                  width: 44,
                  background: t.inputBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 10,
                  padding: '8px',
                  color: t.text,
                  fontSize: 16,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <input
                value={folderForm.name}
                onChange={e => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="Название папки"
                autoFocus
                style={{
                  flex: 1,
                  background: t.inputBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: t.text,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#8B5CF6','#F54B64','#5CB85C','#F0A30A','#5BC0DE'].map(c => (
                <div key={c} onClick={() => setFolderForm({ ...folderForm, color: c })} style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border: folderForm.color === c ? '2px solid white' : '2px solid transparent',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button type="button" onClick={() => setShowFolderForm(false)} style={{
                flex: 1, background: t.surface,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 10, padding: '8px',
                color: t.textSub, cursor: 'pointer', fontSize: 13,
              }}>Отмена</button>
              <button type="submit" style={{
                flex: 1,
                background: `linear-gradient(135deg, ${t.primary}, ${t.primaryEnd})`,
                border: 'none',
                borderRadius: 10, padding: '8px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Создать</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowFolderForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            width: '100%',
            background: 'none',
            border: `1px dashed ${t.cardBorder}`,
            borderRadius: 12,
            color: t.textMuted,
            cursor: 'pointer',
            fontSize: 13,
            marginTop: 4,
            transition: 'all 0.2s',
          }}>
            <span>+</span> Новая папка
          </button>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{
        padding: '16px 12px 0',
        borderTop: `1px solid ${t.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <SidebarBtn icon="🎨" label="Тема" onClick={() => setShowThemePanel(true)} t={t} />
        <SidebarBtn icon="📬" label="Telegram" onClick={() => setShowTgPanel(true)} t={t} />
        {/* БАГ #3 ИСПРАВЛЕН: передаём onSignOut напрямую, без лишней обёртки */}
        <SidebarBtn icon="🚪" label="Выйти" onClick={onSignOut} t={t} danger />
      </div>
    </div>
  )
}

// БАГ #3 ИСПРАВЛЕН: SidebarBtn больше не вызывает onClick(event) — он вызывает onClick() через стрелочную функцию
function SidebarBtn({ icon, label, onClick, t, danger }) {
  return (
    <button
      onClick={() => onClick()}
      className="sidebar-action-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: 'none',
        border: 'none',
        borderRadius: 12,
        color: danger ? t.danger : t.textSub,
        cursor: 'pointer',
        fontSize: 13,
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  TASK CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
function TaskCard({ task, t, index, onToggle, onDelete, folders, completed }) {
  const days = getDaysLeft(task.due_date)
  const daysLabel = getDaysLeftLabel(days)
  const daysColor = getDaysColor(days, t)
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const folder = folders.find(f => String(f.id) === String(task.folder_id))
  const xpReward = getXP(task.priority)

  return (
    <div
      className="task-card"
      style={{
        background: t.card,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${completed ? t.cardBorder : (days !== null && days <= 1 && !completed ? `${t.danger}44` : t.cardBorder)}`,
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: completed ? 0.55 : 1,
        animationDelay: `${index * 0.04}s`,
        boxShadow: !completed && days !== null && days <= 1
          ? `0 0 20px ${t.danger}18`
          : !completed && index === 0
          ? `0 0 16px ${t.glow}`
          : 'none',
      }}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22,
        borderRadius: 6,
        border: `2px solid ${completed ? t.success : priority.color}`,
        background: completed ? t.success : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
        transition: 'all 0.3s',
        boxShadow: completed ? `0 0 10px ${t.success}44` : 'none',
      }}>
        {completed && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round"
              style={{ strokeDasharray: 24, strokeDashoffset: 0 }} />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: t.text,
          fontSize: 15,
          fontWeight: 500,
          textDecoration: completed ? 'line-through' : 'none',
          textDecorationColor: 'rgba(255,255,255,0.3)',
          marginBottom: 6,
          lineHeight: 1.4,
        }}>
          {task.title}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            color: priority.color,
            background: `${priority.color}18`,
            border: `1px solid ${priority.color}33`,
            borderRadius: 6,
            padding: '2px 7px',
            fontWeight: 600,
          }}>
            {priority.icon} {priority.label}
          </span>

          {task.due_date && (
            <span style={{ fontSize: 12, color: daysColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              📅 {formatDate(task.due_date)}
              {!completed && daysLabel && (
                <span style={{
                  fontSize: 11,
                  background: `${daysColor}18`,
                  border: `1px solid ${daysColor}44`,
                  borderRadius: 6,
                  padding: '1px 6px',
                  fontWeight: 600,
                }}>
                  {daysLabel}
                </span>
              )}
            </span>
          )}

          {folder && (
            <span style={{ fontSize: 12, color: t.textMuted }}>
              {folder.emoji} {folder.name}
            </span>
          )}

          {!completed && (
            <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 'auto' }}>
              +{xpReward} XP
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
        background: 'none',
        border: 'none',
        color: t.textMuted,
        cursor: 'pointer',
        padding: '4px',
        fontSize: 16,
        borderRadius: 8,
        flexShrink: 0,
        opacity: 0.5,
        transition: 'all 0.2s',
        marginTop: -2,
      }}>
        ×
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function LoadingState({ t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          background: `linear-gradient(90deg, ${t.card} 0%, ${t.surface} 50%, ${t.card} 100%)`,
          backgroundSize: '200% auto',
          borderRadius: 16,
          height: 72,
          animation: 'shimmer 1.5s ease infinite',
        }} />
      ))}
    </div>
  )
}

function EmptyState({ t, activeFolder, setShowForm }) {
  const messages = {
    urgent: { emoji: '🎯', title: 'Срочных заданий нет', sub: 'Отличная работа!' },
    today:  { emoji: '⚡', title: 'На сегодня всё готово', sub: 'Можешь отдохнуть' },
    all:    { emoji: '✦', title: 'Нет заданий', sub: 'Создай первое задание' },
  }
  const msg = messages[activeFolder] || messages.all

  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 24px',
      animation: 'fadeUp 0.4s ease',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>{msg.emoji}</div>
      <div style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 20,
        color: t.text,
        marginBottom: 10,
      }}>
        {msg.title}
      </div>
      <div style={{ color: t.textSub, fontSize: 14, marginBottom: 28 }}>{msg.sub}</div>
      {activeFolder === 'all' && (
        <button onClick={() => setShowForm(true)} style={{
          background: `linear-gradient(135deg, ${t.primary}, ${t.primaryEnd})`,
          border: 'none',
          color: '#fff',
          borderRadius: 14,
          padding: '13px 28px',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          boxShadow: `0 4px 24px ${t.glow}`,
        }}>
          + Первое задание
        </button>
      )}
    </div>
  )
}
