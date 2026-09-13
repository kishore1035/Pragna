import { useState, useEffect } from "react";
import Login from "./components/auth/Login";
import ResetPassword from "./components/auth/ResetPassword";
import SharedChatView from "./components/chat/SharedChatView";
import PragnaApp from "./pragna/App";
import { ChatProvider } from "./context/ChatContext";

import "./styles/auth.css";
import "./styles/chat.css";
import "./styles/input.css";
import "./styles/chat_modes.css";
import "./styles/dashboard.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ username: '', email: '' });

  // The password reset email links to /reset-password?token=... - no router
  // in this app, so read it directly. Checked once on initial load; the
  // token is single-use anyway so there's no need for this to react to
  // later URL changes within the same session. isResetPasswordRoute is
  // tracked separately from the token itself so that visiting the path
  // with a missing/stripped token still shows an explicit "invalid link"
  // state instead of silently falling through to the normal app/login.
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [isResetPasswordRoute] = useState(() => window.location.pathname === '/reset-password');

  // /share/<token> is a public read-only link - viewable while logged out,
  // so it's checked before the auth gate below, same as the reset-password route.
  const [shareToken] = useState(() => {
    const match = window.location.pathname.match(/^\/share\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  });

  const clearResetToken = () => {
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname + url.search);
    window.location.reload();
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.pathname = '/';
    window.history.replaceState({}, '', url.pathname);
    window.location.reload();
  };

  useEffect(() => {
    // Google/GitHub sign-in lands back here from the backend's
    // /api/auth/<provider>/callback redirect, which appends the result to
    // the query string (there's no server-side session to read it from -
    // see backend/app.py's _oauth_success_redirect). Handle that before
    // falling back to the normal "already logged in" localStorage check,
    // and strip the params either way so a refresh doesn't try to log in
    // again with a token that's already been consumed.
    const oauthParams = new URLSearchParams(window.location.search);
    const oauthToken = oauthParams.get('oauth_token');
    if (oauthToken) {
      const oauthUserId = oauthParams.get('user_id') || '';
      const oauthUsername = oauthParams.get('username') || '';
      const oauthEmail = oauthParams.get('email') || '';

      localStorage.setItem('authToken', oauthToken);
      localStorage.setItem('userId', oauthUserId);
      localStorage.setItem('authUsername', oauthUsername);
      localStorage.setItem('authEmail', oauthEmail);

      const url = new URL(window.location.href);
      ['oauth_token', 'user_id', 'username', 'email'].forEach((key) => url.searchParams.delete(key));
      window.history.replaceState({}, '', url.pathname + url.search);

      setIsAuthenticated(true);
      setUserProfile({ username: oauthUsername, email: oauthEmail });
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('authUsername') || '';
    const savedEmail = localStorage.getItem('authEmail') || '';

    if (savedToken && savedUserId) {
      setIsAuthenticated(true);
      setUserProfile({ username: savedUsername, email: savedEmail });
    }

    setLoading(false);
  }, []);

  const handleLoginSuccess = (userId, token, profile) => {
    setIsAuthenticated(true);
    if (token) localStorage.setItem('authToken', token);
    if (userId) localStorage.setItem('userId', userId);
    if (profile?.username) localStorage.setItem('authUsername', profile.username);
    if (profile?.email) localStorage.setItem('authEmail', profile.email);

    if (profile) {
      setUserProfile({
        username: profile.username || '',
        email: profile.email || '',
      });
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('authUsername');
    localStorage.removeItem('authEmail');
    setUserProfile({ username: '', email: '' });
    setIsAuthenticated(false);
  };

  if (resetToken || isResetPasswordRoute) {
    return <ResetPassword token={resetToken} onDone={clearResetToken} />;
  }

  if (shareToken) {
    return (
      <ChatProvider>
        <SharedChatView token={shareToken} onDone={goHome} />
      </ChatProvider>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#71717a' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid #27272a', borderTopColor: '#e4e4e7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ChatProvider>
      <PragnaApp onLogout={handleLogout} userProfile={userProfile} />
    </ChatProvider>
  );
}