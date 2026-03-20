import { useEffect, useRef, useState } from 'react';
import { buildConnection } from '../services/api';

export function useSignalR(token) {
  const connRef   = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) return;
    const conn = buildConnection(token);
    connRef.current = conn;

    conn.start()
      .then(() => setReady(true))
      .catch(err => console.error('SignalR error:', err));

    return () => { conn.stop(); };
  }, [token]);

  const on  = (event, cb) => connRef.current?.on(event, cb);
  const off = (event, cb) => connRef.current?.off(event, cb);
  const invoke = (method, ...args) => connRef.current?.invoke(method, ...args);

  return { ready, on, off, invoke, connection: connRef };
}
