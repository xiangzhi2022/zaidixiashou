import { Link } from 'react-router-dom';
import {
  Send,
  FolderOpen,
  MessageCircle,
  Handshake,
  RefreshCw,
  Plus,
  LayoutGrid,
  Command,
  Image,
  FileCheck,
  ChevronRight,
  Calendar,
  BookOpen,
  Music,
  Camera,
  Music2,
  Search,
  Upload,
  X,
  ChevronLeft,
  ChevronDown,
  FileText,
  Video,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// ========== Types ==========
interface MediaStats {
  todayPending: number;
  todayNeedApproval: number;
  totalAssets: number;
  reusableAssets: number;
  interactionMessages: number;
  avgResponseMinutes: number;
  influencerCoop: number;
  influencerPending: number;
  weeklyPublished: number;
  pendingReview: number;
  approvalRate: number;
}

interface Platform {
  id: string;
  name: string;
  domain: string;
  icon: string;
  status: 'need_login' | 'pending_auth' | 'available' | 'connected';
  followers: number;
  postsThisWeek: number;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  category: string;
  url: string;
  tags: string[];
  createdAt: string;
  size: string;
  reusable: boolean;
}

interface Schedule {
  id: string;
  title: string;
  platform: string;
  content: string;
  scheduledAt: string;
  status: 'draft' | 'pending_review' | 'scheduled' | 'published';
  tags: string[];
}

interface CalendarDay {
  day: number;
  items: Schedule[];
}

interface CalendarData {
  year: number;
  month: number;
  firstDayOfWeek: number;
  calendar: CalendarDay[];
}

// ========== API ==========
const API = '/api/media';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function putJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function deleteJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  return res.json();
}

// ========== Constants ==========
const statusMap: Record<string, { label: string; bg: string; color: string; icon: typeof CheckCircle2 }> = {
  scheduled: { label: '已排期', bg: 'bg-success/15', color: 'text-success', icon: CheckCircle2 },
  pending_review: { label: '待审核', bg: 'bg-warning/15', color: 'text-warning', icon: AlertCircle },
  draft: { label: '草稿', bg: 'bg-surface-container-high', color: 'text-on-surface-variant', icon: Edit3 },
  published: { label: '已发布', bg: 'bg-primary/10', color: 'text-primary', icon: Send },
};

const platformStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  need_login: { label: '需登录', bg: 'bg-warning/15', color: 'text-warning' },
  pending_auth: { label: '待授权', bg: 'bg-warning/15', color: 'text-warning' },
  available: { label: '可接入', bg: 'bg-success/15', color: 'text-success' },
  connected: { label: '已连接', bg: 'bg-success/15', color: 'text-success' },
};

const platformIcons: Record<string, typeof BookOpen> = {
  'book-open': BookOpen,
  'music': Music,
  'music-2': Music2,
  'camera': Camera,
};

const typeIcons: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  text: FileText,
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// ========== Sub-Components ==========

function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor, onClick }: {
  label: string; value: string | number; sub: string;
  icon: typeof Send; iconBg: string; iconColor: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-surface rounded-lg shadow-card p-5 cursor-pointer hover:shadow-float transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${iconBg} rounded-md flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className="text-sm font-medium text-on-surface-variant">{label}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-on-surface">{value}</span>
        <span className="text-xs text-on-surface-variant mb-1">{sub}</span>
      </div>
    </div>
  );
}

