/* Attenova — Full-Stack Smart Institutional Attendance Application
   Includes GPS Map Camera Stamp (exact coordinates + reverse-geocoded place name
   burnt onto the bottom of attendance photos), Real Google Sign-In, and Render.com API. */

const STORAGE_KEYS = {
  TOKEN: 'attendly_jwt_token',
  USER: 'attendly_current_user',
  LOCAL_DB: 'attendly_local_db_v2',
  GOOGLE_CLIENT_ID: 'attendly_google_client_id'
};

// ---- Default Seed Data (used if server is unreachable) ----------------
function getDefaultSeedDB() {
  return {
    users: [
      {
        id: 'usr_admin_1',
        name: 'Dr. Vikram Sethi',
        email: 'admin@college.edu',
        password: 'password123',
        role: 'admin',
        department: 'Administration'
      },
      {
        id: 'usr_faculty_1',
        name: 'Prof. Nandini Deshpande',
        email: 'faculty@college.edu',
        password: 'password123',
        role: 'faculty',
        department: 'Computer Science'
      },
      {
        id: 'usr_student_1',
        name: 'Aarav Menon',
        email: 'student@college.edu',
        password: 'password123',
        role: 'student',
        rollNo: 'CS21-014',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true,
        parentEmail: 'parent@college.edu'
      },
      {
        id: 'usr_student_2',
        name: 'Diya Sharma',
        email: 'diya@college.edu',
        password: 'password123',
        role: 'student',
        rollNo: 'CS21-015',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true
      },
      {
        id: 'usr_student_3',
        name: 'Kabir Rao',
        email: 'kabir@college.edu',
        password: 'password123',
        role: 'student',
        rollNo: 'CS21-016',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true
      },
      {
        id: 'usr_student_4',
        name: 'Meera Iyer',
        email: 'meera@college.edu',
        password: 'password123',
        role: 'student',
        rollNo: 'CS21-017',
        department: 'Computer Science',
        semester: 'Semester 5',
        faceEnrolled: true
      },
      {
        id: 'usr_parent_1',
        name: 'Rajesh Menon',
        email: 'parent@college.edu',
        password: 'password123',
        role: 'parent',
        studentRollNo: 'CS21-014',
        studentName: 'Aarav Menon',
        preferences: {
          successfulCheckIn: true,
          lateCheckIn: true,
          wrongLocation: true,
          faceNotMatched: false
        }
      }
    ],
    classes: [
      {
        id: 'cls_1',
        name: 'Data Structures',
        room: 'Room B-204',
        schedule: '09:00 – 10:00',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0176,
        lng: 73.0860,
        radius: 60,
        studentCount: 42,
        live: true
      },
      {
        id: 'cls_2',
        name: 'Operating Systems',
        room: 'Room C-101',
        schedule: '11:00 – 12:00',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0178,
        lng: 73.0862,
        radius: 50,
        studentCount: 38,
        live: false
      },
      {
        id: 'cls_3',
        name: 'DBMS',
        room: 'Room A-108',
        schedule: '14:00 – 15:00',
        facultyName: 'Prof. Nandini Deshpande',
        lat: 19.0174,
        lng: 73.0858,
        radius: 55,
        studentCount: 40,
        live: false
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
        locationName: 'Room C-101 · MGM College of Engineering and Technology, Kamothe, Panvel'
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
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel'
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
        locationName: 'Outside Campus · Kamothe Sector 18, Panvel'
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
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel'
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
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel'
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
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel'
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
        locationName: 'Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel'
      }
    ],
    alerts: [
      {
        id: 'alt_1',
        studentRollNo: 'CS21-014',
        type: 'ok',
        title: 'Checked in to Operating Systems',
        detail: '4 Sep, 11:04 · 📍 Room C-101 · MGM College of Engineering and Technology, Kamothe, Panvel (19.0178°, 73.0862°)',
        unread: true
      },
      {
        id: 'alt_2',
        studentRollNo: 'CS21-014',
        type: 'warn',
        title: 'Marked late for Data Structures',
        detail: '3 Sep, 09:18 · 📍 Room B-204 · MGM College of Engineering and Technology, Kamothe, Panvel (19.0176°, 73.0860°)',
        unread: true
      },
      {
        id: 'alt_3',
        studentRollNo: 'CS21-014',
        type: 'bad',
        title: 'Check-in refused — outside the classroom',
        detail: '2 Sep, 14:31 · DBMS · 310 m away (Outside Campus · Kamothe Sector 18, Panvel)',
        unread: true
      },
      {
        id: 'alt_4',
        studentRollNo: 'CS21-014',
        type: 'bad',
        title: 'Face did not match',
        detail: '1 Sep, 09:05 · asked to try again with better lighting',
        unread: false
      }
    ]
  };
}

// ---- Cross-Browser Storage Wrapper (supports file:// protocol & partitioned localStorage) ----
function readWindowNameStore() {
  try {
    if (window.name && window.name.startsWith('__ATTENOVA_STORE__:')) {
      return JSON.parse(window.name.slice('__ATTENOVA_STORE__:'.length));
    }
  } catch {
    // ignore corrupted window.name
  }
  return {};
}

function writeWindowNameStore(store) {
  try {
    window.name = '__ATTENOVA_STORE__:' + JSON.stringify(store);
  } catch {
    // ignore
  }
}

function storageGet(key) {
  try {
    const val = localStorage.getItem(key);
    if (val !== null && val !== undefined) return val;
  } catch {
    // localStorage blocked on file:// in some browsers
  }
  const store = readWindowNameStore();
  return store[key] !== undefined ? store[key] : null;
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore if blocked
  }
  const store = readWindowNameStore();
  // Avoid storing huge base64 photos inside window.name if it's LOCAL_DB
  if (key === STORAGE_KEYS.LOCAL_DB) {
    try {
      const parsed = JSON.parse(value);
      const compact = {
        ...parsed,
        attendance: (parsed.attendance || []).slice(0, 25).map((r) => ({ ...r, photoDataUrl: '' }))
      };
      store[key] = JSON.stringify(compact);
    } catch {
      store[key] = value;
    }
  } else {
    store[key] = value;
  }
  writeWindowNameStore(store);
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  const store = readWindowNameStore();
  delete store[key];
  writeWindowNameStore(store);
}

function getLocalDB() {
  try {
    const raw = storageGet(STORAGE_KEYS.LOCAL_DB);
    if (!raw) {
      const seed = getDefaultSeedDB();
      storageSet(STORAGE_KEYS.LOCAL_DB, JSON.stringify(seed));
      return seed;
    }
    const db = JSON.parse(raw);
    let migrated = false;

    // Auto-migrate any existing classes/records that still had old Pune (18.52, 73.85) coordinates or Kasba/Pune labels
    (db.classes || []).forEach((c) => {
      if (!c.lat || Math.abs(Number(c.lat) - 18.52) < 0.05) {
        c.lat = 19.0176;
        c.lng = 73.0860;
        migrated = true;
      }
    });
    (db.attendance || []).forEach((r) => {
      if (
        !r.lat ||
        Math.abs(Number(r.lat) - 18.52) < 0.05 ||
        (r.locationName && /Pune|Kasba|Shivajinagar/i.test(r.locationName))
      ) {
        const roomPrefix =
          r.locationName && r.locationName.includes('·')
            ? r.locationName.split('·')[0].trim()
            : 'Room B-204';
        r.lat = 19.0176;
        r.lng = 73.0860;
        r.locationName = `${roomPrefix} · MGM College of Engineering and Technology, Kamothe, Panvel`;
        r.photoDataUrl = ''; // regenerate with updated MGM Kamothe Panvel stamp
        migrated = true;
      }
    });

    if (migrated) {
      saveLocalDB(db);
    }
    return db;
  } catch {
    return getDefaultSeedDB();
  }
}

function saveLocalDB(db) {
  storageSet(STORAGE_KEYS.LOCAL_DB, JSON.stringify(db));
}

