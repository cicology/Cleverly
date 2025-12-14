import { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAuthEnabled } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, error } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (!error) {
          onClose();
        }
      } else {
        const { error } = await signUp(email, password);
        if (!error) {
          // Show success message or close modal
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Show message if Supabase is not configured
  if (!isAuthEnabled) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal glass" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 style={{ margin: 0 }}>Authentication Not Configured</h2>
            </div>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: '20px 0' }}>
            <p className="muted">
              Supabase authentication is not configured. Please set up your Supabase project and add the
              credentials to your .env file:
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              VITE_SUPABASE_URL=your-project-url
              <br />
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </div>
            <p className="muted" style={{ marginTop: 16 }}>
              For development, you can set VITE_SUPABASE_DEMO_TOKEN in .env to bypass authentication.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
            <p className="muted">Access Cleverly AI Test Management</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tab-row">
          <button className={`tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>
            <LogIn size={16} style={{ marginRight: 6, display: 'inline' }} />
            Sign In
          </button>
          <button className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>
            <UserPlus size={16} style={{ marginRight: 6, display: 'inline' }} />
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="field">
            <span>Email</span>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8c95a8',
                }}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <span>Password</span>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8c95a8',
                }}
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: 36 }}
              />
            </div>
            {mode === 'signup' && (
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Minimum 6 characters
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 10,
                background: 'rgba(255, 99, 99, 0.12)',
                color: '#ffb3b3',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={16} /> Sign In
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Create Account
                </>
              )}
            </button>
          </div>
        </form>

        {mode === 'signin' && (
          <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
            Don't have an account?{' '}
            <span
              onClick={() => setMode('signup')}
              style={{ color: '#5de0e6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign up
            </span>
          </p>
        )}

        {mode === 'signup' && (
          <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
            Already have an account?{' '}
            <span
              onClick={() => setMode('signin')}
              style={{ color: '#5de0e6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign in
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
