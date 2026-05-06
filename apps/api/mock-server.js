/**
 * 沙箱 Mock API 服务器
 * 无需 PostgreSQL/Redis，提供前端所需的全部 API 端点
 * 仅用于开发预览，生产环境使用完整 NestJS API
 */
import { createServer } from 'http';

const PORT = Number(process.env.PORT || 3001);

// ─── Mock Data ───────────────────────────────────────────
const USERS = {};
const PLATFORM_ACCOUNTS = [
  { id: 'pa_1', platform: 'xiaohongshu', platformName: '小红书', accountName: '设计师阿花', accountId: 'xiaohongshu_designer', avatarUrl: '', status: 'CONNECTED', connectedAt: '2025-01-15T10:30:00Z', browserConnected: true, lastSyncAt: '2025-06-20T08:00:00Z' },
  { id: 'pa_2', platform: 'douyin', platformName: '抖音', accountName: '好物推荐官', accountId: 'douyin_goods', avatarUrl: '', status: 'CONNECTED', connectedAt: '2025-02-20T14:00:00Z', browserConnected: true, lastSyncAt: '2025-06-19T16:00:00Z' },
  { id: 'pa_3', platform: 'taobao', platformName: '淘宝', accountName: '潮流数码旗舰', accountId: 'taobao_digital', avatarUrl: '', status: 'CONNECTED', connectedAt: '2025-03-10T09:00:00Z', browserConnected: false, lastSyncAt: '2025-06-18T12:00:00Z' },
  { id: 'pa_4', platform: 'pinduoduo', platformName: '拼多多', accountName: '优惠小铺', accountId: 'pdd_shop', avatarUrl: '', status: 'DISCONNECTED', connectedAt: null, browserConnected: false, lastSyncAt: null },
  { id: 'pa_5', platform: 'jd', platformName: '京东', accountName: '', accountId: '', avatarUrl: '', status: 'PENDING', connectedAt: null, browserConnected: false, lastSyncAt: null },
];

const AI_KEYS = [
  { id: 'ak_1', name: '主力 GPT-4o', provider: 'openai', model: 'gpt-4o', apiKey: 'sk-***...***3xKz', isDefault: true, status: 'ACTIVE', createdAt: '2025-01-10T08:00:00Z', lastUsedAt: '2025-06-20T10:00:00Z' },
  { id: 'ak_2', name: 'Claude 备用', provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: 'sk-ant-***...***7mNx', isDefault: false, status: 'ACTIVE', createdAt: '2025-03-15T12:00:00Z', lastUsedAt: '2025-06-18T09:00:00Z' },
  { id: 'ak_3', name: 'DeepSeek 性价比', provider: 'deepseek', model: 'deepseek-chat', apiKey: 'sk-***...***9pQr', isDefault: false, status: 'INACTIVE', createdAt: '2025-05-01T10:00:00Z', lastUsedAt: null },
];

const ORDERS = [
  { id: 'ord_001', orderNo: 'XHS20250620001', platform: 'xiaohongshu', platformName: '小红书', product: '无线蓝牙耳机 Pro', customer: '张**', amount: 299.00, currency: 'CNY', status: 'PAID', paidAt: '2025-06-20T10:30:00Z', shippingStatus: 'PENDING', aiSuggestion: '建议24小时内发货，提升店铺评分' },
  { id: 'ord_002', orderNo: 'DY20250620002', platform: 'douyin', platformName: '抖音', product: '智能手表 S9', customer: '李**', amount: 899.00, currency: 'CNY', status: 'SHIPPED', paidAt: '2025-06-19T14:20:00Z', shippingStatus: 'IN_TRANSIT', aiSuggestion: '物流正常，预计明日到达' },
  { id: 'ord_003', orderNo: 'TB20250619003', platform: 'taobao', platformName: '淘宝', product: '便携充电宝 20000mAh', customer: '王**', amount: 159.00, currency: 'CNY', status: 'DELIVERED', paidAt: '2025-06-18T09:00:00Z', shippingStatus: 'DELIVERED', aiSuggestion: '已签收，建议主动关怀提升复购' },
  { id: 'ord_004', orderNo: 'XHS20250618004', platform: 'xiaohongshu', platformName: '小红书', product: '有机抹茶粉 100g', customer: '赵**', amount: 89.00, currency: 'CNY', status: 'REFUNDING', paidAt: '2025-06-18T16:45:00Z', shippingStatus: 'RETURNED', aiSuggestion: '退款原因：商品与描述不符，建议优化商品详情页' },
  { id: 'ord_005', orderNo: 'DY20250617005', platform: 'douyin', platformName: '抖音', product: '瑜伽垫 加厚款', customer: '孙**', amount: 128.00, currency: 'CNY', status: 'PAID', paidAt: '2025-06-17T11:30:00Z', shippingStatus: 'PENDING', aiSuggestion: '爆款商品，建议优先发货' },
  { id: 'ord_006', orderNo: 'TB20250617006', platform: 'taobao', platformName: '淘宝', product: 'USB-C 扩展坞', customer: '周**', amount: 259.00, currency: 'CNY', status: 'CANCELLED', paidAt: null, shippingStatus: 'NONE', aiSuggestion: '客户取消，原因为预算调整' },
];

