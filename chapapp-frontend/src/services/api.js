import * as signalR from '@microsoft/signalr';

export const API_BASE = 'http://localhost:5271/api'
export const HUB_URL  = 'http://localhost:5271/chatHub'

// ── Auth ──────────────────────────────────────────────────────────
export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json(); // { token }
}

// ── Chat REST ─────────────────────────────────────────────────────
export async function apiGetMessages(user1, user2, token) {
  const res = await fetch(`${API_BASE}/chat/${user1}/${user2}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function apiGetOnlineUsers(token) {
  const res = await fetch(`${API_BASE}/users/online`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

// ── SignalR ───────────────────────────────────────────────────────
export function buildConnection(token) {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build();
}

// ── JWT decode ───────────────────────────────────────────────────
export function decodeToken(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const id = parseInt(
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
  );
  const email =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
    payload['email'] || '';
  return { id, email };
}
export async function apiGetAllUsers(token) {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json() // [{ id, name, email }]
}