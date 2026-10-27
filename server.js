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

const DEFAULT_ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'mgmmumbai.ac.in,college.edu')
  .split(',')
  .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);

function getAllowedDomains(db) {
  if (db && db.settings && Array.isArray(db.settings.allowedDomains) && db.settings.allowedDomains.length > 0) {
    return db.settings.allowedDomains;
  }
  return DEFAULT_ALLOWED_DOMAINS;
}

function isAllowedInstitutionalEmail(email, db) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized.includes('@')) return false;
  if (ENV_ADMIN_EMAILS.includes(normalized)) return true;
  const domain = normalized.split('@')[1];
  const allowedDomains = getAllowedDomains(db);
  return allowedDomains.some((d) => domain === d || domain.endsWith('.' + d));
}

// Normalize attendance records to precise campus/local submission time
function normalizeAttendanceRecord(r, defaultTimezone = 'Asia/Kolkata') {
  if (!r) return r;
  let epoch = r.timestamp;
  if (!epoch && typeof r.id === 'string' && r.id.startsWith('att_')) {
    const parsed = Number(r.id.slice(4));
    if (!isNaN(parsed) && parsed > 1600000000000) {
      epoch = parsed;
    }
  }
  if (epoch) {
    const tz = r.timezone || defaultTimezone;
    try {
      const d = new Date(epoch);
      if (!isNaN(d.getTime())) {
        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const displayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short' });
        const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
        r.date = dateFormatter.format(d);
        r.displayDate = displayFormatter.format(d);
        r.time = timeFormatter.format(d);
        r.timestamp = epoch;
      }
    } catch {
      // fallback
    }
  }
  return r;
}

