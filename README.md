# Attenova — Smart Institutional Attendance System (Full-Stack PWA + Render.com)

Attenova is an installable Progressive Web Application (PWA) with a Node.js + Express backend designed for Render.com. It provides **Face + Classroom GPS Location Verified Attendance** with role-based portals for **Students**, **Teachers/Faculty**, **Parents**, and **Institution Admins**.

---

## Features

1. **Unified Login (`index.html`)**:
   - **Email & Password Login** secured with server-side `bcryptjs` password hashing and signed JWT sessions.
   - **Real Google Sign-In** powered by Google Identity Services (`https://accounts.google.com/gsi/client`) and verified on the backend via `google-auth-library`.
   - **Institutional Admin Routing**: Signing in with an institutional admin email (`admin@college.edu`) automatically opens the **Institution Admin Portal (`admin.html`)**.
2. **Persistent Database & Adding More Data**:
   - Add new **Students, Faculty, Parents, and Admins** in `admin.html`.
   - Add new **Classes with GPS Geofences** in `faculty.html` or `admin.html`.
   - Start/Stop **Live Attendance Sessions** in `faculty.html`.
   - Perform **Student Camera + GPS Check-ins** in `student.html` (which automatically raise **Parent Alerts** in `parent.html`).
3. **Downloadable App (PWA)**:
   - Includes `manifest.json`, `sw.js` (Service Worker), and scalable app icon (`icons/icon.svg`) so users can install Attenova as a standalone desktop or mobile app.

---

## Default Institutional Accounts

| Role | Email | Password | Portal |
| --- | --- | --- | --- |
| **Institution Admin** | `admin@college.edu` | `password123` | `admin.html` |
| **Teacher / Faculty** | `faculty@college.edu` | `password123` | `faculty.html` |
| **Student** | `student@college.edu` | `password123` | `student.html` |
| **Parent** | `parent@college.edu` | `password123` | `parent.html` |

---

## Running Locally

```bash
npm install
npm start
```

Then open **`http://localhost:3000`** in Chrome or Edge.

---

## Deploying to Render.com

1. Push this folder to a GitHub repository.
2. In [Render.com](https://render.com), click **New +** &rarr; **Blueprint** (or **Web Service**) and connect your repository.
3. Render automatically reads `render.yaml` (`Build Command: npm install`, `Start Command: npm start`).
4. Set your `GOOGLE_CLIENT_ID` in Render's **Environment Variables** (or paste it inside the Admin Portal's **Google OAuth Setup** tab).
