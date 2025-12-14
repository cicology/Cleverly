import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="glass"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#f0f4ff',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5de0e6, #004aad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={18} />
        </div>
        <div style={{ textAlign: 'left', maxWidth: 150 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email?.split('@')[0] || 'User'}
          </div>
          <div style={{ fontSize: 11, color: '#8c95a8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </div>
        </div>
        <ChevronDown size={16} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 240,
            padding: 8,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(8, 12, 18, 0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f4ff', marginBottom: 4 }}>
              Signed in as
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#8c95a8',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Mail size={12} />
              {user.email}
            </div>
          </div>

          <div style={{ padding: '4px 0' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#ffb3b3',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 99, 99, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