// ---- Session Helpers --------------------------------------------------
function getSessionUser() {
  try {
    const raw = storageGet(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  if (token) storageSet(STORAGE_KEYS.TOKEN, token);
  if (user) storageSet(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearSession() {
  storageRemove(STORAGE_KEYS.TOKEN);
  storageRemove(STORAGE_KEYS.USER);
}

function getToken() {
  return storageGet(STORAGE_KEYS.TOKEN) || '';
}

function getDashboardForRole(role) {
  if (role === 'admin') return 'admin.html';
  if (role === 'faculty') return 'faculty.html';
  if (role === 'parent') return 'parent.html';
  return 'student.html';
}

// ---- Haversine Distance, Reverse Geocoding & GPS Camera Stamp ---------
const DEFAULT_COLLEGE_PLACE = 'MGM College of Engineering and Technology, Kamothe, Panvel';

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function reverseGeocodePlace(lat, lng, fallbackLabel) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return fallbackLabel || DEFAULT_COLLEGE_PLACE;
  }
  // Only return MGM College directly if the student is physically within 120m of MGM Campus Kamothe (19.0176, 73.0860)
  const distToMgm = calculateDistanceMeters(lat, lng, 19.0176, 73.0860);
  if (distToMgm <= 120) {
    return DEFAULT_COLLEGE_PLACE;
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error('Reverse geocode HTTP error');
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const parts = [
        a.amenity || a.building || a.house_number || a.road || a.residential,
        a.suburb || a.neighbourhood || a.village || a.quarter,
        a.city || a.town || a.county || a.state_district,
        a.state
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.slice(0, 3).join(', ');
      }
    }
    if (data && data.display_name) {
      return data.display_name.split(',').slice(0, 3).join(',').trim();
    }
  } catch {
    // Fallback if offline
  }
  return fallbackLabel || `Lat ${lat.toFixed(4)}°, Lng ${lng.toFixed(4)}°`;
}

function formatCoords(lat, lng) {
  const nLat = Number(lat ?? 19.0176).toFixed(5);
  const nLng = Number(lng ?? 73.0860).toFixed(5);
  const latDir = Number(lat ?? 19.0176) >= 0 ? 'N' : 'S';
  const lngDir = Number(lng ?? 73.0860) >= 0 ? 'E' : 'W';
  return `Lat ${Math.abs(nLat)}° ${latDir}, Lng ${Math.abs(nLng)}° ${lngDir}`;
}

function createGpsStampedImage({
  videoEl,
  studentName,
  rollNo,
  className,
  room,
  lat,
  lng,
  accuracy,
  locationName,
  dateTimeStr,
  distanceMeters,
  isInsideGeofence = true
}) {
  const canvas = document.createElement('canvas');
  const W = 640;
  const H = 480;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Draw camera video frame or stylized portrait fallback
  let drewVideo = false;
  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
    try {
      ctx.drawImage(videoEl, 0, 0, W, H);
      drewVideo = true;
    } catch {
      drewVideo = false;
    }
  }

  if (!drewVideo) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1e2d3d');
    grad.addColorStop(1, '#17708a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(W / 2, 145, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2, 290, 95, Math.PI, 0, false);
    ctx.fill();

    ctx.strokeStyle = 'rgba(240, 171, 78, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(W / 2, 175, 88, 112, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Top-right verification pill (Green if inside classroom radius, Red if outside)
  const pillText = isInsideGeofence
    ? `✓ INSIDE CLASSROOM (${distanceMeters ?? 12}m) · PRESENT`
    : `✕ OUTSIDE CLASS (${distanceMeters}m AWAY) · REJECTED`;
  ctx.font = 'bold 11.5px Manrope, sans-serif';
  const pillW = Math.max(220, ctx.measureText(pillText).width + 24);
  ctx.fillStyle = 'rgba(18, 26, 36, 0.88)';
  ctx.fillRect(W - pillW - 14, 14, pillW, 30);
  ctx.strokeStyle = isInsideGeofence ? '#2f9c69' : '#cf3f2b';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(W - pillW - 14, 14, pillW, 30);
  ctx.fillStyle = isInsideGeofence ? '#4ce09a' : '#ff7b6b';
  ctx.fillText(pillText, W - pillW - 2, 33);

  // 3. Draw GPS Map Camera Stamp Bar at the bottom of the image
  const boxX = 14;
  const boxY = H - 118;
  const boxW = W - 28;
  const boxH = 104;

  ctx.fillStyle = 'rgba(16, 23, 33, 0.90)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = isInsideGeofence ? 'rgba(240, 171, 78, 0.75)' : 'rgba(207, 63, 43, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Mini GPS Map Tile on left of the stamp
  const mapX = boxX + 12;
  const mapY = boxY + 12;
  const mapSize = 80;
  ctx.fillStyle = '#193544';
  ctx.fillRect(mapX, mapY, mapSize, mapSize);
  ctx.strokeStyle = 'rgba(240, 171, 78, 0.5)';
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);

  ctx.strokeStyle = 'rgba(23, 112, 138, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isInsideGeofence ? '#f0ab4e' : '#cf3f2b';
  ctx.beginPath();
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('GPS CAM', mapX + 18, mapY + mapSize - 6);

  // Text lines inside the GPS Stamp
  const textX = mapX + mapSize + 14;
  const maxTextW = boxX + boxW - textX - 10;
  const placeText = `📍 ${locationName || `${room || 'Room B-204'} · ${DEFAULT_COLLEGE_PLACE}`}`;
  const coordText = `${formatCoords(lat, lng)}${accuracy ? ` · ±${accuracy}m` : ''}${
    typeof distanceMeters === 'number' ? ` · ${distanceMeters}m from class` : ''
  }`;
  const metaLine1 = `${dateTimeStr || new Date().toLocaleString()} · ${className || 'Data Structures'} (${
    room || 'Room B-204'
  })`;
  const metaLine2 = `Student: ${studentName || 'Aarav Menon'} (${rollNo || 'CS21-014'}) · Attenova GPS Camera`;

  // Line 1: Actual Calibrated Place Name
  ctx.fillStyle = '#ffffff';
  let fontSize = 14.5;
  ctx.font = `bold ${fontSize}px Sora, Manrope, sans-serif`;
  while (ctx.measureText(placeText).width > maxTextW && fontSize > 10) {
    fontSize -= 0.5;
    ctx.font = `bold ${fontSize}px Sora, Manrope, sans-serif`;
  }
  ctx.fillText(placeText, textX, boxY + 28);

  // Line 2: Exact GPS Coordinates & Distance from Classroom
  ctx.fillStyle = '#f0ab4e';
  ctx.font = 'bold 12.5px monospace';
  ctx.fillText(coordText, textX, boxY + 50);

  // Line 3: Date/Time & Class
  ctx.fillStyle = '#d3dce6';
  ctx.font = '12px Manrope, sans-serif';
  ctx.fillText(metaLine1, textX, boxY + 71);

  // Line 4: Student Name & Roll Number
  ctx.fillStyle = '#9fb0c2';
  ctx.font = '11.5px Manrope, sans-serif';
  ctx.fillText(metaLine2, textX, boxY + 90);

  return canvas.toDataURL('image/jpeg', 0.86);
}

// Helper: Format GPS cell HTML for tables
function renderGpsLocationCell(record) {
  const place = record.locationName || `Room B-204 · ${DEFAULT_COLLEGE_PLACE}`;
  const coords = formatCoords(record.lat || 19.0176, record.lng || 73.0860);
  return `
    <div class="gps-cell-place">📍 ${place}</div>
    <div class="gps-cell-coords">${coords}</div>
  `;
}

// Universal Modal to view any record's GPS-Stamped Photo
function ensurePhotoModal() {
  let backdrop = document.querySelector('#gps-photo-modal');
  if (backdrop) return backdrop;

  backdrop = document.createElement('div');
  backdrop.id = 'gps-photo-modal';
  backdrop.className = 'modal-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="modal photo-modal">
      <div class="row between mb">
        <div>
          <h3 id="gps-modal-title">GPS-Stamped Attendance Snapshot</h3>
          <p class="muted small" id="gps-modal-subtitle"></p>
        </div>
        <button class="btn ghost sm" id="gps-modal-close" type="button">✕ Close</button>
      </div>
      <img id="gps-modal-img" alt="GPS-Stamped Student Attendance Photo" />
      <div class="row between mt">
        <span class="small muted" id="gps-modal-coords"></span>
        <a class="btn sm" id="gps-modal-download" download="attendly-gps-photo.jpg">Download Stamped Photo</a>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.querySelector('#gps-modal-close').addEventListener('click', () => {
    backdrop.hidden = true;
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.hidden = true;
  });
  return backdrop;
}

function openGpsPhotoModal(record) {
  const modal = ensurePhotoModal();
  const photoUrl =
    record.photoDataUrl ||
    createGpsStampedImage({
      videoEl: null,
      studentName: record.studentName,
      rollNo: record.rollNo,
      className: record.className,
      lat: record.lat || 19.0176,
      lng: record.lng || 73.0860,
      locationName: record.locationName || `Room B-204 · ${DEFAULT_COLLEGE_PLACE}`,
      dateTimeStr: `${record.displayDate || record.date || 'Today'}, ${record.time || '09:02'}`
    });

  modal.querySelector('#gps-modal-title').textContent = `${record.studentName} (${record.rollNo}) — ${record.className}`;
  modal.querySelector('#gps-modal-subtitle').textContent = `📍 ${
    record.locationName || DEFAULT_COLLEGE_PLACE
  }`;
  modal.querySelector('#gps-modal-coords').textContent = formatCoords(
    record.lat || 19.0176,
    record.lng || 73.0860
  );
  modal.querySelector('#gps-modal-img').src = photoUrl;
  modal.querySelector('#gps-modal-download').href = photoUrl;
  modal.hidden = false;
}

function bindPhotoViewButtons(container, records) {
  if (!container) return;
  container.querySelectorAll('[data-view-photo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.viewPhoto;
      const rec = records.find((r) => r.id === id);
      if (rec) openGpsPhotoModal(rec);
    });
  });
}

