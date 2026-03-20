import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSignalR } from '../hooks/useSignalR';
import { apiGetMessages, apiGetOnlineUsers, apiGetAllUsers } from '../services/api.js';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import styles from './ChatPage.module.css';

// Notification sound (simple beep via Web Audio API)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
}

export default function ChatPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const { ready, on, off, invoke } = useSignalR(token);

  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [currentPeer, setCurrentPeer]   = useState(null);
  const [messages, setMessages]         = useState([]);
  const [typingPeerId, setTypingPeerId] = useState(null);
  const [unreadMap, setUnreadMap]       = useState({}); // { peerId: count }
  const [searchQuery, setSearchQuery]   = useState('');
  const [notification, setNotification] = useState(null); // { name, text }

  const typingTimer    = useRef(null);
  const currentPeerRef = useRef(null);
  const notifTimer     = useRef(null);

  useEffect(() => { currentPeerRef.current = currentPeer; }, [currentPeer]);
  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  const refreshOnline = useCallback(async () => {
    try {
      const [ids, users] = await Promise.all([
        apiGetOnlineUsers(token),
        apiGetAllUsers(token),
      ]);
      setAllUsers(users);
      const onlineIds = ids.map(Number).filter(id => id !== user?.id);
      const usersWithNames = onlineIds.map(id => {
        const found = users.find(u => u.id === id);
        return { id, name: found ? found.name : `User ${id}` };
      });
      setOnlineUsers(usersWithNames);
    } catch {}
  }, [token, user]);

  useEffect(() => { if (ready) refreshOnline(); }, [ready, refreshOnline]);

  const showNotification = useCallback((senderName, text) => {
    setNotification({ name: senderName, text });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 4000);
    playNotificationSound();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const onReceive = (id, senderId, receiverId, content, sentAt, status) => {
      senderId = Number(senderId);
      if (currentPeerRef.current && senderId === currentPeerRef.current.id) {
        invoke('MarkAsRead', id).catch(() => {});
        setMessages(prev => [...prev, { id, senderId, receiverId, content, sentAt, status }]);
      } else {
        // Increment unread for that sender
        setUnreadMap(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
        // Show toast notification
        const senderUser = allUsers.find(u => u.id === senderId);
        const senderName = senderUser ? senderUser.name : `User ${senderId}`;
        showNotification(senderName, content);
      }
    };

    const onStatusUpdate = (id, status) =>
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));

    const onRead = (id) =>
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Read' } : m));

    const onUserOnline  = () => refreshOnline();
    const onUserOffline = () => refreshOnline();

    const onTyping = (senderId) => {
      senderId = Number(senderId);
      setTypingPeerId(senderId);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingPeerId(null), 2200);
    };

    on('ReceiveMessage',       onReceive);
    on('MessageStatusUpdated', onStatusUpdate);
    on('MessageRead',          onRead);
    on('UserOnline',           onUserOnline);
    on('UserOffline',          onUserOffline);
    on('UserTyping',           onTyping);

    return () => {
      off('ReceiveMessage',       onReceive);
      off('MessageStatusUpdated', onStatusUpdate);
      off('MessageRead',          onRead);
      off('UserOnline',           onUserOnline);
      off('UserOffline',          onUserOffline);
      off('UserTyping',           onTyping);
    };
  }, [ready, on, off, invoke, refreshOnline, allUsers, showNotification]);

  const openChat = useCallback(async (peer) => {
    setCurrentPeer(peer);
    setMessages([]);
    // Clear unread for this peer
    setUnreadMap(prev => { const n = { ...prev }; delete n[peer.id]; return n; });
    try {
      const hist = await apiGetMessages(user.id, peer.id, token);
      setMessages(hist);
    } catch {}
  }, [user, token]);

  const sendMessage = useCallback(async (text) => {
    if (!currentPeerRef.current || !text.trim()) return;
    const optimistic = {
      id: Date.now(),
      senderId: user.id,
      receiverId: currentPeerRef.current.id,
      content: text,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await invoke('SendPrivateMessage', currentPeerRef.current.id, text);
    } catch (e) { console.error('Send failed', e); }
  }, [user, invoke]);

  const sendTyping = useCallback(() => {
    if (currentPeerRef.current) invoke('Typing', currentPeerRef.current.id).catch(() => {});
  }, [invoke]);

  // Filter users by search
  const filteredUsers = onlineUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = user?.name && !user.name.includes('@')
    ? user.name
    : user?.email?.split('@')[0] || '?';

  return (
    <div className={styles.shell}>
      {/* Notification toast */}
      {notification && (
        <div className={styles.notifToast} onClick={() => setNotification(null)}>
          <div className={styles.notifIcon}>💬</div>
          <div className={styles.notifBody}>
            <div className={styles.notifName}>{notification.name}</div>
            <div className={styles.notifText}>{notification.text.slice(0, 50)}{notification.text.length > 50 ? '…' : ''}</div>
          </div>
          <button className={styles.notifClose}>✕</button>
        </div>
      )}

      <Sidebar
        user={user}
        displayName={displayName}
        onlineUsers={filteredUsers}
        currentPeer={currentPeer}
        onSelectPeer={openChat}
        onLogout={() => { logout(); navigate('/'); }}
        unreadMap={unreadMap}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ChatWindow
        peer={currentPeer}
        messages={messages}
        myId={user?.id}
        isTyping={typingPeerId === currentPeer?.id}
        onSend={sendMessage}
        onTyping={sendTyping}
      />
    </div>
  );
}