// ---- Public Config Endpoint (for Google Identity Services & PWA) ----
app.get('/api/config', (req, res) => {
  const db = loadDB();
  const googleClientId = process.env.GOOGLE_CLIENT_ID || (db.settings && db.settings.googleClientId) || '';
  res.json({
    googleClientId,
    adminEmails: ENV_ADMIN_EMAILS,
    allowedDomains: getAllowedDomains(db)
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

app.put('/api/config/allowed-domains', (req, res) => {
  const { allowedDomains } = req.body;
  const parsed = String(allowedDomains || '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
  const db = loadDB();
  db.settings = db.settings || {};
  db.settings.allowedDomains = parsed.length > 0 ? parsed : DEFAULT_ALLOWED_DOMAINS;
  saveDB(db);
  res.json({ ok: true, allowedDomains: db.settings.allowedDomains });
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

// Helper: find a student in db.users by id, rollNo, email, or name
function findStudentByQuery(db, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  const students = (db.users || []).filter((u) => u.role === 'student');
  return (
    students.find((s) => s.id && s.id.toLowerCase() === q) ||
    students.find((s) => s.rollNo && s.rollNo.toLowerCase() === q) ||
    students.find((s) => s.email && s.email.toLowerCase() === q) ||
    students.find((s) => s.name && s.name.toLowerCase() === q) ||
    null
  );
}

// Helper: establish a two-way link between a parent user and a student user
function linkParentAndStudent(parentUser, studentUser) {
  if (!parentUser || !studentUser) return;
  parentUser.studentId = studentUser.id;
  parentUser.studentRollNo = studentUser.rollNo || 'CS21-014';
  parentUser.studentEmail = studentUser.email;
  parentUser.studentName = studentUser.name;

  studentUser.parentId = parentUser.id;
  studentUser.parentEmail = parentUser.email;
  studentUser.parentName = parentUser.name;

  if (parentUser.phone && !studentUser.parentPhone) studentUser.parentPhone = parentUser.phone;
  if (studentUser.parentPhone && !parentUser.phone) parentUser.phone = studentUser.parentPhone;
  if (studentUser.parentPhone && !parentUser.whatsappPhone) parentUser.whatsappPhone = studentUser.parentPhone;
}

// 1. Email + Password Sign-In (with college domain verification & bcrypt check)
app.post('/api/auth/login', (req, res) => {
  const { email, password, role, studentIdentifier } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail =
    ENV_ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');
  const db = loadDB();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  // Check if a student already pre-linked this parent's email or if the parent provided a valid student Roll No / Institutional Email
  const matchedStudentForParent =
    role === 'parent'
      ? findStudentByQuery(db, studentIdentifier) ||
        (db.users || []).find(
          (u) => u.role === 'student' && u.parentEmail && u.parentEmail.toLowerCase() === normalizedEmail
        )
      : null;

  // Block non-institutional emails unless pre-enrolled by Admin or signing in as a Parent linked to a valid student
  if (!user && !isAllowedInstitutionalEmail(normalizedEmail, db) && !matchedStudentForParent) {
    const allowedList = getAllowedDomains(db).map((d) => `@${d}`).join(' or ');
    if (role === 'parent') {
      return res.status(403).json({
        error: `Parent sign-in requires either an institutional email (${allowedList}) or your child's enrolled Roll No / College Email.`
      });
    }
    return res.status(403).json({
      error: `Access restricted: Only official institutional email IDs (${allowedList}) are allowed to sign in.`
    });
  }

  if (!user) {
    // Automatically enroll verified institutional email (or linked parent) into the database
    const assignedRole = isAdminEmail
      ? 'admin'
      : ['student', 'faculty', 'parent', 'admin'].includes(role)
      ? role
      : 'student';
    const studentNum = db.users.filter((u) => u.role === 'student').length + 14;
    const defaultStudent =
      matchedStudentForParent ||
      db.users.find((u) => u.role === 'student') ||
      null;

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
      studentId: assignedRole === 'parent' && defaultStudent ? defaultStudent.id : undefined,
      studentRollNo: assignedRole === 'parent' ? (defaultStudent && defaultStudent.rollNo) || 'CS21-014' : undefined,
      studentEmail: assignedRole === 'parent' && defaultStudent ? defaultStudent.email : undefined,
      studentName: assignedRole === 'parent' ? (defaultStudent && defaultStudent.name) || 'Aarav Menon' : undefined,
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

    if (assignedRole === 'parent' && defaultStudent) {
      linkParentAndStudent(user, defaultStudent);
    } else if (assignedRole === 'student') {
      // Check if any parent is already waiting for this student email/rollNo
      const waitingParent = db.users.find(
        (p) =>
          p.role === 'parent' &&
          ((p.studentEmail && p.studentEmail.toLowerCase() === normalizedEmail) ||
            (p.studentRollNo && p.studentRollNo.toLowerCase() === (user.rollNo || '').toLowerCase()))
      );
      if (waitingParent) linkParentAndStudent(waitingParent, user);
    }

    db.users.push(user);
    saveDB(db);
  } else {
    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    let updated = false;
    if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
      updated = true;
    }
    if (user.role === 'parent' && studentIdentifier) {
      const targetStudent = findStudentByQuery(db, studentIdentifier);
      if (targetStudent) {
        linkParentAndStudent(user, targetStudent);
        updated = true;
      }
    }
    if (updated) saveDB(db);
  }

  const safeUser = sanitizeUser(user);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({ token, user: safeUser });
});

// 2. Real Google Sign-In (verifies Google ID token JWT & enforces institutional domain)
app.post('/api/auth/google', async (req, res) => {
  const { credential, selectedRole, studentIdentifier } = req.body;
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
    const matchedStudentForParent =
      selectedRole === 'parent'
        ? findStudentByQuery(db, studentIdentifier) ||
          (db.users || []).find(
            (u) => u.role === 'student' && u.parentEmail && u.parentEmail.toLowerCase() === email
          )
        : null;

    // Block personal Gmail/external Google accounts unless pre-enrolled by Admin or linked Parent
    if (!user && !isAllowedInstitutionalEmail(email, db) && !matchedStudentForParent) {
      const allowedList = getAllowedDomains(db).map((d) => `@${d}`).join(' or ');
      return res.status(403).json({
        error: `Access restricted: Your Google account (${email}) is not an institutional email. Please sign in with ${allowedList}.`
      });
    }

    if (!user) {
      // Auto-register the Google-authenticated user into the institutional database
      const assignedRole = isAdminEmail
        ? 'admin'
        : ['student', 'faculty', 'parent', 'admin'].includes(selectedRole)
        ? selectedRole
        : 'student';

      const studentCount = db.users.filter((u) => u.role === 'student').length + 14;
      const defaultStudent =
        matchedStudentForParent ||
        db.users.find((u) => u.role === 'student') ||
        null;

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
        studentId: assignedRole === 'parent' && defaultStudent ? defaultStudent.id : undefined,
        studentRollNo: assignedRole === 'parent' ? (defaultStudent && defaultStudent.rollNo) || 'CS21-014' : undefined,
        studentEmail: assignedRole === 'parent' && defaultStudent ? defaultStudent.email : undefined,
        studentName: assignedRole === 'parent' ? (defaultStudent && defaultStudent.name) || 'Aarav Menon' : undefined,
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
      if (assignedRole === 'parent' && defaultStudent) {
        linkParentAndStudent(user, defaultStudent);
      }
      db.users.push(user);
      saveDB(db);
    } else {
      let updated = false;
      if (isAdminEmail && user.role !== 'admin') {
        user.role = 'admin';
        updated = true;
      }
      if (user.role === 'parent' && matchedStudentForParent) {
        linkParentAndStudent(user, matchedStudentForParent);
        updated = true;
      }
      if (updated) saveDB(db);
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
    attendance: (db.attendance || []).map((r) => normalizeAttendanceRecord(r)),
    alerts: db.alerts
  });
});

// Add a new user (Admin or Institution registration)
app.post('/api/users', authenticateToken, (req, res) => {
  const {
    name,
    email,
    password,
    role,
    department,
    rollNo,
    semester,
    studentRollNo,
    studentId,
    studentEmail,
    parentEmail,
    facePhotoUrl,
    faceDescriptor
  } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }

  const linkedStudent =
    findStudentByQuery(db, studentId) ||
    findStudentByQuery(db, studentRollNo) ||
    findStudentByQuery(db, studentEmail) ||
    (role === 'parent' ? db.users.find((u) => u.role === 'student') : null);

  const newUser = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password || 'password123', 10),
    role: ENV_ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : role,
    department: department || 'Computer Science',
    rollNo: role === 'student' ? (rollNo || `CS21-${Math.floor(100 + Math.random() * 900)}`).trim() : undefined,
    semester: role === 'student' ? semester || 'Semester 5' : undefined,
    faceEnrolled: role === 'student' ? Boolean(facePhotoUrl) : undefined,
    facePhotoUrl: role === 'student' ? facePhotoUrl || '' : undefined,
    faceDescriptor: role === 'student' && Array.isArray(faceDescriptor) ? faceDescriptor : undefined,
    parentEmail: role === 'student' ? (parentEmail || '').trim().toLowerCase() : undefined,
    studentId: role === 'parent' && linkedStudent ? linkedStudent.id : undefined,
    studentRollNo: role === 'parent' ? (linkedStudent ? linkedStudent.rollNo : (studentRollNo || 'CS21-014').trim()) : undefined,
    studentEmail: role === 'parent' && linkedStudent ? linkedStudent.email : undefined,
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

  if (role === 'parent' && linkedStudent) {
    linkParentAndStudent(newUser, linkedStudent);
  } else if (role === 'student' && parentEmail) {
    const existingParent = db.users.find(
      (u) => u.role === 'parent' && u.email.toLowerCase() === parentEmail.trim().toLowerCase()
    );
    if (existingParent) linkParentAndStudent(existingParent, newUser);
  }

  db.users.push(newUser);
  saveDB(db);
  res.status(201).json({ user: sanitizeUser(newUser) });
});

// Link a Parent account to a specific Student (by Student ID, Roll No, or Email)
app.put('/api/parent/link-student', authenticateToken, (req, res) => {
  const { studentIdentifier, parentId } = req.body;
  if (!studentIdentifier) {
    return res.status(400).json({ error: 'Please provide a Student Roll No, Email, or ID to link.' });
  }

  const db = loadDB();
  const parentUser =
    (parentId && db.users.find((u) => u.id === parentId)) ||
    db.users.find((u) => u.id === req.user.id) ||
    (req.user && req.user.email && db.users.find((u) => u.email.toLowerCase() === req.user.email.toLowerCase()));

  if (!parentUser) {
    return res.status(404).json({ error: 'Parent account not found.' });
  }

  const studentUser = findStudentByQuery(db, studentIdentifier);
  if (!studentUser) {
    return res.status(404).json({
      error: `No enrolled student found matching "${studentIdentifier}". Check the student's Roll No or institutional email.`
    });
  }

  linkParentAndStudent(parentUser, studentUser);
  saveDB(db);

  res.json({
    ok: true,
    parent: sanitizeUser(parentUser),
    student: sanitizeUser(studentUser)
  });
});

// Link a Student account to their Parent's email, name & phone
app.put('/api/student/link-parent', authenticateToken, (req, res) => {
  const { parentEmail, parentName, parentPhone } = req.body;
  if (!parentEmail || !String(parentEmail).includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid parent email address.' });
  }

  const normalizedParentEmail = String(parentEmail).trim().toLowerCase();
  const db = loadDB();
  const studentUser =
    db.users.find((u) => u.id === req.user.id) ||
    (req.user && req.user.email && db.users.find((u) => u.email.toLowerCase() === req.user.email.toLowerCase()));

  if (!studentUser) {
    return res.status(404).json({ error: 'Student account not found.' });
  }

  studentUser.parentEmail = normalizedParentEmail;
  if (parentName && String(parentName).trim()) {
    studentUser.parentName = String(parentName).trim();
  }
  if (parentPhone && String(parentPhone).trim()) {
    studentUser.parentPhone = String(parentPhone).trim();
  }

  const existingParent = db.users.find(
    (u) => u.role === 'parent' && u.email.toLowerCase() === normalizedParentEmail
  );
  if (existingParent) {
    if (parentPhone && String(parentPhone).trim()) {
      existingParent.phone = String(parentPhone).trim();
      existingParent.whatsappPhone = String(parentPhone).trim();
    }
    linkParentAndStudent(existingParent, studentUser);
  }

  saveDB(db);
  res.json({
    ok: true,
    student: sanitizeUser(studentUser),
    parent: existingParent ? sanitizeUser(existingParent) : null
  });
});

// Upload or update a student's reference face photo & biometric descriptor
app.put('/api/users/:id/face', authenticateToken, (req, res) => {
  const { facePhotoUrl, faceDescriptor } = req.body;
  if (!facePhotoUrl) {
    return res.status(400).json({ error: 'Reference face photo is required.' });
  }

  const db = loadDB();
  let user = db.users.find((u) => u.id === req.params.id);
  if (!user && req.user && req.user.email) {
    user = db.users.find((u) => u.email.toLowerCase() === req.user.email.toLowerCase());
  }
  if (!user) return res.status(404).json({ error: 'Student not found' });

  user.facePhotoUrl = facePhotoUrl;
  user.faceDescriptor = Array.isArray(faceDescriptor) ? faceDescriptor : null;
  user.faceEnrolled = true;
  user.faceUpdatedAt = new Date().toISOString();

  saveDB(db);
  res.json({ ok: true, user: sanitizeUser(user) });
});

// Delete a user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const db = loadDB();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (db.users[idx].id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own active account.' });
  }
  db.deletedIds = Array.isArray(db.deletedIds) ? db.deletedIds : [];
  if (!db.deletedIds.includes(req.params.id)) db.deletedIds.push(req.params.id);
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
  db.deletedIds = Array.isArray(db.deletedIds) ? db.deletedIds : [];
  if (!db.deletedIds.includes(req.params.id)) db.deletedIds.push(req.params.id);
  db.classes.splice(idx, 1);
  saveDB(db);
  res.json({ ok: true });
});

