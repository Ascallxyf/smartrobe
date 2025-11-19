// profile.js - 个人资料页面
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
    renderProfile();
    loadNewArrivals();
    return true;
  } else {
    throw new Error(data.message || '登录失败');
  }
}

async function logout() {
  await fetchJSON('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
  document.getElementById('user').innerHTML = '<p class="empty-state">请先登录以查看个人资料</p>';
  document.getElementById('new-arrivals-list').innerHTML = '';
}

// ========== 资料渲染 ==========
function renderProfile() {
  if (!currentUser) {
    document.getElementById('user').innerHTML = '<p class="empty-state">请先登录以查看个人资料</p>';
    return;
  }
  
  const bodyShapeLabels = {
    'H': '矩形 (H型)',
    'A': '梨形 (A型)',
    'X': '沙漏 (X型)',
    'V': '倒三角 (V型)',
    'O': '苹果 (O型)'
  };
  
  const seasonLabels = {
    'spring': '春季型',
    'summer': '夏季型',
    'autumn': '秋季型',
    'winter': '冬季型',
    'unknown': '未知'
  };
  
  document.getElementById('user').innerHTML = `
    <div class="profile-section">
      <h3>👤 用户信息</h3>
      <div class="profile-field">
        <span class="field-label">用户名</span>
        <span class="field-value">${currentUser.username}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">年龄</span>
        <input type="number" id="age-input" class="field-input" value="${currentUser.age || ''}" placeholder="未设置">
      </div>
    </div>
    
    <div class="profile-section">
      <h3>🎨 色彩季型</h3>
      <select id="season-select" class="field-select">
        <option value="unknown" ${!currentUser.skin_season || currentUser.skin_season === 'unknown' ? 'selected' : ''}>未知</option>
        <option value="spring" ${currentUser.skin_season === 'spring' ? 'selected' : ''}>春季型</option>
        <option value="summer" ${currentUser.skin_season === 'summer' ? 'selected' : ''}>夏季型</option>
        <option value="autumn" ${currentUser.skin_season === 'autumn' ? 'selected' : ''}>秋季型</option>
        <option value="winter" ${currentUser.skin_season === 'winter' ? 'selected' : ''}>冬季型</option>
      </select>
    </div>
    
    <div class="profile-section">
      <h3>🧍 体型类型</h3>
      <div class="shape-selector" id="shape-selector">
        ${['H', 'A', 'X', 'V', 'O'].map(shape => `
          <div class="shape-option ${currentUser.body_shape === shape ? 'active' : ''}" data-shape="${shape}">
            <div class="shape-icon">${getShapeIcon(shape)}</div>
            <span class="shape-label">${bodyShapeLabels[shape]}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="profile-section">
      <h3>📏 身体数据</h3>
      <div class="measurements-grid">
        <div class="profile-field">
          <span class="field-label">身高 (cm)</span>
          <input type="number" id="height-input" class="field-input" value="${currentUser.height || ''}" placeholder="未设置">
        </div>
        <div class="profile-field">
          <span class="field-label">体重 (kg)</span>
          <input type="number" id="weight-input" class="field-input" value="${currentUser.weight || ''}" placeholder="未设置">
        </div>
      </div>
    </div>
    
    <button id="save-profile" class="btn btn-primary">保存设置</button>
  `;
  
  setupProfileEditing();
}

function getShapeIcon(shape) {
  const icons = {
    'H': '▯',
    'A': '▽',
    'X': '⧗',
    'V': '△',
    'O': '◯'
  };
  return icons[shape] || '?';
}

function setupProfileEditing() {
  // 体型选择器
  document.querySelectorAll('.shape-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.shape-option').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
    });
  });
  
  // 保存按钮
  document.getElementById('save-profile').addEventListener('click', async () => {
    const activeShape = document.querySelector('.shape-option.active');
    const updateData = {
      age: parseInt(document.getElementById('age-input').value) || null,
      skin_season: document.getElementById('season-select').value,
      body_shape: activeShape ? activeShape.dataset.shape : null,
      height: parseInt(document.getElementById('height-input').value) || null,
      weight: parseInt(document.getElementById('weight-input').value) || null
    };
    
    try {
      const data = await fetchJSON('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (data.success && data.data) {
        currentUser = data.data.user;
        alert('保存成功！');
      } else {
        alert('保存失败：' + (data.message || '未知错误'));
      }
    } catch (err) {
      alert('保存失败：' + err.message);
    }
  });
}

// ========== 新品精选 ==========
function loadNewArrivals() {
  const products = [
    {
      name: '经典圆领T恤',
      price: '¥59',
      image: 'https://via.placeholder.com/300x400/4A5D7C/FFFFFF?text=T-Shirt',
      category: '上衣'
    },
    {
      name: '修身牛仔裤',
      price: '¥199',
      image: 'https://via.placeholder.com/300x400/2F4F4F/FFFFFF?text=Jeans',
      category: '下装'
    },
    {
      name: '轻薄羽绒服',
      price: '¥399',
      image: 'https://via.placeholder.com/300x400/8B7355/FFFFFF?text=Jacket',
      category: '外套'
    },
    {
      name: '针织连衣裙',
      price: '¥299',
      image: 'https://via.placeholder.com/300x400/DC143C/FFFFFF?text=Dress',
      category: '连衣裙'
    }
  ];
  
  const list = document.getElementById('new-arrivals-list');
  list.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}">
        <span class="product-category">${p.category}</span>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-price">${p.price}</p>
      </div>
    </div>
  `).join('');
}

// ========== 模态框 ==========
function setupModal() {
  const modal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  
  loginBtn.addEventListener('click', () => modal.classList.remove('hidden'));
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
      renderProfile();
      loadNewArrivals();
    } else {
      updateAuthUI();
    }
  } catch (err) {
    updateAuthUI();
  }
}

document.addEventListener('DOMContentLoaded', init);
