import { useState } from 'react';
import './Sidebar.css';

const navItems = [
  { icon: '⊞', label: 'Dashboard', id: 'dashboard' },
  { icon: '⏱', label: 'Timer', id: 'timer' },
  { icon: '📝', label: 'Notes', id: 'notes' },
];

// ── Sidebar receives `subjects` array and `onNav` from parent App ──
export default function Sidebar({ active, onNav, subjects = [], onOpenSubject }) {
  const [subjectsOpen, setSubjectsOpen] = useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">S</div>
        <div className="brand-text">
          <span className="brand-name">StudySphere</span>
          <span className="brand-tagline">Learn · Grow · Excel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">MAIN MENU</p>
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-item ${active === item.id ? 'nav-item--active' : ''}`}
                onClick={() => onNav(item.id)}
                id={`nav-${item.id}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {active === item.id && <span className="nav-indicator" />}
              </button>
            </li>
          ))}

          {/* ── My Subjects (collapsible) ── */}
          <li>
            <button
              className={`nav-item ${active === 'subjects' ? 'nav-item--active' : ''}`}
              onClick={() => { onNav('subjects'); setSubjectsOpen(o => !o); }}
              style={{ width: '100%' }}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-label">My Subjects</span>
              {subjects.length > 0 && (
                <span style={{
                  marginLeft: 'auto', marginRight: '6px',
                  background: 'var(--accent-primary)', color: '#fff',
                  borderRadius: '10px', padding: '1px 8px',
                  fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {subjects.length}
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: subjectsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              {active === 'subjects' && <span className="nav-indicator" />}
            </button>

            {/* Subject list */}
            {subjectsOpen && subjects.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '4px 0 8px', padding: 0 }}>
                {subjects.map((subj, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => onOpenSubject && onOpenSubject(subj)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px 9px 36px', background: 'transparent',
                        border: 'none', cursor: 'pointer', borderRadius: '10px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow, rgba(99,102,241,0.08))'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1rem' }}>📂</span>
                      <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {subj.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {subj.tasks?.length || 0} concepts
                        </div>
                      </div>
                      {/* Progress pill */}
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-glow, rgba(99,102,241,0.1))', borderRadius: '8px', padding: '2px 8px', flexShrink: 0 }}>
                        {subj.tasks ? Math.round((subj.tasks.filter(t => t.completed).length / subj.tasks.length) * 100) : 0}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {subjectsOpen && subjects.length === 0 && active === 'subjects' && (
              <div style={{ padding: '8px 12px 8px 36px', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No subjects saved yet
              </div>
            )}
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">KA</div>
          <div className="user-info">
            <p className="user-name">Karthik Appala</p>
            <p className="user-streak">🔥 14-day streak</p>
          </div>
          <button className="settings-btn" title="Settings">⚙</button>
        </div>
      </div>
    </aside>
  );
}