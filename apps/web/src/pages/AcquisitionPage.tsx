import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  UserPlus, Plus, Play, Pause, Trash2, Send,
  Search, Filter, TrendingUp, Users, Target, Mail
} from 'lucide-react';

type TabKey = 'tasks' | 'prospects' | 'campaigns';

interface AcquisitionTask {
  id: string;
  name: string;
  platform: string;
  taskType: string;
  status: string;
  maxResults: number;
  resultCount: number;
  createdAt: string;
}

interface Lead {
  id: string;
  platform: string;
  username: string;
  intentScore: number;
  status: string;
  profileUrl?: string;
  lastContactedAt?: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  messageTemplate: string;
  status: string;
  sentCount: number;
  repliedCount: number;
  requiresApproval: boolean;
  createdAt: string;
}

interface Stats {
  totalProspects: number;
  contactedProspects: number;
  conversionRate: number;
  activeTasks: number;
  activeCampaigns: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  RUNNING: '#2F6BFF',
  COMPLETED: '#16A37B',
  FAILED: '#EF4444',
  CANCELLED: '#6B7280',
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: '新潜客',
  CONTACTED: '已触达',
  REPLIED: '已回复',
  CONVERTED: '已转化',
  LOST: '已流失',
};

export function AcquisitionPage() {
  const [tab, setTab] = useState<TabKey>('tasks');
  const [tasks, setTasks] = useState<AcquisitionTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // New task form
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', platform: 'XIAOHONGSHU', type: 'KEYWORD_SEARCH', keywords: '', maxResults: 100 });

  // New campaign form
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', platform: 'XIAOHONGSHU', messageTemplate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await apiClient.get('/acquisition/stats');
      setStats(statsRes.data?.data ?? statsRes.data);

      if (tab === 'tasks') {
        const res = await apiClient.get('/acquisition/tasks');
        setTasks(res.data?.data ?? res.data);
      } else if (tab === 'prospects') {
        const res = await apiClient.get('/acquisition/prospects');
        setLeads(res.data?.data ?? res.data);
      } else {
        const res = await apiClient.get('/acquisition/campaigns');
        setCampaigns(res.data?.data ?? res.data);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTask = async () => {
    try {
      await apiClient.post('/acquisition/tasks', newTask);
      setShowNewTask(false);
      setNewTask({ name: '', platform: 'XIAOHONGSHU', type: 'KEYWORD_SEARCH', keywords: '', maxResults: 100 });
      fetchData();
    } catch { /* handle error */ }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiClient.delete(`/acquisition/tasks/${id}`);
      fetchData();
    } catch { /* handle error */ }
  };

  const handleCreateCampaign = async () => {
    try {
      await apiClient.post('/acquisition/campaigns', newCampaign);
      setShowNewCampaign(false);
      setNewCampaign({ name: '', platform: 'XIAOHONGSHU', messageTemplate: '' });
      fetchData();
    } catch { /* handle error */ }
  };

  const handleSubmitApproval = async (id: string) => {
    try {
      await apiClient.post(`/acquisition/campaigns/${id}/submit-approval`);
      fetchData();
    } catch { /* handle error */ }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="acq-header">
        <div>
          <h1 className="page-title"><UserPlus size={22} /> 获客中心</h1>
          <p className="page-desc">管理获客任务、潜客库和触达活动</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="acq-stats">
          <div className="acq-stat">
            <Users size={16} />
            <div>
              <strong>{stats.totalProspects}</strong>
              <span>潜客总数</span>
            </div>
          </div>
          <div className="acq-stat">
            <Target size={16} />
            <div>
              <strong>{stats.contactedProspects}</strong>
              <span>已触达</span>
            </div>
          </div>
          <div className="acq-stat">
            <TrendingUp size={16} />
            <div>
              <strong>{stats.conversionRate}%</strong>
              <span>转化率</span>
            </div>
          </div>
          <div className="acq-stat">
            <Play size={16} />
            <div>
              <strong>{stats.activeTasks}</strong>
              <span>进行中任务</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="acq-tabs">
        {(['tasks', 'prospects', 'campaigns'] as TabKey[]).map(t => (
          <button
            key={t}
            className={`acq-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'tasks' ? '获客任务' : t === 'prospects' ? '潜客库' : '触达活动'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          {tab === 'tasks' && (
            <button className="btn-primary" onClick={() => setShowNewTask(true)}>
              <Plus size={16} /> 新建任务
            </button>
          )}
          {tab === 'campaigns' && (
            <button className="btn-primary" onClick={() => setShowNewCampaign(true)}>
              <Plus size={16} /> 新建活动
            </button>
          )}
        </div>
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="acq-table-wrap">
          {loading ? (
            <div className="acq-loading">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="acq-empty">
              <Search size={32} />
              <p>暂无获客任务，点击"新建任务"开始</p>
            </div>
          ) : (
            <table className="acq-table">
              <thead>
                <tr>
                  <th>任务名称</th>
                  <th>平台</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>结果数</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td><strong>{task.name}</strong></td>
                    <td>{task.platform}</td>
                    <td>{task.taskType}</td>
                    <td>
                      <span className="status-badge" style={{ background: STATUS_COLORS[task.status] ?? '#6B7280' }}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>
                    <td>{task.resultCount}/{task.maxResults}</td>
                    <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="删除" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Prospects Tab */}
      {tab === 'prospects' && (
        <div className="acq-table-wrap">
          {loading ? (
            <div className="acq-loading">加载中...</div>
          ) : leads.length === 0 ? (
            <div className="acq-empty">
              <Users size={32} />
              <p>暂无潜客数据，运行获客任务后自动采集</p>
            </div>
          ) : (
            <table className="acq-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>平台</th>
                  <th>意图分数</th>
                  <th>状态</th>
                  <th>最近触达</th>
                  <th>加入时间</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td><strong>{lead.username}</strong></td>
                    <td>{lead.platform}</td>
                    <td>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${Math.min(lead.intentScore, 100)}%` }} />
                        <span>{lead.intentScore}</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: lead.status === 'NEW' ? '#2F6BFF' : lead.status === 'CONVERTED' ? '#16A37B' : '#F59E0B' }}>
                        {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td>{lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : '-'}</td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === 'campaigns' && (
        <div className="acq-table-wrap">
          {loading ? (
            <div className="acq-loading">加载中...</div>
          ) : campaigns.length === 0 ? (
            <div className="acq-empty">
              <Mail size={32} />
              <p>暂无触达活动，点击"新建活动"开始</p>
            </div>
          ) : (
            <table className="acq-table">
              <thead>
                <tr>
                  <th>活动名称</th>
                  <th>平台</th>
                  <th>状态</th>
                  <th>已发送</th>
                  <th>已回复</th>
                  <th>审批</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.platform}</td>
                    <td>
                      <span className="status-badge" style={{ background: STATUS_COLORS[c.status] ?? '#6B7280' }}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>{c.sentCount}</td>
                    <td>{c.repliedCount}</td>
                    <td>{c.requiresApproval ? '需要' : '不需要'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        {c.status === 'PENDING' && (
                          <button className="btn-icon" title="提交审批" onClick={() => handleSubmitApproval(c.id)}>
                            <Send size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>新建获客任务</h2>
            <div className="form-group">
              <label className="form-label">任务名称</label>
              <input className="form-input" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} placeholder="如：小红书母婴关键词采集" />
            </div>
            <div className="form-group">
              <label className="form-label">平台</label>
              <select className="form-input" value={newTask.platform} onChange={e => setNewTask({ ...newTask, platform: e.target.value })}>
                <option value="XIAOHONGSHU">小红书</option>
                <option value="DOUYIN">抖音</option>
                <option value="TIKTOK">TikTok</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="X_TWITTER">X/Twitter</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">任务类型</label>
              <select className="form-input" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}>
                <option value="KEYWORD_SEARCH">关键词搜索</option>
                <option value="COMMENT_SCRAPE">评论采集</option>
                <option value="FOLLOWER_SCRAPE">粉丝采集</option>
                <option value="PROFILE_SCRAPE">主页采集</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">关键词 (逗号分隔)</label>
              <input className="form-input" value={newTask.keywords} onChange={e => setNewTask({ ...newTask, keywords: e.target.value })} placeholder="如：母婴,育儿,宝宝" />
            </div>
            <div className="form-group">
              <label className="form-label">最大结果数</label>
              <input className="form-input" type="number" value={newTask.maxResults} onChange={e => setNewTask({ ...newTask, maxResults: Number(e.target.value) })} />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewTask(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreateTask} disabled={!newTask.name}>创建任务</button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="modal-overlay" onClick={() => setShowNewCampaign(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>新建触达活动</h2>
            <div className="form-group">
              <label className="form-label">活动名称</label>
              <input className="form-input" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="如：小红书母婴达人触达" />
            </div>
            <div className="form-group">
              <label className="form-label">平台</label>
              <select className="form-input" value={newCampaign.platform} onChange={e => setNewCampaign({ ...newCampaign, platform: e.target.value })}>
                <option value="XIAOHONGSHU">小红书</option>
                <option value="DOUYIN">抖音</option>
                <option value="TIKTOK">TikTok</option>
                <option value="INSTAGRAM">Instagram</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">消息模板</label>
              <textarea className="form-textarea" value={newCampaign.messageTemplate} onChange={e => setNewCampaign({ ...newCampaign, messageTemplate: e.target.value })} placeholder="如：您好！我们是XXX品牌，对您的内容非常感兴趣..." rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewCampaign(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.messageTemplate}>创建活动</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
