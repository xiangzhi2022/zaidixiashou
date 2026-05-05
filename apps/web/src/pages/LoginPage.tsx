import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

function LoginPage() {
  const [tab, setTab] = useState<'wechat' | 'sms'>('wechat');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendCode = async () => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    try {
      await apiClient.post('/auth/sms/send', { phone });
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
      setError('');
    } catch {
      setError('发送验证码失败，请重试');
    }
  };

  const handleSmsLogin = async () => {
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/sms/login', { phone, code });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch {
      setError('登录失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="login-brand-title">AI Commerce Ops</h1>
          <p className="login-brand-subtitle">跨境电商 AI 运营中控台</p>
        </div>
        <div className="login-form-area">
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'wechat' ? 'active' : ''}`}
              onClick={() => setTab('wechat')}
            >
              微信扫码登录
            </button>
            <button
              className={`login-tab ${tab === 'sms' ? 'active' : ''}`}
              onClick={() => setTab('sms')}
            >
              短信验证码登录
            </button>
          </div>

          {tab === 'wechat' ? (
            <div className="login-qr-section">
              <div className="qr-placeholder">
                <svg width="160" height="160" viewBox="0 0 160 160">
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
                  <rect x="70" y="130" width="20" height="10" fill="#18181B" />
                </svg>
              </div>
              <p className="qr-hint">请使用微信扫描二维码登录</p>
              <p className="qr-sub-hint">打开微信 → 扫一扫</p>
            </div>
          ) : (
            <div className="login-sms-section">
              <div className="form-group">
                <label className="form-label">手机号</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+86</span>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">验证码</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="6位验证码"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    maxLength={6}
                  />
                  <button
                    className="btn-send-code"
                    onClick={sendCode}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
                  </button>
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button
                className="btn-login"
                onClick={handleSmsLogin}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          )}

          <p className="login-agreement">
            登录即同意《服务条款》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}

export { LoginPage };