const PRODUCTS = [
  { id: 'prod_001', name: '无线蓝牙耳机 Pro', sku: 'XHS-BT-001', platform: 'xiaohongshu', platformName: '小红书', price: 299.00, stock: 156, sold: 2340, status: 'ACTIVE', category: '数码', aiScore: 87, aiSuggestion: '主图CTR偏低，建议A/B测试新主图', coverUrl: '' },
  { id: 'prod_002', name: '智能手表 S9', sku: 'DY-SW-009', platform: 'douyin', platformName: '抖音', price: 899.00, stock: 42, sold: 856, status: 'ACTIVE', category: '数码', aiScore: 92, aiSuggestion: '库存偏低，建议补货避免断货', coverUrl: '' },
  { id: 'prod_003', name: '便携充电宝 20000mAh', sku: 'TB-PB-003', platform: 'taobao', platformName: '淘宝', price: 159.00, stock: 0, sold: 5680, status: 'OUT_OF_STOCK', category: '数码', aiScore: 78, aiSuggestion: '已断货，历史销量好，建议紧急补货', coverUrl: '' },
  { id: 'prod_004', name: '有机抹茶粉 100g', sku: 'XHS-MT-004', platform: 'xiaohongshu', platformName: '小红书', price: 89.00, stock: 320, sold: 1245, status: 'ACTIVE', category: '食品', aiScore: 65, aiSuggestion: '差评率上升，建议检查品控', coverUrl: '' },
  { id: 'prod_005', name: '瑜伽垫 加厚款', sku: 'DY-YG-005', platform: 'douyin', platformName: '抖音', price: 128.00, stock: 88, sold: 3670, status: 'ACTIVE', category: '运动', aiScore: 95, aiSuggestion: '爆款，建议加大投放', coverUrl: '' },
];

const MESSAGES = [
  { id: 'msg_001', platform: 'xiaohongshu', platformName: '小红书', customer: '小美', content: '这个耳机防水吗？跑步可以戴吗', time: '2025-06-20T10:30:00Z', status: 'UNREAD', aiDraft: '亲，这款耳机支持 IPX5 防水等级，日常运动出汗和小雨都不怕的，跑步完全没问题哦~ 🏃‍♀️' },
  { id: 'msg_002', platform: 'douyin', platformName: '抖音', customer: '阿杰', content: '手表支持心率监测吗？', time: '2025-06-20T09:15:00Z', status: 'AI_DRAFTED', aiDraft: '您好！S9 智能手表支持24小时心率监测，还有血氧和睡眠监测功能，非常全面~' },
  { id: 'msg_003', platform: 'taobao', platformName: '淘宝', customer: '大熊', content: '充电宝能给笔记本充吗？', time: '2025-06-19T18:40:00Z', status: 'REPLIED', aiDraft: '' },
  { id: 'msg_004', platform: 'xiaohongshu', platformName: '小红书', customer: '茶叶控', content: '抹茶粉打开后能放多久？', time: '2025-06-19T14:20:00Z', status: 'UNREAD', aiDraft: '亲，开封后建议冷藏保存，30天内饮用完毕口感最佳哦~' },
  { id: 'msg_005', platform: 'douyin', platformName: '抖音', customer: '瑜伽小仙女', content: '垫子有异味吗？', time: '2025-06-18T21:00:00Z', status: 'AI_DRAFTED', aiDraft: '亲，我们用的是环保TPE材质，开箱几乎没有异味，通风放一会儿就完全OK啦~' },
];