// ---- Unified API Client (Server first, Local fallback if offline) -----
async function apiRequest(path, options = {}) {
  // When opened directly from a folder/zip via file:// protocol, skip network fetch immediately
  if (window.location.protocol === 'file:') {
    return handleOfflineFallback(path, options);
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(path, { ...options, headers });
    const contentType = (res.headers && res.headers.get('content-type')) || '';

    // If running on a static server (e.g. VS Code Live Server, Python http.server, GitHub Pages)
    // that returns 404/405 or HTML instead of JSON API responses, use the local database fallback
    if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
      return handleOfflineFallback(path, options);
    }

    const data = await res.json();
    if (!res.ok) {
      const apiErr = new Error(data.error || `Request failed (${res.status})`);
      apiErr.isApiError = true;
      throw apiErr;
    }
    return data;
  } catch (err) {
    if (err && err.isApiError) {
      throw err;
    }
    return handleOfflineFallback(path, options);
  }
}

function handleOfflineFallback(path, options) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const db = getLocalDB();

  if (path === '/api/config' && method === 'GET') {
    return {
      googleClientId: storageGet(STORAGE_KEYS.GOOGLE_CLIENT_ID) || '',
      adminEmails: ['admin@college.edu', 'principal@college.edu']
    };
  }

  if (path === '/api/config/google-client-id' && method === 'PUT') {
    storageSet(STORAGE_KEYS.GOOGLE_CLIENT_ID, (body.googleClientId || '').trim());
    return { ok: true, googleClientId: body.googleClientId };
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const isAdmin =
      ['admin@college.edu', 'principal@college.edu'].includes(email) || email.startsWith('admin@');
    let user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const localPart = (email.split('@')[0] || 'Student')
        .replace(/^[a-z]\d+[_.-]?/i, '')
        .split(/[._-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
      const assignedRole = isAdmin ? 'admin' : body.role || 'student';
      user = {
        id: 'usr_' + Date.now(),
        name: localPart || email.split('@')[0],
        email,
        password: body.password || 'password123',
        role: assignedRole,
        department: 'Computer Science',
        rollNo: assignedRole === 'student' ? `CS25-0${db.users.length + 14}` : undefined,
        semester: assignedRole === 'student' ? 'Semester 5' : undefined,
        faceEnrolled: assignedRole === 'student' ? true : undefined,
        studentRollNo: assignedRole === 'parent' ? 'CS21-014' : undefined,
        studentName: assignedRole === 'parent' ? 'Aarav Menon' : undefined
      };
      db.users.push(user);
      saveLocalDB(db);
    } else if (user.password && user.password !== 'password123' && user.password !== body.password) {
      throw new Error('Incorrect password. Please try again.');
    }
    return { token: 'local_jwt_' + Date.now(), user };
  }

  if (path === '/api/auth/google' && method === 'POST') {
    if (!body.credential) throw new Error('Missing Google credential token.');
    const parts = body.credential.split('.');
    if (parts.length < 2) throw new Error('Invalid Google token format.');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
    const email = (payload.email || '').toLowerCase();
    const name = payload.name || email.split('@')[0];
    const isAdmin = ['admin@college.edu', 'principal@college.edu'].includes(email);

    let user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const assignedRole = isAdmin ? 'admin' : body.selectedRole || 'student';
      user = {
        id: 'usr_' + Date.now(),
        name,
        email,
        role: assignedRole,
        picture: payload.picture || '',
        department: 'Computer Science',
        rollNo: assignedRole === 'student' ? `CS21-0${db.users.length + 14}` : undefined,
        semester: assignedRole === 'student' ? 'Semester 5' : undefined,
        faceEnrolled: assignedRole === 'student' ? true : undefined,
        studentRollNo: assignedRole === 'parent' ? 'CS21-014' : undefined
      };
      db.users.push(user);
      saveLocalDB(db);
    }
    return { token: 'local_google_jwt_' + Date.now(), user };
  }

  if (path === '/api/data' && method === 'GET') {
    return {
      currentUser: getSessionUser(),
      users: db.users,
      classes: db.classes,
      attendance: db.attendance,
      alerts: db.alerts
    };
  }

  if (path === '/api/users' && method === 'POST') {
    const newUser = {
      id: 'usr_' + Date.now(),
      name: body.name,
      email: body.email.toLowerCase(),
      password: body.password || 'password123',
      role: body.email.toLowerCase() === 'admin@college.edu' ? 'admin' : body.role,
      department: body.department || 'Computer Science',
      rollNo: body.role === 'student' ? body.rollNo || 'CS21-019' : undefined,
      semester: body.role === 'student' ? 'Semester 5' : undefined,
      faceEnrolled: body.role === 'student' ? true : undefined,
      studentRollNo: body.role === 'parent' ? body.studentRollNo || 'CS21-014' : undefined
    };
    db.users.push(newUser);
    saveLocalDB(db);
    return { user: newUser };
  }

  if (path.startsWith('/api/users/') && method === 'DELETE') {
    const id = path.split('/').pop();
    db.users = db.users.filter((u) => u.id !== id);
    saveLocalDB(db);
    return { ok: true };
  }

  if (path === '/api/classes' && method === 'POST') {
    const newClass = {
      id: 'cls_' + Date.now(),
      name: body.name,
      room: body.room || 'Room B-101',
      schedule: body.schedule || '10:00 – 11:00',
      facultyName: (getSessionUser() && getSessionUser().name) || 'Prof. Nandini Deshpande',
      lat: parseFloat(body.lat) || 19.0176,
      lng: parseFloat(body.lng) || 73.0860,
      radius: parseInt(body.radius, 10) || 60,
      studentCount: 40,
      live: false
    };
    db.classes.push(newClass);
    saveLocalDB(db);
    return { classItem: newClass };
  }

  if (path.endsWith('/toggle-session') && method === 'POST') {
    const id = path.split('/')[3];
    const cls = db.classes.find((c) => c.id === id);
    if (cls) cls.live = !cls.live;
    saveLocalDB(db);
    return { classItem: cls };
  }

  if (path.startsWith('/api/classes/') && method === 'DELETE') {
    const id = path.split('/').pop();
    db.classes = db.classes.filter((c) => c.id !== id);
    saveLocalDB(db);
    return { ok: true };
  }

  if (path === '/api/attendance' && method === 'POST') {
    const student =
      (body.studentId && db.users.find((u) => u.id === body.studentId)) ||
      getSessionUser() ||
      db.users.find((u) => u.role === 'student');
    const cls =
      (body.classId && db.classes.find((c) => c.id === body.classId)) ||
      db.classes.find((c) => c.live) ||
      db.classes[0];
    const now = new Date();
    const displayDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const finalLat = typeof body.lat === 'number' ? Number(body.lat.toFixed(5)) : Number(cls.lat || 19.0176);
    const finalLng = typeof body.lng === 'number' ? Number(body.lng.toFixed(5)) : Number(cls.lng || 73.0860);
    const classLat = Number(cls.lat || 19.0176);
    const classLng = Number(cls.lng || 73.0860);
    const allowedRadius = Number(cls.radius || 60);
    const distanceMeters = calculateDistanceMeters(finalLat, finalLng, classLat, classLng);

    let status = 'Present';
    let badgeType = 'ok';
    if (body.manualStatus) {
      status = body.manualStatus;
      badgeType = status === 'Present' ? 'ok' : status === 'Late' ? 'warn' : 'bad';
    } else if (distanceMeters > allowedRadius) {
      status = 'Rejected — outside class area';
      badgeType = 'bad';
    } else if (body.faceMatched === false) {
      status = 'Rejected — face mismatch';
      badgeType = 'bad';
    }

    const finalPlace =
      body.locationName ||
      (distanceMeters <= allowedRadius
        ? `${cls.room} · ${DEFAULT_COLLEGE_PLACE}`
        : `Outside ${cls.room} (${distanceMeters}m away)`);

    const record = {
      id: 'att_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo || 'CS21-014',
      classId: cls.id,
      className: cls.name,
      date: now.toISOString().slice(0, 10),
      displayDate,
      status,
      badgeType,
      time: timeStr,
      distance: `${distanceMeters} m`,
      lat: finalLat,
      lng: finalLng,
      locationName: finalPlace,
      photoDataUrl: body.photoDataUrl || ''
    };
    db.attendance.unshift(record);
    db.alerts.unshift({
      id: 'alt_' + Date.now(),
      studentRollNo: record.rollNo,
      type: badgeType,
      title: badgeType === 'ok' ? `Checked in to ${cls.name}` : `${status} in ${cls.name}`,
      detail: `${displayDate}, ${timeStr} · 📍 ${finalPlace} (${finalLat}°, ${finalLng}° · ${distanceMeters}m from class)`,
      unread: true
    });
    saveLocalDB(db);
    return { record };
  }

  if (path === '/api/alerts/mark-read' && method === 'POST') {
    db.alerts.forEach((a) => (a.unread = false));
    saveLocalDB(db);
    return { ok: true };
  }

  if (path === '/api/preferences' && method === 'PUT') {
    const parent = db.users.find((u) => u.role === 'parent');
    if (parent) parent.preferences = body;
    saveLocalDB(db);
    return { ok: true, preferences: body };
  }

  return {};
}

