import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiLogin, apiRegister } from '../services/api';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [mode, setMode]       = useState('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const switchMode = (m) => { setMode(m); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Name is required.'); setLoading(false); return; }
        await apiRegister(name.trim(), email, password);
      }
      const data = await apiLogin(email, password);
      login(data.token, mode === 'register' ? name.trim() : undefined);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💬</div>
          <span className={styles.logoText}>ChapApp</span>
        </div>

        <h1 className={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Join ChapApp'}
        </h1>
        <p className={styles.sub}>
          {mode === 'login' ? 'Sign in to continue chatting' : 'Create your account'}
        </p>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`} onClick={() => switchMode('login')}>Sign In</button>
          <button type="button" className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`} onClick={() => switchMode('register')}>Register</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input className={styles.input} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPass(e.target.value)} required />
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
