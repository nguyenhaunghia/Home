const { google } = require('googleapis');
const path = require('path');
require('dotenv').config(); // Đảm bảo nạp được các biến từ file .env

// ============================================================================
// [NÂNG CẤP ĐA NĂNG]: ĐỌC HỘ CHIẾU GOOGLE
// ============================================================================
let googleAuthOptions = {
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
    ]
};

// Kiểm tra: Nếu có biến môi trường (trên Render) thì ưu tiên dùng, nếu không thì dùng file (Local)
if (process.env.GOOGLE_CREDENTIALS) {
    googleAuthOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log("🚀 Smart School: Đang sử dụng Hộ chiếu từ Environment Variables.");
} else {
    googleAuthOptions.keyFile = path.join(__dirname, '../credentials.json');
    console.log("💻 Smart School: Đang sử dụng Hộ chiếu từ file credentials.json.");
}

const auth = new google.auth.GoogleAuth(googleAuthOptions);

// Gắn quyền Robot vào công cụ Sheets và Drive
const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// [CẢI TIẾN]: Lấy ID từ .env để bảo mật hơn, nếu không có mới dùng ID mặc định
const ACCOUNT_SHEET_ID = process.env.ACCOUNT_SHEET_ID || '1oqsmFmYoVpAa9iS8q10UdL6oYtChi6CSiF0zNMfGTmE';
const ROOM_SHEET_ID = process.env.ROOM_SHEET_ID || '1I-SC1lS4wxl6zcHxzzwPmJ8CCWX9eD9FHA6OhJey70M';

// ============================================================================
// 1. CÁC HÀM ĐỌC DỮ LIỆU CƠ BẢN
// ============================================================================
async function getSchoolMap() {
    try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SHEET_ID, range: 'School!A:Z' });
        const rows = res.data.values || [];
        if (rows.length < 2) return {};

        const headers = rows.shift();
        const idxId = headers.indexOf('SchoolID');
        const idxName = headers.indexOf('SchoolName');

        if (idxId === -1 || idxName === -1) return {};

        const schoolMap = {};
        rows.forEach(row => { if (row[idxId]) schoolMap[row[idxId]] = row[idxName] || row[idxId]; });
        return schoolMap;
    } catch (e) { return {}; }
}

async function getUserProfile(email) {
    try {
        const res = await sheets.spreadsheets.values.get({ 
            spreadsheetId: ACCOUNT_SHEET_ID, 
            range: 'AccountProfile!A:Z' 
        });
        const rows = res.data.values || [];
        if (rows.length < 1) return null;

        // Lấy dòng tiêu đề và chuẩn hóa (viết thường hết, xóa khoảng trắng)
        const headers = rows[0].map(h => h.trim().toLowerCase());
        
        const idxEmail = headers.indexOf('email');
        const idxUserID = headers.indexOf('userid');
        const idxFullName = headers.indexOf('fullname');
        const idxObject = headers.indexOf('object');
        const idxSchoolID = headers.indexOf('schoolid');
        const idxClassID = headers.indexOf('classid');

        if (idxEmail === -1) {
            console.error("🔥 LỖI: Không tìm thấy cột 'Email' trong Sheet!");
            return null;
        }

        // Tìm dòng chứa email (không phân biệt hoa thường)
        const userRow = rows.find(row => 
            row[idxEmail] && row[idxEmail].trim().toLowerCase() === email.trim().toLowerCase()
        );

        if (!userRow) {
            console.warn(`⚠️ CẢNH BÁO: Không tìm thấy email ${email} trong danh sách.`);
            return null;
        }

        return {
            UserID: userRow[idxUserID] || '',
            FullName: userRow[idxFullName] || '',
            Email: userRow[idxEmail] || '',
            Object: userRow[idxObject] || '',
            SchoolID: userRow[idxSchoolID] || '',
            ClassID: userRow[idxClassID] || ''
        };
    } catch (err) {
        console.error("❌ LỖI HỆ THỐNG (getUserProfile):", err.message);
        throw err; // Ném lỗi để Server in ra màn hình đen cho bạn xem
    }
}

// ============================================================================
// 2. LẤY DANH SÁCH PHÒNG
// ============================================================================
async function getRooms(profile) {
    const schoolMap = await getSchoolMap();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ROOM_SHEET_ID, range: 'RoomList!A:Z' });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows.shift();
    const idxRomID = headers.indexOf('RomID');
    const idxSchoolID = headers.indexOf('SchoolID');
    const idxClassID = headers.indexOf('ClassID');
    const idxClassName = headers.indexOf('ClassName'); 
    const idxStudentIDList = headers.indexOf('StudentIDList');
    const idxBegin = headers.indexOf('Begin');
    const idxEnd = headers.indexOf('End');
    const idxComment = headers.indexOf('Comment');
    const idxNote = headers.indexOf('Note');
    const idxAccountUpdate = headers.indexOf('AccountUpdate');
    const idxTimeUpdate = headers.indexOf('TimeUpdate');

    const isAdmin = profile.Email === 'nguyenhaunghia@gmail.com' || profile.Object === 'Admin';

    return rows.filter(row => {
        if (isAdmin) return true;
        return row[idxSchoolID] === profile.SchoolID; 
    }).map(row => {
        const rawSchoolID = row[idxSchoolID] || '';
        return {
            RomID: row[idxRomID] || '',
            SchoolID: rawSchoolID,
            SchoolName: schoolMap[rawSchoolID] || rawSchoolID, 
            ClassID: row[idxClassID] || '',
            ClassName: row[idxClassName] || '',
            StudentIDList: row[idxStudentIDList] || '',
            Begin: row[idxBegin] || '',
            End: row[idxEnd] || '',
            Comment: row[idxComment] || '',
            Note: row[idxNote] || '',
            AccountUpdate: row[idxAccountUpdate] || '',
            TimeUpdate: row[idxTimeUpdate] || ''
        };
    });
}

