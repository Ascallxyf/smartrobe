// wardrobe.js - 我的衣橱页面
let currentUser = null;
let currentFilter = 'all';
let uploadedFile = null;

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
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const uploadBtn = document.getElementById('upload-btn');
  
  if (loginBtn) loginBtn.classList.toggle('hidden', loggedIn);
  if (logoutBtn) logoutBtn.classList.toggle('hidden', !loggedIn);
  if (uploadBtn) uploadBtn.disabled = !loggedIn;
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
    await loadWardrobe();
    return true;
  } else {
    throw new Error(data.message || '登录失败');
  }
}

async function logout() {
  await fetchJSON('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
  document.getElementById('wardrobe-grid').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">👔</div>
      <h3>还没有衣服</h3>
      <p>请先登录以查看和管理你的衣橱</p>
    </div>
  `;
  updateStats([], 0, 0);
}

// ========== 衣橱加载 ==========
async function loadWardrobe() {
  if (!currentUser) {
    document.getElementById('wardrobe-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👔</div>
        <h3>还没有衣服</h3>
        <p>请先登录以查看和管理你的衣橱</p>
      </div>
    `;
    updateStats([], 0, 0);
    return;
  }
  
  const data = await fetchJSON('/api/wardrobe');
  if (data.success && data.data) {
    renderWardrobe(data.data.items || []);
    updateStats(data.data.items || []);
  }
}

// ========== 更新统计信息 ==========
function updateStats(items, categories, colors) {
  // 计算分类数量
  if (!categories) {
    const uniqueCategories = new Set(items.map(item => item.category_group || item.category));
    categories = uniqueCategories.size;
  }
  
  // 计算色彩种类
  if (!colors) {
    const allColors = new Set();
    items.forEach(item => {
      if (item.colors && item.colors.length) {
        item.colors.forEach(color => allColors.add(color));
      }
    });
    colors = allColors.size;
  }
  
  document.getElementById('total-items').textContent = items.length;
  document.getElementById('total-categories').textContent = categories;
  document.getElementById('total-colors').textContent = colors;
}