// ---- PWA Service Worker & Install Button ------------------------------
let deferredInstallPrompt = null;

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.querySelector('#pwa-install-btn');
  if (installBtn) {
    installBtn.hidden = false;
  }
});

const pwaInstallBtn = document.querySelector('#pwa-install-btn');
if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    pwaInstallBtn.hidden = true;
  });
}

// ---- Tabs -------------------------------------------------------------
document.querySelectorAll('[data-tabs]').forEach((group) => {
  const buttons = group.querySelectorAll('.tabs button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      group.querySelectorAll('.tabpanel').forEach((p) => {
        p.hidden = p.dataset.tab !== btn.dataset.target;
      });
    });
  });
});

// ---- Auth Guard & Header Navigation -----------------------------------
const currentPage = document.body.dataset.page;
const sessionUser = getSessionUser();

if (currentPage && currentPage !== 'login') {
  if (!sessionUser) {
    window.location.href = 'index.html';
  } else {
    renderAuthenticatedHeader(sessionUser);
  }
} else if (currentPage === 'login' && sessionUser) {
  renderAuthenticatedHeader(sessionUser);
}

function renderAuthenticatedHeader(user) {
  const nav = document.querySelector('#app-nav');
  if (!nav) return;

  const installBtn = nav.querySelector('#pwa-install-btn');
  nav.innerHTML = '';

  if (user.role === 'admin') {
    nav.insertAdjacentHTML(
      'beforeend',
      `
      <a href="admin.html" ${currentPage === 'admin' ? 'aria-current="page"' : ''}>Admin</a>
      <a href="faculty.html" ${currentPage === 'faculty' ? 'aria-current="page"' : ''}>Faculty</a>
      <a href="student.html" ${currentPage === 'student' ? 'aria-current="page"' : ''}>Student</a>
      <a href="parent.html" ${currentPage === 'parent' ? 'aria-current="page"' : ''}>Parent</a>
    `
    );
  } else if (user.role === 'faculty') {
    nav.insertAdjacentHTML('beforeend', `<a href="faculty.html" aria-current="page">Faculty Dashboard</a>`);
  } else if (user.role === 'parent') {
    nav.insertAdjacentHTML(
      'beforeend',
      `
      <a href="parent.html" ${currentPage === 'parent' ? 'aria-current="page"' : ''}>Overview</a>
      <a href="preferences.html" ${currentPage === 'preferences' ? 'aria-current="page"' : ''}>Alert Settings</a>
    `
    );
  } else {
    nav.insertAdjacentHTML('beforeend', `<a href="student.html" aria-current="page">Student Check-in</a>`);
  }

  const chip = document.createElement('span');
  chip.className = 'user-chip';
  chip.innerHTML = `<span class="role-dot"></span><span>${user.name} (${user.role})</span>`;
  nav.appendChild(chip);

  if (installBtn) {
    nav.appendChild(installBtn);
  }

  const signOutBtn = document.createElement('button');
  signOutBtn.type = 'button';
  signOutBtn.className = 'btn-header';
  signOutBtn.textContent = 'Sign out';
  signOutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
  nav.appendChild(signOutBtn);
}

// ---- Login Page (Email/Password + Real Google Identity Services) ------
if (currentPage === 'login') {
  initLoginPage();
}

async function initLoginPage() {
  const loginForm = document.querySelector('#login-form');
  const alertBox = document.querySelector('#login-alert');

  function showLoginMessage(msg, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `auth-msg ${type}`;
    alertBox.hidden = false;
  }

  document.querySelectorAll('[data-fill-email]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelector('#email').value = chip.dataset.fillEmail;
      document.querySelector('#password').value = 'password123';
      const roleRadio = document.querySelector(`input[name="role"][value="${chip.dataset.fillRole}"]`);
      if (roleRadio) roleRadio.checked = true;
      if (alertBox) alertBox.hidden = true;
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (alertBox) alertBox.hidden = true;
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      const selectedRole = loginForm.role.value;

      try {
        const res = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, role: selectedRole })
        });
        setSession(res.token, res.user);
        window.location.href = getDashboardForRole(res.user.role);
      } catch (err) {
        showLoginMessage(err.message || 'Sign in failed.');
      }
    });
  }

  const config = await apiRequest('/api/config').catch(() => ({ googleClientId: '' }));
  const setupBar = document.querySelector('#google-setup-bar');
  const modal = document.querySelector('#google-config-modal');
  const clientIdInput = document.querySelector('#google-client-id-input');

  function mountGoogleButton(clientId) {
    const container = document.querySelector('#google-signin-button');
    if (!container) return;

    if (!clientId) {
      container.innerHTML = '';
      if (setupBar) setupBar.hidden = false;
      return;
    }

    if (setupBar) setupBar.hidden = true;

    const tryRender = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const selectedRole =
                (document.querySelector('input[name="role"]:checked') || {}).value || 'student';
              const res = await apiRequest('/api/auth/google', {
                method: 'POST',
                body: JSON.stringify({
                  credential: response.credential,
                  selectedRole
                })
              });
              setSession(res.token, res.user);
              window.location.href = getDashboardForRole(res.user.role);
            } catch (err) {
              showLoginMessage(err.message || 'Google Sign-In verification failed.');
            }
          }
        });
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'rectangular'
        });
      } else {
        setTimeout(tryRender, 300);
      }
    };
    tryRender();
  }

  mountGoogleButton(config.googleClientId);

  const openBtn = document.querySelector('#open-google-config');
  const closeBtn = document.querySelector('#close-google-config');
  const saveBtn = document.querySelector('#save-google-config');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      if (clientIdInput) clientIdInput.value = config.googleClientId || '';
      modal.hidden = false;
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.hidden = true;
    });
  }
  if (saveBtn && modal) {
    saveBtn.addEventListener('click', async () => {
      const newId = (clientIdInput ? clientIdInput.value : '').trim();
      await apiRequest('/api/config/google-client-id', {
        method: 'PUT',
        body: JSON.stringify({ googleClientId: newId })
      });
      config.googleClientId = newId;
      modal.hidden = true;
      mountGoogleButton(newId);
    });
  }
}

