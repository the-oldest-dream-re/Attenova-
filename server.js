require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { loadDB, saveDB } = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'attendly-institutional-secret-key-2026';
const ENV_ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@college.edu,principal@college.edu')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: sanitize user object before sending to client
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

// Helper: Haversine distance in meters between two GPS coordinates
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Middleware: authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session' });
    req.user = payload;
    next();
  });
}

// ---- Public Config Endpoint (for Google Identity Services & PWA) ----
app.get('/api/config', (req, res) => {
  const db = loadDB();
  const googleClientId = process.env.GOOGLE_CLIENT_ID || (db.settings && db.settings.googleClientId) || '';
  res.json({
    googleClientId,
    adminEmails: ENV_ADMIN_EMAILS
  });
});

app.put('/api/config/google-client-id', (req, res) => {
  const { googleClientId } = req.body;
  const db = loadDB();
  db.settings = db.settings || {};
  db.settings.googleClientId = (googleClientId || '').trim();
  saveDB(db);
  res.json({ ok: true, googleClientId: db.settings.googleClientId });
});

// ---- Authentication Endpoints ---------------------------------------

// Helper: derive readable name from institutional email (e.g., s25_tekade_yash@mgmmumbai.ac.in -> Tekade Yash)
function formatNameFromEmail(email) {
  const local = email.split('@')[0] || 'User';
  const parts = local
    .replace(/^[a-z]\d+[_.-]?/i, '') // strip prefixes like s25_
    .split(/[._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return local;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// 1. Email + Password Sign-In (with bcrypt verification & auto-enrollment for new institutional emails)
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail =
    ENV_ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');
  const db = loadDB();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // Automatically enroll new institutional email into the database
    const assignedRole = isAdminEmail
      ? 'admin'
      : ['student', 'faculty', 'parent', 'admin'].includes(role)
      ? role
      : 'student';
    const studentNum = db.users.filter((u) => u.role === 'student').length + 14;

    user = {
      id: 'usr_' + Date.now(),
      name: formatNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role: assignedRole,
      department: 'Computer Science',
      rollNo: assignedRole === 'student' ? `CS25-0${studentNum}` : undefined,
      semester: assignedRole === 'student' ? 'Semester 5' : undefined,
      faceEnrolled: assignedRole === 'student' ? true : undefined,
      studentRollNo: assignedRole === 'parent' ? 'CS21-014' : undefined,
      studentName: assignedRole === 'parent' ? 'Aarav Menon' : undefined,
      preferences:
        assignedRole === 'parent'
          ? {
              successfulCheckIn: true,
              lateCheckIn: true,
              wrongLocation: true,
              faceNotMatched: true
            }
          : undefined,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveDB(db);
  } else {
    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
      saveDB(db);
    }
  }

  const safeUser = sanitizeUser(user);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({ token, user: safeUser });
});

// 2. Real Google Sign-In (verifies Google ID token JWT via google-auth-library)
app.post('/api/auth/google', async (req, res) => {
  const { credential, selectedRole } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential token.' });
  }

  const db = loadDB();
  const configuredClientId =
    process.env.GOOGLE_CLIENT_ID || (db.settings && db.settings.googleClientId) || '';

  try {
    const client = new OAuth2Client(configuredClientId || undefined);
    const verifyOptions = configuredClientId
      ? { idToken: credential, audience: configuredClientId }
      : { idToken: credential };

    const ticket = await client.verifyIdToken(verifyOptions);
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Unable to extract email from Google account.' });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const isAdminEmail = ENV_ADMIN_EMAILS.includes(email);

    let user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      // Auto-register the Google-authenticated user into the institutional database
      const assignedRole = isAdminEmail
        ? 'admin'
        : ['student', 'faculty', 'parent', 'admin'].includes(selectedRole)
        ? selectedRole
        : 'student';

      const studentCount = db.users.filter((u) => u.role === 'student').length + 14;
      user = {
        id: 'usr_' + Date.now(),
        name,
        email,
        passwordHash: bcrypt.hashSync(Math.random().toString(36) + Date.now(), 10),
        role: assignedRole,
        googleSub: payload.sub,
        picture: payload.picture || '',
        department: 'Computer Science',
        rollNo: assignedRole === 'student' ? `CS21-0${studentCount}` : undefined,
        semester: assignedRole === 'student' ? 'Semester 5' : undefined,
        faceEnrolled: assignedRole === 'student' ? true : undefined,
        studentRollNo: assignedRole === 'parent' ? 'CS21-014' : undefined,
        studentName: assignedRole === 'parent' ? 'Aarav Menon' : undefined,
        preferences:
          assignedRole === 'parent'
            ? {
                successfulCheckIn: true,
                lateCheckIn: true,
                wrongLocation: true,
                faceNotMatched: true
              }
            : undefined,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      saveDB(db);
    } else if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
      saveDB(db);
    }

    const safeUser = sanitizeUser(user);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Google token verification failed:', err.message);
    res.status(401).json({
      error: 'Google Sign-In verification failed: ' + err.message
    });
  }
});

