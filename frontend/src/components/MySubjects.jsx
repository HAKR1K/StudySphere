import React from 'react';

export default function MySubjects({ subjects = [] }) {
    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
                My Subjects
            </h2>

            {subjects.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't saved any roadmaps yet. Go to the Study Planner to create one!</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {subjects.map((s, index) => {
                        const total = s.tasks?.length || 0;
                        const completed = s.tasks?.filter(t => t.completed).length || 0;
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                        return (
                            <div key={index}
                                 className="widget-card"
                                 style={{
                                     padding: '24px',
                                     background: 'var(--bg-surface)',
                                     borderRadius: '20px',
                                     border: '1px solid var(--border)',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     gap: '16px',
                                     boxShadow: 'var(--shadow-card)',
                                     transition: 'transform 0.2s ease'
                                 }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{s.name}</h3>
                                    <span style={{ fontSize: '1.5rem' }}>📂</span>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span>📚 {total} Concepts</span>
                                    <span>✅ {completed} Done</span>
                                </div>

                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Progress</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'var(--bg-base)',
                                        borderRadius: '99px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            background: 'var(--accent-primary)',
                                            borderRadius: '99px',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                                    Saved on: {new Date(s.savedAt).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}