// ─── Helper ──────────────────────────────────────────────
function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

// ─── Router ──────────────────────────────────────────────
async function handler(req, res) {
  const { method } = req;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  try {
    // ─── Health ────────────────────────────────
    if (path === '/health') {
      return jsonResponse(res, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // ─── Auth ──────────────────────────────────
    if (path === '/api/auth/sms/send' && method === 'POST') {
      return jsonResponse(res, { success: true, message: '验证码已发送' });
    }

    if (path === '/api/auth/sms/login' && method === 'POST') {
      const body = await parseBody(req);
      const phone = body.phone || '13800138000';
      const userId = `user_${phone.slice(-4)}`;
      const token = `mock_jwt_${userId}_${Date.now()}`;
      USERS[userId] = { id: userId, phone, name: `用户${phone.slice(-4)}` };
      return jsonResponse(res, { accessToken: token, refreshToken: token, expiresIn: 86400 });
    }

    if (path === '/api/auth/wechat/login' && method === 'POST') {
      const body = await parseBody(req);
      const openId = `wx_${body.code || 'mock'}`;
      const userId = `user_wx_${openId.slice(-4)}`;
      const token = `mock_jwt_${userId}_${Date.now()}`;
      USERS[userId] = { id: userId, wechatOpenId: openId, name: `微信用户${openId.slice(-4)}` };
      return jsonResponse(res, { accessToken: token, refreshToken: token, expiresIn: 86400 });
    }

    if (path === '/api/auth/email/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = body.email || 'admin@example.local';
      if (body.password !== 'admin123' && email === 'admin@example.local') {
        return jsonResponse(res, { error: '密码错误' }, 401);
      }
      const userId = 'user_admin';
      const token = `mock_jwt_${userId}_${Date.now()}`;
      USERS[userId] = { id: userId, email, name: '管理员' };
      return jsonResponse(res, { accessToken: token, refreshToken: token, expiresIn: 86400 });
    }

    if (path === '/api/auth/profile' && method === 'GET') {
      return jsonResponse(res, {
        id: 'user_admin', name: '管理员', email: 'admin@example.local',
        phone: '13800138000', avatarUrl: '', loginMethod: 'SMS',
        subscription: { plan: 'PRO', status: 'ACTIVE', expiresAt: '2026-06-20', aiQuotaDaily: 500, aiQuotaUsed: 42 },
        teams: [{ team: { id: 'team_1', name: '管理员的团队' }, role: 'OWNER' }],
      });
    }

    // ─── Platform Accounts ─────────────────────
    if (path === '/api/platform-accounts' && method === 'GET') {
      return jsonResponse(res, { data: PLATFORM_ACCOUNTS, total: PLATFORM_ACCOUNTS.length });
    }

    if (path.match(/^\/api\/platform-accounts\/[\w-]+\/connect$/) && method === 'POST') {
      return jsonResponse(res, { success: true, message: '连接请求已发起' });
    }

    if (path.match(/^\/api\/platform-accounts\/[\w-]+\/disconnect$/) && method === 'POST') {
      return jsonResponse(res, { success: true, message: '已断开连接' });
    }

    if (path.match(/^\/api\/platform-accounts\/[\w-]+\/browser$/) && method === 'POST') {
      return jsonResponse(res, { success: true, message: '浏览器连接已建立', wsUrl: 'ws://localhost:9222' });
    }

    if (path.match(/^\/api\/platform-accounts\/[\w-]+\/browser$/) && method === 'DELETE') {
      return jsonResponse(res, { success: true, message: '浏览器连接已断开' });
    }

    // ─── Commerce: Orders ──────────────────────
    if (path === '/api/commerce/orders' && method === 'GET') {
      const status = url.searchParams.get('status');
      const platform = url.searchParams.get('platform');
      let filtered = ORDERS;
      if (status) filtered = filtered.filter(o => o.status === status);
      if (platform) filtered = filtered.filter(o => o.platform === platform);
      return jsonResponse(res, { data: filtered, total: filtered.length });
    }

    // ─── Commerce: Products ────────────────────
    if (path === '/api/commerce/products' && method === 'GET') {
      return jsonResponse(res, { data: PRODUCTS, total: PRODUCTS.length });
    }

    // ─── Messages ──────────────────────────────
    if (path === '/api/commerce/messages' && method === 'GET') {
      return jsonResponse(res, { data: MESSAGES, total: MESSAGES.length });
    }

    if (path.match(/^\/api\/commerce\/messages\/[\w-]+\/reply$/) && method === 'POST') {
      return jsonResponse(res, { success: true, message: '回复已发送' });
    }

    if (path.match(/^\/api\/commerce\/messages\/[\w-]+\/draft$/) && method === 'POST') {
      return jsonResponse(res, { success: true, draft: 'AI生成的回复草稿...' });
    }

    // ─── AI Keys ───────────────────────────────
    if (path === '/api/ai-keys' && method === 'GET') {
      return jsonResponse(res, { data: AI_KEYS, total: AI_KEYS.length });
    }

    if (path === '/api/ai-keys' && method === 'POST') {
      const body = await parseBody(req);
      const newKey = { id: `ak_${Date.now()}`, ...body, isDefault: false, status: 'ACTIVE', createdAt: new Date().toISOString(), lastUsedAt: null };
      AI_KEYS.push(newKey);
      return jsonResponse(res, { data: newKey }, 201);
    }

    if (path.match(/^\/api\/ai-keys\/[\w-]+$/) && method === 'PUT') {
      const body = await parseBody(req);
      return jsonResponse(res, { success: true, data: body });
    }

    if (path.match(/^\/api\/ai-keys\/[\w-]+$/) && method === 'DELETE') {
      return jsonResponse(res, { success: true });
    }

    if (path.match(/^\/api\/ai-keys\/[\w-]+\/test$/) && method === 'POST') {
      return jsonResponse(res, { success: true, latency: 320, model: 'gpt-4o' });
    }

    // ─── Acquisition ───────────────────────────
    if (path === '/api/acquisition/channels' && method === 'GET') {
      return jsonResponse(res, {
        data: [
          { name: '小红书', visitors: 12580, conversion: 3.2, revenue: 89600, trend: 'up' },
          { name: '抖音', visitors: 8920, conversion: 4.1, revenue: 125300, trend: 'up' },
          { name: '淘宝', visitors: 6340, conversion: 2.8, revenue: 45200, trend: 'down' },
          { name: '京东', visitors: 3210, conversion: 3.5, revenue: 67800, trend: 'stable' },
        ]
      });
    }

    if (path === '/api/acquisition/funnel' && method === 'GET') {
      return jsonResponse(res, {
        data: { steps: ['访问', '浏览商品', '加购', '下单', '支付'], values: [31050, 12420, 4830, 1890, 1520] }
      });
    }

    // ─── Media ─────────────────────────────────
    if (path === '/api/media/calendar' && method === 'GET') {
      return jsonResponse(res, { data: [] });
    }

    if (path === '/api/media/assets' && method === 'GET') {
      return jsonResponse(res, { data: [], total: 0 });
    }

    // ─── Automations ───────────────────────────
    if (path === '/api/automations' && method === 'GET') {
      return jsonResponse(res, { data: [], total: 0 });
    }

    if (path === '/api/automations' && method === 'POST') {
      const body = await parseBody(req);
      return jsonResponse(res, { data: { id: `auto_${Date.now()}`, ...body, status: 'ACTIVE' } }, 201);
    }

    // ─── Approvals ─────────────────────────────
    if (path === '/api/approvals' && method === 'GET') {
      return jsonResponse(res, { data: [], total: 0 });
    }

    if (path === '/api/approvals/config' && method === 'GET') {
      return jsonResponse(res, { data: { autoReply: true, autoReplyThreshold: 'LOW', contentPublish: true, contentReviewRequired: true, refundAuto: false, refundThreshold: 100 } });
    }

    if (path === '/api/approvals/config' && method === 'PUT') {
      return jsonResponse(res, { success: true });
    }

    // ─── Subscription / Billing ────────────────
    if (path === '/api/subscription' && method === 'GET') {
      return jsonResponse(res, {
        data: {
          plan: 'PRO', status: 'ACTIVE', startedAt: '2025-01-01', expiresAt: '2026-01-01',
          aiQuotaDaily: 500, aiQuotaUsed: 42, cdpConcurrency: 3, acquisitionLimit: 100,
        }
      });
    }

    if (path === '/api/subscription/plans' && method === 'GET') {
      return jsonResponse(res, {
        data: [
          { id: 'FREE', name: '免费版', price: 0, aiQuotaDaily: 50, cdpConcurrency: 1, acquisitionLimit: 10 },
          { id: 'PRO', name: '专业版', price: 299, aiQuotaDaily: 500, cdpConcurrency: 3, acquisitionLimit: 100 },
          { id: 'ENTERPRISE', name: '企业版', price: 999, aiQuotaDaily: -1, cdpConcurrency: 10, acquisitionLimit: -1 },
        ]
      });
    }

    if (path === '/api/subscription/invoices' && method === 'GET') {
      return jsonResponse(res, { data: [
        { id: 'inv_001', amount: 299, status: 'PAID', date: '2025-06-01', plan: 'PRO' },
        { id: 'inv_002', amount: 299, status: 'PAID', date: '2025-05-01', plan: 'PRO' },
      ]});
    }

    // ─── Overview / Dashboard ──────────────────
    if (path === '/api/overview' && method === 'GET') {
      return jsonResponse(res, {
        data: {
          revenue: { value: 328560, change: 12.5 },
          orders: { value: 1520, change: 8.3 },
          customers: { value: 860, change: -2.1 },
          aiActions: { value: 342, change: 25.7 },
          topProducts: PRODUCTS.slice(0, 5),
          recentOrders: ORDERS.slice(0, 5),
        }
      });
    }

    // ─── Autopilot ─────────────────────────────
    if (path === '/api/autopilot/config' && method === 'GET') {
      return jsonResponse(res, { data: { enabled: false, mode: 'ASSIST', autoReply: false, autoPublish: false, autoRefund: false, autoPriceAdjust: false } });
    }

    if (path === '/api/autopilot/config' && method === 'PUT') {
      return jsonResponse(res, { success: true });
    }

    // ─── Connectors (platform connection guides) ──────
    if (path === '/api/connectors/guides' && method === 'GET') {
      return jsonResponse(res, {
        data: [
          { platform: 'xiaohongshu', platformName: '小红书', authType: 'BROWSER_CDP', docUrl: 'https://open.xiaohongshu.com/document/doc', description: '通过浏览器 CDP 协议连接小红书商家后台，实现商品管理、订单处理、消息回复等操作', requiredFields: ['shopId'], steps: ['登录小红书商家后台', '通过 CDP 连接浏览器', '授权数据访问'] },
          { platform: 'douyin', platformName: '抖音', authType: 'OAUTH2', docUrl: 'https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi', description: '通过抖音开放平台 OAuth2 授权，管理抖店商品和订单', requiredFields: ['shopId', 'appKey', 'appSecret'], steps: ['申请抖店开放平台应用', '配置 OAuth2 回调地址', '授权店铺数据访问'] },
          { platform: 'taobao', platformName: '淘宝', authType: 'OAUTH2', docUrl: 'https://open.taobao.com/api.htm', description: '通过淘宝开放平台授权，管理淘宝店铺商品和订单', requiredFields: ['shopId', 'appKey', 'appSecret'], steps: ['申请淘宝开放平台应用', '配置 OAuth2 回调地址', '授权店铺数据访问'] },
          { platform: 'pinduoduo', platformName: '拼多多', authType: 'OAUTH2', docUrl: 'https://open.pinduoduo.com/application/document/browse', description: '通过拼多多开放平台授权，管理拼多多店铺', requiredFields: ['shopId', 'clientId', 'clientSecret'], steps: ['申请拼多多开放平台应用', '配置 OAuth2 回调地址', '授权店铺数据访问'] },
          { platform: 'jd', platformName: '京东', authType: 'OAUTH2', docUrl: 'https://open.jd.com/home/home', description: '通过京东开放平台授权，管理京东店铺', requiredFields: ['shopId', 'appKey', 'appSecret'], steps: ['申请京东开放平台应用', '配置 OAuth2 回调地址', '授权店铺数据访问'] },
        ]
      });
    }

    // ─── Fallback ──────────────────────────────
    jsonResponse(res, { error: 'Not Found', path }, 404);
  } catch (err) {
    console.error('API Error:', err);
    jsonResponse(res, { error: 'Internal Server Error', message: err.message }, 500);
  }
}

// ─── Start ───────────────────────────────────────────────
const server = createServer(handler);
server.listen(PORT, () => {
  console.log(`[Mock API] Server running on http://localhost:${PORT}`);
  console.log(`[Mock API] Health: http://localhost:${PORT}/health`);
  console.log(`[Mock API] API Base: http://localhost:${PORT}/api/`);
});
