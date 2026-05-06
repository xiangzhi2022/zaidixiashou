import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Smartphone } from 'lucide-react';

function LoginPage() {
  const [tab, setTab] = useState<'wechat' | 'sms'>('wechat');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendCode = () => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    setError('');
  };

  const handleSmsLogin = () => {
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }
    setLoading(true);
    // Demo: direct login
    login('demo-token', { id: '1', name: '小初', phone });
    navigate('/');
    setLoading(false);
  };

  const handleQrClick = () => {
    login('demo-token', { id: '1', name: '小初', phone: '13800138000' });
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
        <div className="w-full max-w-sm flex flex-col min-h-[480px]">
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
              onClick={() => setTab('wechat')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'wechat' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
            >
              微信扫码登录
            </button>
            <button
              onClick={() => setTab('sms')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'sms' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
            >
              短信验证码登录
            </button>
          </div>

          {/* WeChat QR */}
          {tab === 'wechat' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                onClick={handleQrClick}
                className="w-48 h-48 bg-surface-container rounded-xl flex items-center justify-center cursor-pointer hover:shadow-float transition-shadow mb-4"
              >
                <svg width="140" height="140" viewBox="0 0 160 160">
                  <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                  <rect x="20" y="20" width="30" height="30" fill="#18181B" />
                  <rect x="100" y="10" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                  <rect x="110" y="20" width="30" height="30" fill="#18181B" />
                  <rect x="10" y="100" width="50" height="50" rx="4" fill="none" stroke="#18181B" strokeWidth="4" />
                  <rect x="20" y="110" width="30" height="30" fill="#18181B" />
                  <rect x="70" y="70" width="20" height="20" fill="#18181B" />
                  <rect x="100" y="80" width="10" height="10" fill="#18181B" />
                  <rect x="120" y="100" width="10" height="10" fill="#18181B" />
                  <rect x="80" y="120" width="10" height="10" fill="#18181B" />
                  <rect x="100" y="130" width="10" height="10" fill="#18181B" />
                  <rect x="130" y="110" width="10" height="10" fill="#18181B" />
                </svg>
              </div>
              <p className="text-sm font-medium text-on-surface mb-1">请使用微信扫描二维码登录</p>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <Smartphone className="w-3 h-3" />打开微信 → 扫一扫
              </p>
            </div>
          )}

          {/* SMS Form */}
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
                      {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
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
              </div>
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