// ---- Student Dashboard Logic (with Live GPS Camera Overlay & Stamp) ---
if (currentPage === 'student') {
  initStudentDashboard();
}

async function initStudentDashboard() {
  const data = await apiRequest('/api/data');
  const user = data.currentUser || sessionUser;
  const classes = data.classes || [];
  const allAttendance = data.attendance || [];

  if (user) {
    const firstName = user.name.split(' ')[0];
    document.querySelector('#student-greeting').textContent = `Hello, ${firstName}`;
    document.querySelector('#student-meta').textContent = `Roll no ${user.rollNo || 'CS21-014'} · ${
      user.department || 'Computer Science'
    }, ${user.semester || 'Semester 5'}`;
  }

  const classSelect = document.querySelector('#student-class-select');
  const titleEl = document.querySelector('#active-class-title');
  const metaEl = document.querySelector('#active-class-meta');

  function getSelectedClass() {
    return (
      classes.find((c) => classSelect && c.id === classSelect.value) ||
      classes.find((c) => c.live) ||
      classes[0]
    );
  }

  function updateSelectedClassHeader() {
    const cls = getSelectedClass();
    if (!cls) return;
    titleEl.textContent = `Check in to ${cls.name}`;
    metaEl.textContent = `${cls.schedule || '09:00 – 10:00'} · ${cls.room} · ${
      cls.live ? 'session is live' : 'no live session'
    }`;
  }

  if (classSelect) {
    classSelect.innerHTML = classes
      .map(
        (c) =>
          `<option value="${c.id}" ${c.live ? 'selected' : ''}>${c.name} (${c.room}) ${
            c.live ? '— LIVE' : ''
          }</option>`
      )
      .join('');
    classSelect.addEventListener('change', updateSelectedClassHeader);
    updateSelectedClassHeader();
  }

  function renderStudentAttendance(records) {
    const myRecords = records.filter(
      (r) => !user || r.studentId === user.id || r.rollNo === (user.rollNo || 'CS21-014')
    );
    const attended = myRecords.filter((r) => r.badgeType === 'ok' || r.badgeType === 'warn').length + 20;
    const missed = myRecords.filter((r) => r.badgeType === 'bad').length + 1;
    const pct = Math.round((attended / (attended + missed)) * 100);

    document.querySelector('#stat-percent').textContent = `${pct}%`;
    document.querySelector('#stat-attended').textContent = String(attended);
    document.querySelector('#stat-missed').textContent = String(missed);

    const tbody = document.querySelector('#recent-list');
    if (tbody) {
      tbody.innerHTML = myRecords
        .map(
          (r) => `
          <tr>
            <td>${r.displayDate || r.date}<div class="muted small">${r.time}</div></td>
            <td>${r.className}</td>
            <td>${renderGpsLocationCell(r)}</td>
            <td><span class="badge ${r.badgeType || 'ok'}">${r.status}</span></td>
            <td><button class="btn secondary sm" data-view-photo="${r.id}" type="button">View GPS Photo</button></td>
          </tr>`
        )
        .join('');
      bindPhotoViewButtons(tbody, myRecords);
    }
  }

  renderStudentAttendance(allAttendance);

  // Camera + Live GPS Map Camera Stamp
  const camRoot = document.querySelector('.camera[data-open-btn]');
  if (camRoot) {
    const video = camRoot.querySelector('video');
    const capturedImg = document.querySelector('#captured-photo');
    const downloadLink = document.querySelector('#download-stamped-photo');
    const off = camRoot.querySelector('.off');
    const oval = camRoot.querySelector('.oval');
    const gpsOverlay = document.querySelector('#gps-live-overlay');
    const gpsPlaceEl = document.querySelector('#gps-live-place');
    const gpsCoordsEl = document.querySelector('#gps-live-coords');
    const gpsTimeEl = document.querySelector('#gps-live-time');

    const openBtn = document.querySelector(camRoot.dataset.openBtn);
    const captureBtn = document.querySelector(camRoot.dataset.captureBtn);
    const status = document.querySelector(camRoot.dataset.status);

    const calStudentLocEl = document.querySelector('#cal-student-loc');
    const calClassLocEl = document.querySelector('#cal-class-loc');
    const calDistanceBadgeEl = document.querySelector('#cal-distance-badge');
    const calibrateGpsBtn = document.querySelector('#calibrate-gps-btn');

    let stream = null;
    let liveGpsState = {
      lat: 19.0176,
      lng: 73.0860,
      accuracy: 10,
      distanceMeters: 0,
      isInsideGeofence: true,
      locationName: `Room B-204 · ${DEFAULT_COLLEGE_PLACE}`
    };

    async function refreshLiveGpsOverlay(forceCalibrate = false) {
      const cls = getSelectedClass();
      const campusLat = cls && cls.lat ? Number(cls.lat) : 19.0176;
      const campusLng = cls && cls.lng ? Number(cls.lng) : 73.0860;
      const allowedRadius = cls && cls.radius ? Number(cls.radius) : 60;
      const roomLabel = cls && cls.room ? cls.room : 'Room B-204';
      const classTargetDesc = `${roomLabel} · ${DEFAULT_COLLEGE_PLACE} (${formatCoords(campusLat, campusLng)} · Radius ${allowedRadius}m)`;

      if (calClassLocEl) {
        calClassLocEl.innerHTML = `<strong>Classroom Target:</strong> ${classTargetDesc}`;
      }
      if (calStudentLocEl) {
        calStudentLocEl.innerHTML = `<strong>Your Actual Location:</strong> Calibrating high-accuracy GPS sensor…`;
      }
      if (calDistanceBadgeEl) {
        calDistanceBadgeEl.innerHTML = `<strong>Geofence Status:</strong> <span class="badge warn">Calibrating GPS…</span>`;
      }
      if (calibrateGpsBtn) {
        calibrateGpsBtn.disabled = true;
        calibrateGpsBtn.textContent = '📡 Calibrating…';
      }
      if (gpsPlaceEl) gpsPlaceEl.textContent = 'Calibrating exact GPS coordinates & actual place name…';

      let pos;
      try {
        pos = await getBrowserLocation(forceCalibrate);
      } catch (err) {
        if (calStudentLocEl) {
          calStudentLocEl.innerHTML =
            `<strong>Your Actual Location:</strong> GPS permission denied or unavailable — please allow browser Location access.`;
        }
        if (calDistanceBadgeEl) {
          calDistanceBadgeEl.innerHTML = `<strong>Geofence Status:</strong> <span class="badge bad">GPS Unavailable</span>`;
        }
        if (calibrateGpsBtn) {
          calibrateGpsBtn.disabled = false;
          calibrateGpsBtn.textContent = '🎯 Re-Calibrate Exact GPS';
        }
        return;
      }

      const useLat = pos.lat;
      const useLng = pos.lng;
      const accuracy = pos.accuracy || 15;
      const distanceMeters = calculateDistanceMeters(useLat, useLng, campusLat, campusLng);
      const isInsideGeofence = distanceMeters <= allowedRadius;

      // Reverse-geocode the student's ACTUAL coordinates (shows real home/street name when away from college)
      const actualPlace = await reverseGeocodePlace(useLat, useLng);
      const resolvedLocationName = isInsideGeofence
        ? `${roomLabel} · ${actualPlace}`
        : actualPlace;

      liveGpsState = {
        lat: useLat,
        lng: useLng,
        accuracy,
        distanceMeters,
        isInsideGeofence,
        locationName: resolvedLocationName
      };

      if (calStudentLocEl) {
        calStudentLocEl.innerHTML = `<strong>Your Actual Location:</strong> 📍 ${resolvedLocationName} (${formatCoords(useLat, useLng)} · ±${accuracy}m)`;
      }
      if (calClassLocEl) {
        calClassLocEl.innerHTML = `<strong>Classroom Target:</strong> 🏫 ${classTargetDesc}`;
      }
      if (calDistanceBadgeEl) {
        if (isInsideGeofence) {
          calDistanceBadgeEl.innerHTML = `<strong>Geofence Status:</strong> <span class="badge ok">✓ Inside Classroom (${distanceMeters}m ≤ ${allowedRadius}m) — Eligible for Present</span>`;
        } else {
          calDistanceBadgeEl.innerHTML = `<strong>Geofence Status:</strong> <span class="badge bad">✕ Outside Classroom (${distanceMeters}m away · Max ${allowedRadius}m) — Will be Rejected</span>`;
        }
      }
      if (calibrateGpsBtn) {
        calibrateGpsBtn.disabled = false;
        calibrateGpsBtn.textContent = '🎯 Re-Calibrate Exact GPS';
      }

      if (gpsPlaceEl) {
        gpsPlaceEl.textContent = isInsideGeofence
          ? `📍 ${resolvedLocationName}`
          : `⚠️ ${resolvedLocationName} (${distanceMeters}m away from ${roomLabel})`;
      }
      if (gpsCoordsEl) {
        gpsCoordsEl.textContent = `${formatCoords(useLat, useLng)} · ±${accuracy}m · ${distanceMeters}m from class`;
      }
      if (gpsTimeEl) {
        gpsTimeEl.textContent = `${new Date().toLocaleString()} · ${
          user ? user.name : 'Aarav Menon'
        } (${(user && user.rollNo) || 'CS21-014'})`;
      }
    }

    if (calibrateGpsBtn) {
      calibrateGpsBtn.addEventListener('click', () => refreshLiveGpsOverlay(true));
    }
    if (classSelect) {
      classSelect.addEventListener('change', () => refreshLiveGpsOverlay(false));
    }
    // Calibrate immediately on page load so the student sees their actual location & distance
    refreshLiveGpsOverlay(true);

    async function openCamera() {
      if (capturedImg) {
        capturedImg.hidden = true;
        video.hidden = false;
      }
      if (downloadLink) downloadLink.hidden = true;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        video.srcObject = stream;
        await video.play();
        off.hidden = true;
        oval.hidden = false;
        if (gpsOverlay) gpsOverlay.hidden = false;
        openBtn.disabled = true;
        captureBtn.disabled = false;
        status.textContent = 'Camera & Live GPS Tag active — click "Verify & stamp GPS photo".';
      } catch {
        off.hidden = false;
        off.textContent = 'Simulated Camera Ready — Live GPS Tag active below';
        oval.hidden = false;
        if (gpsOverlay) gpsOverlay.hidden = false;
        openBtn.disabled = true;
        captureBtn.disabled = false;
        status.textContent = 'Live GPS Tag ready — click "Verify & stamp GPS photo".';
      }

      refreshLiveGpsOverlay(true);
    }

    function stopCameraStreamOnly() {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      oval.hidden = true;
      if (gpsOverlay) gpsOverlay.hidden = true;
      openBtn.disabled = false;
      openBtn.textContent = 'Retake / Open camera';
      captureBtn.disabled = true;
    }

    async function captureAndVerify() {
      status.textContent = 'Calibrating GPS & stamping actual location onto attendance photo…';
      captureBtn.disabled = true;

      await refreshLiveGpsOverlay(true);
      const cls = getSelectedClass();
      const nowStr = new Date().toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Burn GPS Map Camera Tag onto the bottom of the captured photo
      const stampedDataUrl = createGpsStampedImage({
        videoEl: video,
        studentName: user ? user.name : 'Aarav Menon',
        rollNo: (user && user.rollNo) || 'CS21-014',
        className: cls ? cls.name : 'Data Structures',
        room: cls ? cls.room : 'Room B-204',
        lat: liveGpsState.lat,
        lng: liveGpsState.lng,
        accuracy: liveGpsState.accuracy,
        distanceMeters: liveGpsState.distanceMeters,
        isInsideGeofence: liveGpsState.isInsideGeofence,
        locationName: liveGpsState.locationName,
        dateTimeStr: nowStr
      });

      // Show the GPS-stamped image inside the camera box
      stopCameraStreamOnly();
      off.hidden = true;
      video.hidden = true;
      if (capturedImg) {
        capturedImg.src = stampedDataUrl;
        capturedImg.hidden = false;
      }
      if (downloadLink) {
        downloadLink.href = stampedDataUrl;
        downloadLink.hidden = false;
      }

      try {
        const res = await apiRequest('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            classId: cls ? cls.id : undefined,
            lat: liveGpsState.lat,
            lng: liveGpsState.lng,
            locationName: liveGpsState.locationName,
            photoDataUrl: stampedDataUrl,
            faceMatched: true
          })
        });

        const rec = res.record;
        status.innerHTML = `<span class="badge ${rec.badgeType}">${rec.status}</span> (${rec.distance} from ${cls ? cls.room : 'classroom'}) · Marked at ${rec.time} · 📍 <strong>${rec.locationName}</strong> (${formatCoords(rec.lat, rec.lng)})`;
        allAttendance.unshift(rec);
        renderStudentAttendance(allAttendance);
      } catch (err) {
        status.textContent = 'Check-in failed: ' + err.message;
      }
    }

    openBtn.addEventListener('click', openCamera);
    captureBtn.addEventListener('click', captureAndVerify);
    window.addEventListener('beforeunload', stopCameraStreamOnly);
  }
}

