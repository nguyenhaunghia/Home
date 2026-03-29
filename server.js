const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// [BỔ SUNG THƯ VIỆN ĐỌC FILE]
const fs = require('fs'); 

// --- [BẮT ĐẦU CỨU HỘ LOCALHOST: CHỐNG LỖI JWT SIGNATURE] ---
// Đọc trực tiếp file credentials gốc để không bị mất dấu xuống dòng như file .env
try {
    const credPath = path.join(__dirname, 'credentials.json');
    if (fs.existsSync(credPath)) {
        process.env.GOOGLE_CREDENTIALS = fs.readFileSync(credPath, 'utf8');
        console.log("🔑 [LOCAL] Đã nạp thành công chìa khóa trực tiếp từ file credentials.json gốc!");
    }
} catch (err) {
    console.log("⚠️ Đang chạy trên Render hoặc không tìm thấy file credentials.json cục bộ.");
}
// --- [KẾT THÚC CỨU HỘ LOCALHOST] ---

// --- NHÚNG CÁC CONTROLLER ---
const { getAuthUrl, oauth2Callback, createMeetRoom } = require('./classroom/googleController');
const { recordLogin, recordLogout } = require('./classroom/attendanceController');
const { getUserProfile, getRooms, deleteRoomFromSheet, getSchoolList, getClassList, getStudentList, getImagesByFolderId } = require('./classroom/sheetController');

const app = express();

// --- [QUAN TRỌNG NHẤT]: BỘ ĐỌC DỮ LIỆU (KÍNH LÚP) ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [NÂNG CẤP]: Cấu hình Trust Proxy để nhận diện HTTPS trên Render
app.set('trust proxy', 1); 

// CẤU HÌNH SESSION CHUẨN QUỐC TẾ (Sửa lỗi mất trí nhớ trên localhost)
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'smart-school-backup-key-2026',
    resave: false,
    saveUninitialized: false, // TUYỆT ĐỐI ĐỂ FALSE để tránh tràn bộ nhớ
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: isProduction, // Mạng thì True (HTTPS), Máy tính thì False (HTTP)
        httpOnly: true, // Chống hack cookie qua XSS
        sameSite: isProduction ? 'none' : 'lax', // CHÌA KHÓA Ở ĐÂY: Dưới máy tính dùng 'lax' để chuyển trang không bị mất vé
        path: '/' // Bắt buộc phải có để thẻ nhớ dùng được cho mọi thư mục
    }
}));

app.use(express.static(__dirname));
app.use('/classroom', express.static(path.join(__dirname, 'classroom')));

// === NHÓM 1: XÁC THỰC GOOGLE (AUTH) & SSO BRIDGE ===
app.get('/auth/google', getAuthUrl);
app.get('/oauth2callback', oauth2Callback);

// [CẬP NHẬT 2]: Ép máy chủ lưu Session ngay lập tức để trị dứt điểm lỗi SSO
app.post('/api/auth/sync-session', (req, res) => {
    // [ÁO GIÁP BẢO VỆ]: Thêm || {} để chống sập server nếu req.body bị rỗng
    const { email } = req.body || {}; 
    
    if (email) {
        req.session.userEmail = email; // Tự động tạo session cho Classroom
        
        // Buộc Session phải được ghi vào bộ nhớ trước khi phản hồi
        req.session.save((err) => {
            if (err) console.error("Lỗi khi lưu SSO Session:", err);
            res.json({ success: true, message: 'SSO synced' });
        });
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

// === [CẬP NHẬT 3]: API KÉO SLIDE HÌNH NỀN TỪ GOOGLE DRIVE ===
app.get('/api/options/drive-images/:folderId', async (req, res) => {
    try {
        // Lưu ý: Đảm bảo trong sheetController.js đã khai báo hàm này và cấp quyền scope Drive
        const data = await getImagesByFolderId(req.params.folderId);
        res.json({ success: true, data: data });
    } catch (err) { 
        console.error("Lỗi API kéo ảnh Drive:", err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// === NHÓM 4: ĐIỂM DANH (ATTENDANCE) & ĐĂNG XUẤT ===
app.post('/api/attendance/login', recordLogin);
app.post('/api/attendance/logout', recordLogout);

app.get('/api/attendance/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Lỗi khi hủy Session:", err);
        res.clearCookie('connect.sid'); 
        // [CẬP NHẬT 4]: Đăng xuất xong đẩy thẳng về trang chủ trung tâm
        res.redirect('/index.html'); 
    });
});

// --- KHỞI CHẠY ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server Smart School đang chạy: http://localhost:${PORT}`);
    console.log(`👉 Link Trang chủ gốc: http://localhost:${PORT}/index.html`);
    console.log(`👉 Link Classroom: http://localhost:${PORT}/classroom/index.html`);
});