function PlatformRow({ platform, onConnect }: { platform: Platform; onConnect: (p: Platform) => void }) {
  const ps = platformStatusMap[platform.status] ?? { label: '未知', bg: 'bg-on-surface/5', color: 'text-on-surface-variant' };
  const IconComp = platformIcons[platform.icon] || BookOpen;
  const isConnectable = platform.status !== 'connected';
  return (
    <div className="flex items-center justify-between p-3 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${platform.status === 'connected' ? 'bg-primary/10' : 'bg-on-surface/5'} rounded-md flex items-center justify-center`}>
          <IconComp className={`w-4 h-4 ${platform.status === 'connected' ? 'text-primary' : 'text-on-surface'}`} />
        </div>
        <div>
          <span className="text-sm font-medium text-on-surface">{platform.name}</span>
          <p className="text-xs text-on-surface-variant">
            {platform.domain}
            {platform.followers > 0 && ` · ${platform.followers.toLocaleString()} 粉丝`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ps.bg} ${ps.color}`}>
          {ps.label}
        </span>
        <button
          onClick={() => onConnect(platform)}
          className={`text-sm font-medium hover:underline ${isConnectable ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          {isConnectable ? '连接' : '管理'}
        </button>
      </div>
    </div>
  );
}

function ScheduleRow({ schedule, onStatusChange, onDelete }: {
  schedule: Schedule;
  onStatusChange: (id: string, status: Schedule['status']) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = statusMap[schedule.status] ?? { label: '未知', bg: 'bg-on-surface/5', color: 'text-on-surface-variant', icon: HelpCircle };
  const StatusIcon = st.icon;
  const dotColor = schedule.status === 'scheduled' ? 'bg-success' : schedule.status === 'pending_review' ? 'bg-warning' : 'bg-on-surface-variant/40';

  return (
    <div>
      <div
        className="flex items-center justify-between py-3 hover:bg-surface-container/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <div>
            <span className="text-sm font-medium text-on-surface">{schedule.title}</span>
            <p className="text-xs text-on-surface-variant">
              {schedule.platform} · {formatScheduleTime(schedule.scheduledAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium ${st.bg} ${st.color}`}>
            <StatusIcon className="w-3 h-3" />
            {st.label}
          </span>
          <ChevronDown className={`w-4 h-4 text-on-surface-variant/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="ml-5 mb-3 p-4 bg-surface-container/30 rounded-lg space-y-3">
          <p className="text-sm text-on-surface-variant">{schedule.content}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {schedule.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Tag className="w-3 h-3 mr-1" />{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
            {schedule.status === 'draft' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(schedule.id, 'pending_review'); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
              >
                提交审核
              </button>
            )}
            {schedule.status === 'pending_review' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(schedule.id, 'scheduled'); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
              >
                审核通过
              </button>
            )}
            {schedule.status === 'scheduled' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(schedule.id, 'published'); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                立即发布
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(schedule.id); }}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-error/10 text-error hover:bg-error/20 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: (id: string) => void }) {
  const TypeIcon = typeIcons[asset.type] || Image;
  const typeLabels: Record<string, string> = { image: '图片', video: '视频', text: '文案' };

  return (
    <div className="bg-surface rounded-lg shadow-card overflow-hidden hover:shadow-float transition-shadow group">
      <div className="h-32 bg-surface-container flex items-center justify-center relative">
        <TypeIcon className="w-8 h-8 text-on-surface-variant/40" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDelete(asset.id)} className="p-1.5 rounded-md bg-surface/80 hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className={`absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
          asset.type === 'image' ? 'bg-primary/10 text-primary' : asset.type === 'video' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
        }`}>
          {typeLabels[asset.type]}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-on-surface truncate">{asset.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-on-surface-variant">{asset.category} · {asset.size}</span>
          {asset.reusable && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-success/10 text-success">可复用</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {asset.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentCalendar({ calendarData, onScheduleClick }: {
  calendarData: CalendarData | null;
  onScheduleClick: (schedule: Schedule) => void;
}) {
  if (!calendarData) return <div className="text-center py-8 text-on-surface-variant">加载日历中...</div>;

  const { firstDayOfWeek, calendar } = calendarData;
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const today = new Date();
  const isToday = (day: number) =>
    calendarData.year === today.getFullYear() &&
    calendarData.month === today.getMonth() + 1 &&
    day === today.getDate();

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-outline-variant/20">
        {WEEKDAYS.map(d => (
          <div key={d} className="bg-surface-container py-2 text-center text-xs font-medium text-on-surface-variant">{d}</div>
        ))}
        {blanks.map(i => (
          <div key={`blank-${i}`} className="bg-surface min-h-[80px] p-1.5" />
        ))}
        {calendar.map(day => (
          <div
            key={day.day}
            className={`bg-surface min-h-[80px] p-1.5 ${isToday(day.day) ? 'ring-1 ring-primary/30 rounded' : ''}`}
          >
            <div className={`text-xs font-medium mb-1 ${isToday(day.day) ? 'text-primary' : 'text-on-surface-variant'}`}>
              {day.day}
            </div>
            {day.items.map(item => {
              const st = statusMap[item.status] ?? { label: '未知', bg: 'bg-on-surface/5', color: 'text-on-surface-variant', icon: HelpCircle };
              return (
                <div
                  key={item.id}
                  onClick={() => onScheduleClick(item)}
                  className={`text-xs px-1.5 py-0.5 rounded mb-0.5 cursor-pointer truncate ${st.bg} ${st.color}`}
                  title={item.title}
                >
                  {item.title}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddScheduleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: { title: string; platform: string; content: string; scheduledAt: string }) => void }) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('小红书');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = () => {
    if (!title || !scheduledAt) return;
    onAdd({ title, platform, content, scheduledAt });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-dialog w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-on-surface">新建排期</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">标题 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="输入内容标题"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">发布平台</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option>小红书</option>
                <option>抖音</option>
                <option>TikTok</option>
                <option>Instagram</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">发布时间 *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">内容描述</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="输入内容描述..."
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title || !scheduledAt}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== Helpers ==========
function formatScheduleTime(dt: string): string {
  try {
    const d = new Date(dt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `今天 ${time} 发布`;
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return `明天 ${time} 发布`;
    if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后 ${time}`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ` ${time}`;
  } catch {
    return dt;
  }
}

// ========== Main Component ==========
type TabType = 'overview' | 'calendar' | 'assets';

export function MediaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [assetFilter, setAssetFilter] = useState<{ type: string; category: string; search: string }>({
    type: 'all', category: 'all', search: ''
  });
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Fetch all data
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, platRes, schRes, assetRes, calRes] = await Promise.all([
        fetchJSON<{ success: boolean; data: MediaStats }>(`${API}/stats`),
        fetchJSON<{ success: boolean; data: Platform[] }>(`${API}/platforms`),
        fetchJSON<{ success: boolean; data: Schedule[] }>(`${API}/schedules`),
        fetchJSON<{ success: boolean; data: Asset[]; categories: string[] }>(`${API}/assets`),
        fetchJSON<{ success: boolean; data: CalendarData }>(`${API}/calendar?year=${calMonth.year}&month=${calMonth.month}`),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (platRes.success) setPlatforms(platRes.data);
      if (schRes.success) setSchedules(schRes.data);
      if (assetRes.success) {
        setAssets(assetRes.data);
        if (assetRes.categories) setAssetCategories(assetRes.categories);
      }
      if (calRes.success) setCalendarData(calRes.data);
    } catch (err) {
      console.error('Failed to load media data:', err);
    } finally {
      setLoading(false);
    }
  }, [calMonth.year, calMonth.month]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadAll();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadAll]);

  // Platform connect
  const handlePlatformConnect = async (platform: Platform) => {
    const action = platform.status === 'connected' ? 'disconnect' : 'connect';
    const res = await postJSON<{ success: boolean; data: Platform; message: string }>(`${API}/platforms/connect`, {
      platform: platform.name,
      action,
    });
    if (res.success) {
      setPlatforms(prev => prev.map(p => p.id === platform.id ? res.data : p));
    }
  };

  // Schedule status change
  const handleScheduleStatus = async (id: string, status: Schedule['status']) => {
    const res = await putJSON<{ success: boolean; data: Schedule }>(`${API}/schedules/${id}`, { status });
    if (res.success) {
      setSchedules(prev => prev.map(s => s.id === id ? res.data : s));
    }
  };

  // Schedule delete
  const handleScheduleDelete = async (id: string) => {
    const res = await deleteJSON<{ success: boolean }>(`${API}/schedules/${id}`);
    if (res.success) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  // Add schedule
  const handleAddSchedule = async (data: { title: string; platform: string; content: string; scheduledAt: string }) => {
    const res = await postJSON<{ success: boolean; data: Schedule }>(`${API}/schedules`, {
      ...data,
      status: 'draft',
      tags: [],
    });
    if (res.success) {
      setSchedules(prev => [res.data, ...prev]);
    }
  };

  // Asset delete
  const handleAssetDelete = async (id: string) => {
    const res = await deleteJSON<{ success: boolean }>(`${API}/assets/${id}`);
    if (res.success) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  // Calendar navigation
  const prevMonth = () => {
    setCalMonth(prev => {
      const m = prev.month === 1 ? 12 : prev.month - 1;
      const y = prev.month === 1 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };
  const nextMonth = () => {
    setCalMonth(prev => {
      const m = prev.month === 12 ? 1 : prev.month + 1;
      const y = prev.month === 12 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  // Filtered assets
  const filteredAssets = assets.filter(a => {
    if (assetFilter.type !== 'all' && a.type !== assetFilter.type) return false;
    if (assetFilter.category !== 'all' && a.category !== assetFilter.category) return false;
    if (assetFilter.search) {
      const q = assetFilter.search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  // Filtered schedules
  const filteredSchedules = schedules.filter(s => {
    if (scheduleFilter !== 'all' && s.status !== scheduleFilter) return false;
    return true;
  });

  const metrics = stats ? [
    { label: '今日待发布', value: stats.todayPending, icon: Send, iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: `${stats.todayNeedApproval}条需审批` },
    { label: '内容素材', value: stats.totalAssets, icon: FolderOpen, iconBg: 'bg-success/10', iconColor: 'text-success', sub: `${stats.reusableAssets}条可复用` },
    { label: '互动消息', value: stats.interactionMessages, icon: MessageCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning', sub: `平均响应${stats.avgResponseMinutes}分钟` },
    { label: '达人合作', value: stats.influencerCoop, icon: Handshake, iconBg: 'bg-error/10', iconColor: 'text-error', sub: `${stats.influencerPending}个待报价` },
  ] : [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">运营中心</h1>
          <p className="text-sm text-on-surface-variant mt-1">媒体账号矩阵总览与内容生产线入口</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAll}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />刷新
          </button>
          <button
            onClick={() => setShowAddSchedule(true)}
            className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />新建排期
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-surface-container/50 p-1 rounded-lg w-fit">
        {[
          { key: 'overview' as TabType, label: '总览', icon: LayoutGrid },
          { key: 'calendar' as TabType, label: '内容日历', icon: Calendar },
          { key: 'assets' as TabType, label: '素材管理', icon: FolderOpen },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-surface text-on-surface shadow-card'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {metrics.map(m => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Platform Matrix */}
            <div className="bg-surface rounded-lg shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-on-surface-variant" />
                  <h2 className="text-base font-semibold text-on-surface">媒体账号矩阵</h2>
                </div>
                <Link
                  to="/settings/accounts"
                  className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />连接账号
                </Link>
              </div>
              <div className="space-y-3">
                {platforms.map(p => (
                  <PlatformRow key={p.id} platform={p} onConnect={handlePlatformConnect} />
                ))}
              </div>
            </div>

            {/* Operations Center */}
            <div className="bg-surface rounded-lg shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Command className="w-4 h-4 text-on-surface-variant" />
                <h2 className="text-base font-semibold text-on-surface">运营中心</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">图像视频生成</span>
                      <p className="text-xs text-on-surface-variant">AI 创作图文、配图建议和视频脚本</p>
                    </div>
                  </div>
                  <Link to="/media/creative" className="bg-surface-container-high text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-highest active:scale-[0.98] transition-all inline-flex items-center gap-2">
                    进入<ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">草稿审核发布</span>
                      <p className="text-xs text-on-surface-variant">预览草稿、风险检查、多平台发布</p>
                    </div>
                  </div>
                  <Link to="/media/drafts" className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                    进入<ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">自动化工作流</span>
                      <p className="text-xs text-on-surface-variant">定时发布、自动回复、数据同步</p>
                    </div>
                  </div>
                  <Link to="/media/automation" className="bg-surface-container-high text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-highest active:scale-[0.98] transition-all inline-flex items-center gap-2">
                    进入<ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              {stats && (
                <div className="mt-5 pt-4 border-t border-outline-variant/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-lg font-bold text-on-surface">{stats.weeklyPublished}</p><p className="text-xs text-on-surface-variant">本周发布</p></div>
                    <div><p className="text-lg font-bold text-on-surface">{stats.pendingReview}</p><p className="text-xs text-on-surface-variant">待审核</p></div>
                    <div><p className="text-lg font-bold text-on-surface">{stats.approvalRate}%</p><p className="text-xs text-on-surface-variant">通过率</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule List */}
          <div className="bg-surface rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-on-surface-variant" />
                <h2 className="text-base font-semibold text-on-surface">媒体排期</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={scheduleFilter}
                  onChange={e => setScheduleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-outline-variant/40 bg-surface-container/30 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="pending_review">待审核</option>
                  <option value="scheduled">已排期</option>
                  <option value="published">已发布</option>
                </select>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  查看日历<ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-outline-variant/30">
              {filteredSchedules.length === 0 && (
                <div className="py-8 text-center text-sm text-on-surface-variant">暂无排期数据</div>
              )}
              {filteredSchedules.map(s => (
                <ScheduleRow
                  key={s.id}
                  schedule={s}
                  onStatusChange={handleScheduleStatus}
                  onDelete={handleScheduleDelete}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab: Calendar */}
      {activeTab === 'calendar' && (
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-on-surface">
                {calMonth.year} 年 {calMonth.month} 月
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowAddSchedule(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />新建排期
            </button>
          </div>
          <ContentCalendar
            calendarData={calendarData}
            onScheduleClick={(_schedule) => {
              // Scroll to schedule in overview
              setActiveTab('overview');
            }}
          />
          {/* Calendar Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline-variant/20">
            {Object.entries(statusMap).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${val.bg}`} />
                <span className="text-xs text-on-surface-variant">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assets */}
      {activeTab === 'assets' && (
        <div>
          {/* Asset Filters */}
          <div className="bg-surface rounded-lg shadow-card p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-on-surface-variant" />
                <select
                  value={assetFilter.type}
                  onChange={e => setAssetFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-1.5 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">全部类型</option>
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                  <option value="text">文案</option>
                </select>
              </div>
              <select
                value={assetFilter.category}
                onChange={e => setAssetFilter(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-1.5 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">全部分类</option>
                {assetCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={assetFilter.search}
                  onChange={e => setAssetFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-outline-variant/40 bg-surface-container/30 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="搜索素材名称或标签..."
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-on-surface-variant">{filteredAssets.length} 个素材</span>
                <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />上传素材
                </button>
              </div>
            </div>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-4 gap-4">
            {filteredAssets.length === 0 && (
              <div className="col-span-4 py-12 text-center text-sm text-on-surface-variant">
                暂无素材，点击"上传素材"添加
              </div>
            )}
            {filteredAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} onDelete={handleAssetDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddSchedule && (
        <AddScheduleModal
          onClose={() => setShowAddSchedule(false)}
          onAdd={handleAddSchedule}
        />
      )}
    </>
  );
}