// ---- Twilio SMS & WhatsApp Parent Notification Dispatcher ----
async function sendTwilioNotification({ to, body, isWhatsApp = false }) {
  if (!to) return { ok: false, reason: 'Recipient phone number is required' };
  const db = loadDB();
  const settings = db.settings || {};
  const accountSid = process.env.TWILIO_ACCOUNT_SID || settings.twilioAccountSid;
  const authToken = process.env.TWILIO_AUTH_TOKEN || settings.twilioAuthToken;

  const cleanPhone = (val) => (val || '').replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '');

  const smsFromNumber = cleanPhone(process.env.TWILIO_PHONE_NUMBER || settings.twilioPhoneNumber || '+15005550006');
  const whatsappFromNumber = cleanPhone(process.env.TWILIO_WHATSAPP_NUMBER || settings.twilioWhatsAppNumber || '+14155238886');
  const rawFrom = isWhatsApp ? whatsappFromNumber : smsFromNumber;
  const rawTo = cleanPhone(to);
  const formattedTo = isWhatsApp ? `whatsapp:${rawTo}` : rawTo;
  const formattedFrom = isWhatsApp ? `whatsapp:${rawFrom}` : rawFrom;

  if (!accountSid || !authToken) {
    // Record mock/simulated dispatch in logs if credentials not set yet
    db.notificationLogs = db.notificationLogs || [];
    const simulatedLog = {
      id: 'notif_' + Date.now(),
      type: isWhatsApp ? 'WhatsApp' : 'SMS',
      to: rawTo,
      from: isWhatsApp ? formattedFrom : rawFrom,
      body,
      status: 'simulated (configure Twilio SID & Token in Admin tab to deliver live)',
      timestamp: new Date().toISOString()
    };
    db.notificationLogs.unshift(simulatedLog);
    if (db.notificationLogs.length > 50) db.notificationLogs.pop();
    saveDB(db);
    return {
      ok: false,
      simulated: true,
      sid: null,
      error: 'Twilio Account SID or Auth Token is not configured. Delivery was simulated locally and not sent to phone.'
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // ALWAYS send the complete, rich attendance notification in Body
  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', formattedFrom);
  params.append('Body', body);

  try {
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    let data = await res.json();

    let deliveryChannel = isWhatsApp ? 'WhatsApp' : 'SMS';
    let statusText = res.ok ? 'delivered' : 'failed: ' + (data.message || res.status);

    // If WhatsApp failed because the 24-hr session window is closed (Error 63016 / ContentSid Required),
    // automatically fall back to SMS so the parent gets the real attendance notification without delay!
    if (!res.ok && isWhatsApp && (data.code === 63016 || (data.message || '').includes('outside the 24-hour window') || (data.message || '').includes('ContentSid Required'))) {
      try {
        const smsParams = new URLSearchParams();
        smsParams.append('To', rawTo);
        smsParams.append('From', smsFromNumber);
        smsParams.append('Body', body);

        const smsRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: smsParams.toString()
        });
        const smsData = await smsRes.json();
        if (smsRes.ok) {
          deliveryChannel = 'SMS (Fallback)';
          statusText = 'delivered via SMS fallback (WhatsApp 24-hr session closed — send sandbox join keyword to ' + rawFrom + ')';
          data = smsData;
          res = smsRes;
        } else {
          statusText = `WhatsApp: 24-hr session closed with ${rawFrom} (ensure recipient sent sandbox keyword to ${rawFrom}). SMS fallback failed: ${smsData.message || 'Trial template restriction / unverified number'}`;
        }
      } catch (fallbackErr) {
        statusText = `WhatsApp session closed. SMS fallback error: ${fallbackErr.message}`;
      }
    } else if (!res.ok && data.message) {
      if (data.message.includes('Trial accounts') || data.code === 21617 || data.code === 21608) {
        statusText = 'failed: Twilio Trial account limit. Recipient must be in Twilio Verified Caller IDs & SMS From must be your real Twilio number.';
      }
    }

    db.notificationLogs = db.notificationLogs || [];
    db.notificationLogs.unshift({
      id: 'notif_' + Date.now(),
      type: deliveryChannel,
      to: rawTo,
      from: isWhatsApp ? formattedFrom : smsFromNumber,
      body: body,
      status: statusText,
      sid: data.sid || null,
      timestamp: new Date().toISOString()
    });
    if (db.notificationLogs.length > 50) db.notificationLogs.pop();
    saveDB(db);

    return { ok: res.ok, sid: data.sid || null, channel: deliveryChannel, error: data.message };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

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
    faceScore,
    manualStatus,
    livenessVerified,
    livenessScore,
    livenessDetails
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

  const campusTimezone = req.body.timezone || 'Asia/Kolkata';
  const now = req.body.clientTimestamp ? new Date(req.body.clientTimestamp) : new Date();

  // Ensure precise date and time matching student submission
  let isoDate = req.body.date;
  let displayDate = req.body.displayDate;
  let timeStr = req.body.time;

  if (!isoDate || !displayDate || !timeStr) {
    try {
      const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: campusTimezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      isoDate = isoDate || dateFormatter.format(now);
      const displayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: campusTimezone, day: 'numeric', month: 'short' });
      displayDate = displayDate || displayFormatter.format(now);
      const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: campusTimezone, hour: '2-digit', minute: '2-digit', hour12: false });
      timeStr = timeStr || timeFormatter.format(now);
    } catch {
      isoDate = isoDate || now.toISOString().slice(0, 10);
      displayDate = displayDate || now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      timeStr = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }

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
  } else if (livenessVerified === false) {
    status = 'Rejected — Liveness check failed';
    badgeType = 'bad';
    alertTitle = `Anti-spoofing challenge failed for ${cls.name}`;
    alertDetail = `${displayDate}, ${timeStr} · Anti-spoofing challenge failed (${livenessDetails || 'Static photo or screen spoofing suspected'}) · 📍 ${finalPlace}`;
  } else if (!faceMatched) {
    const pctLabel = typeof faceScore === 'number' ? ` (${faceScore}% match)` : '';
    status = `Rejected — Face not matched${pctLabel}`;
    badgeType = 'bad';
    alertTitle = `Face did not match for ${cls.name}`;
    alertDetail = `${displayDate}, ${timeStr} · Biometric face match failed${pctLabel} · 📍 ${finalPlace}`;
  } else if (distanceMeters > cls.radius) {
    status = 'Rejected — outside class area';
    badgeType = 'bad';
    alertTitle = `Check-in refused — outside the classroom`;
    alertDetail = `${displayDate}, ${timeStr} · ${cls.name} · ${distanceMeters} m away (${finalPlace})`;
  }

  const record = {
    id: 'att_' + now.getTime(),
    timestamp: now.getTime(),
    createdAt: now.toISOString(),
    studentId: student.id,
    studentEmail: student.email,
    studentName: student.name,
    rollNo: student.rollNo || 'CS21-014',
    classId: cls.id,
    className: cls.name,
    date: isoDate,
    displayDate,
    status,
    badgeType,
    time: timeStr,
    timezone: campusTimezone,
    distance: `${distanceMeters} m`,
    lat: finalLat,
    lng: finalLng,
    locationName: finalPlace,
    photoDataUrl: photoDataUrl || '',
    faceMatched: Boolean(faceMatched),
    faceScore: typeof faceScore === 'number' ? faceScore : undefined,
    livenessVerified: livenessVerified !== undefined ? Boolean(livenessVerified) : true,
    livenessScore: typeof livenessScore === 'number' ? livenessScore : undefined,
    livenessDetails: livenessDetails || (livenessVerified ? 'Active eye-blink & head-yaw verified' : '')
  };

  db.attendance.unshift(record);

  // Trigger parent alert if enabled (match parent by studentId, studentRollNo, studentEmail, or student.parentEmail)
  const parentUser = db.users.find(
    (u) =>
      u.role === 'parent' &&
      ((u.studentId && u.studentId === student.id) ||
        (u.studentRollNo && u.studentRollNo.toLowerCase() === (record.rollNo || '').toLowerCase()) ||
        (u.studentEmail && student.email && u.studentEmail.toLowerCase() === student.email.toLowerCase()) ||
        (student.parentEmail && u.email.toLowerCase() === student.parentEmail.toLowerCase()))
  );

  const prefs = (parentUser && parentUser.preferences) || {
    successfulCheckIn: true,
    lateCheckIn: true,
    wrongLocation: true,
    faceNotMatched: true,
    smsNotifications: true,
    whatsappNotifications: true
  };

  const shouldAlert =
    (badgeType === 'ok' && prefs.successfulCheckIn) ||
    (badgeType === 'warn' && prefs.lateCheckIn) ||
    (status.includes('outside') && prefs.wrongLocation) ||
    (status.includes('Face') && prefs.faceNotMatched) ||
    (status.includes('Liveness') && prefs.faceNotMatched);

  let parentNotifSummary = null;

  if (shouldAlert) {
    db.alerts.unshift({
      id: 'alt_' + Date.now(),
      attendanceId: record.id,
      studentId: student.id,
      studentEmail: student.email,
      studentName: student.name,
      studentRollNo: record.rollNo,
      type: badgeType,
      title: alertTitle,
      detail: alertDetail,
      unread: true,
      createdAt: now.toISOString()
    });

    // Automated Twilio WhatsApp / SMS notification to parent with all details
    const parentPhone =
      (parentUser && (parentUser.phone || parentUser.whatsappPhone)) ||
      student.parentPhone ||
      student.emergencyContact ||
      (db.settings && (db.settings.twilioRecipientPhone || db.settings.defaultParentPhone)) ||
      '+919969665014';

    if (parentPhone) {
      const mapsUrl = `https://maps.google.com/?q=${finalLat},${finalLng}`;
      const statusIcon = status === 'Present' ? '✅ Present' : status === 'Late' ? '⚠️ Late' : '❌ ' + status;
      const livenessText = record.livenessVerified ? 'Passed (Anti-Spoof Verified)' : 'Failed';
      const biometricText = record.faceScore ? `${record.faceScore}% biometric match` : 'Biometric Face Verified';

      const parentMsg = `🎓 [Attenova Attendance Alert]\nStudent: ${student.name} (${record.rollNo})\nSubject: ${cls.name} (${cls.room})\nStatus: ${statusIcon}\nTime: ${timeStr}, ${displayDate}\nLocation: ${finalPlace}\nGPS: ${finalLat}°, ${finalLng}°\nMaps: ${mapsUrl}\nBiometric: ${biometricText} · Liveness: ${livenessText}`;

      let sentChannels = [];
      if (prefs.whatsappNotifications !== false) {
        sendTwilioNotification({
          to: parentPhone,
          body: parentMsg,
          isWhatsApp: true
        }).catch((err) =>
          console.warn('Twilio WhatsApp dispatch notice:', err.message)
        );
        sentChannels.push('WhatsApp');
      }
      if (prefs.smsNotifications) {
        sendTwilioNotification({
          to: parentPhone,
          body: parentMsg,
          isWhatsApp: false
        }).catch((err) =>
          console.warn('Twilio SMS dispatch notice:', err.message)
        );
        sentChannels.push('SMS');
      }

      parentNotifSummary = {
        dispatched: true,
        recipient: parentPhone,
        channels: sentChannels,
        studentName: student.name,
        rollNo: record.rollNo,
        className: cls.name,
        status: status,
        time: timeStr,
        location: finalPlace
      };
    }
  }

  saveDB(db);
  res.status(201).json({ record, parentNotification: parentNotifSummary });
});

