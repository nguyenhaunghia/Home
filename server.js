const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// --- NHÚNG CÁC CONTROLLER ---
const { getAuthUrl, oauth2Callback, createMeetRoom } = require('./classroom/googleController');
const { recordLogin, recordLogout } = require('./classroom/attendanceController');
const { getUserProfile, getRooms, deleteRoomFromSheet, getSchoolList, getClassList, getStudentList } = require('./classroom/sheetController');

const app = express();

// --- CẤU HÌNH HỆ THỐNG ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'smart-school-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session tồn tại 1 ngày
}));
app.use(express.static(__dirname));
app.use('/classroom', express.static(path.join(__dirname, 'classroom')));





// === NHÓM 1: XÁC THỰC GOOGLE (AUTH) & SSO BRIDGE ===
app.get('/auth/google', getAuthUrl);
app.get('/oauth2callback', oauth2Callback);

// [CẬP NHẬT] API đón dữ liệu SSO từ Local/Session Storage của trang chủ
app.post('/api/auth/sync-session', (req, res) => {
    const { email } = req.body;
    if (email) {
        req.session.userEmail = email; // Tự động tạo session cho Classroom
        res.json({ success: true, message: 'SSO synced' });
    } else {
        res.status(400).json({ success: false, message: 'No email provided' });
    }
});

// === NHÓM 2: QUẢN LÝ PHÒNG HỌC & DASHBOARD (SHEETS) ===
app.get('/api/dashboard-data', async (req, res) => {
    if (!req.session.userEmail) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập lại!' });
    }
    
    try {
        const email = req.session.userEmail; 
        const profile = await getUserProfile(email);
        if (!profile) return res.status(403).json({ error: 'Email không tồn tại trong AccountProfile' });

        const rooms = await getRooms(profile);
        res.json({ profile, rooms });
    } catch (error) {
        console.error("Lỗi Dashboard:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/classes/create-meet', createMeetRoom); 

app.post('/api/delete-room', async (req, res) => {
    if (!req.session.userEmail) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const { romId } = req.body;

    try {
        const profile = await getUserProfile(req.session.userEmail);
        await deleteRoomFromSheet(romId, profile);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === NHÓM 3: CÁC API PHỤC VỤ MODAL (Trường, Lớp, Học sinh) ===
app.get('/api/options/schools', async (req, res) => {
    try {
        if (!req.session.userEmail) return res.status(401).json({ error: 'Chưa đăng nhập' });
        const data = await getSchoolList();
        res.json(data);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.get('/api/options/classes/:schoolId', async (req, res) => {
    try {
        if (!req.session.userEmail) return res.status(401).json({ error: 'Chưa đăng nhập' });
        const data = await getClassList();
        res.json(data);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.get('/api/options/students/:schoolId/:classId', async (req, res) => {
    try {
        if (!req.session.userEmail) return res.status(401).json({ error: 'Chưa đăng nhập' });
        const data = await getStudentList(req.params.schoolId, req.params.classId);
        res.json(data);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});


// === NHÓM 4: ĐIỂM DANH (ATTENDANCE) & ĐĂNG XUẤT ===
app.post('/api/attendance/login', recordLogin);
app.post('/api/attendance/logout', recordLogout);

app.get('/api/attendance/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Lỗi khi hủy Session:", err);
        res.clearCookie('connect.sid'); 
        res.redirect('/classroom/index.html'); 
    });
});

// --- KHỞI CHẠY ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server Smart School đang chạy: http://localhost:${PORT}`);
    console.log(`👉 Link Dashboard: http://localhost:${PORT}/classroom/index.html`);
});