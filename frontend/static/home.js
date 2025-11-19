// home.js - 首页逻辑
let currentUser = null;

// ========== 工具函数 ==========
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function fetchJSON(url, options = {}) {
  const headers = options.headers || {};
  if (!headers['X-CSRFToken']) {
    const token = getCookie('csrftoken');
    if (token) headers['X-CSRFToken'] = token;
  }
  const resp = await fetch(url, { ...options, headers, credentials: 'include' });
  return resp.json();
}

// ========== 认证相关 ==========
function updateAuthUI() {
  const loggedIn = !!currentUser;
  document.getElementById('login-btn').classList.toggle('hidden', loggedIn);
  document.getElementById('logout-btn').classList.toggle('hidden', !loggedIn);
}

async function login(username, password) {
  const data = await fetchJSON('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (data.success && data.data) {
    currentUser = data.data.user;
    updateAuthUI();
    return true;
  } else {
    throw new Error(data.message || '登录失败');
  }
}

async function logout() {
  await fetchJSON('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
}

// ========== 模态框 ==========
function setupModal() {
  const modal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const ctaLoginBtn = document.getElementById('cta-login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  
  loginBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  ctaLoginBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  logoutBtn.addEventListener('click', logout);
  
  document.querySelectorAll('[data-dismiss="modal"]').forEach(el => {
    el.addEventListener('click', () => modal.classList.add('hidden'));
  });
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
      loginMessage.textContent = '';
      await login(username, password);
      modal.classList.add('hidden');
      loginForm.reset();
      // 登录成功后跳转到衣橱页面
      window.location.href = 'wardrobe.html';
    } catch (err) {
      loginMessage.textContent = err.message;
    }
  });
}

// ========== 初始化 ==========
async function init() {
  setupModal();
  
  // 检查登录状态
  try {
    const data = await fetchJSON('/api/user');
    if (data.success && data.data && data.data.user) {
      currentUser = data.data.user;
      updateAuthUI();
    } else {
      updateAuthUI();
    }
  } catch (err) {
    updateAuthUI();
  }
}

document.addEventListener('DOMContentLoaded', init);
