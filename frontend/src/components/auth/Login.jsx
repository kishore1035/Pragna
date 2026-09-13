import { useEffect, useState } from 'react';
import '../../styles/auth.css';
import { authAPI } from '../../api/authAPI';
import { API_BASE } from '../../api/api';
import PasswordInput from '../ui/PasswordInput';
import pragnaLogo from '../../assets/pragna-logo-full.png';
import InteractiveNeuralVortex from './InteractiveNeuralVortex';

// SVG icons for OAuth providers
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Registration is two steps: request-otp emails a code without creating
  // the account, verify-otp creates it once the code checks out.
  const [showOtpVerify, setShowOtpVerify] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendLoading, setOtpResendLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');

  useEffect(() => {
    if (!window.location.search.includes('oauth_error')) return;
    const params = new URLSearchParams(window.location.search);
    const oauthErr = params.get('oauth_error');
    if (oauthErr) {
      const messages = {
        invalid_state: 'Sign-in session expired. Please try again.',
        login_failed: 'Google sign-in failed. Please try again or use email/password.',
        access_denied: 'Google sign-in was cancelled.',
      };
      setError(messages[oauthErr] || 'Google sign-in failed. Please try again.');
    }
    const url = new URL(window.location.href);
    const err = url.searchParams.get('oauth_error');
    if (err) {
      if (err === 'access_denied') {
        setError('Sign-in request was cancelled.');
      } else if (err === 'invalid_state') {
        setError('Sign-in session timed out. Please try again.');
      } else {
        setError('Social sign-in failed. Please try again or use your password.');
      }
    }
    url.searchParams.delete('oauth_error');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  const handleOAuthLogin = (provider) => {
    setError('');
    const returnTo = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE}/api/auth/${provider}/login?return_to=${returnTo}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validate locally first so obvious mistakes surface instantly instead of
    // costing a network round-trip.
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Enter your username and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.login(trimmedUsername, password);

      if (data.error) {
        setError(data.error || 'Login failed');
        return;
      }

      // Save token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user_id);
      const resolvedUsername = data.username || trimmedUsername;
      const resolvedEmail = data.email || localStorage.getItem('authEmail') || '';
      localStorage.setItem('authUsername', resolvedUsername);
      if (resolvedEmail) {
        localStorage.setItem('authEmail', resolvedEmail);
      }
      
      onLoginSuccess(data.user_id, data.token, {
        username: resolvedUsername,
        email: resolvedEmail,
      });
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Mirror the backend's rules client-side so the user gets the feedback
    // immediately rather than after a failed round-trip.
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail || !password) {
      setError('Fill in every field to create your account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.requestRegistrationOtp(trimmedUsername, trimmedEmail, password);

      if (data.error) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Account doesn't exist yet - request-otp only emailed a code.
      // Hold onto what was submitted so verify (and resend) can use it.
      setPendingUsername(trimmedUsername);
      setPendingEmail(trimmedEmail);
      setPendingPassword(password);
      setOtpCode('');
      setOtpNotice('');
      setShowOtpVerify(true);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedCode = otpCode.trim();
    if (!trimmedCode) {
      setError('Enter the code from your email.');
      return;
    }

    setOtpLoading(true);

    try {
      const data = await authAPI.verifyRegistrationOtp(pendingEmail, trimmedCode);

      if (data.error) {
        setError(data.error || 'Verification failed');
        return;
      }

      // verify-otp is what actually creates the account, so this is the
      // first point account+token exist - same login-completion steps as
      // the old single-step register.
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('authUsername', pendingUsername);
      localStorage.setItem('authEmail', pendingEmail);

      onLoginSuccess(data.user_id, data.token, {
        username: pendingUsername,
        email: pendingEmail,
      });
    } catch {
      setError('Network error. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtpNotice('');
    setOtpResendLoading(true);
    try {
      const data = await authAPI.requestRegistrationOtp(pendingUsername, pendingEmail, pendingPassword);
      if (data.error) {
        setError(data.error || 'Failed to resend code');
        return;
      }
      setOtpCode('');
      setOtpNotice('A new code has been sent.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setOtpResendLoading(false);
    }
  };

  const backToRegisterForm = () => {
    setShowOtpVerify(false);
    setOtpCode('');
    setOtpNotice('');
    setError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);
    try {
      await authAPI.forgotPassword(resetEmail);
      // Always show the same success state regardless of whether the email
      // is registered - the backend deliberately never reveals that.
      setResetSent(true);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setResetSent(false);
    setResetEmail('');
    setError('');
  };

  return (
    <div className="auth-container">
      <InteractiveNeuralVortex />

      <div className="auth-box">
        <div className="auth-logo-wrapper">
          <img src={pragnaLogo} alt="Pragna Logo" className="auth-logo-centered" />
        </div>
        {showOtpVerify ? (
          <>
            <h1>Verify your email</h1>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              <p style={{ color: 'var(--pragna-text-muted, #a89878)', fontSize: '13.5px', lineHeight: 1.5, margin: '4px 0 16px 0' }}>
                Enter the 6-digit code sent to <strong>{pendingEmail}</strong>. It expires in 10 minutes.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoFocus
                maxLength={6}
                disabled={otpLoading}
              />
              {otpNotice && (
                <p style={{ color: 'var(--pragna-gold-soft, #e5c76b)', fontSize: '13px', margin: '-4px 0 4px 0' }}>
                  {otpNotice}
                </p>
              )}
              <button type="submit" disabled={otpLoading} className="auth-btn">
                {otpLoading ? 'Verifying…' : 'Verify & Create Account'}
              </button>
            </form>

            <p className="auth-toggle">
              <button type="button" onClick={handleResendOtp} disabled={otpResendLoading || otpLoading}>
                {otpResendLoading ? 'Resending…' : 'Resend code'}
              </button>
            </p>
            <p className="auth-toggle">
              <button type="button" onClick={backToRegisterForm} disabled={otpLoading}>
                Back
              </button>
            </p>
          </>
        ) : showForgotPassword ? (
          <>
            <h1>Reset Password</h1>

            {error && <div className="auth-error">{error}</div>}

            {resetSent ? (
              <>
                <p style={{ color: 'var(--pragna-text-muted, #a89878)', fontSize: '14px', lineHeight: 1.6, margin: '4px 0 20px 0' }}>
                  If that email is registered, a password reset link has been sent. Check your inbox
                  (and spam folder) - the link expires in 60 minutes.
                </p>
                <button type="button" onClick={backToLogin} className="auth-btn">
                  Back to login
                </button>
              </>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p style={{ color: 'var(--pragna-text-muted, #a89878)', fontSize: '13.5px', lineHeight: 1.5, margin: '4px 0 16px 0' }}>
                  Enter your account email and we'll send you a link to reset your password.
                </p>
                <input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={resetLoading}
                />
                <button type="submit" disabled={resetLoading} className="auth-btn">
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            {!resetSent && (
              <p className="auth-toggle">
                <button type="button" onClick={backToLogin} disabled={resetLoading}>
                  Back to login
                </button>
              </p>
            )}
          </>
        ) : (
          <>
            <h1>{showRegister ? 'Create Account' : 'Welcome Back'}</h1>

            {error && <div className="auth-error">{error}</div>}

            {/* key forces a fresh form (and re-runs autoFocus) when switching
                between sign-in and register, so focus lands sensibly instead
                of staying wherever it was. */}
            <form key={showRegister ? 'register' : 'login'} onSubmit={showRegister ? handleRegister : handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                disabled={loading}
              />

              {showRegister && (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              )}

              <PasswordInput
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={showRegister ? 'new-password' : 'current-password'}
                disabled={loading}
              />

              {showRegister && (
                <p className="password-hint">Min 8 characters</p>
              )}

              {!showRegister && (
                <p className="auth-toggle" style={{ margin: '-8px 0 4px 0', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(''); }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              <button type="submit" disabled={loading} className="auth-btn">
                {loading
                  ? (showRegister ? 'Sending code…' : 'Signing in…')
                  : (showRegister ? 'Register' : 'Login')}
              </button>
            </form>

            <div className="auth-divider">or continue with</div>

            <div className="auth-oauth-row">
              <button
                type="button"
                className="auth-oauth-btn"
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                title="Sign in with Google"
              >
                <GoogleIcon />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="auth-oauth-btn"
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                title="Sign in with GitHub"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                className="auth-oauth-btn"
                onClick={() => handleOAuthLogin('discord')}
                disabled={loading}
                title="Sign in with Discord"
              >
                <DiscordIcon />
                <span>Discord</span>
              </button>
            </div>

            <p className="auth-toggle">
              {showRegister ? 'Have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setShowRegister(!showRegister);
                  setError('');
                }}
                disabled={loading}
              >
                {showRegister ? ' Login' : ' Register'}
              </button>
            </p>

          </>
        )}
      </div>
    </div>
  );
}

