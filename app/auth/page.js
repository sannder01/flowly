// app/auth/page.js
'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = params.get('error');

  useEffect(() => {
    if (status === 'authenticated') router.replace('/app');
  }, [status, router]);

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/app' });
  }

  if (status === 'loading') return <LoadingScreen />;

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-page">
        <div className="mesh mesh-1" />
        <div className="mesh mesh-2" />

        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
            <span className="logo-text">Chronicle</span>
          </div>

          {/* Heading */}
          <h1 className="auth-heading">Добро пожаловать</h1>
          <p className="auth-sub">Войди через Google, чтобы начать</p>

          {/* Error */}
          {error && (
            <div className="auth-error">
              {error === 'OAuthAccountNotLinked'
                ? 'Этот email уже используется с другим провайдером'
                : 'Что-то пошло не так. Попробуй снова.'}
            </div>
          )}

          {/* Google button */}
          <button
            className="btn-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Входим...' : 'Войти через Google'}
          </button>

          {/* Features */}
          <div className="auth-features">
            {[
              { icon: '📅', text: 'Календарь и планирование' },
              { icon: '⚡', text: 'Дедлайны и приоритеты' },
              { icon: '🔒', text: 'Безопасно и приватно' },
            ].map(f => (
              <div key={f.text} className="feature-item">
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(124,106,247,0.2)', borderTop:'3px solid #7c6af7', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'DM Sans', sans-serif; }

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    overflow: hidden;
    background: #0a0a0f;
  }
  .mesh {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .mesh-1 {
    top: -20%; left: -10%;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(124,106,247,0.14) 0%, transparent 70%);
  }
  .mesh-2 {
    bottom: -20%; right: -10%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%);
  }
  .auth-card {
    width: 100%;
    max-width: 440px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 44px 40px;
    backdrop-filter: blur(24px);
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    position: relative;
    z-index: 1;
    animation: cardIn 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .auth-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
  }
  .logo-icon {
    width: 44px; height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #7c6af7, #a78bfa);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(124,106,247,0.35);
  }
  .logo-text {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #a78bfa, #7c6af7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  .auth-heading {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #f0eefc;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  .auth-sub {
    font-size: 15px;
    color: #8a87a8;
    margin-bottom: 32px;
  }
  .auth-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    color: #ff8080;
    margin-bottom: 20px;
  }
  .btn-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #fff;
    color: #1a1a2e;
    border: none;
    border-radius: 14px;
    padding: 14px 20px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    margin-bottom: 28px;
  }
  .btn-google:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .btn-google:active { transform: translateY(0); }
  .btn-google:disabled { opacity: 0.7; cursor: not-allowed; }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(26,26,46,0.2);
    border-top-color: #7c6af7;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-top: 24px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #6b6890;
  }
  .feature-item span:first-child { font-size: 16px; }
`;
