const state = {
  user: null,
  wardrobe: [],
  recommendations: [],
};

function getJsonHeaders(options) {
  return {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: getJsonHeaders(options),
    ...options,
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    return {};
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(payload?.message || `请求失败: ${response.status}`);
    if (payload && payload.code) error.code = payload.code;
    throw error;
  }

  return payload;
}

function toggleElementDisplay(element, show) {
  if (!element) return;
  element.style.display = show ? "inline-flex" : "none";
}

function openModal(modal) {
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (modal) modal.classList.add("hidden");
}

function renderProfile(user) {
  const profile = document.getElementById("user");
  if (!user) {
    profile.innerHTML = '<div class="empty-state">未登录或无法获取用户信息，请先登录。</div>';
    return;
  }

  const skinSeasonMap = {
    spring: "春季型（暖色调）",
    summer: "夏季型（冷色调）",
    autumn: "秋季型（暖色调）",
    winter: "冬季型（冷色调）",
    unknown: "未识别"
  };

  const bodyShapeMap = {
    H: "H型 | 矩形身材",
    A: "A型 | 梨形身材",
    X: "X型 | 沙漏身材",
    V: "V型 | 倒三角身材",
    O: "O型 | 苹果身材"
  };

  const bodyShapeDesc = {
    H: "肩宽≈臀宽，腰线不明显",
    A: "臀宽>肩宽，下半身丰满",
    X: "肩宽≈臀宽，腰线明显",
    V: "肩宽>臀宽，上半身丰满",
    O: "腰腹丰满，整体圆润"
  };

  const skinSeasonText = skinSeasonMap[user.skin_season] || user.skin_season || "未识别";
  const bodyShapeText = bodyShapeMap[user.body_shape] || user.body_shape || "<span style='color:#999'>点击选择</span>";

  profile.innerHTML = `
    <div class="profile-row">
      <div class="metric-tile">
        <div class="label">昵称</div>
        <div class="value">${user.username ?? "-"}</div>
      </div>
      <div class="metric-tile editable" id="shape-tile">
        <div class="label">体型分类</div>
        <div class="value" id="shape-display">${bodyShapeText}</div>
        <div id="shape-selector" class="hidden shape-selector">
          <div class="shape-option ${user.body_shape === 'H' ? 'selected' : ''}" data-shape="H">
            <div class="shape-icon">│</div>
            <div class="shape-name">H型</div>
            <div class="shape-desc">矩形身材</div>
          </div>
          <div class="shape-option ${user.body_shape === 'A' ? 'selected' : ''}" data-shape="A">
            <div class="shape-icon">△</div>
            <div class="shape-name">A型</div>
            <div class="shape-desc">梨形身材</div>
          </div>
          <div class="shape-option ${user.body_shape === 'X' ? 'selected' : ''}" data-shape="X">
            <div class="shape-icon">✕</div>
            <div class="shape-name">X型</div>
            <div class="shape-desc">沙漏身材</div>
          </div>
          <div class="shape-option ${user.body_shape === 'V' ? 'selected' : ''}" data-shape="V">
            <div class="shape-icon">▽</div>
            <div class="shape-name">V型</div>
            <div class="shape-desc">倒三角身材</div>
          </div>
          <div class="shape-option ${user.body_shape === 'O' ? 'selected' : ''}" data-shape="O">
            <div class="shape-icon">○</div>
            <div class="shape-name">O型</div>
            <div class="shape-desc">苹果身材</div>
          </div>
        </div>
      </div>
    </div>
    <div class="profile-row">
      <div class="metric-tile editable" id="age-tile">
        <div class="label">年龄</div>
        <div class="value" id="age-display">${user.age || "<span style='color:#999'>点击设置</span>"}</div>
        <input type="number" id="age-input" class="hidden" min="10" max="100" value="${user.age || ""}" />
      </div>
      <div class="metric-tile editable" id="season-tile">
        <div class="label">肤色季型</div>
        <div class="value" id="season-display">${skinSeasonText}</div>
        <select id="season-select" class="hidden">
          <option value="unknown" ${user.skin_season === 'unknown' ? 'selected' : ''}>未识别</option>
          <option value="spring" ${user.skin_season === 'spring' ? 'selected' : ''}>春季型（暖色调）</option>
          <option value="summer" ${user.skin_season === 'summer' ? 'selected' : ''}>夏季型（冷色调）</option>
          <option value="autumn" ${user.skin_season === 'autumn' ? 'selected' : ''}>秋季型（暖色调）</option>
          <option value="winter" ${user.skin_season === 'winter' ? 'selected' : ''}>冬季型（冷色调）</option>
        </select>
      </div>
    </div>
  `;

  // 添加年龄编辑功能
  const ageTile = document.getElementById('age-tile');
  const ageDisplay = document.getElementById('age-display');
  const ageInput = document.getElementById('age-input');
  
  if (ageTile && ageDisplay && ageInput) {
    ageTile.addEventListener('click', () => {
      ageDisplay.classList.add('hidden');
      ageInput.classList.remove('hidden');
      ageInput.focus();
    });

    ageInput.addEventListener('blur', async () => {
      const newAge = parseInt(ageInput.value);
      if (newAge && newAge >= 10 && newAge <= 100) {
        try {
          await updateUserProfile({ age: newAge });
          state.user.age = newAge;
          ageDisplay.innerHTML = newAge;
        } catch (error) {
          alert('更新年龄失败：' + error.message);
        }
      }
      ageInput.classList.add('hidden');
      ageDisplay.classList.remove('hidden');
    });

    ageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        ageInput.blur();
      }
    });
  }

  // 添加体型选择功能
  const shapeTile = document.getElementById('shape-tile');
  const shapeDisplay = document.getElementById('shape-display');
  const shapeSelector = document.getElementById('shape-selector');
  
  if (shapeTile && shapeDisplay && shapeSelector) {
    shapeTile.addEventListener('click', (e) => {
      if (!e.target.closest('.shape-option')) {
        shapeDisplay.classList.add('hidden');
        shapeSelector.classList.remove('hidden');
      }
    });

    const shapeOptions = shapeSelector.querySelectorAll('.shape-option');
    shapeOptions.forEach(option => {
      option.addEventListener('click', async () => {
        const newShape = option.dataset.shape;
        try {
          await updateUserProfile({ body_shape: newShape });
          state.user.body_shape = newShape;
          shapeDisplay.innerHTML = bodyShapeMap[newShape] || newShape;
          
          // 更新选中状态
          shapeOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        } catch (error) {
          alert('更新体型失败：' + error.message);
        }
        shapeSelector.classList.add('hidden');
        shapeDisplay.classList.remove('hidden');
      });
    });

    // 点击外部关闭选择器
    document.addEventListener('click', (e) => {
      if (!shapeTile.contains(e.target) && !shapeSelector.classList.contains('hidden')) {
        shapeSelector.classList.add('hidden');
        shapeDisplay.classList.remove('hidden');
      }
    });
  }

  // 添加肤色季型选择功能
  const seasonTile = document.getElementById('season-tile');
  const seasonDisplay = document.getElementById('season-display');
  const seasonSelect = document.getElementById('season-select');
  
  if (seasonTile && seasonDisplay && seasonSelect) {
    seasonTile.addEventListener('click', () => {
      seasonDisplay.classList.add('hidden');
      seasonSelect.classList.remove('hidden');
      seasonSelect.focus();
    });

    seasonSelect.addEventListener('change', async () => {
      const newSeason = seasonSelect.value;
      try {
        await updateUserProfile({ skin_season: newSeason });
        state.user.skin_season = newSeason;
        seasonDisplay.textContent = skinSeasonMap[newSeason] || newSeason;
      } catch (error) {
        alert('更新肤色季型失败：' + error.message);
      }
      seasonSelect.classList.add('hidden');
      seasonDisplay.classList.remove('hidden');
    });

    seasonSelect.addEventListener('blur', () => {
      seasonSelect.classList.add('hidden');
      seasonDisplay.classList.remove('hidden');
    });
  }
}