async function fetchIpLocationFallback() {
  try {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      return {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: 150
      };
    }
  } catch {
    // ignore
  }
  throw new Error('no geolocation');
}

function getBrowserLocation(calibrateMultiSample = false) {
  return new Promise((resolve, reject) => {
    const fallbackOrReject = () => {
      fetchIpLocationFallback().then(resolve).catch(reject);
    };

    if (!navigator.geolocation) return fallbackOrReject();

    if (!calibrateMultiSample) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          }),
        fallbackOrReject,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 7000 }
      );
      return;
    }

    // Multi-sample high-accuracy GPS calibration: collect fresh sensor readings and keep the sharpest fix
    let bestFix = null;
    let settled = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        };
        if (!bestFix || fix.accuracy < bestFix.accuracy) {
          bestFix = fix;
        }
        // If we get a sharp GPS lock (<= 25m accuracy), resolve immediately
        if (fix.accuracy <= 25 && !settled) {
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          resolve(bestFix);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          if (bestFix) resolve(bestFix);
          else fallbackOrReject();
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 7000 }
    );

    setTimeout(() => {
      if (!settled) {
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        if (bestFix) {
          resolve(bestFix);
        } else {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy)
              }),
            fallbackOrReject,
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
          );
        }
      }
    }, 2200);
  });
}

// ---- Faculty Dashboard Logic ------------------------------------------
if (currentPage === 'faculty') {
  initFacultyDashboard();
}

