import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {}

export function AuthScreen({}: AuthScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignup && !name) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    let authError;

    try {
      if (isSignup) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        authError = signUpErr;
        if (!authError) {
          setError('Sign up successful! Please check your email or log in.');
          setLoading(false);
          return;
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        authError = signInErr;
      }
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch')) {
        authError = { message: 'Network error: Cannot reach Supabase. Please check your Project URL and Key in src/lib/supabase.ts.' };
      } else {
        authError = e;
      }
    }

    setLoading(false);
    if (authError) {
      setError(authError.message);
    }
  };

  const signInGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://dprince-ai.vercel.app', // Update if necessary
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      }
    });

    if (error) {
      setGoogleLoading(false);
      if (error.message.includes('provider is not enabled') || error.message.includes('not enabled')) {
        setError('Google sign-in is not yet configured. Please use email/password below, or contact the admin.');
      } else {
        setError('Google sign-in failed: ' + error.message);
      }
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div id="authScreen" style={{ display: 'flex' }}>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="DPR AI Logo" style={{ width: 64, height: 64, marginBottom: 16, borderRadius: 12, boxShadow: 'var(--glow-g)' }} />
            <span className="auth-logo-name">DPR AI</span>
            <span className="auth-logo-tag">Think &nbsp;·&nbsp; Create &nbsp;·&nbsp; Explore</span>
          </div>
          <div className="auth-title">
            {isSignup ? 'Create account' : 'Welcome back'}
          </div>
          <div className="auth-sub">
            {isSignup ? 'Join DPR AI for free' : 'Sign in to continue'}
          </div>
          {error && <div className="auth-err show">{error}</div>}

          <button className="btn-google" onClick={signInGoogle} disabled={googleLoading}>
            {googleLoading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          <div className="auth-div">or</div>

          {isSignup && (
            <input
              className="auth-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
          <button className="btn-primary" onClick={handleAuth} disabled={loading}>
            {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
          </button>

          <div className="auth-switch">
             {isSignup ? (
               <>Already have an account? <a onClick={toggleMode}>Sign in</a></>
             ) : (
               <>Don't have an account? <a onClick={toggleMode}>Sign up free</a></>
             )}
          </div>
          <div className="auth-back">
            <a href="https://mrwale.vercel.app" target="_blank" rel="noreferrer">← Back to Mr. Wale's Portfolio</a>
          </div>
        </div>
      </div>
    </div>
  );
}