// Delete an attendance record (Faculty or Admin cleanup of duplicate/rejected check-ins)
app.delete('/api/attendance/:id', authenticateToken, (req, res) => {
  const db = loadDB();
  const idx = (db.attendance || []).findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Attendance record not found' });
  const removed = db.attendance[idx];
  db.deletedIds = Array.isArray(db.deletedIds) ? db.deletedIds : [];
  if (!db.deletedIds.includes(req.params.id)) db.deletedIds.push(req.params.id);
  db.attendance.splice(idx, 1);

  // Also remove any parent alert generated from this deleted check-in attempt
  db.alerts = (db.alerts || []).filter(
    (a) =>
      a.attendanceId !== req.params.id &&
      !(removed && a.studentRollNo === removed.rollNo && a.detail && a.detail.includes(removed.time))
  );

  saveDB(db);
  res.json({ ok: true });
});

// Mark parent alerts read (scoped to linked student if provided)
app.post('/api/alerts/mark-read', authenticateToken, (req, res) => {
  const { studentId, studentRollNo } = req.body || {};
  const db = loadDB();
  db.alerts.forEach((a) => {
    if (
      (!studentId && !studentRollNo) ||
      (studentId && a.studentId === studentId) ||
      (studentRollNo && a.studentRollNo === studentRollNo)
    ) {
      a.unread = false;
    }
  });
  saveDB(db);
  res.json({ ok: true });
});