async function initFacultyDashboard() {
  let state = await apiRequest('/api/data');
  const user = state.currentUser || sessionUser;
  if (user) {
    document.querySelector('#faculty-meta').textContent = `${user.name} · ${
      user.department || 'Computer Science'
    }`;
  }

  function renderFacultyView() {
    const classes = state.classes || [];
    const attendance = state.attendance || [];
    const students = (state.users || []).filter((u) => u.role === 'student');

    // 1. Render Classes Grid
    const grid = document.querySelector('#classes-grid');
    if (grid) {
      grid.innerHTML = classes
        .map(
          (c) => `
        <div class="panel">
          <h3>${c.name}</h3>
          <p class="muted small">${c.room} · ${c.schedule || '09:00 – 10:00'} · radius ${c.radius} m</p>
          <p class="gps-cell-coords">📍 ${formatCoords(c.lat, c.lng)}</p>
          <div class="row between mt">
            <span class="badge ${c.live ? 'ok' : ''}">${
              c.live ? 'Live — students can check in now' : 'No session running'
            }</span>
            <button class="btn ${c.live ? 'accent' : ''}" data-toggle-class="${c.id}" type="button">
              ${c.live ? 'End session' : 'Start session'}
            </button>
          </div>
        </div>
      `
        )
        .join('');

      grid.querySelectorAll('[data-toggle-class]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.toggleClass;
          const res = await apiRequest(`/api/classes/${id}/toggle-session`, { method: 'POST' });
          const idx = state.classes.findIndex((c) => c.id === id);
          if (idx !== -1 && res.classItem) state.classes[idx] = res.classItem;
          renderFacultyView();
        });
      });
    }

    // 2. Populate Manual Attendance Selects
    const mStudent = document.querySelector('#m-student');
    const mClass = document.querySelector('#m-class');
    if (mStudent) {
      mStudent.innerHTML = students
        .map((s) => `<option value="${s.id}">${s.name} (${s.rollNo || 'Student'})</option>`)
        .join('');
    }
    if (mClass) {
      mClass.innerHTML = classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // 3. Render Live Check-ins Table
    const liveTbody = document.querySelector('#faculty-live-tbody');
    const liveCount = document.querySelector('#live-count-label');
    if (liveCount) liveCount.textContent = `${attendance.length} total records`;
    if (liveTbody) {
      liveTbody.innerHTML = attendance
        .map(
          (r) => `
        <tr>
          <td>${r.studentName}</td>
          <td>${r.rollNo}</td>
          <td>${r.className}</td>
          <td>${renderGpsLocationCell(r)}</td>
          <td><span class="badge ${r.badgeType || 'ok'}">${r.status}</span></td>
          <td>${r.distance || '—'}</td>
          <td>${r.time}</td>
          <td><button class="btn secondary sm" data-view-photo="${r.id}" type="button">View GPS Photo</button></td>
        </tr>
      `
        )
        .join('');
      bindPhotoViewButtons(liveTbody, attendance);
    }

    // 4. Render Reports Tab
    const rclassSelect = document.querySelector('#rclass');
    if (rclassSelect && rclassSelect.options.length <= 1) {
      rclassSelect.innerHTML =
        `<option value="all">All Classes</option>` +
        classes.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
    }
    renderReportTable();
  }

  function getFilteredReportRows() {
    const rclass = (document.querySelector('#rclass') || {}).value || 'all';
    const from = (document.querySelector('#from') || {}).value || '';
    const to = (document.querySelector('#to') || {}).value || '';

    return (state.attendance || []).filter((r) => {
      if (rclass !== 'all' && r.className !== rclass) return false;
      if (from && r.date && r.date < from) return false;
      if (to && r.date && r.date > to) return false;
      return true;
    });
  }

  function renderReportTable() {
    const reportTbody = document.querySelector('#faculty-report-tbody');
    if (!reportTbody) return;
    const rows = getFilteredReportRows();
    reportTbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.rollNo}</td>
        <td>${r.studentName}</td>
        <td>${r.className}</td>
        <td>${r.displayDate || r.date}</td>
        <td>${renderGpsLocationCell(r)}</td>
        <td><span class="badge ${r.badgeType || 'ok'}">${r.status}</span></td>
        <td>${r.time}</td>
        <td>${r.distance || '—'}</td>
        <td><button class="btn secondary sm" data-view-photo="${r.id}" type="button">View GPS Photo</button></td>
      </tr>
    `
      )
      .join('');
    bindPhotoViewButtons(reportTbody, rows);
  }

  ['#rclass', '#from', '#to'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener('change', renderReportTable);
  });

  // Add New Class Form
  const addClassForm = document.querySelector('#add-class-form');
  if (addClassForm) {
    addClassForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.querySelector('#cname').value.trim();
      const room = document.querySelector('#croom').value.trim();
      const schedule = document.querySelector('#cschedule').value.trim();
      const lat = document.querySelector('#lat').value.trim();
      const lng = document.querySelector('#lng').value.trim();
      const radius = document.querySelector('#rad').value.trim();

      const res = await apiRequest('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name, room, schedule, lat, lng, radius })
      });
      if (res.classItem) {
        state.classes.push(res.classItem);
        addClassForm.reset();
        document.querySelector('#class-save-status').textContent = `Saved "${res.classItem.name}" to database.`;
        renderFacultyView();
      }
    });
  }

  // Use Current GPS button
  const gpsBtn = document.querySelector('#use-gps-btn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', async () => {
      const status = document.querySelector('#class-save-status');
      status.textContent = 'Calibrating exact GPS coordinates…';
      try {
        const pos = await getBrowserLocation(true);
        document.querySelector('#lat').value = pos.lat.toFixed(5);
        document.querySelector('#lng').value = pos.lng.toFixed(5);
        const place = await reverseGeocodePlace(pos.lat, pos.lng);
        status.textContent = `Coordinates calibrated: ${place} (${formatCoords(pos.lat, pos.lng)} · ±${pos.accuracy} m).`;
      } catch {
        status.textContent = 'Could not read GPS; using default campus coordinates.';
      }
    });
  }

  // Manual Attendance Form
  const manualForm = document.querySelector('#manual-attendance-form');
  if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = document.querySelector('#m-student').value;
      const classId = document.querySelector('#m-class').value;
      const manualStatus = document.querySelector('#m-status').value;

      const res = await apiRequest('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ studentId, classId, manualStatus })
      });
      if (res.record) {
        state.attendance.unshift(res.record);
        renderFacultyView();
      }
    });
  }

  // Export CSV (including GPS Place Name & Exact Coordinates)
  const exportBtn = document.querySelector('#export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rows = getFilteredReportRows();
      const csvRows = [
        ['Roll no', 'Student', 'Class', 'Date', 'Status', 'Time', 'Distance', 'GPS Place Name', 'Latitude', 'Longitude'],
        ...rows.map((r) => [
          r.rollNo,
          r.studentName,
          r.className,
          r.date,
          r.status,
          r.time,
          r.distance || '',
          r.locationName || '',
          r.lat || '',
          r.lng || ''
        ])
      ];
      const csv = csvRows
        .map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(','))
        .join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-report-gps.csv';
      a.click();
      URL.revokeObjectURL(url);
      document.querySelector('#export-status').textContent = `Downloaded ${rows.length} rows (with GPS coordinates & place names) as CSV.`;
    });
  }

  renderFacultyView();
}

// ---- Parent Dashboard Logic -------------------------------------------
if (currentPage === 'parent') {
  initParentDashboard();
}

async function initParentDashboard() {
  const data = await apiRequest('/api/data');
  const user = data.currentUser || sessionUser;
  const studentRoll = (user && user.studentRollNo) || 'CS21-014';
  const student =
    (data.users || []).find((u) => u.rollNo === studentRoll) ||
    (data.users || []).find((u) => u.role === 'student');

  if (student) {
    const firstName = student.name.split(' ')[0];
    document.querySelector('#parent-heading').textContent = `${firstName}'s attendance`;
    document.querySelector('#parent-subheading').textContent = `${
      student.department || 'Computer Science'
    }, ${student.semester || 'Semester 5'} · roll no ${student.rollNo}`;
  }

  const alerts = (data.alerts || []).filter(
    (a) => !a.studentRollNo || a.studentRollNo === studentRoll
  );
  const history = (data.attendance || []).filter(
    (r) => !r.rollNo || r.rollNo === studentRoll
  );

  const attended = history.filter((r) => r.badgeType === 'ok' || r.badgeType === 'warn').length + 20;
  const total = attended + history.filter((r) => r.badgeType === 'bad').length + 1;
  document.querySelector('#parent-stat-pct').textContent = `${Math.round((attended / total) * 100)}%`;
  document.querySelector('#parent-stat-ratio').textContent = `${attended} / ${total}`;

  function renderAlerts() {
    const unread = alerts.filter((a) => a.unread).length;
    document.querySelector('#unread-count').textContent = String(unread);
    const list = document.querySelector('#parent-alerts-list');
    if (list) {
      list.innerHTML = alerts
        .map(
          (a) => `
        <div class="alert ${a.type || 'ok'}">
          ${a.unread ? '<span class="dot"></span>' : ''}
          <div>
            <strong>${a.title}</strong>
            <div class="muted small">${a.detail}</div>
          </div>
        </div>
      `
        )
        .join('');
    }
  }

  renderAlerts();

  const readBtn = document.querySelector('#mark-read');
  if (readBtn) {
    readBtn.addEventListener('click', async () => {
      await apiRequest('/api/alerts/mark-read', { method: 'POST' });
      alerts.forEach((a) => (a.unread = false));
      renderAlerts();
    });
  }

  const historyTbody = document.querySelector('#parent-history-tbody');
  if (historyTbody) {
    historyTbody.innerHTML = history
      .map(
        (r) => `
      <tr>
        <td>${r.displayDate || r.date}</td>
        <td>${r.className}</td>
        <td>${renderGpsLocationCell(r)}</td>
        <td><span class="badge ${r.badgeType || 'ok'}">${r.status}</span></td>
        <td>${r.time}</td>
        <td><button class="btn secondary sm" data-view-photo="${r.id}" type="button">View GPS Photo</button></td>
      </tr>
    `
      )
      .join('');
    bindPhotoViewButtons(historyTbody, history);
  }
}