// 3. Get Current Logged-in User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

// ---- Application Data Endpoints -------------------------------------

// Bootstrap all institutional data
app.get('/api/data', authenticateToken, (req, res) => {
  const db = loadDB();
  const currentUser = db.users.find((u) => u.id === req.user.id);
  res.json({
    currentUser: sanitizeUser(currentUser),
    users: db.users.map(sanitizeUser),
    classes: db.classes,
    attendance: db.attendance,
    alerts: db.alerts
  });
});

// Add a new user (Admin or Institution registration)
app.post('/api/users', authenticateToken, (req, res) => {
  const { name, email, password, role, department, rollNo, semester, studentRollNo, parentEmail } =
    req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }

  const linkedStudent = studentRollNo
    ? db.users.find((u) => u.rollNo && u.rollNo.toLowerCase() === studentRollNo.trim().toLowerCase())
    : null;

  const newUser = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password || 'password123', 10),
    role: ENV_ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : role,
    department: department || 'Computer Science',
    rollNo: role === 'student' ? (rollNo || `CS21-${Math.floor(100 + Math.random() * 900)}`).trim() : undefined,
    semester: role === 'student' ? semester || 'Semester 5' : undefined,
    faceEnrolled: role === 'student' ? true : undefined,
    parentEmail: role === 'student' ? (parentEmail || '').trim().toLowerCase() : undefined,
    studentRollNo: role === 'parent' ? (studentRollNo || 'CS21-014').trim() : undefined,
    studentName: role === 'parent' ? (linkedStudent ? linkedStudent.name : 'Aarav Menon') : undefined,
    preferences:
      role === 'parent'
        ? {
            successfulCheckIn: true,
            lateCheckIn: true,
            wrongLocation: true,
            faceNotMatched: true
          }
        : undefined,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);
  res.status(201).json({ user: sanitizeUser(newUser) });
});

// Delete a user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const db = loadDB();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (db.users[idx].id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own active account.' });
  }
  db.users.splice(idx, 1);
  saveDB(db);
  res.json({ ok: true });
});

// Add a new class (Faculty or Admin)
app.post('/api/classes', authenticateToken, (req, res) => {
  const { name, room, schedule, lat, lng, radius, studentCount } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Class name is required.' });
  }

  const db = loadDB();
  const creator = db.users.find((u) => u.id === req.user.id);

  const newClass = {
    id: 'cls_' + Date.now(),
    name: name.trim(),
    room: (room || 'Room B-101').trim(),
    schedule: (schedule || '10:00 – 11:00').trim(),
    facultyId: creator ? creator.id : 'usr_faculty_1',
    facultyName: creator ? creator.name : 'Prof. Nandini Deshpande',
    lat: parseFloat(lat) || 19.0176,
    lng: parseFloat(lng) || 73.0860,
    radius: parseInt(radius, 10) || 60,
    studentCount: parseInt(studentCount, 10) || 40,
    live: false,
    createdAt: new Date().toISOString()
  };

  db.classes.push(newClass);
  saveDB(db);
  res.status(201).json({ classItem: newClass });
});

// Toggle live session for a class
app.post('/api/classes/:id/toggle-session', authenticateToken, (req, res) => {
  const db = loadDB();
  const cls = db.classes.find((c) => c.id === req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  cls.live = !cls.live;
  saveDB(db);
  res.json({ classItem: cls });
});

// Delete a class
app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  const db = loadDB();
  const idx = db.classes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Class not found' });
  db.classes.splice(idx, 1);
  saveDB(db);
  res.json({ ok: true });
});

