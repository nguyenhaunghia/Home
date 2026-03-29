const { google } = require('googleapis');
require('dotenv').config();

const { getUserProfile, saveRoomToSheet } = require('./sheetController');

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

const getAuthUrl = (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        // [CẬP NHẬT] Đã xóa quyền Spreadsheets, bảo vệ sự riêng tư của Sheet Admin
        scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.send' 
        ]
    });
    res.redirect(url); 
};

const oauth2Callback = async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Đăng nhập thất bại!");

    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens; 
        
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        req.session.userEmail = userInfo.data.email; 
        
        res.redirect('/classroom/index.html');
    } catch (error) { res.status(500).send("Lỗi xác thực Google."); }
};

const createMeetRoom = async (req, res) => {
    if (!req.session.tokens || !req.session.userEmail) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn!" });
    }

    try {
        oauth2Client.setCredentials(req.session.tokens);
        
        const profile = await getUserProfile(req.session.userEmail);
        if (!profile) throw new Error("Tài khoản chưa được thiết lập trên hệ thống.");

        const { lessonName, schoolId, classId, studentList, studentEmails, startTime, endTime, description, note, isSendEmail } = req.body;

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
            summary: lessonName,       
            description: description,
            start: { dateTime: new Date(startTime).toISOString(), timeZone: 'Asia/Ho_Chi_Minh' },
            end: { dateTime: new Date(endTime).toISOString(), timeZone: 'Asia/Ho_Chi_Minh' },
            conferenceData: { createRequest: { requestId: `room-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } }
        };

        const response = await calendar.events.insert({ calendarId: 'primary', conferenceDataVersion: 1, resource: event });
        const meetUrl = response.data.hangoutLink;
        const romId = meetUrl.replace('https://meet.google.com/', '');

        const timeUpdate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const newRoomData = {
            RomID: romId, SchoolID: schoolId, ClassID: classId, ClassName: lessonName,  
            StudentIDList: studentList, Begin: startTime.replace('T', ' '), End: endTime.replace('T', ' '),
            Comment: description, Note: note, AccountUpdate: profile.Email, TimeUpdate: timeUpdate
        };

        await saveRoomToSheet(newRoomData); // Dùng Robot lưu ngầm

        if (isSendEmail && studentEmails && studentEmails.length > 0) {
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0f2fe; border-radius: 10px; background-color: #f8fafc;">
                    <h2 style="color: #1e3a8a;">Thông báo: Phòng học trực tuyến mới!</h2>
                    <p>Chào em, thầy/cô <b>${profile.FullName}</b> vừa tạo một phòng học trực tuyến mới trên hệ thống Smart School.</p>
                    <ul>
                        <li><b>Môn học:</b> ${lessonName}</li>
                        <li><b>Thời gian bắt đầu:</b> ${startTime.replace('T', ' ')}</li>
                        <li><b>Ghi chú:</b> ${description || 'Không có'}</li>
                    </ul>
                    <a href="${meetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #84cc16; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">👉 BẤM VÀO ĐÂY ĐỂ VÀO LỚP</a>
                </div>
            `;
            const makeEmail = (to, bcc, subject, html) => {
                const str = ["Content-Type: text/html; charset=utf-8", "MIME-Version: 1.0", `To: ${to}`, `Bcc: ${bcc}`, `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`, "", html].join("\n");
                return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            };

            const bccList = studentEmails.join(',');
            const rawEmail = makeEmail(profile.Email, bccList, `[Smart School] Lớp học ${lessonName} sắp bắt đầu!`, emailHtml);
            
            await gmail.users.messages.send({ userId: 'me', requestBody: { raw: rawEmail } });
        }

        res.status(200).json({ success: true, meetUrl: meetUrl });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAuthUrl, oauth2Callback, createMeetRoom, oauth2Client };