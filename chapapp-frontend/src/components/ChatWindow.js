import React, { useEffect, useRef, useState } from 'react';
import styles from './ChatWindow.module.css';

function StatusIcon({ status }) {
  if (status === 'Sent')      return <span className={styles.statusSent}>✓</span>;
  if (status === 'Delivered') return <span className={styles.statusDelivered}>✓✓</span>;
  if (status === 'Read')      return <span className={styles.statusRead}>✓✓</span>;
  return null;
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    const date = new Date(msg.sentAt).toDateString();
    if (date !== lastDate) {
      groups.push({ type: 'divider', date, label: formatDateLabel(date) });
      lastDate = date;
    }
    groups.push({ type: 'message', msg });
  });
  return groups;
}

function formatDateLabel(dateStr) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function MessageBubble({ msg, isMine }) {
  const time = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>{msg.content}</div>
      <div className={styles.meta}>
        <span className={styles.time}>{time}</span>
        {isMine && <StatusIcon status={msg.status} />}
      </div>
    </div>
  );
}

export default function ChatWindow({ peer, messages, myId, isTyping, onSend, onTyping }) {
  const [text, setText]   = useState('');
  const bottomRef         = useRef(null);
  const typingSentRef     = useRef(false);
  const inputRef          = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when peer changes
  useEffect(() => {
    if (peer) inputRef.current?.focus();
  }, [peer]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      onTyping();
      setTimeout(() => { typingSentRef.current = false; }, 2000);
    }
  };

  if (!peer) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💬</div>
        <h2 className={styles.emptyTitle}>Start a conversation</h2>
        <p className={styles.emptySub}>Select someone from the list to begin chatting in real time.</p>
        <div className={styles.emptyHints}>
          <span className={styles.hint}>⚡ Real-time messaging</span>
          <span className={styles.hint}>✓✓ Read receipts</span>
          <span className={styles.hint}>✍️ Typing indicators</span>
        </div>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className={styles.panel}>
      <div className={styles.bgPattern} />

      <div className={styles.header}>
        <div className={`${styles.avatar} ${styles.lg}`}>{peer.name[0].toUpperCase()}</div>
        <div className={styles.headerInfo}>
          <div className={styles.peerName}>{peer.name}</div>
          <div className={`${styles.peerStatus} ${isTyping ? styles.typing : ''}`}>
            {isTyping ? (
              <span className={styles.typingText}>
                <span className={styles.td1} /><span className={styles.td2} /><span className={styles.td3} /> typing…
              </span>
            ) : (
              <><span className={styles.onlineDot} /> Online</>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.msgCount}>{messages.length} messages</div>
        </div>
      </div>

      <div className={styles.messages}>
        {grouped.map((item, i) =>
          item.type === 'divider'
            ? <div key={i} className={styles.dateDivider}>{item.label}</div>
            : <MessageBubble key={item.msg.id} msg={item.msg} isMine={item.msg.senderId === myId} />
        )}
        {isTyping && (
          <div className={`${styles.msgRow} ${styles.theirs}`}>
            <div className={`${styles.bubble} ${styles.typingBubble}`}>
              <span className={styles.d1}/><span className={styles.d2}/><span className={styles.d3}/>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder={`Message ${peer.name}…`}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKey}
          />
          <button
            className={`${styles.sendBtn} ${text.trim() ? styles.sendActive : ''}`}
            onClick={handleSend}
          >
            ➤
          </button>
        </div>
        <div className={styles.inputHint}>Press Enter to send</div>
      </div>
    </div>
  );
}