// Record an attendance check-in (from Student camera/location or Faculty/Admin manual entry)
app.post('/api/attendance', authenticateToken, (req, res) => {
  const {
    classId,
    studentId,
    lat,
    lng,
    locationName,
    photoDataUrl,
    faceMatched = true,
    manualStatus
  } = req.body;
  const db = loadDB();

  const student =
    (studentId && db.users.find((u) => u.id === studentId)) ||
    db.users.find((u) => u.id === req.user.id && u.role === 'student') ||
    db.users.find((u) => u.role === 'student');

  const cls =
    (classId && db.classes.find((c) => c.id === classId)) ||
    db.classes.find((c) => c.live) ||
    db.classes[0];

  if (!student || !cls) {
    return res.status(400).json({ error: 'Valid student and class are required.' });
  }

  const finalLat = typeof lat === 'number' ? Number(lat.toFixed(5)) : cls.lat || 19.0176;
  const finalLng = typeof lng === 'number' ? Number(lng.toFixed(5)) : cls.lng || 73.0860;
  const finalPlace =
    (locationName && locationName.trim()) ||
    `${cls.room} · MGM College of Engineering and Technology, Kamothe, Panvel`;

  let distanceMeters = 0;
  if (typeof lat === 'number' && typeof lng === 'number' && cls.lat && cls.lng) {
    distanceMeters = calculateDistanceMeters(lat, lng, Number(cls.lat), Number(cls.lng));
  }

  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const displayDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  let status = 'Present';
  let badgeType = 'ok';
  let alertTitle = `Checked in to ${cls.name}`;
  let alertDetail = `${displayDate}, ${timeStr} · 📍 ${finalPlace} (${finalLat}°, ${finalLng}°)`;

  if (manualStatus) {
    status = manualStatus;
    badgeType =
      manualStatus === 'Present' ? 'ok' : manualStatus === 'Late' ? 'warn' : 'bad';
    alertTitle = `Attendance updated for ${cls.name}: ${manualStatus}`;
    alertDetail = `${displayDate}, ${timeStr} · recorded at ${finalPlace}`;
  } else if (!faceMatched) {
    status = 'Face not matched';
    badgeType = 'bad';
    alertTitle = `Face did not match for ${cls.name}`;
    alertDetail = `${displayDate}, ${timeStr} · 📍 ${finalPlace}`;
  } else if (distanceMeters > cls.radius) {
    status = 'Rejected — outside class area';
    badgeType = 'bad';
    alertTitle = `Check-in refused — outside the classroom`;
    alertDetail = `${displayDate}, ${timeStr} · ${cls.name} · ${distanceMeters} m away (${finalPlace})`;
  }

  const record = {
    id: 'att_' + Date.now(),
    studentId: student.id,
    studentName: student.name,
    rollNo: student.rollNo || 'CS21-014',
    classId: cls.id,
    className: cls.name,
    date: isoDate,
    displayDate,
    status,
    badgeType,
    time: timeStr,
    distance: `${distanceMeters} m`,
    lat: finalLat,
    lng: finalLng,
    locationName: finalPlace,
    photoDataUrl: photoDataUrl || '',
    faceMatched: Boolean(faceMatched)
  };

  db.attendance.unshift(record);

  // Trigger parent alert if enabled
  const parentUser = db.users.find(
    (u) =>
      u.role === 'parent' &&
      ((u.studentRollNo && u.studentRollNo === record.rollNo) ||
        (student.parentEmail && u.email.toLowerCase() === student.parentEmail.toLowerCase()))
  );

  const prefs = (parentUser && parentUser.preferences) || {
    successfulCheckIn: true,
    lateCheckIn: true,
    wrongLocation: true,
    faceNotMatched: true
  };

  const shouldAlert =
    (badgeType === 'ok' && prefs.successfulCheckIn) ||
    (badgeType === 'warn' && prefs.lateCheckIn) ||
    (status.includes('outside') && prefs.wrongLocation) ||
    (status.includes('Face') && prefs.faceNotMatched);

  if (shouldAlert) {
    db.alerts.unshift({
      id: 'alt_' + Date.now(),
      studentRollNo: record.rollNo,
      type: badgeType,
      title: alertTitle,
      detail: alertDetail,
      unread: true,
      createdAt: now.toISOString()
    });
  }

  saveDB(db);
  res.status(201).json({ record });
});

// Mark all parent alerts read
app.post('/api/alerts/mark-read', authenticateToken, (req, res) => {
  const db = loadDB();
  db.alerts.forEach((a) => {
    a.unread = false;
  });
  saveDB(db);
  res.json({ ok: true });
});

// Save parent alert preferences
app.put('/api/preferences', authenticateToken, (req, res) => {
  const { successfulCheckIn, lateCheckIn, wrongLocation, faceNotMatched } = req.body;
  const db = loadDB();
  const user =
    db.users.find((u) => u.id === req.user.id) || db.users.find((u) => u.role === 'parent');

  if (user) {
    user.preferences = {
      successfulCheckIn: Boolean(successfulCheckIn),
      lateCheckIn: Boolean(lateCheckIn),
      wrongLocation: Boolean(wrongLocation),
      faceNotMatched: Boolean(faceNotMatched)
    };
    saveDB(db);
  }

  res.json({ ok: true, preferences: user ? user.preferences : req.body });
});

// Serve static frontend files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Attenova Smart Attendance Server running at http://localhost:${PORT}`);
});