// ---- Parent Preferences Logic -----------------------------------------
if (currentPage === 'preferences') {
  initPreferencesPage();
}

async function initPreferencesPage() {
  const data = await apiRequest('/api/data');
  const user = data.currentUser || sessionUser;
  const prefs = (user && user.preferences) || {
    successfulCheckIn: true,
    lateCheckIn: true,
    wrongLocation: true,
    faceNotMatched: false
  };

  document.querySelector('#pref-ok').checked = Boolean(prefs.successfulCheckIn);
  document.querySelector('#pref-late').checked = Boolean(prefs.lateCheckIn);
  document.querySelector('#pref-outside').checked = Boolean(prefs.wrongLocation);
  document.querySelector('#pref-face').checked = Boolean(prefs.faceNotMatched);

  const prefForm = document.querySelector('#pref-form');
  if (prefForm) {
    prefForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        successfulCheckIn: document.querySelector('#pref-ok').checked,
        lateCheckIn: document.querySelector('#pref-late').checked,
        wrongLocation: document.querySelector('#pref-outside').checked,
        faceNotMatched: document.querySelector('#pref-face').checked
      };
      await apiRequest('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      const enabledCount = Object.values(updated).filter(Boolean).length;
      document.querySelector('#pref-status').textContent = `Saved — you will get ${enabledCount} of 4 alert types.`;
    });
  }
}

// ---- Institution Admin Portal Logic -----------------------------------
if (currentPage === 'admin') {
  initAdminPortal();
}

async function initAdminPortal() {
  let state = await apiRequest('/api/data');
  const config = await apiRequest('/api/config').catch(() => ({ googleClientId: '' }));

  const googleInput = document.querySelector('#admin-google-client-id');
  if (googleInput) googleInput.value = config.googleClientId || '';

  function renderAdminAll() {
    const users = state.users || [];
    const classes = state.classes || [];
    const logs = state.attendance || [];

    document.querySelector('#admin-count-users').textContent = String(users.length);
    document.querySelector('#admin-count-students').textContent = String(
      users.filter((u) => u.role === 'student').length
    );
    document.querySelector('#admin-count-classes').textContent = String(classes.length);
    document.querySelector('#admin-count-logs').textContent = String(logs.length);

    // Users table
    const usersTbody = document.querySelector('#admin-users-tbody');
    if (usersTbody) {
      usersTbody.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge info">${u.role}</span></td>
          <td>${u.rollNo ? `Roll: ${u.rollNo} · ` : ''}${u.department || 'Institution'}</td>
          <td>
            <button class="btn danger sm" data-delete-user="${u.id}" type="button">Remove</button>
          </td>
        </tr>
      `
        )
        .join('');

      usersTbody.querySelectorAll('[data-delete-user]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.deleteUser;
          try {
            await apiRequest(`/api/users/${id}`, { method: 'DELETE' });
            state.users = state.users.filter((u) => u.id !== id);
            renderAdminAll();
          } catch (err) {
            alert(err.message);
          }
        });
      });
    }

    // Classes table
    const classesTbody = document.querySelector('#admin-classes-tbody');
    if (classesTbody) {
      classesTbody.innerHTML = classes
        .map(
          (c) => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.room} · ${c.schedule || ''}</td>
          <td>${c.lat}, ${c.lng}</td>
          <td>${c.radius} m</td>
          <td><span class="badge ${c.live ? 'ok' : ''}">${c.live ? 'Live' : 'Idle'}</span></td>
          <td>
            <button class="btn danger sm" data-delete-class="${c.id}" type="button">Delete</button>
          </td>
        </tr>
      `
        )
        .join('');

      classesTbody.querySelectorAll('[data-delete-class]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.deleteClass;
          await apiRequest(`/api/classes/${id}`, { method: 'DELETE' });
          state.classes = state.classes.filter((c) => c.id !== id);
          renderAdminAll();
        });
      });
    }

    // Logs table
    const logsTbody = document.querySelector('#admin-logs-tbody');
    if (logsTbody) {
      logsTbody.innerHTML = logs
        .map(
          (r) => `
        <tr>
          <td>${r.displayDate || r.date}</td>
          <td>${r.time}</td>
          <td>${r.rollNo}</td>
          <td>${r.studentName}</td>
          <td>${r.className}</td>
          <td>${renderGpsLocationCell(r)}</td>
          <td><span class="badge ${r.badgeType || 'ok'}">${r.status}</span></td>
          <td>${r.distance || '—'}</td>
          <td><button class="btn secondary sm" data-view-photo="${r.id}" type="button">View GPS Photo</button></td>
        </tr>
      `
        )
        .join('');
      bindPhotoViewButtons(logsTbody, logs);
    }
  }

  // Add user form
  const addUserForm = document.querySelector('#admin-add-user-form');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = document.querySelector('#admin-user-status');
      try {
        const payload = {
          name: document.querySelector('#u-name').value.trim(),
          email: document.querySelector('#u-email').value.trim(),
          password: document.querySelector('#u-pass').value,
          role: document.querySelector('#u-role').value,
          department: document.querySelector('#u-dept').value.trim(),
          rollNo: document.querySelector('#u-roll').value.trim(),
          studentRollNo: document.querySelector('#u-roll').value.trim()
        };
        const res = await apiRequest('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.user) {
          state.users.push(res.user);
          addUserForm.reset();
          statusEl.textContent = `Added ${res.user.name} (${res.user.role}) to database.`;
          renderAdminAll();
        }
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  // Add class form
  const addClassForm = document.querySelector('#admin-add-class-form');
  if (addClassForm) {
    addClassForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.querySelector('#ac-name').value.trim(),
        room: document.querySelector('#ac-room').value.trim(),
        schedule: document.querySelector('#ac-sched').value.trim(),
        lat: document.querySelector('#ac-lat').value.trim(),
        lng: document.querySelector('#ac-lng').value.trim(),
        radius: document.querySelector('#ac-rad').value.trim()
      };
      const res = await apiRequest('/api/classes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.classItem) {
        state.classes.push(res.classItem);
        addClassForm.reset();
        renderAdminAll();
      }
    });
  }

  // Save Google Client ID
  const saveGoogleBtn = document.querySelector('#admin-save-google-btn');
  if (saveGoogleBtn) {
    saveGoogleBtn.addEventListener('click', async () => {
      const val = (googleInput ? googleInput.value : '').trim();
      await apiRequest('/api/config/google-client-id', {
        method: 'PUT',
        body: JSON.stringify({ googleClientId: val })
      });
      document.querySelector('#admin-google-status').textContent = 'Google OAuth Client ID saved.';
    });
  }

  renderAdminAll();
}
