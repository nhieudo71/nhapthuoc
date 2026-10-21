// ======================== UI & HELPERS ========================

// Theme Management
let currentTheme = localStorage.getItem('pi_theme') || 'dark';

function applyTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('pi_theme', t);
  const isDark = t === 'dark';
  const icon = isDark ? '🌙' : '☀️';
  const label = isDark ? 'Tối' : 'Sáng';
  for (let i = 1; i <= 10; i++) {
    const ic = document.getElementById('theme-icon' + i);
    if (ic) ic.textContent = icon;
    const lb = document.getElementById('theme-label' + i);
    if (lb) lb.textContent = label;
  }
  const bd = document.getElementById('btn-dark');
  const bl = document.getElementById('btn-light');
  if (bd && bl) {
    bd.className = 'btn ' + (isDark ? 'btn-primary' : 'btn-outline');
    bl.className = 'btn ' + (isDark ? 'btn-outline' : 'btn-primary');
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(t) {
  applyTheme(t);
}

// Sidebar Navigation
function openSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.add('open');
  const ov = document.getElementById('sidebar-overlay');
  if (ov) {
    ov.style.display = 'block';
    ov.style.pointerEvents = 'all';
    requestAnimationFrame(() => ov.classList.add('show'));
  }
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');
  const ov = document.getElementById('sidebar-overlay');
  if (ov) {
    ov.classList.remove('show');
    setTimeout(() => {
      ov.style.display = 'none';
      ov.style.pointerEvents = 'none';
    }, 250);
  }
}

// Toast Notifications
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toasts');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    t.style.transition = 'all .25s ease';
    setTimeout(() => t.remove(), 250);
  }, 3500);
}

// Modal Windows
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('show');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('show');
}

// Progress Bar
function showProgress(show, msg = '', pct = 0) {
  const el = document.getElementById('upload-progress');
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  if (show) {
    const fill = document.getElementById('prog-fill');
    const text = document.getElementById('prog-text');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = msg;
  }
}

function setProgress(pct, msg) {
  const fill = document.getElementById('prog-fill');
  const text = document.getElementById('prog-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = msg;
}

// Formatting & Sanitizing
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString('vi-VN');
}

function fmtDateInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert dd/mm/yyyy -> yyyy-mm-dd for input[type="date"]
function vnDateToISO(s) {
  if (!s) return '';
  const m = String(s).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return '';
  const yyyy = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${yyyy}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// Convert any date string to dd/mm/yyyy for Vietnamese Excel export
function toVNDate(s) {
  if (!s) return '';
  const str = String(s).trim();
  let m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[3].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[1]}`;
  m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3].length === 2 ? '20' + m[3] : m[3]}`;
  return str;
}

