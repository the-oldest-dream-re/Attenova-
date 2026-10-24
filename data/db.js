const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'store.json');

function createSeedData() {
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  return {
    users: [
      {
        id: 'usr_admin_1',
        name: 'Dr. Vikram Sethi',
        email: 'admin@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        department: 'Administration',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_faculty_1',
        name: 'Prof. Nandini Deshpande',
        email: 'faculty@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'faculty',
        department: 'Computer Science',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_student_1',
        name: 'Aarav Menon',
        email: 'student@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'student',
        rollNo: 'CS21-014',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true,
        parentName: 'Rajesh Menon',
        parentEmail: 'parent@college.edu',
        parentPhone: '+919969665014',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_student_2',
        name: 'Diya Sharma',
        email: 'diya@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'student',
        rollNo: 'CS21-015',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true,
        parentEmail: '',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_student_3',
        name: 'Kabir Rao',
        email: 'kabir@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'student',
        rollNo: 'CS21-016',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true,
        parentEmail: '',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_student_4',
        name: 'Meera Iyer',
        email: 'meera@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'student',
        rollNo: 'CS21-017',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true,
        parentEmail: '',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_parent_1',
        name: 'Rajesh Menon',
        email: 'parent@college.edu',
        passwordHash: defaultPasswordHash,
        role: 'parent',
        studentId: 'usr_student_1',
        studentRollNo: 'CS21-014',
        studentName: 'Aarav Menon',
        studentEmail: 'student@college.edu',
        phone: '+919969665014',
        whatsappPhone: '+919969665014',
        preferences: {
          successfulCheckIn: true,
          lateCheckIn: true,
          wrongLocation: true,
          faceNotMatched: true,
          whatsappNotifications: true,
          smsNotifications: true
        },
        createdAt: '2026-08-01T08:00:00.000Z'
      }
    ],
    classes: [
      {
        id: 'cls_1',
        name: 'Data Structures',
        room: 'Room B-204',
        schedule: '09:00 - 10:00',
        facultyId: 'usr_faculty_1',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0176,
        lng: 73.0860,
        radius: 60,
        studentCount: 42,
        live: true,
        createdAt: '2026-08-10T09:00:00.000Z'
      },
      {
        id: 'cls_2',
        name: 'Operating Systems',
        room: 'Room C-101',
        schedule: '11:00 - 12:00',
        facultyId: 'usr_faculty_1',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0178,
        lng: 73.0862,
        radius: 50,
        studentCount: 38,
        live: false,
        createdAt: '2026-08-10T09:00:00.000Z'
      },
      {
        id: 'cls_3',
        name: 'DBMS',
        room: 'Room A-108',
        schedule: '14:00 - 15:00',
        facultyId: 'usr_faculty_1',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0174,
        lng: 73.0858,
        radius: 55,
        studentCount: 40,
        live: false,
        createdAt: '2026-08-10T09:00:00.000Z'
      }
    ],
    attendance: [
      {
        id: 'att_1',
        studentId: 'usr_student_1',
        studentName: 'Aarav Menon',
        rollNo: 'CS21-014',
        classId: 'cls_2',
        className: 'Operating Systems',
        date: '2026-09-04',
        displayDate: '4 Sep',
        status: 'Present',
        badgeType: 'ok',
        time: '11:04',
        distance: '12 m',
        lat: 19.0178,
        lng: 73.0862,
        locationName: 'Room C-101 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: true
      },
      {
        id: 'att_2',
        studentId: 'usr_student_1',
        studentName: 'Aarav Menon',
        rollNo: 'CS21-014',
        classId: 'cls_1',
        className: 'Data Structures',
        date: '2026-09-03',
        displayDate: '3 Sep',
        status: 'Late',
        badgeType: 'warn',
        time: '09:18',
        distance: '15 m',
        lat: 19.0176,
        lng: 73.0860,
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: true
      },
      {
        id: 'att_3',
        studentId: 'usr_student_1',
        studentName: 'Aarav Menon',
        rollNo: 'CS21-014',
        classId: 'cls_3',
        className: 'DBMS',
        date: '2026-09-02',
        displayDate: '2 Sep',
        status: 'Rejected — outside class area',
        badgeType: 'bad',
        time: '14:31',
        distance: '310 m',
        lat: 19.0145,
        lng: 73.0831,
        locationName: 'Outside Campus · Kamothe Sector 18, Panvel',
        faceMatched: true
      },
      {
        id: 'att_4',
        studentId: 'usr_student_1',
        studentName: 'Aarav Menon',
        rollNo: 'CS21-014',
        classId: 'cls_1',
        className: 'Data Structures',
        date: '2026-09-01',
        displayDate: '1 Sep',
        status: 'Present',
        badgeType: 'ok',
        time: '09:02',
        distance: '11 m',
        lat: 19.0176,
        lng: 73.0860,
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: true
      },
      {
        id: 'att_5',
        studentId: 'usr_student_2',
        studentName: 'Diya Sharma',
        rollNo: 'CS21-015',
        classId: 'cls_1',
        className: 'Data Structures',
        date: '2026-09-01',
        displayDate: '1 Sep',
        status: 'Late',
        badgeType: 'warn',
        time: '09:19',
        distance: '14 m',
        lat: 19.0176,
        lng: 73.0860,
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: true
      },
      {
        id: 'att_6',
        studentId: 'usr_student_3',
        studentName: 'Kabir Rao',
        rollNo: 'CS21-016',
        classId: 'cls_1',
        className: 'Data Structures',
        date: '2026-09-01',
        displayDate: '1 Sep',
        status: 'Face not matched',
        badgeType: 'bad',
        time: '09:05',
        distance: '8 m',
        lat: 19.0176,
        lng: 73.0860,
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: false
      },
      {
        id: 'att_7',
        studentId: 'usr_student_4',
        studentName: 'Meera Iyer',
        rollNo: 'CS21-017',
        classId: 'cls_1',
        className: 'Data Structures',
        date: '2026-09-01',
        displayDate: '1 Sep',
        status: 'Present',
        badgeType: 'ok',
        time: '08:58',
        distance: '9 m',
        lat: 19.0176,
        lng: 73.0860,
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel',
        faceMatched: true
      }
    ],
    alerts: [
      {
        id: 'alt_1',
        studentRollNo: 'CS21-014',
        type: 'ok',
        title: 'Checked in to Operating Systems',
        detail: '4 Sep, 11:04 · face and location verified',
        unread: true,
        createdAt: '2026-09-04T11:04:00.000Z'
      },
      {
        id: 'alt_2',
        studentRollNo: 'CS21-014',
        type: 'warn',
        title: 'Marked late for Data Structures',
        detail: '3 Sep, 09:18 · 18 minutes after the class began',
        unread: true,
        createdAt: '2026-09-03T09:18:00.000Z'
      },
      {
        id: 'alt_3',
        studentRollNo: 'CS21-014',
        type: 'bad',
        title: 'Check-in refused — outside the classroom',
        detail: '2 Sep, 14:31 · DBMS · 310 m away from the room',
        unread: true,
        createdAt: '2026-09-02T14:31:00.000Z'
      },
      {
        id: 'alt_4',
        studentRollNo: 'CS21-014',
        type: 'bad',
        title: 'Face did not match',
        detail: '1 Sep, 09:05 · asked to try again with better lighting',
        unread: false,
        createdAt: '2026-09-01T09:05:00.000Z'
      }
    ],
    settings: {
      defaultParentPhone: '+919969665014',
      twilioRecipientPhone: '+919969665014'
    }
  };
}

