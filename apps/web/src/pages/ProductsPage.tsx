import { useState } from 'react';
import { Package, AlertTriangle, Sparkles, Search, RefreshCw, Plus, Type, Image, DollarSign, X, CheckCircle, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'SKU 总数', value: '1,248', icon: Package, iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: '7 个平台同步中', subBg: 'bg-primary/10', subColor: 'text-primary' },
  { label: '低库存', value: '32', icon: AlertTriangle, iconBg: 'bg-error/10', iconColor: 'text-error', sub: '建议 48 小时内补货', subBg: 'bg-warning/15', subColor: 'text-warning', valueColor: 'text-error' },
  { label: '待优化 Listing', value: '86', icon: Sparkles, iconBg: 'bg-warning/10', iconColor: 'text-warning', sub: '标题主图价格可提升', subBg: 'bg-warning/15', subColor: 'text-warning', valueColor: 'text-warning' },
];

interface Product {
  sku: string;
  name: string;
  stock: number;
  stockColor: string;
  platforms: string[];
  status: string;
  statusBg: string;
  statusColor: string;
  statusKey: string;
}

const products: Product[] = [
  { sku: 'SKU-D112', name: '夏季运动短裤', stock: 18, stockColor: 'text-error', platforms: ['Amazon', 'Shopee', 'Lazada'], status: '低库存', statusBg: 'bg-error/15', statusColor: 'text-error', statusKey: 'low-stock' },
  { sku: 'SKU-B884', name: '旅行收纳包', stock: 220, stockColor: 'text-success', platforms: ['Amazon', 'TikTok Shop', 'Temu', 'SHEIN'], status: '热卖', statusBg: 'bg-success/15', statusColor: 'text-success', statusKey: 'hot' },
  { sku: 'SKU-X029', name: '宠物梳毛器', stock: 85, stockColor: 'text-on-surface', platforms: ['Amazon', 'Shopee'], status: '待优化', statusBg: 'bg-warning/15', statusColor: 'text-warning', statusKey: 'pending-optimize' },
  { sku: 'SKU-A201', name: '蓝牙耳机', stock: 156, stockColor: 'text-on-surface', platforms: ['Amazon', 'eBay', 'Lazada', 'TikTok Shop', 'Temu'], status: '正常', statusBg: 'bg-surface-container-high', statusColor: 'text-on-surface-variant', statusKey: 'normal' },
];

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [optimizeSku, setOptimizeSku] = useState<Product | null>(null);
  const [syncSku, setSyncSku] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = products.filter((p) => {
    if (filterStatus && p.statusKey !== filterStatus) return false;
    if (filterPlatform && !p.platforms.some(pl => pl.toLowerCase().includes(filterPlatform.toLowerCase()))) return false;
    if (search && !p.sku.toLowerCase().includes(search.toLowerCase()) && !p.name.includes(search)) return false;
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">商品</h1>
          <p className="text-sm text-on-surface-variant mt-1">管理 Listing、库存和跨平台同步</p>
        </div>
        <button onClick={() => showToast('添加商品功能开发中')} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" />添加商品
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface rounded-lg shadow-card p-5 cursor-pointer hover:shadow-float transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{s.label}</span>
                <div className={`w-8 h-8 ${s.iconBg} rounded-md flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${s.valueColor || 'text-on-surface'}`}>{s.value}</div>
              <div className="flex items-center gap-1 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${s.subBg} ${s.subColor}`}>{s.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface rounded-lg shadow-card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索 SKU 或商品名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container border-none rounded-md pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="low-stock">低库存</option>
          <option value="hot">热卖</option>
          <option value="pending-optimize">待优化</option>
          <option value="normal">正常</option>
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
        >
          <option value="">全部平台</option>
          <option value="amazon">Amazon</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
          <option value="tiktok">TikTok Shop</option>
          <option value="temu">Temu</option>
          <option value="shein">SHEIN</option>
          <option value="ebay">eBay</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPlatform(''); showToast('数据已刷新'); }} className="bg-surface-container text-on-surface px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />刷新
        </button>
      </div>

      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_100px_1fr_120px_160px] px-5 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide items-center">
          <span>SKU 编号</span><span>商品名</span><span>库存</span><span>同步平台</span><span>状态</span><span className="text-right">操作</span>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {filtered.map((p) => (
            <div key={p.sku} className="grid grid-cols-[140px_1fr_100px_1fr_120px_160px] px-5 py-4 hover:bg-surface-container/50 transition-colors items-center">
              <span className="text-sm font-medium text-on-surface font-mono">{p.sku}</span>
              <span className="text-sm text-on-surface">{p.name}</span>
              <span className={`text-sm font-semibold ${p.stockColor}`}>{p.stock}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {p.platforms.map((pl) => (
                  <span key={pl} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{pl}</span>
                ))}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.statusBg} ${p.statusColor}`}>{p.status}</span>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setOptimizeSku(p)} className="text-primary text-sm font-medium hover:underline">优化建议</button>
                <button onClick={() => setSyncSku(p)} className="text-primary text-sm font-medium hover:underline">同步</button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-surface-container/50 flex items-center justify-between text-sm text-on-surface-variant">
          <span>共 {filtered.length} 条商品</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-sm transition-colors opacity-40" disabled>上一页</button>
            <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">1</span>
            <button className="px-3 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-sm transition-colors opacity-40" disabled>下一页</button>
          </div>
        </div>
      </div>

      {/* Optimize Modal */}
      {optimizeSku && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setOptimizeSku(null)}>
          <div className="bg-surface rounded-xl shadow-dialog max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-on-surface">Listing 优化建议</h2>
              <button onClick={() => setOptimizeSku(null)} className="p-1.5 rounded-md hover:bg-surface-container transition-colors"><X className="w-4 h-4 text-on-surface-variant" /></button>
            </div>
            <div className="text-sm text-on-surface-variant mb-4">{optimizeSku.sku} · {optimizeSku.name}</div>
            <div className="space-y-3">
              <div className="bg-surface-container rounded-md p-3">
                <div className="flex items-center gap-2 mb-1"><Type className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-on-surface">标题优化</span></div>
                <p className="text-sm text-on-surface-variant">建议增加"透气速干""轻薄"等高频搜索词，提升搜索曝光率</p>
              </div>
              <div className="bg-surface-container rounded-md p-3">
                <div className="flex items-center gap-2 mb-1"><Image className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-on-surface">主图优化</span></div>
                <p className="text-sm text-on-surface-variant">建议使用模特上身图替代平铺图，增加场景感和购买意愿</p>
              </div>
              <div className="bg-surface-container rounded-md p-3">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-on-surface">价格优化</span></div>
                <p className="text-sm text-on-surface-variant">当前定价低于同类竞品 15%，建议调整至 $24.99 以提高利润率</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setOptimizeSku(null)} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all">取消</button>
              <button onClick={() => { setOptimizeSku(null); showToast('优化建议已提交审批'); }} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">应用建议</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {syncSku && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSyncSku(null)}>
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-on-surface">跨平台同步</h2>
              <button onClick={() => setSyncSku(null)} className="p-1.5 rounded-md hover:bg-surface-container transition-colors"><X className="w-4 h-4 text-on-surface-variant" /></button>
            </div>
            <div className="text-sm text-on-surface-variant mb-4">{syncSku.sku} · {syncSku.name}</div>
            <p className="text-sm text-on-surface-variant mb-3">选择要同步的平台：</p>
            <div className="space-y-2 mb-5">
              {syncSku.platforms.map((pl) => (
                <label key={pl} className="flex items-center gap-2.5 p-2.5 rounded-md bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-on-surface">{pl}</span>
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-success/15 text-success">已连接</span>
                </label>
              ))}
            </div>
            <div className="bg-warning/10 rounded-md p-3 flex items-start gap-2 mb-5">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <span className="text-sm text-on-surface-variant">同步操作将覆盖目标平台现有 Listing 信息，此操作需经审批后执行。</span>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSyncSku(null)} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all">取消</button>
              <button onClick={() => { setSyncSku(null); showToast('同步请求已提交审批'); }} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">提交审批</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="bg-surface rounded-lg shadow-float px-4 py-3 flex items-center gap-2 text-sm font-medium text-on-surface border border-outline-variant/20">
            <CheckCircle className="w-4 h-4 text-success" /><span>{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
