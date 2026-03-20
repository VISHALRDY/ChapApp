import React from 'react';
import styles from './Sidebar.module.css';

function Avatar({ name, size = 'md', online = false }) {
  return (
    <div className={`${styles.avatar} ${styles[size]} ${online ? styles.online : ''}`}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}

export default function Sidebar({
  user, displayName, onlineUsers, currentPeer,
  onSelectPeer, onLogout, unreadMap, searchQuery, onSearchChange
}) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>💬</div>
          <span className={styles.brandName}>ChapApp</span>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search users…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button className={styles.searchClear} onClick={() => onSearchChange('')}>✕</button>
        )}
      </div>

      <div className={styles.sectionLabel}>Online Now · {onlineUsers.length}</div>

      <div className={styles.list}>
        {onlineUsers.length === 0 ? (
          <div className={styles.empty}>
            {searchQuery ? 'No users match your search' : 'No one else online yet…'}
          </div>
        ) : (
          onlineUsers.map(peer => {
            const isActive = currentPeer?.id === peer.id;
            const unread = unreadMap[peer.id] || 0;
            return (
              <button
                key={peer.id}
                className={`${styles.userItem} ${isActive ? styles.active : ''}`}
                onClick={() => onSelectPeer(peer)}
              >
                <Avatar name={peer.name} size="sm" online />
                <div className={styles.userInfo}>
                  <div className={styles.userNameRow}>
                    <span className={styles.userName}>{peer.name}</span>
                    {unread > 0 && (
                      <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>
                    )}
                  </div>
                  <div className={styles.userOnline}>
                    <span className={styles.pulseDot} /> Online
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <Avatar name={displayName} online />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{displayName}</div>
          <div className={styles.statusOnline}>● Active now</div>
        </div>
        <button className={styles.logoutBtn} title="Sign out" onClick={onLogout}>⏻</button>
      </div>
    </div>
  );
}