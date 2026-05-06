import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Smartphone, Mail, QrCode, Check } from 'lucide-react';

type LoginTab = 'sms' | 'email' | 'qrcode';
type QRCodeType = 'WECHAT' | 'ALIPAY';

const API_BASE = '/api';

function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('sms');
  const [qrType, setQrType] = useState<QRCodeType>('WECHAT');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrStatus, setQrStatus] = useState<'waiting' | 'scanned' | 'confirmed' | 'expired'>('waiting');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // API 请求
  const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || '请求失败');
    }
    
    return response.json();
  }, []);

  // 发送短信验证码
  const sendCode = async () => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      await apiRequest('/auth/sms/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 短信登录
  const handleSmsLogin = async () => {
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const result = await apiRequest('/auth/sms/login', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      
      login(result.accessToken, { id: '1', name: '用户', phone });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 邮箱登录
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const result = await apiRequest('/auth/email/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      login(result.accessToken, { id: '1', name: '用户', email });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 邮箱注册
  const handleEmailRegister = async () => {
    if (!email || !password || password.length < 6) {
      setError('请输入邮箱和至少6位密码');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const result = await apiRequest('/auth/email/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: email.split('@')[0] }),
      });
      
      login(result.accessToken, { id: '1', name: email.split('@')[0] ?? '', email });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成二维码
  const generateQRCode = async () => {
    setQrStatus('waiting');
    setLoading(true);
    
    try {
      const result = await apiRequest('/auth/qrcode/generate', {
        method: 'POST',
        body: JSON.stringify({ type: qrType }),
      });
      
      // 轮询二维码状态
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiRequest(`/auth/qrcode/status?scene=${result.scene}`);
          
          if (status.state === 'CONFIRMED') {
            clearInterval(pollInterval);
            setQrStatus('confirmed');
            login(status.tokens.accessToken, { id: status.user.id, name: status.user.name });
            setTimeout(() => navigate('/'), 500);
          } else if (status.state === 'EXPIRED') {
            clearInterval(pollInterval);
            setQrStatus('expired');
          } else if (status.state === 'SCANNED') {
            setQrStatus('scanned');
          }
        } catch {
          // 忽略轮询错误
        }
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成二维码失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换二维码类型时重新生成
  useEffect(() => {
    if (tab === 'qrcode') {
      /* eslint-disable react-hooks/set-state-in-effect */
      generateQRCode();
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrType, tab]);

  // 开发模式快速登录
  const handleDevQuickLogin = () => {
    const testToken = 'dev_token_' + Date.now();
    login(testToken, { id: 'dev', name: '开发测试用户', phone: '13800138000' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-container flex">
      {/* Left: Brand */}
      <div className="hidden lg:flex w-[480px] bg-primary flex-col items-center justify-center text-on-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-on-primary" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-on-primary" />
          <div className="absolute top-40 right-20 w-32 h-32 rounded-full border border-on-primary" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 bg-on-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">AI Commerce Ops</h1>
          <p className="text-on-primary/80 text-sm leading-relaxed">跨境电商 AI 运营中控台<br />智能驱动，效率倍增</p>
        </div>
      </div>

      {/* Right: Login Form */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col min-h-[520px]">
          {/* Brand for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-on-surface">AI Commerce Ops</h1>
            <p className="text-sm text-on-surface-variant">跨境电商 AI 运营中控台</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 mb-6">
            <button
              onClick={() => setTab('sms')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === 'sms' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
            >
              <Smartphone className="w-4 h-4" />
              短信
            </button>
            <button
              onClick={() => setTab('email')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === 'email' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
            >
              <Mail className="w-4 h-4" />
              邮箱
            </button>
            <button
              onClick={() => setTab('qrcode')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === 'qrcode' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
            >
              <QrCode className="w-4 h-4" />
              扫码
            </button>
          </div>

          {/* SMS Login */}
          {tab === 'sms' && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">手机号</label>
                  <div className="flex">
                    <div className="shrink-0 bg-surface-container rounded-l-md px-3 py-2 text-sm text-on-surface-variant flex items-center gap-1 select-none">+86</div>
                    <input
                      type="tel"
                      maxLength={11}
                      placeholder="请输入手机号"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-r-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">验证码</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="请输入6位验证码"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                    <button
                      onClick={sendCode}
                      disabled={countdown > 0}
                      className={`shrink-0 bg-surface-container text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all whitespace-nowrap ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-error">{error}</p>}
                <button
                  onClick={handleSmsLogin}
                  disabled={loading}
                  className="w-full bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all mt-2 disabled:opacity-50"
                >
                  {loading ? '登录中...' : '登录'}
                </button>
                <p className="text-xs text-on-surface-variant text-center mt-2">测试验证码: 888888</p>
              </div>
            </div>
          )}

          {/* Email Login/Register */}
          {tab === 'email' && (
            <div className="flex-1 flex flex-col justify-center">
              {!isRegister ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">邮箱</label>
                    <input
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">密码</label>
                    <input
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button
                    onClick={handleEmailLogin}
                    disabled={loading}
                    className="w-full bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? '登录中...' : '登录'}
                  </button>
                  <button
                    onClick={() => setIsRegister(true)}
                    className="w-full bg-surface-container text-on-surface px-4 py-2.5 rounded-md text-sm font-medium hover:bg-surface-container-high transition-all"
                  >
                    注册新账号
                  </button>
                  <p className="text-xs text-on-surface-variant text-center mt-2">测试账号: admin@example.local / admin123</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">邮箱</label>
                    <input
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">密码 (至少6位)</label>
                    <input
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button
                    onClick={handleEmailRegister}
                    disabled={loading}
                    className="w-full bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? '注册中...' : '注册'}
                  </button>
                  <button
                    onClick={() => setIsRegister(false)}
                    className="w-full bg-surface-container text-on-surface px-4 py-2.5 rounded-md text-sm font-medium hover:bg-surface-container-high transition-all"
                  >
                    返回登录
                  </button>
                </div>
              )}
            </div>
          )}

          {/* QR Code Login */}
          {tab === 'qrcode' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* QR Type Selector */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setQrType('WECHAT')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${qrType === 'WECHAT' ? 'bg-[#07C160] text-white' : 'bg-surface-container text-on-surface-variant'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.588 20.7A1 1 0 0 0 4 22l3.532-.85A9.959 9.959 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                  微信
                </button>
                <button
                  onClick={() => setQrType('ALIPAY')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${qrType === 'ALIPAY' ? 'bg-[#1677FF] text-white' : 'bg-surface-container text-on-surface-variant'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  支付宝
                </button>
              </div>
              
              {/* QR Code Box */}
              <div
                className="w-48 h-48 bg-surface-container rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
              >
                {qrStatus === 'waiting' && (
                  <div className="text-center">
                    <svg width="80" height="80" viewBox="0 0 160 160" className="opacity-30">
                      <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                      <rect x="100" y="10" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                      <rect x="10" y="100" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                      <rect x="70" y="70" width="20" height="20" fill="#18181B" />
                    </svg>
                    <p className="text-xs text-on-surface-variant mt-2">正在生成...</p>
                  </div>
                )}
                {qrStatus === 'scanned' && (
                  <div className="text-center text-success">
                    <Check className="w-12 h-12 mx-auto" />
                    <p className="text-sm font-medium mt-2">已扫码</p>
                    <p className="text-xs text-on-surface-variant">请在手机上确认</p>
                  </div>
                )}
                {qrStatus === 'confirmed' && (
                  <div className="text-center text-success">
                    <Check className="w-16 h-16 mx-auto" />
                    <p className="text-sm font-medium mt-2">登录成功</p>
                  </div>
                )}
                {qrStatus === 'expired' && (
                  <div className="text-center text-error">
                    <QrCode className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-sm font-medium mt-2">二维码已过期</p>
                    <button onClick={generateQRCode} className="text-xs text-primary mt-1">点击刷新</button>
                  </div>
                )}
              </div>
              
              <p className="text-sm font-medium text-on-surface mb-1">
                {qrType === 'WECHAT' ? '请使用微信扫描二维码' : '请使用支付宝扫描二维码'}
              </p>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {qrType === 'WECHAT' ? '微信 → 扫一扫' : '支付宝 → 扫一扫'}
              </p>
              
              {/* Dev Mode Quick Login */}
              <button
                onClick={handleDevQuickLogin}
                className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                开发模式: 快速登录
              </button>
            </div>
          )}

          {/* Agreement */}
          <div className="mt-auto pt-6 text-center">
            <p className="text-xs text-on-surface-variant">
              登录即同意<a href="#" className="text-primary hover:underline">《服务条款》</a>和<a href="#" className="text-primary hover:underline">《隐私政策》</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export { LoginPage };
