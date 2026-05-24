# MarkMind — Email Notifications Integration Guide

## What Was Added

### Backend Changes
- `backend/services/emailService.js` — Complete rewrite with 7 email types + reusable `sendEmail()` utility
- `backend/controllers/authController.js` — Welcome email on register, login alert on login, notification preferences CRUD
- `backend/controllers/bookmarkController.js` — Bookmark saved email on create
- `backend/controllers/spaceController.js` — Collaboration emails on bookmark add & comment
- `backend/models/User.js` — Added `notificationPreferences` field (loginAlerts, bookmarkEmails, collaborationEmails)
- `backend/routes/auth.js` — Added GET/PUT `/api/auth/notification-preferences`

### Frontend Changes
- `frontend/src/pages/NotificationSettings.jsx` — New settings page with toggle UI
- `frontend/src/App.jsx` — Added `/notifications` route
- `frontend/src/components/Layout.jsx` — Added Notifications nav link

## Email Types Implemented

| Email | Trigger | Respects Preference |
|-------|---------|---------------------|
| Welcome | User registers | Always sent |
| Login Alert | Successful login | `loginAlerts` |
| Bookmark Saved | Bookmark created | `bookmarkEmails` |
| Collaboration Bookmark | Member adds bookmark to shared space | `collaborationEmails` |
| Collaboration Comment | Member comments in shared space | `collaborationEmails` |
| Password Reset | Forgot password flow | Always sent |
| Space Invitation | Invited to a space | Always sent |

## Setup

All emails use Gmail SMTP — already configured in `.env`:

```
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password
```

> Get an App Password: Google Account → Security → 2-Step Verification → App Passwords

## Running

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Notification Preferences

Users can control email notifications at `/notifications` in the app.
The API endpoint is `PUT /api/auth/notification-preferences` with body:
```json
{ "loginAlerts": true, "bookmarkEmails": false, "collaborationEmails": true }
```

## Fail-Safe Design

- All emails are sent asynchronously (non-blocking)
- Failed emails are logged but never crash the API
- If no SMTP is configured, Ethereal test accounts are used (preview URLs logged to console)
