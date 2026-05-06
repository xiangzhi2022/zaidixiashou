const pages = {
  overview: {
    eyebrow: "今日运营中心",
    title: "统一管理电商平台、媒体运营和系统设置",
    hint: "输入运营目标或平台操作，AI 会先分析，再把高风险动作放入审批队列。",
    command: "帮我汇总今天电商订单、媒体互动和待审核发布内容",
    render: renderOverview,
  },
  orders: {
    eyebrow: "订单工作台",
    title: "集中处理跨平台订单、物流异常和退款请求",
    hint: "例如：筛选今天 Amazon 异常订单，生成处理优先级。",
    command: "筛选所有物流超时订单，并给出处理建议",
    render: renderOrders,
  },
  products: {
    eyebrow: "商品与库存",
    title: "管理 Listing、库存、价格和跨平台同步",
    hint: "例如：找出库存低于 20 的商品，并生成补货建议。",
    command: "找出库存低于 20 的商品，并生成补货建议",
    render: renderProducts,
  },
  messages: {
    eyebrow: "消息与评论",
    title: "集中处理买家咨询、评价和社媒私信",
    hint: "例如：为未回复消息生成中文和英文回复草稿。",
    command: "帮我回复物流延迟投诉，语气客气并给优惠券",
    render: renderMessages,
  },
  media: {
    eyebrow: "媒体运营中心",
    title: "统一管理媒体账号、内容生成、草稿审核和发布",
    hint: "例如：围绕旅行收纳主题生成小红书图文、抖音视频脚本和 TikTok 内容，并进入审核。",
    command: "围绕旅行收纳主题生成一组跨平台内容，并安排明天发布",
    render: renderMedia,
  },
  mediaCreative: {
    eyebrow: "图像视频生成",
    title: "统一生成图文、图片、短视频脚本和分镜",
    hint: "例如：把选题和用户洞察转成小红书图文、配图建议、抖音/TikTok 视频脚本。",
    command: "为旅行收纳主题生成小红书图文、配图建议和 30 秒短视频脚本",
    render: renderMediaCreative,
  },
  mediaDrafts: {
    eyebrow: "草稿审核发布",
    title: "预览草稿、完成审核并发布到已授权账号",
    hint: "例如：预览明天要发布的内容，标出风险点并提交审核发布。",
    command: "预览明天待发布内容，标出风险点并放入审核发布",
    render: renderMediaDrafts,
  },
  mediaPublish: {
    eyebrow: "审核发布",
    title: "审核草稿并发布到已授权媒体账号",
    hint: "发布前先检查账号授权、敏感词、素材尺寸和排期冲突。",
    command: "列出所有待审核发布内容，并按风险排序",
    render: renderMediaPublish,
  },
  automation: {
    eyebrow: "自动运营",
    title: "配置数据巡检、互动回复、好友消息和发布触发器",
    hint: "例如：每天汇总互动用户，并自动生成好友消息草稿。",
    command: "新建一个每天 9 点汇总互动用户并生成好友消息的自动化",
    render: renderAutomation,
  },
  accounts: {
    eyebrow: "平台账号管理",
    title: "集中管理电商和媒体平台的登录、授权和权限",
    hint: "例如：检查哪些平台账号需要重新登录。",
    command: "检查所有平台账号授权状态，并列出需要我处理的账号",
    render: renderAccounts,
  },
  autopilot: {
    eyebrow: "自动托管模式",
    title: "让 AI 自动运营，但保留清晰的风险边界",
    hint: "托管模式会自动生成、排期或执行运营动作，高风险动作仍需审批。",
    command: "为媒体发布开启半自动托管，只允许生成草稿和排期",
    render: renderAutopilot,
  },
  approval: {
    eyebrow: "审批与风控",
    title: "确认 AI 准备执行的高风险操作",
    hint: "发布、改价、退款、批量回复都会先进入这里。",
    command: "列出所有待审批动作，并按风险从高到低排序",
    render: renderApproval,
  },
};

// ============ 登录状态管理 ============
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
let currentUser = null;
let currentQRCodeType = 'WECHAT';
let qrCodePollInterval = null;

// ============ 登录弹窗控制 ============
function openLoginModal() {
  const modal = $('#loginModal');
  modal.classList.add('active');
  // 初始化二维码
  if ($('.login-tab.active')?.dataset.tab === 'qrcode') {
    generateQRCode();
  }
}

function closeLoginModal() {
  const modal = $('#loginModal');
  modal.classList.remove('active');
  // 停止轮询
  if (qrCodePollInterval) {
    clearInterval(qrCodePollInterval);
    qrCodePollInterval = null;
  }
}

function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.login-panel').forEach(p => p.classList.remove('active'));
  
  $(`.login-tab[data-tab="${tab}"]`)?.classList.add('active');
  $(`#panel-${tab}`)?.classList.add('active');
  
  // 切换到扫码登录时生成二维码
  if (tab === 'qrcode') {
    generateQRCode();
  } else if (qrCodePollInterval) {
    clearInterval(qrCodePollInterval);
    qrCodePollInterval = null;
  }
}

function switchQRCodeType(type) {
  currentQRCodeType = type;
  document.querySelectorAll('.qrcode-tab').forEach(t => t.classList.remove('active'));
  $(`.qrcode-tab[data-qrtype="${type}"]`)?.classList.add('active');
  $('#scanPlatform').textContent = type === 'WECHAT' ? '微信' : '支付宝';
  generateQRCode();
}

