# ChapApp Frontend

React frontend for the ChapApp real-time chat backend (.NET + SignalR).

## Project Structure

```
chapapp-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.js           # Online users list + current user footer
│   │   ├── Sidebar.module.css
│   │   ├── ChatWindow.js        # Message area + input
│   │   └── ChatWindow.module.css
│   ├── context/
│   │   └── AuthContext.js       # JWT auth state (login/logout/persist)
│   ├── hooks/
│   │   └── useSignalR.js        # SignalR connection hook
│   ├── pages/
│   │   ├── AuthPage.js          # Login + Register
│   │   ├── AuthPage.module.css
│   │   ├── ChatPage.js          # Main chat layout (orchestrates everything)
│   │   └── ChatPage.module.css
│   ├── services/
│   │   └── api.js               # Fetch calls + SignalR builder + JWT decoder
│   ├── styles/
│   │   └── global.css           # CSS variables + resets
│   ├── App.js                   # Router + AuthProvider
│   └── index.js                 # Entry point
├── .env                         # Backend URLs
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure backend URL
Edit `.env` if your backend runs on a different port:
```
REACT_APP_API_BASE=http://localhost:5183/api
REACT_APP_HUB_URL=http://localhost:5183/chathub
```

### 3. Add CORS to your .NET backend (`Program.cs`)
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// In middleware pipeline:
app.UseCors();
```

### 4. Run
```bash
npm start
```

App opens at **http://localhost:3000**

## Features
- Login / Register with JWT
- Session persisted in localStorage
- Real-time messaging via SignalR
- Message status: Sent → Delivered → Read (✓ / ✓✓ / blue ✓✓)
- Typing indicators
- Online users list (live updates)
- Auto-scroll to latest message