function renderWardrobe(items) {
  const grid = document.getElementById('wardrobe-grid');
  
  // 筛选
  let filteredItems = items;
  if (currentFilter !== 'all') {
    filteredItems = items.filter(item => item.category_group === currentFilter);
  }
  
  if (filteredItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>该分类暂无衣服</h3>
        <p>点击"上传新衣服"添加第一件</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredItems.map(item => `
    <div class="wardrobe-item">
      <div class="item-image">
        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E%3Crect width=%22300%22 height=%22400%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22%3E${item.name}%3C/text%3E%3C/svg%3E'">
        <div class="item-category">${getCategoryLabel(item.category)}</div>
      </div>
      <div class="item-info">
        <h3>${item.name}</h3>
        ${item.colors && item.colors.length ? `
          <div class="color-palette">
            ${item.colors.slice(0, 5).map(c => `<span class="color-dot" style="background:${c}" title="${c}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="deleteItem(${item.id})">删除</button>
    </div>
  `).join('');
}

function getCategoryLabel(category) {
  const labels = {
    'tshirt': 'T恤', 'shirt': '衬衫', 'sweater': '毛衣', 'hoodie': '卫衣',
    'coat': '大衣', 'jacket': '夹克', 'blazer': '西装外套', 'vest': '背心',
    'jeans': '牛仔裤', 'pants': '休闲裤', 'shorts': '短裤', 'skirt': '半身裙',
    'dress': '连衣裙', 'shoes': '鞋类', 'bag': '包类', 'accessory': '配饰',
    'suit': '套装', 'other': '其他'
  };
  return labels[category] || category;
}

async function deleteItem(id) {
  if (!confirm('确定删除这件衣服吗？')) return;
  const data = await fetchJSON(`/api/wardrobe/${id}`, { method: 'DELETE' });
  if (data.success) {
    await loadWardrobe();
  }
}

// ========== 上传功能 ==========
function setupUpload() {
  const uploadBtn = document.getElementById('upload-btn');
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('image-upload');
  const placeholder = document.getElementById('upload-placeholder');
  const previewArea = document.getElementById('preview-area');
  const previewImage = document.getElementById('preview-image');
  const confirmBtn = document.getElementById('confirm-upload');
  const cancelBtn = document.getElementById('cancel-upload');
  
  if (!uploadBtn || !uploadArea || !fileInput) {
    console.error('上传元素未找到');
    return;
  }
  
  // 点击上传按钮
  uploadBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    uploadArea.classList.remove('hidden');
    uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  
  // 点击占位符选择文件
  placeholder.addEventListener('click', () => fileInput.click());
  
  // 拖拽上传支持
  placeholder.addEventListener('dragover', (e) => {
    e.preventDefault();
    placeholder.style.background = 'rgba(201, 168, 106, 0.2)';
  });
  
  placeholder.addEventListener('dragleave', (e) => {
    e.preventDefault();
    placeholder.style.background = '';
  });
  
  placeholder.addEventListener('drop', (e) => {
    e.preventDefault();
    placeholder.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      alert('请上传图片文件');
    }
  });
  
  // 文件选择
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  });
  
  // 处理文件选择
  function handleFileSelect(file) {
    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }
    
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      placeholder.classList.add('hidden');
      previewArea.classList.remove('hidden');
    };
    reader.onerror = () => {
      alert('图片读取失败');
    };
    reader.readAsDataURL(file);
  }
  
  // 确认上传
  confirmBtn.addEventListener('click', async () => {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('name', uploadedFile.name.split('.')[0]);
    
    confirmBtn.disabled = true;
    confirmBtn.textContent = '🔄 上传中...';
    
    try {
      const resp = await fetch('/api/wardrobe/upload', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData,
        credentials: 'include'
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      
      if (data.success && data.data) {
        const item = data.data.item;
        const classification = data.data.classification;
        const confidence = classification.confidence || 0;
        const confidencePercent = (confidence * 100).toFixed(1);
        const method = classification.method || 'unknown';
        
        let message = `✅ 上传成功！\n识别为：${getCategoryLabel(item.category)}`;
        if (method === 'deep_learning') {
          message += `\n置信度：${confidencePercent}%`;
        }
        message += `\n提取了 ${item.palette ? item.palette.length : 0} 种颜色`;
        
        alert(message);
        resetUpload();
        await loadWardrobe();
      } else {
        alert('❌ 上传失败：' + (data.message || '未知错误'));
      }
    } catch (err) {
      console.error('上传错误:', err);
      alert('❌ 上传失败：' + err.message + '\n\n请检查：\n1. 是否已登录\n2. 网络连接是否正常\n3. 服务器是否运行');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '确认上传';
    }
  });
  
  // 取消上传
  cancelBtn.addEventListener('click', resetUpload);
}

function resetUpload() {
  uploadedFile = null;
  document.getElementById('image-upload').value = '';
  document.getElementById('upload-area').classList.add('hidden');
  document.getElementById('preview-area').classList.add('hidden');
  document.getElementById('upload-placeholder').classList.remove('hidden');
}

// ========== 分类切换 ==========
function setupCategoryTabs() {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.group;
      loadWardrobe();
    });
  });
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
  setupUpload();
  setupCategoryTabs();
  
  // 检查登录状态
  try {
    const data = await fetchJSON('/api/user');
    if (data.success && data.data && data.data.user) {
      currentUser = data.data.user;
      updateAuthUI();
      await loadWardrobe();
    } else {
      updateAuthUI();
      await loadWardrobe();
    }
  } catch (err) {
    updateAuthUI();
    await loadWardrobe();
  }
}

document.addEventListener('DOMContentLoaded', init);
