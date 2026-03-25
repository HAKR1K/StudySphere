import React, { useState, useEffect } from 'react';

export default function LearningHub() {
    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/learning-hub')
            .then(res => res.json())
            .then(data => {
                setApiData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to connect to backend", err);
                setLoading(false);
            });
    }, []);

    // Helper to extract a cool color from titles (simulated)
    const getColor = (idx) => {
        const colors = ['linear-gradient(135deg, #0ea5e9, #3b82f6)', 'linear-gradient(135deg, #8b5cf6, #d946ef)', 'linear-gradient(135deg, #10b981, #059669)'];
        return colors[idx % colors.length];
    };

    return (
        <div className="module-page" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', marginBottom: '8px', fontWeight: 800, color: 'var(--text-primary)' }}>Learning Hub</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px' }}>Continue where you left off from your curated course library.</p>

            {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>⏳ Fetching courses from backend...</p>
                </div>
            ) : apiData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {apiData.modules.map((mod, index) => (
                        <div key={mod.id} style={{
                            background: 'var(--bg-surface)',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-card)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            cursor: 'pointer'
                        }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>
                            <div style={{ height: '140px', background: getColor(index), display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}>Course</div>
                            </div>

                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{mod.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>Learn the fundamentals and advanced concepts directly mapped from your curriculum.</p>

                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <span color="var(--text-muted)">Progress</span>
                                        <span style={{ color: 'var(--accent-primary)' }}>{mod.progress}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-hover)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ width: mod.progress, height: '100%', background: 'var(--accent-primary)', borderRadius: '99px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                <p style={{ color: 'var(--accent-danger)' }}>Failed to load data from backend server. Is it running?</p>
            )}
        </div>
    );
}