// ============ 登录 API 调用 ============
const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }
  
  return response.json();
}

// 发送短信验证码
async function sendSmsCode() {
  const phone = $('#smsPhone').value.trim();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    showToast('请输入正确的手机号');
    return;
  }
  
  const btn = $('#sendSmsBtn');
  btn.disabled = true;
  btn.textContent = '发送中...';
  
  try {
    await apiRequest('/auth/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    
    showToast('验证码已发送');
    // 60秒倒计时
    let countdown = 60;
    const timer = setInterval(() => {
      countdown--;
      btn.textContent = `${countdown}秒后重试`;
      if (countdown <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '获取验证码';
      }
    }, 1000);
  } catch (error) {
    showToast(error.message);
    btn.disabled = false;
    btn.textContent = '获取验证码';
  }
}

// 短信登录
async function loginBySms() {
  const phone = $('#smsPhone').value.trim();
  const code = $('#smsCode').value.trim();
  
  if (!phone || !/^1\d{10}$/.test(phone)) {
    showToast('请输入正确的手机号');
    return;
  }
  if (!code || code.length !== 6) {
    showToast('请输入6位验证码');
    return;
  }
  
  try {
    const result = await apiRequest('/auth/sms/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    
    handleLoginSuccess(result);
  } catch (error) {
    showToast(error.message);
  }
}

// 邮箱登录
async function loginByEmail() {
  const email = $('#emailInput').value.trim();
  const password = $('#emailPassword').value;
  
  if (!email || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
    showToast('请输入正确的邮箱');
    return;
  }
  if (!password || password.length < 6) {
    showToast('密码至少6位');
    return;
  }
  
  try {
    const result = await apiRequest('/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    handleLoginSuccess(result);
  } catch (error) {
    showToast(error.message);
  }
}

// 邮箱注册
async function registerByEmail() {
  const email = $('#regEmail').value.trim();
  const password = $('#regPassword').value;
  const password2 = $('#regPassword2').value;
  
  if (!email || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
    showToast('请输入正确的邮箱');
    return;
  }
  if (!password || password.length < 6) {
    showToast('密码至少6位');
    return;
  }
  if (password !== password2) {
    showToast('两次密码不一致');
    return;
  }
  
  try {
    const result = await apiRequest('/auth/email/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: email.split('@')[0] }),
    });
    
    handleLoginSuccess(result);
  } catch (error) {
    showToast(error.message);
  }
}

// 生成二维码
async function generateQRCode() {
  const qrcodeBox = $('#qrcodeBox');
  const status = $('#qrcodeStatus');
  
  // 显示加载状态
  qrcodeBox.innerHTML = `
    <div class="qrcode-placeholder">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="3" height="3"/>
        <rect x="18" y="14" width="3" height="3"/>
        <rect x="14" y="18" width="3" height="3"/>
        <rect x="18" y="18" width="3" height="3"/>
      </svg>
      <p>正在生成二维码...</p>
    </div>
  `;
  
  try {
    const result = await apiRequest('/auth/qrcode/generate', {
      method: 'POST',
      body: JSON.stringify({ type: currentQRCodeType }),
    });
    
    // 生成二维码图片 (使用 qrcode.js 或简单模拟)
    // 实际项目中这里会调用微信/支付宝SDK
    qrcodeBox.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="width:160px;height:160px;margin:0 auto;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#94a3b8;">
          <div>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="3" height="3"/>
              <rect x="18" y="14" width="3" height="3"/>
              <rect x="14" y="18" width="3" height="3"/>
              <rect x="18" y="18" width="3" height="3"/>
            </svg>
            <p style="margin:8px 0 0;font-size:11px;">${currentQRCodeType === 'WECHAT' ? '微信' : '支付宝'}<br>扫码登录</p>
            <p style="margin:4px 0 0;color:#f59e0b;font-size:10px;">开发模式</p>
          </div>
        </div>
      </div>
    `;
    
    // 更新状态
    const platformName = currentQRCodeType === 'WECHAT' ? '微信' : '支付宝';
    status.innerHTML = `<span class="dot warn"></span><span>打开${platformName}扫一扫</span>`;
    
    // 开发模式：直接轮询状态
    // 实际项目中，二维码会被微信/支付宝扫描后回调
    if (qrCodePollInterval) clearInterval(qrCodePollInterval);
    qrCodePollInterval = setInterval(async () => {
      await pollQRCodeStatus(result.scene);
    }, 2000);
    
  } catch (error) {
    qrcodeBox.innerHTML = `
      <div class="qrcode-placeholder">
        <p>生成失败，请重试</p>
      </div>
    `;
    showToast(error.message);
  }
}

// 轮询二维码状态
async function pollQRCodeStatus(scene) {
  try {
    const result = await apiRequest(`/auth/qrcode/status?scene=${scene}`);
    
    if (result.state === 'CONFIRMED') {
      // 登录成功
      clearInterval(qrCodePollInterval);
      qrCodePollInterval = null;
      handleLoginSuccess(result.tokens);
    } else if (result.state === 'EXPIRED') {
      // 二维码过期
      clearInterval(qrCodePollInterval);
      qrCodePollInterval = null;
      showToast('二维码已过期，请刷新');
    }
  } catch (error) {
    // 忽略轮询错误
  }
}

// 处理登录成功
function handleLoginSuccess(result) {
  localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, result.refreshToken);
  
  // 获取用户信息
  apiRequest('/auth/profile').then(user => {
    currentUser = user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateUserUI(user);
    closeLoginModal();
    showToast(`欢迎回来，${user.name}`);
  }).catch(() => {
    // 如果获取用户信息失败，仍然认为登录成功
    updateUserUI({ name: '用户', phone: '', email: '' });
    closeLoginModal();
    showToast('登录成功');
  });
}

// 登出
function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  currentUser = null;
  updateUserUI(null);
  showToast('已退出登录');
}

// 更新用户 UI
function updateUserUI(user) {
  const userCard = $('.user-card');
  const userAvatar = $('#userAvatar');
  const userName = $('#userName');
  const loginBtn = $('#loginBtn');
  
  if (user) {
    userCard.classList.add('logged-in');
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
    userName.textContent = user.name;
    
    // 添加退出按钮
    if (!userCard.querySelector('.logout-btn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'logout-btn';
      logoutBtn.textContent = '退出';
      logoutBtn.onclick = logout;
      userCard.appendChild(logoutBtn);
    }
  } else {
    userCard.classList.remove('logged-in');
    userAvatar.textContent = '未';
    userName.textContent = '未登录';
    userCard.querySelector('.logout-btn')?.remove();
  }
}

// 检查登录状态
function checkAuthStatus() {
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  if (userJson) {
    try {
      currentUser = JSON.parse(userJson);
      updateUserUI(currentUser);
    } catch (e) {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }
}

const $ = (selector) => document.querySelector(selector);

function metric(label, value, note, tone = "") {
  return `<article class="metric-panel"><span>${label}</span><strong>${value}</strong><em class="${tone}">${note}</em></article>`;
}

function panel(title, eyebrow, body, actions = "") {
  return `
    <section class="panel">
      <div class="panel-header">
        <div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>
        ${actions}
      </div>
      ${body}
    </section>
  `;
}

function row({ logo = "", logoClass = "", title, subtitle, status = "", actions = "", unread = false }) {
  return `
    <article class="row ${unread ? "unread" : ""}">
      <div class="row-main">
        ${logo ? `<span class="logo ${logoClass}">${logo}</span>` : ""}
        <div><strong>${title}</strong><span class="muted">${subtitle}</span></div>
      </div>
      <div class="row-actions">${status}${actions}</div>
    </article>
  `;
}

function renderOverview() {
  return `
    <section class="metric-grid">
      ${metric("今日 GMV", "$18,420", "较昨日 +12.6%", "up")}
      ${metric("待处理订单", "247", "18 个异常", "warn-text")}
      ${metric("今日浏览量", "182,420", "小红书 + 抖音 + TikTok + Instagram", "up")}
      ${metric("媒体待审核", "4", "草稿预览与审核发布合并处理", "warn-text")}
    </section>
    <div class="grid-2">
      ${panel("电商运营", "核心工作区", `<div class="list">
        ${row({ logo: "订", title: "订单与售后", subtitle: "异常订单、退款、物流跟踪统一处理", status: '<span class="pill warn">18 异常</span>' })}
        ${row({ logo: "品", title: "商品与库存", subtitle: "Listing 优化、补货建议、跨平台同步", status: '<span class="pill ok">在线</span>' })}
        ${row({ logo: "信", title: "消息中心", subtitle: "买家咨询、评价、社媒私信集中回复", status: '<span class="pill red">64 未读</span>' })}
      </div>`)}
      ${panel("媒体运营", "全平台中控", `<div class="list">
        ${row({ logo: "榜", title: "各平台数据榜单", subtitle: "按浏览量、点赞量、收藏量、互动率追踪内容表现", status: '<span class="pill ok">4 平台</span>' })}
        ${row({ logo: "人", title: "互动用户名单", subtitle: "沉淀点赞、收藏、评论、私信用户，筛选高意向人群", status: '<span class="pill warn">326 人</span>' })}
        ${row({ logo: "审", title: "草稿审核发布", subtitle: "草稿预览、风险检查、审核和发布合并处理", status: '<span class="pill warn">4 待审</span>' })}
      </div>`)}
    </div>
    <div class="grid-2">
      ${panel("媒体平台数据榜单", "今日表现", `<table class="table">
        <thead><tr><th>平台</th><th>浏览</th><th>点赞</th><th>收藏</th><th>互动率</th></tr></thead>
        <tbody>
          <tr><td>小红书</td><td>62,400</td><td>8,910</td><td>3,240</td><td>19.4%</td></tr>
          <tr><td>抖音</td><td>54,820</td><td>6,780</td><td>1,920</td><td>15.9%</td></tr>
          <tr><td>TikTok</td><td>47,360</td><td>2,940</td><td>486</td><td>7.2%</td></tr>
          <tr><td>Instagram</td><td>17,840</td><td>330</td><td>200</td><td>3.1%</td></tr>
        </tbody>
      </table>`)}
      ${panel("互动用户名单", "点赞 / 收藏 / 评论 / 私信", `<div class="list">
        ${row({ logo: "小", title: "小红书用户：Luna_旅行手帐", subtitle: "收藏 3 篇、评论 2 次，建议加好友并发送搭配清单", status: '<span class="pill warn">高意向</span>' })}
        ${row({ logo: "抖", title: "抖音用户：阿敏爱收纳", subtitle: "点赞视频并私信问价格，可发送优惠码", status: '<span class="pill ok">可触达</span>' })}
        ${row({ logo: "IG", title: "Instagram：home_daily", subtitle: "保存 Reels，关注同类收纳内容", status: '<span class="pill gray">培育</span>' })}
      </div>`)}
    </div>
    ${panel("系统设置", "账号与风控", `<div class="grid-3">
      <div class="goal-card"><strong>平台账号管理</strong><span class="card-note">电商和媒体账号授权、登录、权限</span></div>
      <div class="goal-card risky-option"><strong>自动托管模式</strong><span class="card-note">高风险动作进入审批队列</span></div>
      <div class="goal-card"><strong>审批</strong><span class="card-note">发布、改价、退款、批量回复统一确认</span></div>
    </div>`)}
  `;
}

function renderOrders() {
  return `
    <section class="metric-grid">
      ${metric("今日订单", "247", "34 个新订单", "up")}
      ${metric("异常订单", "18", "需要优先处理", "warn-text")}
      ${metric("待发货", "73", "最晚 18:00 前处理")}
      ${metric("退款请求", "6", "2 个高风险", "warn-text")}
    </section>
    ${panel("订单列表", "跨平台聚合", `<table class="table">
      <thead><tr><th>订单</th><th>平台</th><th>状态</th><th>金额</th><th>优先级</th><th>操作</th></tr></thead>
      <tbody>
        <tr><td>#A-10482</td><td>Amazon</td><td>物流超时</td><td>$128.40</td><td>高</td><td><button class="ghost-button js-action">处理</button></td></tr>
        <tr><td>#E-87312</td><td>eBay</td><td>买家要求退款</td><td>$42.90</td><td>高</td><td><button class="ghost-button js-action">处理</button></td></tr>
        <tr><td>#S-22409</td><td>Shopify</td><td>待发货</td><td>$86.00</td><td>中</td><td><button class="ghost-button js-action">处理</button></td></tr>
        <tr><td>#TK-8810</td><td>TikTok Shop</td><td>正常</td><td>$54.20</td><td>低</td><td><button class="ghost-button js-action">查看</button></td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderProducts() {
  return `
    <section class="grid-3">
      <div class="goal-card"><strong>SKU 总数 1,248</strong><span class="card-note">7 个平台同步中</span></div>
      <div class="goal-card"><strong>低库存 32</strong><span class="card-note">建议 48 小时内补货</span></div>
      <div class="goal-card"><strong>待优化 Listing 86</strong><span class="card-note">标题、主图、价格可提升</span></div>
    </section>
    ${panel("商品库", "Listing 与库存", `<div class="list">
      ${row({ title: "SKU-D112 夏季运动短裤", subtitle: "库存 18，Amazon/eBay/Shopify 已同步", status: '<span class="pill warn">低库存</span>' })}
      ${row({ title: "SKU-B884 旅行收纳包", subtitle: "库存 220，TikTok Shop 转化率 4.8%", status: '<span class="pill ok">热卖</span>' })}
      ${row({ title: "SKU-X029 宠物梳毛器", subtitle: "主图点击率偏低，建议 A/B 测试", status: '<span class="pill gray">待优化</span>' })}
    </div>`)}
  `;
}

function renderFriendMessagePanel() {
  return `
      ${panel("好友自动消息", "AI 私信草稿", `<div class="reply-box">
        <textarea class="textarea">你好呀，看到你收藏了我们的旅行收纳内容。我整理了一份「短途旅行收纳清单」，也附上今天可用的优惠码，需要的话我发给你。</textarea>
        <div class="split-actions">
          <button class="ghost-button js-action"><i data-lucide="wand-sparkles"></i><span>换一种语气</span></button>
          <button class="ghost-button js-action"><i data-lucide="users"></i><span>生成好友名单</span></button>
          <button class="primary-button js-action"><i data-lucide="send"></i><span>放入审核</span></button>
        </div>
      </div>`)}
  `;
}

function renderDataBoard() {
  return `
    <section class="metric-grid">
      ${metric("总浏览量", "182,420", "较昨日 +18.2%", "up")}
      ${metric("总点赞", "18,940", "小红书贡献 47%", "up")}
      ${metric("总收藏", "5,846", "旅行收纳主题最高", "up")}
      ${metric("互动率", "13.6%", "高于近 7 日均值", "up")}
    </section>
    ${panel("各平台数据榜单", "浏览 / 点赞 / 收藏 / 互动", `<table class="table">
      <thead><tr><th>排名</th><th>平台</th><th>内容</th><th>浏览</th><th>点赞</th><th>收藏</th><th>互动率</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>小红书</td><td>7 天旅行收纳清单</td><td>62,400</td><td>8,910</td><td>3,240</td><td>19.4%</td></tr>
        <tr><td>2</td><td>抖音</td><td>行李箱整理前后对比</td><td>54,820</td><td>6,780</td><td>1,920</td><td>15.9%</td></tr>
        <tr><td>3</td><td>TikTok</td><td>Pack with me for a weekend</td><td>47,360</td><td>2,940</td><td>486</td><td>7.2%</td></tr>
        <tr><td>4</td><td>Instagram</td><td>Desk reset storage reel</td><td>17,840</td><td>330</td><td>200</td><td>3.1%</td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderEngagedUsers() {
  return `
    <div class="grid-2">
      ${panel("高意向互动用户", "点赞 / 收藏 / 评论 / 私信", `<div class="list">
        ${row({ logo: "小", title: "Luna_旅行手帐", subtitle: "收藏 3 篇、评论 2 次，关注旅行收纳话题", status: '<span class="pill warn">加好友</span>' })}
        ${row({ logo: "抖", title: "阿敏爱收纳", subtitle: "点赞视频并私信问价格，可发送优惠码", status: '<span class="pill ok">可触达</span>' })}
        ${row({ logo: "TT", title: "pack_daily", subtitle: "保存视频，留言询问尺寸", status: '<span class="pill warn">需回复</span>' })}
        ${row({ logo: "IG", title: "home_daily", subtitle: "保存 Reels，关注同类整理内容", status: '<span class="pill gray">培育</span>' })}
      </div>`)}
      ${panel("好友名单生成", "AI 筛选", `<div class="reply-box">
        <select class="select"><option>高意向：收藏 + 评论 + 私信</option><option>中意向：点赞 + 收藏</option><option>达人线索：主页粉丝超过 1 万</option></select>
        <textarea class="textarea">筛选规则：优先加入最近 24 小时内多次互动、询问价格、保存内容或评论表达购买兴趣的用户。</textarea>
        <button class="primary-button js-action"><i data-lucide="users"></i><span>生成好友名单</span></button>
      </div>`)}
    </div>
    ${panel("待触达名单", "可复制到私信工作流", `<table class="table">
      <thead><tr><th>用户</th><th>平台</th><th>互动</th><th>建议动作</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>Luna_旅行手帐</td><td>小红书</td><td>收藏 3 / 评论 2</td><td>发送收纳清单</td><td>待审核</td></tr>
        <tr><td>阿敏爱收纳</td><td>抖音</td><td>点赞 4 / 私信 1</td><td>发送优惠码</td><td>可发送</td></tr>
        <tr><td>pack_daily</td><td>TikTok</td><td>保存 1 / 评论 1</td><td>回复尺寸问题</td><td>待回复</td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderMessages() {
  return `
    <section class="message-layout">
      ${panel("消息队列", "买家咨询 / 评价 / 社媒私信", `<div class="list">
        ${row({ title: "eBay 买家：物流为什么还没到？", subtitle: "等待 1 小时 14 分钟，建议先查询物流再补偿优惠券", status: '<span class="pill red">急</span>', unread: true })}
        ${row({ title: "TikTok Shop 买家：这个收纳包有几个尺寸？", subtitle: "收藏后评论，建议发送尺寸图和使用场景", status: '<span class="pill warn">高意向</span>', unread: true })}
        ${row({ title: "Instagram 私信：今天下单有优惠吗？", subtitle: "可发送专属优惠码和购买链接", status: '<span class="pill ok">可回复</span>' })}
      </div>`)}
      ${panel("AI 回复生成", "统一回复工作台", `<div class="reply-box message-preview">
        <textarea class="textarea">您好，非常抱歉让您久等了。我已经帮您查询物流，包裹目前正在转运中，预计 2-4 个工作日内送达。也可以给您补一张下次购物优惠券。</textarea>
        <div class="split-actions">
          <button class="ghost-button js-action"><i data-lucide="languages"></i><span>生成英文</span></button>
          <button class="ghost-button js-action"><i data-lucide="wand-sparkles"></i><span>优化语气</span></button>
          <button class="primary-button js-action"><i data-lucide="send"></i><span>放入审批</span></button>
        </div>
      </div>`)}
    </section>
  `;
}

function renderMedia() {
  return `
    <section class="metric-grid">
      ${metric("今日待发布", "12", "4 条需要审批", "warn-text")}
      ${metric("内容素材", "126", "38 条可复用", "up")}
      ${metric("互动消息", "43", "平均响应 18 分钟")}
      ${metric("达人合作", "9", "3 个待报价")}
    </section>
    <div class="grid-2">
      ${panel("媒体账号矩阵", "发布渠道", `<div class="list">
        ${row({ logo: "小", logoClass: "shopify", title: "小红书", subtitle: "种草笔记、评论、收藏、选题追踪", status: '<span class="pill warn">需登录</span>' })}
        ${row({ logo: "抖", logoClass: "amazon", title: "抖音", subtitle: "短视频、图文、创作者中心、评论回复", status: '<span class="pill warn">待授权</span>' })}
        ${row({ logo: "TT", logoClass: "ebay", title: "TikTok", subtitle: "短视频发布、TikTok Shop 内容带货", status: '<span class="pill ok">可接入</span>' })}
        ${row({ logo: "IG", title: "Instagram", subtitle: "Reels、帖子、Story、私信评论", status: '<span class="pill ok">已连接</span>' })}
      </div>`, '<button class="ghost-button" data-page-shortcut="accounts"><i data-lucide="plug"></i><span>连接账号</span></button>')}
      ${panel("运营中心", "内容生产线", `<div class="list">
        ${row({ title: "图像视频生成", subtitle: "图文、配图、短视频脚本、分镜和字幕建议同一入口", actions: '<button class="ghost-button" data-page-shortcut="mediaCreative">进入</button>' })}
        ${row({ title: "草稿审核发布", subtitle: "按平台预览文案、图片、视频，并完成审核发布", actions: '<button class="primary-button" data-page-shortcut="mediaDrafts">进入</button>' })}
      </div>`)}
    </div>
    ${renderMediaSchedule()}
  `;
}

function renderMediaCreative() {
  return `
    <div class="grid-2">
      ${panel("图文与配图生成", "选题到内容", `<div class="reply-box">
        <input class="input" value="旅行收纳主题：短途出行、行李箱整理、通勤收纳" />
        <select class="select"><option>小红书图文 + 配图建议</option><option>Instagram 帖子 + Reels 封面</option><option>TikTok Shop 内容带货</option></select>
        <textarea class="textarea">生成方向：通勤收纳、旅行整理、周末短途。语气自然，突出真实使用场景、前后对比和收藏价值。</textarea>
        <button class="primary-button js-action"><i data-lucide="image-plus"></i><span>生成图文和配图</span></button>
      </div>`)}
      ${panel("视频脚本与分镜", "短视频生成", `<div class="reply-box">
        <select class="select"><option>抖音 / TikTok 9:16</option><option>Instagram Reels 9:16</option><option>小红书视频 3:4</option></select>
        <textarea class="textarea">口播风格：真实测评，不夸张。字幕需要短句，前 3 秒必须出现痛点，结尾引导收藏和评论领取清单。</textarea>
        <button class="primary-button js-action"><i data-lucide="video"></i><span>生成脚本和分镜</span></button>
      </div>`)}
    </div>
    <div class="grid-2">
      ${panel("生成结果", "图文 / 图片", `<div class="list">
        ${row({ title: "小红书标题 A", subtitle: "出差箱子终于不乱了，这个收纳方法真能救急", status: '<span class="pill ok">可用</span>' })}
        ${row({ title: "配图建议", subtitle: "开箱平铺图、旅行箱对比图、分层细节图、封面文字图", status: '<span class="pill gray">待选图</span>' })}
        ${row({ title: "话题标签", subtitle: "#旅行收纳 #出差好物 #通勤包整理 #行李箱整理", status: '<span class="pill ok">已生成</span>' })}
      </div>`)}
      ${panel("生成结果", "视频 / 分镜", `<div class="list">
        ${row({ title: "镜头 1：痛点开场", subtitle: "行李箱打开，衣物和充电线混在一起。字幕：出门三天，箱子先乱了。", status: '<span class="pill ok">0-5s</span>' })}
        ${row({ title: "镜头 2：整理过程", subtitle: "按衣物、洗漱、电子配件三个区域快速分类，画面节奏加快。", status: '<span class="pill ok">6-18s</span>' })}
        ${row({ title: "镜头 3：互动引导", subtitle: "整理前后对比，提醒观众收藏清单并评论领取模板。", status: '<span class="pill ok">19-30s</span>' })}
      </div>`)}
    </div>
    ${panel("平台适配", "发布前建议", `<table class="table">
      <thead><tr><th>平台</th><th>内容形态</th><th>开头钩子</th><th>素材要求</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>小红书</td><td>图文 / 视频</td><td>出差三天，箱子怎么不乱？</td><td>封面 3:4，6 张图</td><td>待审核</td></tr>
        <tr><td>抖音</td><td>短视频</td><td>出门前 10 分钟这样整理</td><td>9:16 视频，强字幕</td><td>可生成</td></tr>
        <tr><td>TikTok</td><td>短视频</td><td>Pack with me for 3 days</td><td>英文字幕，前 3 秒钩子</td><td>可生成</td></tr>
        <tr><td>Instagram</td><td>Reels / 帖子</td><td>Weekend bag reset</td><td>Reels 封面 + 话题标签</td><td>待确认</td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderMediaGraphic() {
  return `
    <div class="grid-2">
      ${panel("图文生成器", "选题到内容", `<div class="reply-box">
        <input class="input" value="旅行收纳主题：短途出行、行李箱整理、通勤收纳" />
        <select class="select"><option>小红书种草笔记</option><option>Instagram caption</option><option>TikTok Shop 商品短文案</option></select>
        <textarea class="textarea">生成方向：通勤收纳、旅行整理、周末短途。语气自然，突出真实使用场景、前后对比和收藏价值。</textarea>
        <button class="primary-button js-action"><i data-lucide="sparkles"></i><span>生成图文草稿</span></button>
      </div>`)}
      ${panel("生成结果", "预览", `<div class="list">
        ${row({ title: "小红书标题 A", subtitle: "出差箱子终于不乱了，这个收纳包真能装", status: '<span class="pill ok">可用</span>' })}
        ${row({ title: "配图建议", subtitle: "开箱平铺图、旅行箱对比图、分层细节图", status: '<span class="pill gray">待选图</span>' })}
        ${row({ title: "话题标签", subtitle: "#旅行收纳 #出差好物 #通勤包整理", status: '<span class="pill ok">已生成</span>' })}
      </div>`)}
    </div>
  `;
}

function renderMediaVideo() {
  return `
    <div class="grid-2">
      ${panel("视频脚本", "具体页面", `<div class="list">
        ${row({ title: "镜头 1：痛点开场", subtitle: "行李箱打开，衣物和充电线混在一起。字幕：出门三天，箱子先乱了。", status: '<span class="pill ok">0-5s</span>' })}
        ${row({ title: "镜头 2：整理过程", subtitle: "按衣物、洗漱、电子配件三个区域快速分类，画面节奏加快。", status: '<span class="pill ok">6-18s</span>' })}
        ${row({ title: "镜头 3：结果对比", subtitle: "整理前后对比，提醒观众收藏清单并评论领取模板。", status: '<span class="pill ok">19-30s</span>' })}
      </div>`)}
      ${panel("视频生成设置", "平台适配", `<div class="reply-box">
        <select class="select"><option>抖音 9:16</option><option>TikTok 9:16</option><option>Instagram Reels 9:16</option></select>
        <textarea class="textarea">口播风格：真实测评，不夸张。字幕需要短句，前 3 秒必须出现痛点。</textarea>
        <button class="primary-button js-action"><i data-lucide="video"></i><span>生成分镜和口播</span></button>
      </div>`)}
    </div>
    ${panel("生成结果", "脚本 / 字幕 / 发布建议", `<table class="table">
      <thead><tr><th>平台</th><th>开头钩子</th><th>字幕风格</th><th>建议发布时间</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>抖音</td><td>出门前 10 分钟这样整理</td><td>短句强节奏</td><td>今晚 20:30</td><td>待审核</td></tr>
        <tr><td>TikTok</td><td>Pack with me for 3 days</td><td>英文简句</td><td>明天 09:00</td><td>可生成</td></tr>
        <tr><td>Instagram</td><td>Weekend bag reset</td><td>轻量生活方式</td><td>明天 12:00</td><td>可生成</td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderMediaDrafts() {
  return `
    ${panel("草稿审核发布", "预览 / 检查 / 发布", `<div class="list">
      ${row({ title: "旅行收纳清单｜小红书", subtitle: "图文 6 张，标题 2 版，正文 428 字", status: '<span class="pill ok">素材完整</span>' })}
      ${row({ title: "行李箱整理前后对比｜TikTok", subtitle: "短视频脚本已生成，待补封面图", status: '<span class="pill warn">缺封面</span>' })}
      ${row({ title: "Weekend bag reset｜Instagram", subtitle: "Reels 文案、字幕、话题标签已生成", status: '<span class="pill gray">待确认</span>' })}
    </div>`)}
    <div class="grid-2">
      ${panel("预览文案", "小红书", `<textarea class="textarea">出差三天，箱子最怕越翻越乱。我的整理方式是先按使用频率分层，再把洗漱、电子配件和换洗衣物分开。收藏这份清单，下次出门直接照着装。</textarea>`)}
      ${panel("审核清单", "发布前检查", `<div class="list">
        ${row({ title: "敏感词检查", subtitle: "未发现平台风险词", status: '<span class="pill ok">通过</span>' })}
        ${row({ title: "图片尺寸", subtitle: "1 张封面图需要裁成 3:4", status: '<span class="pill warn">需处理</span>' })}
      </div>`)}
    </div>
    ${panel("多平台预览", "发布前对照", `<table class="table">
      <thead><tr><th>平台</th><th>标题</th><th>素材</th><th>风险</th><th>动作</th></tr></thead>
      <tbody>
        <tr><td>小红书</td><td>7 天旅行收纳清单</td><td>6 图</td><td>无</td><td><button class="ghost-button js-action">预览</button></td></tr>
        <tr><td>TikTok</td><td>Pack with me for 3 days</td><td>视频脚本</td><td>缺封面</td><td><button class="ghost-button js-action">补素材</button></td></tr>
        <tr><td>Instagram</td><td>Weekend bag reset</td><td>Reels</td><td>话题偏少</td><td><button class="ghost-button js-action">补标签</button></td></tr>
      </tbody>
    </table>`)}
  `;
}

function renderMediaPublish() {
  return `
    ${panel("审核发布", "发布队列", `<table class="table">
      <thead><tr><th>内容</th><th>平台</th><th>状态</th><th>发布时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr><td>旅行收纳清单</td><td>小红书</td><td>待审核</td><td>明天 10:00</td><td><button class="ghost-button js-action">预览</button></td></tr>
        <tr><td>行李箱整理前后对比</td><td>TikTok</td><td>缺封面</td><td>明天 18:30</td><td><button class="ghost-button js-action">补素材</button></td></tr>
        <tr><td>达人测评合作</td><td>Instagram</td><td>待报价</td><td>周五 12:00</td><td><button class="ghost-button js-action">确认</button></td></tr>
      </tbody>
    </table>`, '<button class="primary-button js-action"><i data-lucide="send-check"></i><span>通过并发布</span></button>')}
  `;
}

function renderMediaSchedule() {
  return panel("媒体排期", "跨平台内容", `<div class="list">
    ${row({ title: "旅行收纳清单", subtitle: "小红书图文、抖音短视频、Instagram caption", status: '<span class="pill ok">已排期</span>' })}
    ${row({ title: "行李箱整理前后对比", subtitle: "TikTok 短视频脚本待审核", status: '<span class="pill warn">待审核</span>' })}
    ${row({ title: "达人测评合作", subtitle: "3 位达人等待报价确认", status: '<span class="pill gray">草稿</span>' })}
  </div>`);
}

function renderAutomation() {
  return panel("自动化流程", "定时任务", `<div class="list">
    ${row({ title: "每天 9 点汇总媒体数据", subtitle: "生成浏览、点赞、收藏、互动榜单", status: '<span class="pill ok">运行中</span>' })}
    ${row({ title: "每 2 小时扫描高意向用户", subtitle: "把点赞、收藏、评论、私信用户加入好友名单", status: '<span class="pill ok">运行中</span>' })}
    ${row({ title: "好友自动消息", subtitle: "为高意向用户生成私信草稿，审核后发送", status: '<span class="pill warn">待审核</span>' })}
    ${row({ title: "媒体草稿每日汇总", subtitle: "把图文和视频草稿放入审核发布", status: '<span class="pill ok">运行中</span>' })}
  </div>`);
}

function renderAccounts() {
  return panel("平台账号", "授权状态", `<div class="list">
    ${row({ logo: "小", title: "小红书", subtitle: "种草笔记、评论、收藏、选题追踪", status: '<span class="pill warn">需登录</span>' })}
    ${row({ logo: "抖", title: "抖音", subtitle: "短视频、图文、创作者中心、评论回复", status: '<span class="pill warn">待授权</span>' })}
    ${row({ logo: "TT", title: "TikTok", subtitle: "短视频发布、TikTok Shop 内容带货", status: '<span class="pill ok">可接入</span>' })}
    ${row({ logo: "IG", title: "Instagram", subtitle: "Reels、帖子、Story、私信评论", status: '<span class="pill ok">已连接</span>' })}
  </div>`);
}

function renderAutopilot() {
  return `<section class="risk-banner"><div><strong>自动托管模式需要风险边界</strong><p>建议先开启半自动：允许生成草稿、排期和提醒，发布、退款、改价等操作仍进入审批。</p></div><button class="danger-button js-action">配置边界</button></section>${renderAutomation()}`;
}

function renderApproval() {
  return panel("审批队列", "待确认动作", `<div class="list">
    ${row({ title: "发布旅行收纳小红书图文", subtitle: "需确认封面图、话题标签和发布时间", actions: '<button class="icon-button js-deny"><i data-lucide="x"></i></button><button class="icon-button approve js-approve"><i data-lucide="check"></i></button>' })}
    ${row({ title: "发送 326 条好友消息", subtitle: "高意向用户私信草稿，需确认话术不过度营销", actions: '<button class="icon-button js-deny"><i data-lucide="x"></i></button><button class="icon-button approve js-approve"><i data-lucide="check"></i></button>' })}
    ${row({ title: "回复 64 条评论和私信", subtitle: "需要检查语气、优惠信息和平台敏感词", actions: '<button class="icon-button js-deny"><i data-lucide="x"></i></button><button class="icon-button approve js-approve"><i data-lucide="check"></i></button>' })}
  </div>`);
}

function renderSimplePage(title, eyebrow, rows) {
  const tableRows = rows.map((item) => `<tr>${item.map((cell) => `<td>${cell}</td>`).join("")}<td><button class="ghost-button js-action">处理</button></td></tr>`).join("");
  return panel(title, eyebrow, `<table class="table"><thead><tr><th>编号</th><th>平台</th><th>状态</th><th>金额</th><th>优先级</th><th>操作</th></tr></thead><tbody>${tableRows}</tbody></table>`);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function setPage(pageKey) {
  const page = pages[pageKey] || pages.overview;
  $("#pageEyebrow").textContent = page.eyebrow;
  $("#pageTitle").textContent = page.title;
  $("#commandHint").textContent = page.hint;
  $("#commandInput").value = page.command;
  $("#pageContent").innerHTML = page.render();
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === pageKey));
  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page], [data-page-shortcut]");
  if (pageButton) {
    setPage(pageButton.dataset.page || pageButton.dataset.pageShortcut);
    return;
  }

  if (event.target.closest("#runCommandBtn")) showToast("已生成执行计划，等待确认");
  if (event.target.closest("#refreshBtn")) showToast("数据已刷新");
  
  // 登录弹窗事件
  if (event.target.closest("#loginBtn")) openLoginModal();
  if (event.target.closest("#loginClose") || event.target.closest("#loginOverlay")) closeLoginModal();
  
  // 登录方式切换
  if (event.target.closest(".login-tab")) {
    switchLoginTab(event.target.closest(".login-tab").dataset.tab);
  }
  
  // 扫码类型切换
  if (event.target.closest(".qrcode-tab")) {
    switchQRCodeType(event.target.closest(".qrcode-tab").dataset.qrtype);
  }
  
  // 发送短信验证码
  if (event.target.closest("#sendSmsBtn")) sendSmsCode();
  
  // 短信登录
  if (event.target.closest("#smsLoginBtn")) loginBySms();
  
  // 邮箱登录
  if (event.target.closest("#emailLoginBtn")) loginByEmail();
  
  // 邮箱注册
  if (event.target.closest("#emailRegisterBtn")) {
    $('#registerPanel').style.display = 'block';
    $('#panel-email').style.display = 'none';
  }
  
  // 返回登录
  if (event.target.closest("#backToLoginBtn")) {
    $('#registerPanel').style.display = 'none';
    $('#panel-email').style.display = 'block';
  }
  
  // 执行注册
  if (event.target.closest("#doRegisterBtn")) registerByEmail();
  
  if (event.target.closest(".js-approve")) showToast("已批准，进入执行队列");
  if (event.target.closest(".js-deny")) showToast("已驳回，保留记录");
  if (event.target.closest(".js-action")) showToast("操作已加入工作流");
});

// 键盘事件 - ESC 关闭弹窗
document.addEventListener("keydown", (event) => {
  if (event.key === 'Escape') {
    closeLoginModal();
  }
});

setPage("overview");
checkAuthStatus();
