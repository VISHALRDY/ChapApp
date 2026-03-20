import React, { createContext, useContext, useState } from 'react';
import { decodeToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('chap_token'));
  const [user, setUser]   = useState(() => {
    const t = localStorage.getItem('chap_token');
    const n = localStorage.getItem('chap_name');
    if (t) {
      const d = decodeToken(t);
      // Use saved name, but never fall back to full email as display name
      const name = n && !n.includes('@') ? n : d.email.split('@')[0];
      return { ...d, name };
    }
    return null;
  });

  const login = (tok, name) => {
    const decoded = decodeToken(tok);
    // Prefer explicit name, then strip email domain as fallback
    const displayName = name && !name.includes('@')
      ? name
      : decoded.email.split('@')[0];
    const u = { ...decoded, name: displayName };
    localStorage.setItem('chap_token', tok);
    localStorage.setItem('chap_name', displayName);
    setToken(tok);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('chap_token');
    localStorage.removeItem('chap_name');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);