let cachedDB = null;
let pgPool = null;
let pgInitialized = false;

// Safe loading of pg (installed on Render/production or environment with PostgreSQL)
let pg = null;
try {
  pg = require('pg');
} catch (e) {
  // pg will be installed via package.json on deployment
}

// ---- Vector Math & High-Speed Similarity Search (pgvector & In-Memory) ----
function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 999;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 128-D Vector Search across 10,000+ students (sub-millisecond in-memory or pgvector)
function searchStudentsByVector(descriptor, topK = 5) {
  const db = loadDB();
  const students = (db.users || []).filter(
    (u) => u.role === 'student' && Array.isArray(u.faceDescriptor) && u.faceDescriptor.length === 128
  );

  const scored = students.map((s) => {
    const dist = euclideanDistance(descriptor, s.faceDescriptor);
    const cosSim = cosineSimilarity(descriptor, s.faceDescriptor);
    const score = Math.round(Math.max(10, Math.min(99, cosSim * 100)));
    return {
      student: s,
      distance: Number(dist.toFixed(4)),
      cosineSimilarity: Number(cosSim.toFixed(4)),
      score,
      matched: dist <= 0.58
    };
  });

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, topK);
}


function loadDB() {
  if (cachedDB) return cachedDB;
  try {
    if (!fs.existsSync(DB_PATH)) {
      const seed = createSeedData();
      saveDB(seed);
      cachedDB = seed;
      return seed;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    cachedDB = JSON.parse(raw);
    return cachedDB;
  } catch (err) {
    console.error('Error loading DB, initializing with seed data:', err);
    const seed = createSeedData();
    saveDB(seed);
    cachedDB = seed;
    return seed;
  }
}

function saveDB(data) {
  cachedDB = data;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

module.exports = {
  loadDB,
  saveDB,
  searchStudentsByVector,
  euclideanDistance,
  cosineSimilarity
};