// Save parent alert preferences
app.put('/api/preferences', authenticateToken, (req, res) => {
  const {
    successfulCheckIn,
    lateCheckIn,
    wrongLocation,
    faceNotMatched,
    smsNotifications,
    whatsappNotifications,
    parentPhone
  } = req.body;
  const db = loadDB();
  const user =
    db.users.find((u) => u.id === req.user.id) || db.users.find((u) => u.role === 'parent');

  if (user) {
    user.preferences = {
      ...(user.preferences || {}),
      successfulCheckIn: Boolean(successfulCheckIn),
      lateCheckIn: Boolean(lateCheckIn),
      wrongLocation: Boolean(wrongLocation),
      faceNotMatched: Boolean(faceNotMatched),
      smsNotifications: Boolean(smsNotifications),
      whatsappNotifications: Boolean(whatsappNotifications)
    };
    if (parentPhone) {
      user.phone = parentPhone;
      user.whatsappPhone = parentPhone;
    }
    saveDB(db);
  }

  res.json({ ok: true, preferences: user ? user.preferences : req.body });
});

// =====================================================================
// Automated SMS / WhatsApp Notifications (Twilio Integration)
// =====================================================================

// Notification settings and delivery audit logs
app.get('/api/admin/notifications/config', authenticateToken, (req, res) => {
  const db = loadDB();
  const settings = db.settings || {};
  if (settings.twilioContentSid) {
    delete settings.twilioContentSid;
    saveDB(db);
  }
  const sid = process.env.TWILIO_ACCOUNT_SID || settings.twilioAccountSid || '';
  const maskedSid = sid ? `${sid.slice(0, 6)}...${sid.slice(-4)}` : '';
  const token = process.env.TWILIO_AUTH_TOKEN || settings.twilioAuthToken || '';
  const hasToken = Boolean(token);
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || settings.twilioPhoneNumber || '';
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || settings.twilioWhatsAppNumber || '+14155238886';

  res.json({
    ok: true,
    twilioConfigured: Boolean(sid && hasToken),
    hasAccountSid: Boolean(sid),
    hasAuthToken: Boolean(hasToken),
    accountSidMasked: maskedSid,
    fromPhoneNumber: fromPhone,
    whatsappFromNumber: whatsappFrom,
    totalLogs: (db.notificationLogs || []).length,
    recentLogs: (db.notificationLogs || []).slice(0, 30)
  });
});

