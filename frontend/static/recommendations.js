// recommendations.js - 搭配推荐页面
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
  document.getElementById('refresh-btn').disabled = !loggedIn;
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
    await loadRecommendations();
    loadStyleTips();
    return true;
  } else {
    throw new Error(data.message || '登录失败');
  }
}

async function logout() {
  await fetchJSON('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
  document.getElementById('recommendation-list').innerHTML = '<p class="empty-state">请先登录以查看推荐</p>';
  document.getElementById('tips-list').innerHTML = '';
}

// ========== 推荐加载 ==========
async function loadRecommendations() {
  if (!currentUser) {
    document.getElementById('recommendation-list').innerHTML = '<p class="empty-state">请先登录以查看推荐</p>';
    return;
  }
  
  const data = await fetchJSON('/api/recommendations');
  if (data.success) {
    renderRecommendations(data.recommendations);
  }
}

function renderRecommendations(recommendations) {
  const list = document.getElementById('recommendation-list');
  
  if (recommendations.length === 0) {
    list.innerHTML = '<p class="empty-state">暂无推荐，请先添加衣服到衣橱</p>';
    return;
  }
  
  list.innerHTML = recommendations.slice(0, 6).map(rec => `
    <div class="recommendation-card">
      <h3>${rec.name || '搭配推荐'}</h3>
      ${rec.items && rec.items.length ? `
        <div class="outfit-items">
          ${rec.items.slice(0, 3).map(item => `
            <div class="outfit-item">
              <img src="${item.image_url}" alt="${item.name}">
              <span>${item.name}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="rec-meta">
        <span class="score">匹配度：${Math.round((rec.score || 0.8) * 100)}%</span>
        ${rec.occasion ? `<span class="occasion">${rec.occasion}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ========== 风格建议 ==========
function loadStyleTips() {
  if (!currentUser) {
    document.getElementById('tips-list').innerHTML = '';
    return;
  }
  
  const tips = generateStyleTips(currentUser);
  renderStyleTips(tips);
}

function generateStyleTips(user) {
  const tips = [];
  
  // 体型建议
  const bodyShapeTips = {
    'H': {
      title: '矩形身材搭配指南',
      content: '适合选择腰线明确的服装来塑造曲线，如收腰连衣裙、高腰裤搭配短款上衣。避免过于宽松的直筒款式。',
      colors: ['#8B7355', '#D2B48C']
    },
    'A': {
      title: '梨形身材搭配指南',
      content: '上身可选择亮色、装饰性强的款式来平衡比例，下身选择深色、简洁款式。A字裙和直筒裤是你的好朋友。',
      colors: ['#4A5D7C', '#87CEEB']
    },
    'X': {
      title: '沙漏身材搭配指南',
      content: '你拥有均衡的身材比例！适合修身款式来展现曲线，如裹身裙、收腰外套。避免过于宽松掩盖身材优势。',
      colors: ['#DC143C', '#FFD700']
    },
    'V': {
      title: '倒三角身材搭配指南',
      content: '下身可选择有设计感的款式来平衡肩宽，如阔腿裤、百褶裙。上身避免泡泡袖等增加肩部体积的设计。',
      colors: ['#2F4F4F', '#9ACD32']
    },
    'O': {
      title: '苹果身材搭配指南',
      content: '选择V领、竖条纹等有纵向延伸感的款式。高腰裤搭配宽松上衣可以修饰腰线，展现腿部优势。',
      colors: ['#191970', '#FFDAB9']
    }
  };
  
  if (user.body_shape && bodyShapeTips[user.body_shape]) {
    tips.push(bodyShapeTips[user.body_shape]);
  }
  
  // 肤色季型建议
  const seasonTips = {
    'spring': {
      title: '春季型适配色彩',
      content: '你适合明亮、温暖的色调，如暖黄、珊瑚橙、嫩绿、浅驼色。避免深沉冷艳的颜色。',
      colors: ['#FFD700', '#FF7F50', '#90EE90', '#F5DEB3']
    },
    'summer': {
      title: '夏季型适配色彩',
      content: '你适合柔和、清爽的冷色调，如粉蓝、薰衣草紫、薄荷绿、银灰色。避免过于鲜艳的暖色。',
      colors: ['#B0E0E6', '#E6E6FA', '#98FB98', '#C0C0C0']
    },
    'autumn': {
      title: '秋季型适配色彩',
      content: '你适合温暖、深沉的大地色系，如橄榄绿、焦糖色、铁锈红、芥末黄。避免冷色调和荧光色。',
      colors: ['#808000', '#D2691E', '#CD5C5C', '#DAA520']
    },
    'winter': {
      title: '冬季型适配色彩',
      content: '你适合高对比度的冷艳色彩，如纯白、宝石蓝、酒红、黑色。避免柔和暖调的中性色。',
      colors: ['#FFFFFF', '#0047AB', '#8B0000', '#000000']
    }
  };
  
  if (user.skin_season && seasonTips[user.skin_season]) {
    tips.push(seasonTips[user.skin_season]);
  }
  
  // 通用建议
  if (tips.length < 3) {
    tips.push({
      title: '经典配色法则',
      content: '60%基础色（黑白灰驼）+ 30%主色调 + 10%点缀色，是永不出错的搭配公式。',
      colors: ['#000000', '#FFFFFF', '#808080', '#D2B48C']
    });
  }
  
  return tips;
}

function renderStyleTips(tips) {
  const list = document.getElementById('tips-list');
  list.innerHTML = tips.map(tip => `
    <div class="tip-card">
      <h3>${tip.title}</h3>
      <p>${tip.content}</p>
      ${tip.colors ? `
        <div class="color-palette">
          ${tip.colors.map(c => `<span class="color-dot" style="background:${c}"></span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ========== 模态框 ==========
function setupModal() {
  const modal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  
  loginBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  logoutBtn.addEventListener('click', logout);
  refreshBtn.addEventListener('click', loadRecommendations);
  
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
      await loadRecommendations();
      loadStyleTips();
    } else {
      updateAuthUI();
    }
  } catch (err) {
    updateAuthUI();
  }
}

document.addEventListener('DOMContentLoaded', init);
