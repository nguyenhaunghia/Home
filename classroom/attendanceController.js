// Khởi tạo một mảng tạm trong RAM để lưu điểm danh (Thực tế sau này sẽ lưu vào Database MySQL/MongoDB)
const attendanceLogs = {};

// 1. Hàm ghi nhận lúc học sinh VÀO LỚP
const recordLogin = (req, res) => {
    const { studentId, studentName } = req.body;
    const loginTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // Lưu thông tin vào bộ nhớ
    attendanceLogs[studentId] = { 
        name: studentName, 
        loginAt: loginTime, 
        logoutAt: "Đang trong lớp..." 
    };
    
    console.log(`🟢 [VÀO LỚP]: Học sinh ${studentName} (ID: ${studentId}) lúc ${loginTime}`);
    res.status(200).json({ success: true, message: "Đã điểm danh vào lớp" });
};

// 2. Hàm ghi nhận lúc học sinh THOÁT LỚP (Tắt tab)
const recordLogout = (req, res) => {
    // Lưu ý: sendBeacon gửi data dạng chuỗi thô, nên ta cần parse thủ công
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        try {
            const { studentId } = JSON.parse(body);
            const logoutTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            
            if (attendanceLogs[studentId]) {
                attendanceLogs[studentId].logoutAt = logoutTime;
                console.log(`🔴 [THOÁT LỚP]: Học sinh ${attendanceLogs[studentId].name} rời đi lúc ${logoutTime}`);
            }
            res.status(200).send('OK');
        } catch (error) {
            res.status(400).send('Lỗi xử lý dữ liệu thoát');
        }
    });
};

module.exports = { recordLogin, recordLogout };