// Update Twilio credentials dynamically
app.post('/api/admin/notifications/config', authenticateToken, (req, res) => {
  const { accountSid, authToken, phoneNumber, whatsappNumber } = req.body;
  const db = loadDB();
  db.settings = db.settings || {};
  if (db.settings.twilioContentSid) {
    delete db.settings.twilioContentSid;
  }
  const cleanPhone = (val) => (val || '').replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '');

  if (accountSid && accountSid.trim()) {
    const s = accountSid.trim();
    if (!s.startsWith('AC') || s.length < 30) {
      return res.status(400).json({ error: 'Twilio Account SID must start with "AC" and be 34 characters long.' });
    }
    process.env.TWILIO_ACCOUNT_SID = s;
    db.settings.twilioAccountSid = s;
  }
  if (authToken && authToken.trim()) {
    const tok = authToken.trim();
    process.env.TWILIO_AUTH_TOKEN = tok;
    db.settings.twilioAuthToken = tok;
  }
  if (phoneNumber !== undefined) {
    const p = cleanPhone(phoneNumber.trim());
    process.env.TWILIO_PHONE_NUMBER = p;
    db.settings.twilioPhoneNumber = p;
  }
  if (whatsappNumber !== undefined) {
    const wp = cleanPhone(whatsappNumber.trim());
    process.env.TWILIO_WHATSAPP_NUMBER = wp;
    db.settings.twilioWhatsAppNumber = wp;
  }
  saveDB(db);
  const configured = Boolean(
    (process.env.TWILIO_ACCOUNT_SID || db.settings.twilioAccountSid) &&
    (process.env.TWILIO_AUTH_TOKEN || db.settings.twilioAuthToken)
  );
  res.json({ ok: true, message: 'Twilio notification credentials updated successfully', configured });
});