// ============================================================================
// 3. XÓA PHÒNG
// ============================================================================
async function deleteRoomFromSheet(romId, profile) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ROOM_SHEET_ID, range: 'RoomList!A:Z' });
    const rows = res.data.values || [];
    if (rows.length === 0) throw new Error("Sheet dữ liệu đang rỗng!");

    const headers = rows[0];
    const idxRomID = headers.indexOf('RomID');
    const idxAccountUpdate = headers.indexOf('AccountUpdate');
    const idxBegin = headers.indexOf('Begin');

    if (idxRomID === -1) throw new Error("Cột 'RomID' không tồn tại!");

    const rowIndex = rows.findIndex((row, i) => i > 0 && row[idxRomID] === romId);
    if (rowIndex === -1) throw new Error("Không tìm thấy phòng học này.");

    const isAdmin = profile.Email === 'nguyenhaunghia@gmail.com' || profile.Object === 'Admin';
    const isOwner = rows[rowIndex][idxAccountUpdate] === profile.Email;
    
    if (!isAdmin) {
        if (!isOwner) throw new Error("Bạn không có quyền xóa phòng học do người khác tạo!");
        const beginTimeStr = rows[rowIndex][idxBegin] || '';
        const beginTime = new Date(beginTimeStr.replace(' ', 'T')).getTime(); 
        const currentTime = new Date().getTime();
        if (currentTime >= beginTime) throw new Error("Không thể xóa phòng học đã hoặc đang diễn ra!");
    }

    // Lấy sheetId của tab 'RoomList' để xóa hàng chính xác
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: ROOM_SHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === 'RoomList');
    const sheetId = sheet ? sheet.properties.sheetId : 0;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: ROOM_SHEET_ID,
        resource: {
            requests: [{
                deleteDimension: { 
                    range: { 
                        sheetId: sheetId, 
                        dimension: 'ROWS', 
                        startIndex: rowIndex, 
                        endIndex: rowIndex + 1 
                    } 
                }
            }]
        }
    });
}

// ============================================================================
// 4. LƯU PHÒNG MỚI VÀO SHEET
// ============================================================================
async function saveRoomToSheet(roomData) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ROOM_SHEET_ID, range: 'RoomList!A1:Z1' });
    const headers = res.data.values ? res.data.values[0] : [];
    if (headers.length === 0) throw new Error("Sheet RoomList chưa có dòng tiêu đề!");

    const newRow = new Array(headers.length).fill('');
    headers.forEach((header, index) => {
        if (roomData[header] !== undefined) newRow[index] = roomData[header];
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: ROOM_SHEET_ID,
        range: 'RoomList!A:A',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [newRow] }
    });
}

// ============================================================================
// 5. CÁC HÀM PHỤC VỤ MODAL 
// ============================================================================
async function getSchoolList() {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SHEET_ID, range: 'School!A:Z' });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];
    
    const headers = rows.shift().map(h => h ? h.trim() : '');
    const idxId = headers.indexOf('SchoolID');
    const idxName = headers.indexOf('SchoolName');
    
    if (idxId === -1) throw new Error("Không tìm thấy cột SchoolID trong sheet School");
    return rows.map(row => ({ SchoolID: row[idxId], SchoolName: row[idxName] || row[idxId] })).filter(s => s.SchoolID);
}

async function getClassList() {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SHEET_ID, range: 'Class!A:Z' });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows.shift().map(h => h ? h.trim() : '');
    const idxClassId = headers.indexOf('ClassID');
    const idxClassName = headers.indexOf('ClassName');

    if (idxClassId === -1) throw new Error("Thiếu cột ClassID trong sheet Class");

    return rows.filter(row => row[idxClassId])
               .map(row => ({ ClassID: row[idxClassId], ClassName: row[idxClassName] || row[idxClassId] }));
}

async function getStudentList(schoolId, classId) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SHEET_ID, range: 'AccountProfile!A:Z' });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows.shift().map(h => h ? h.trim() : '');
    const idxUserId = headers.indexOf('UserID');
    const idxFullName = headers.indexOf('FullName');
    const idxEmail = headers.indexOf('Email');
    const idxObject = headers.indexOf('Object');
    const idxSchoolId = headers.indexOf('SchoolID');
    const idxClassId = headers.indexOf('ClassID');

    return rows.filter(row => {
        const isCorrectSchool = row[idxSchoolId] === schoolId;
        const isCorrectClass = row[idxClassId] === classId;
        const isStudent = (row[idxObject] === 'Học sinh' || row[idxObject] === 'Hoc sinh');
        return isCorrectSchool && isCorrectClass && isStudent;
    }).map(row => ({ 
        UserID: row[idxUserId], 
        FullName: row[idxFullName], 
        Email: row[idxEmail] 
    }));
}

// ============================================================================
// [BỔ SUNG QUAN TRỌNG]: HÀM LẤY ẢNH TỪ GOOGLE DRIVE
// ============================================================================
async function getImagesByFolderId(folderId) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name)',
            pageSize: 50
        });
        return res.data.files || [];
    } catch (err) {
        console.error("Lỗi getImagesByFolderId:", err.message);
        return [];
    }
}

module.exports = { 
    getUserProfile, 
    getRooms, 
    deleteRoomFromSheet, 
    saveRoomToSheet, 
    getSchoolList, 
    getClassList, 
    getStudentList,
    getImagesByFolderId // Xuất hàm mới ra cho server.js sử dụng
};