function summariseWardrobe(items) {
  const total = items.length;
  const categories = items.reduce((map, item) => {
    map[item.category] = (map[item.category] || 0) + 1;
    return map;
  }, {});
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  return {
    total,
    categories,
    topCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null,
  };
}

function renderWardrobeSummary(items) {
  const metrics = document.getElementById("wardrobe-metrics");
  const list = document.getElementById("wardrobe-list");

  if (!items.length) {
    metrics.innerHTML = '<div class="metric-tile"><div class="label">状态</div><div class="value">暂无单品</div></div>';
    list.innerHTML = '<div class="empty-state">去上传第一件衣服，让我们为你生成灵感搭配。</div>';
    return;
  }

  const summary = summariseWardrobe(items);
  metrics.innerHTML = `
    <div class="metric-tile">
      <div class="label">衣橱总数</div>
      <div class="value">${summary.total}</div>
    </div>
    <div class="metric-tile">
      <div class="label">主力品类</div>
      <div class="value">${summary.topCategory ? summary.topCategory.name.toUpperCase() : "-"}</div>
    </div>
  `;

  list.innerHTML = items
    .map((item) => {
      const palette = Array.isArray(item.palette) ? item.palette.slice(0, 3) : [];
      const mainColor = item.main_color_hex || "#d1d5db";
      return `
        <div class="wardrobe-item">
          <div class="info">
            <h3>${item.name}</h3>
            <div class="tags">
              <span class="tag">${item.category}</span>
              ${item.silhouette ? `<span class="tag">版型 ${item.silhouette}</span>` : ""}
              ${item.season ? `<span class="tag">${item.season}</span>` : ""}
            </div>
          </div>
          <div class="palette">
            <div class="color-chip" style="background:${mainColor}"></div>
            ${
              palette.length
                ? `<div class="tags">${palette
                    .map((swatch) => `<span class="tag">${swatch.hex}</span>`)
                    .join("")}</div>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderNewArrivals(items) {
  const container = document.getElementById("new-arrivals-list");
  const showcase = items.slice(0, 4);
  if (!showcase.length) {
    container.innerHTML = `
      <div class="product-card">
        <div class="category">Essential</div>
        <div class="name">初秋基础针织</div>
        <p class="desc">柔软亲肤的米白色针织，搭配高腰长裤提升整体质感。</p>
      </div>
      <div class="product-card">
        <div class="category">Outer</div>
        <div class="name">轻盈机能夹克</div>
        <p class="desc">利落剪裁搭配防风面料，日常通勤也能保有高级感。</p>
      </div>
    `;
    return;
  }

  container.innerHTML = showcase
    .map(
      (item) => `
        <div class="product-card">
          <div class="category">${item.category}</div>
          <div class="name">${item.name}</div>
          <p class="desc">适配你的肤色 ${item.main_color_hex}，可与衣橱中 ${item.silhouette || "多种版型"} 单品混搭。</p>
        </div>
      `
    )
    .join("");
}

function renderRecommendations(results) {
  const container = document.getElementById("recommendation-list");
  if (!results.length) {
    container.innerHTML = '<div class="empty-state">点击上方“生成推荐”获取今日穿搭灵感。</div>';
    return;
  }

  container.innerHTML = results
    .map((res) => {
      const { item } = res;
      const totalScore = typeof res.total_score === "number" ? res.total_score : 0;
      const scores = [
        { label: "色彩匹配", value: res.color_score ?? 0 },
        { label: "体型匹配", value: res.body_score ?? 0 },
        { label: "年龄匹配", value: res.age_score ?? 0 },
      ];
      return `
        <div class="recommendation-card">
          <div class="title">
            <h3>${item.name}</h3>
            <p class="desc">综合得分 ${totalScore.toFixed(2)}</p>
          </div>
          ${scores
            .map(
              (score) => `
              <div>
                <div class="score-row">
                  <span>${score.label}</span>
                  <span>${(score.value * 100).toFixed(0)}%</span>
                </div>
                <div class="score-bar"><span style="width:${Math.max(0, Math.min(score.value, 1)) * 100}%"></span></div>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    })
    .join("");
}

function renderTips(user) {
  const container = document.getElementById("tips-list");
  if (!user) {
    container.innerHTML = '<div class="tip-card">登录后即可获得个性化风格建议。</div>';
    return;
  }

  const tips = [];
  const seasonTips = {
    spring: "选择带有暖调的米色、驼色与珊瑚橙，保持整体的轻盈感。",
    summer: "以冷调的薄荷绿、雾霾蓝为主色调，面料选择轻薄透气。",
    autumn: "焦糖棕、酒红色是秋日氛围感首选，搭配羊毛、灯芯绒等质感材质。",
    winter: "黑白灰搭配宝石蓝或深紫，营造冬季高级对比感。",
  };

  if (user.skin_season && seasonTips[user.skin_season]) {
    tips.push({ title: "色彩建议", content: seasonTips[user.skin_season] });
  }

  if (user.body_shape) {
    const shapeTips = {
      A: "强调上半身，选择有结构感的外套与肩部设计。",
      H: "利用腰带或高腰线拉出比例，兼顾松弛与精致。",
      X: "突出腰线，选择修身剪裁与柔软面料。",
      O: "选择顺垂面料打造流畅线条，避免过于贴身。",
      T: "下装选择有分量的阔腿裤或A字裙，平衡肩部比例。",
    };
    tips.push({ title: "体型搭配", content: shapeTips[user.body_shape] || "选择顺垂面料与清晰腰线。" });
  }

  tips.push({ title: "面料建议", content: "选用天然材质（棉、毛、丝）与机能面料混搭，兼顾舒适与时尚。" });

  container.innerHTML = tips
    .map((tip) => `
      <div class="tip-card">
        <h3>${tip.title}</h3>
        <p>${tip.content}</p>
      </div>
    `)
    .join("");
}

async function loadData() {
  try {
    const userResp = await fetchJSON("/api/user");
    state.user = userResp?.data?.user || null;

    if (state.user) {
      try {
        const wardrobeResp = await fetchJSON("/api/wardrobe");
        state.wardrobe = wardrobeResp?.data?.items || [];
      } catch (error) {
        console.warn("无法加载衣橱数据", error);
        state.wardrobe = [];
      }
    } else {
      state.wardrobe = [];
      state.recommendations = [];
    }

    renderProfile(state.user);
    renderWardrobeSummary(state.wardrobe);
    renderNewArrivals(state.wardrobe);
    renderTips(state.user);
    renderRecommendations(state.recommendations);
    updateAuthUI();
  } catch (error) {
    console.error(error);
    state.user = null;
    state.wardrobe = [];
    renderProfile(null);
    renderWardrobeSummary([]);
    renderNewArrivals([]);
    renderTips(null);
    renderRecommendations([]);
    updateAuthUI();
  }
}

async function refreshRecommendations() {
  if (!state.user) {
    openAuthModal();
    return;
  }
  try {
    const data = await fetchJSON("/api/recommendations", { method: "POST" });
    state.recommendations = data?.data?.results || [];
    renderRecommendations(state.recommendations);
  } catch (error) {
    if (error.code === "AUTH_REQUIRED") {
      openAuthModal();
      return;
    }
    alert(`生成推荐失败：${error.message}`);
  }
}

async function login(username, password) {
  return fetchJSON("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function logout() {
  return fetchJSON("/api/auth/logout", { method: "POST" });
}

async function updateUserProfile(data) {
  return fetchJSON("/api/user/update", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateAuthUI() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const refreshBtn = document.getElementById("refresh");
  const heroBtn = document.getElementById("hero-refresh");

  const isLoggedIn = Boolean(state.user);
  toggleElementDisplay(loginBtn, !isLoggedIn);
  toggleElementDisplay(logoutBtn, isLoggedIn);

  if (refreshBtn) {
    refreshBtn.disabled = !isLoggedIn;
    refreshBtn.title = isLoggedIn ? "生成最新推荐" : "登录后可生成推荐";
  }
  if (heroBtn) {
    heroBtn.disabled = !isLoggedIn;
    heroBtn.title = isLoggedIn ? "生成最新推荐" : "登录后可生成推荐";
  }
}

function openAuthModal() {
  updateAuthUI();
  const modal = document.getElementById("auth-modal");
  if (modal) openModal(modal);
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) closeModal(modal);
}

function initAuthEvents() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const dismissTriggers = document.querySelectorAll('[data-dismiss="modal"]');

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (!state.user) {
        if (loginMessage) loginMessage.textContent = "";
        openAuthModal();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await logout();
      } finally {
        state.user = null;
        state.recommendations = [];
        await loadData();
      }
    });
  }

  dismissTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeAuthModal);
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const username = (formData.get("username") || "").toString().trim();
      const password = (formData.get("password") || "").toString();
      if (loginMessage) loginMessage.textContent = "";
      if (!username || !password) {
        if (loginMessage) loginMessage.textContent = "请输入用户名和密码";
        return;
      }
      try {
        await login(username, password);
        closeAuthModal();
        loginForm.reset();
        await loadData();
      } catch (error) {
        if (loginMessage) loginMessage.textContent = error.message;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const refreshBtn = document.getElementById("refresh");
  const heroBtn = document.getElementById("hero-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", refreshRecommendations);
  if (heroBtn) heroBtn.addEventListener("click", refreshRecommendations);
  initAuthEvents();
});