// Dispatch test SMS or WhatsApp notification
app.post('/api/admin/notifications/test', authenticateToken, async (req, res) => {
  const { to, body, isWhatsApp } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Target phone number is required (e.g. +919876543210)' });
  }
  const testMsg =
    body ||
    `🎓 [Attenova Attendance Alert]\nStudent: Aarav Menon (CS21-014)\nSubject: Data Structures (Room B-204)\nStatus: ✅ Present\nTime: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nLocation: Room B-204 · MGM College Kamothe Panvel\nGPS: 19.0176°, 73.0860°\nMaps: https://maps.google.com/?q=19.0176,73.086\nBiometric: Biometric Face Verified · Liveness: Passed (Anti-Spoof Verified)`;
  const result = await sendTwilioNotification({
    to,
    body: testMsg,
    isWhatsApp: Boolean(isWhatsApp)
  });
  res.json(result);
});

// ---- Automatic Client-to-Server State Re-Hydration (/api/sync) -------
// Restores users, reference face photos, classes, and attendance logs cached in client localStorage
// whenever a Render free-tier container wakes up from a cold start or redeploy.
app.post('/api/sync', authenticateToken, (req, res) => {
  const { users = [], classes = [], attendance = [], deletedIds = [], settings } = req.body || {};
  const db = loadDB();
  db.deletedIds = Array.from(new Set([...(db.deletedIds || []), ...(Array.isArray(deletedIds) ? deletedIds : [])]));
  const deletedSet = new Set(db.deletedIds);
  let changed = false;

  // 1. Remove any items that were deleted on the client
  const beforeUsers = db.users.length;
  db.users = db.users.filter((u) => !deletedSet.has(u.id));
  if (db.users.length !== beforeUsers) changed = true;

  const beforeClasses = db.classes.length;
  db.classes = db.classes.filter((c) => !deletedSet.has(c.id));
  if (db.classes.length !== beforeClasses) changed = true;

  const beforeAtt = db.attendance.length;
  db.attendance = db.attendance.filter((a) => !deletedSet.has(a.id));
  if (db.attendance.length !== beforeAtt) changed = true;

  // 2. Merge client users, reference face photos, and parent-student relationship links
  if (Array.isArray(users)) {
    users.forEach((cu) => {
      if (!cu || !cu.email || deletedSet.has(cu.id)) return;
      const existing = db.users.find(
        (u) => u.id === cu.id || u.email.toLowerCase() === cu.email.toLowerCase()
      );
      if (!existing) {
        db.users.push({
          ...cu,
          passwordHash: cu.passwordHash || bcrypt.hashSync(cu.password || 'password123', 10)
        });
        changed = true;
      } else {
        if (cu.facePhotoUrl && !existing.facePhotoUrl) {
          existing.facePhotoUrl = cu.facePhotoUrl;
          existing.faceDescriptor = cu.faceDescriptor || existing.faceDescriptor;
          existing.faceEnrolled = true;
          changed = true;
        }
        // Preserve parent <-> student links from client
        ['studentId', 'studentRollNo', 'studentEmail', 'studentName', 'parentId', 'parentEmail', 'parentName'].forEach(
          (relKey) => {
            if (cu[relKey] && existing[relKey] !== cu[relKey]) {
              existing[relKey] = cu[relKey];
              changed = true;
            }
          }
        );
      }
    });
  }

  // 3. Merge client classes
  if (Array.isArray(classes)) {
    classes.forEach((cc) => {
      if (!cc || !cc.id || deletedSet.has(cc.id)) return;
      const existing = db.classes.find((c) => c.id === cc.id);
      if (!existing) {
        db.classes.push(cc);
        changed = true;
      }
    });
  }

  // 4. Merge client attendance logs
  if (Array.isArray(attendance)) {
    attendance.forEach((ca) => {
      if (!ca || !ca.id || deletedSet.has(ca.id)) return;
      normalizeAttendanceRecord(ca);
      const existingIdx = db.attendance.findIndex((a) => a.id === ca.id);
      if (existingIdx === -1) {
        db.attendance.push(ca);
        changed = true;
      } else {
        normalizeAttendanceRecord(db.attendance[existingIdx]);
      }
    });
    if (changed) {
      db.attendance.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    }
  }

  // 5. Restore notification settings if present from client (survives Render restarts)
  if (settings && typeof settings === 'object') {
    db.settings = db.settings || {};
    if (settings.twilioAccountSid && !process.env.TWILIO_ACCOUNT_SID && !db.settings.twilioAccountSid) {
      db.settings.twilioAccountSid = settings.twilioAccountSid;
      process.env.TWILIO_ACCOUNT_SID = settings.twilioAccountSid;
      changed = true;
    }
    if (settings.twilioAuthToken && !process.env.TWILIO_AUTH_TOKEN && !db.settings.twilioAuthToken) {
      db.settings.twilioAuthToken = settings.twilioAuthToken;
      process.env.TWILIO_AUTH_TOKEN = settings.twilioAuthToken;
      changed = true;
    }
    if (settings.twilioPhoneNumber && !process.env.TWILIO_PHONE_NUMBER && !db.settings.twilioPhoneNumber) {
      db.settings.twilioPhoneNumber = settings.twilioPhoneNumber;
      process.env.TWILIO_PHONE_NUMBER = settings.twilioPhoneNumber;
      changed = true;
    }
    if (settings.twilioWhatsAppNumber && !process.env.TWILIO_WHATSAPP_NUMBER && !db.settings.twilioWhatsAppNumber) {
      db.settings.twilioWhatsAppNumber = settings.twilioWhatsAppNumber;
      process.env.TWILIO_WHATSAPP_NUMBER = settings.twilioWhatsAppNumber;
      changed = true;
    }
  }

  if (changed) {
    saveDB(db);
  }

  const currentUser =
    db.users.find((u) => u.id === req.user.id) ||
    (req.user.email && db.users.find((u) => u.email.toLowerCase() === req.user.email.toLowerCase()));

  res.json({
    ok: true,
    currentUser: sanitizeUser(currentUser),
    users: db.users.map(sanitizeUser),
    classes: db.classes,
    attendance: (db.attendance || []).map((r) => normalizeAttendanceRecord(r)),
    alerts: db.alerts,
    deletedIds: db.deletedIds
  });
});

// Health check endpoint (used by Render & self keep-alive ping)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Serve static frontend files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Attenova Smart Attendance Server running at http://localhost:${PORT}`);

  // Keep Render Free Tier container awake by pinging RENDER_EXTERNAL_URL every 13 minutes
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (externalUrl) {
    const pingUrl = `${externalUrl.replace(/\/$/, '')}/api/health`;
    setInterval(() => {
      fetch(pingUrl).catch(() => {});
    }, 13 * 60 * 1000);
  }
});
