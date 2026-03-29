// --- ĐỊNH NGHĨA HEADER DÙNG CHUNG (BẢN ĐÃ FIX LỖI CHE MENU) ---
const APP_HEADER = `
<header id="dynamic-header" class="flex flex-col md:flex-row border-b border-blue-100 w-full items-stretch bg-white relative overflow-visible">
    
    <a href="/index.html" title="Trở về Trang chủ Smart School" class="w-full md:w-64 lg:w-72 flex-shrink-0 logo-box-tight cursor-pointer z-20 relative" style="text-decoration: none;">
        <img src="/assets/logo.png" alt="Smart School Logo" onerror="this.outerHTML='<i class=\\'fas fa-graduation-cap text-6xl text-cyan-600 mb-1\\'></i>'">            
    </a>

    <div class="flex-1 flex flex-col min-w-0 overflow-visible relative">
        <div id="classroom-panel" class="banner-gradient flex-1 min-h-[155px] flex flex-col items-center justify-center text-center p-4">
            <div class="title-3d-glow text-3xl md:text-5xl mb-1">SMART SCHOOL</div>
            <div class="text-white font-bold tracking-widest text-sm z-10" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">PHÂN HỆ CLASS ROOM</div>
        </div>

        <nav class="nav-container overflow-visible px-4 flex-1 flex items-center bg-white/95 relative z-50">
            <ul class="flex flex-wrap items-center w-full overflow-visible">
                
                <li class="dropdown-group">
                    <button><i class="fas fa-info-circle mr-2 text-gray-400"></i> Giới thiệu <i class="fas fa-chevron-down ml-1 text-[10px]"></i></button>
                    <div class="dropdown-menu">
                        <a href="/classroom/index.html" class="dropdown-item">Giới thiệu</a>
                        <a href="/classroom/help.html" class="dropdown-item">Hướng dẫn</a>
                    </div>
                </li>

                <li class="dropdown-group" id="menu-management" style="display: none;">
                    <button><i class="fas fa-cogs mr-2 text-gray-400"></i> Quản lý <i class="fas fa-chevron-down ml-1 text-[10px]"></i></button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item">Tài khoản</a>
                        <a href="#" class="dropdown-item">Phòng học</a>
                        <a href="#" class="dropdown-item">Lịch dạy học</a>
                    </div>
                </li>

                <li class="dropdown-group" id="menu-teacher" style="display: none;">
                    <button><i class="fas fa-chalkboard-teacher mr-2 text-cyan-600"></i> Giáo viên <i class="fas fa-chevron-down ml-1 text-[10px]"></i></button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item">Thời khóa biểu</a>
                        <a href="/classroom/create-room.html" class="dropdown-item font-bold text-cyan-700">Danh sách phòng học</a>
                    </div>
                </li>

                <li class="dropdown-group" id="menu-student" style="display: none;">
                    <button><i class="fas fa-user-graduate mr-2 text-green-600"></i> Học sinh <i class="fas fa-chevron-down ml-1 text-[10px]"></i></button>
                    <div class="dropdown-menu">
                        <a href="/classroom/student.html" class="dropdown-item">Thời khóa biểu</a>
                        <a href="#" class="dropdown-item">Danh sách bài tập</a>
                    </div>
                </li>
                
                <li class="ml-auto pl-4 border-l border-blue-100" id="menu-create-room" style="display: none;">
                    <a href="/classroom/create-room.html" id="btnCreateGlobal" class="btn-accent-lime text-white px-4 py-2 my-1 rounded-lg text-sm shadow-sm hover:shadow-md transition-all flex items-center">
                        <i class="fas fa-plus-circle mr-2"></i> Khởi tạo
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <div id="auth-container" class="w-full md:w-64 lg:w-72 flex-shrink-0 bg-slate-50 border-l border-blue-100 p-4 flex flex-col items-center justify-center min-h-[120px] z-20 relative">
        <div class="text-gray-400 text-sm font-['Roboto_Mono']"><i class="fas fa-circle-notch fa-spin"></i> Đang tải...</div>
    </div>
</header>
`;

// --- ĐỊNH NGHĨA FOOTER DÙNG CHUNG ---
const APP_FOOTER = `
<footer class="bg-slate-50 border-t border-slate-200 p-4 text-center text-sm text-gray-500 w-full mt-auto">
    <p><strong>Kiến tạo giải pháp công nghệ giáo dục đột phá.</strong> N's SoftWave tự hào phát triển hệ sinh thái học tập thông minh.</p>
    <p class="mt-1 font-['Roboto_Mono'] text-xs">© 2026 N's SoftWave. Phát triển bởi: nhn.softwave@gmail.com</p>
</footer>
`;

// --- LOGIC SLIDE HÌNH NỀN TỪ GOOGLE DRIVE ---
async function startPanelSlideshow() {
    const panel = document.getElementById('classroom-panel');
    const FOLDER_ID = '1IeRyy6OQidUJHH7aZ2vYimuce6v5mdXN';
    
    if (!panel) return;

    try {
        const res = await fetch(`/api/options/drive-images/${FOLDER_ID}`);
        const json = await res.json();

        if (json.success && json.data && json.data.length > 0) {
            let images = json.data;
            let currentIndex = 0;

            const changeBg = () => {
                const imgId = images[currentIndex].id;
                // Gọi API thumbnail chất lượng cao (sz=w1920)
                const imgUrl = `https://drive.google.com/thumbnail?id=${imgId}&sz=w1920`;
                
                // Kỹ thuật Preload (tải ngầm trước khi đổi nền) giúp chống nhấp nháy đen
                const tempImg = new Image();
                tempImg.src = imgUrl;
                tempImg.onload = () => {
                    panel.style.backgroundImage = `url('${imgUrl}')`;
                    currentIndex = (currentIndex + 1) % images.length;
                };
            };

            changeBg(); 
            setInterval(changeBg, 12000); // Tự động luân phiên sau mỗi 12 giây
        }
    } catch (e) {
        console.log("Không thể tải slide ảnh nền Classroom:", e);
    }
}

// --- HÀM KHỞI TẠO HỆ THỐNG ---
async function initSmartSchool(currentPage) {
    const headerEl = document.getElementById('smart-header');
    if(headerEl) headerEl.innerHTML = APP_HEADER;
    
    const footerEl = document.getElementById('smart-footer');
    if(footerEl) footerEl.innerHTML = APP_FOOTER;

    const authContainer = document.getElementById('auth-container');

    // ========================================================
    // BỘ QUÉT SSO: ĐỒNG BỘ ĐĂNG NHẬP TỪ TRANG CHỦ (HOME)
    // ========================================================
    try {
        const homeUserDataStr = localStorage.getItem('userData');
        console.log("[SSO] BƯỚC 1 - Dữ liệu LocalStorage:", homeUserDataStr ? "Đã tìm thấy" : "Trống rỗng");

        if (homeUserDataStr) {
            const homeUserData = JSON.parse(homeUserDataStr);
            const userEmail = homeUserData.account || homeUserData.Email || homeUserData.email; 
            console.log("[SSO] BƯỚC 2 - Email đăng nhập:", userEmail);
            
            if (userEmail) {
                // [ĐIỂM CHỐT LỖI]: Phải có credentials: 'same-origin' để ép lưu Cookie
                const syncRes = await fetch('/api/auth/sync-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail }),
                    credentials: 'same-origin' 
                });
                const syncData = await syncRes.json();
                console.log("[SSO] BƯỚC 3 - Kết quả đồng bộ Server:", syncData);
            }
        }
    } catch(err) {
        console.log("[SSO] Sync bypass...", err);
    }
    // ========================================================

    try {
        // [ĐIỂM CHỐT LỖI]: Phải mang Cookie (credentials) đi hỏi Dashboard mới được cho vào
        const res = await fetch('/api/dashboard-data?t=' + new Date().getTime(), {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await res.json();
        console.log("[SSO] BƯỚC 4 - Dữ liệu tải về từ Server:", data);

        // Xử lý CHƯA đăng nhập
        if (data.error) {
            if (currentPage === 'create-room' || currentPage === 'student') {
                window.location.href = '/index.html'; 
                return null;
            }
            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="w-full text-center">
                        <p class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Chưa đăng nhập</p>
                        <a href="/index.html" class="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-200 hover:border-cyan-400 text-blue-800 font-bold py-2 px-3 rounded-lg shadow-sm transition-all hover:shadow-md group text-sm">
                            <i class="fas fa-sign-in-alt text-cyan-600 group-hover:scale-110 transition-transform"></i>
                            Đăng nhập hệ thống
                        </a>
                    </div>
                `;
            }
            return null;
        }

        const p = data.profile;

        try {
            const schoolRes = await fetch('/api/options/schools');
            const schools = await schoolRes.json();
            const matchedSchool = schools.find(s => s.SchoolID === p.SchoolID);
            if (matchedSchool) p.SchoolName = matchedSchool.SchoolName; 
        } catch(e) { console.log("Không tải được danh sách trường để ánh xạ"); }

        if (authContainer) {
            authContainer.innerHTML = `
                <div class="w-full flex flex-col items-center relative">
                    <button onclick="localStorage.removeItem('userData'); localStorage.removeItem('isLoggedIn'); window.location.href='/api/attendance/logout'" title="Đăng xuất an toàn" class="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white border border-red-100 transition-all shadow-sm">
                        <i class="fas fa-power-off text-sm"></i>
                    </button>
                    <div class="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xl font-black mb-2 shadow-sm border-2 border-white ring-2 ring-blue-50">
                        ${p.FullName.charAt(0).toUpperCase()}
                    </div>
                    <div class="font-bold text-blue-950 text-center leading-tight text-sm px-4 truncate w-full" title="${p.FullName}">${p.FullName}</div>
                    <div class="text-[10px] font-bold text-cyan-700 mt-1.5 flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 uppercase tracking-wider">
                        <i class="fas ${p.Object === 'Giáo viên' ? 'fa-chalkboard-teacher' : 'fa-user-graduate'}"></i> ${p.Object}
                    </div>
                    <div class="text-[11px] text-gray-500 font-medium mt-2 text-center w-full px-2 flex justify-center items-center gap-1.5">
                        <i class="fas fa-school text-gray-400"></i>
                        <span class="truncate" title="${p.SchoolName || p.SchoolID || 'Admin Hệ thống'}">${p.SchoolName || p.SchoolID || 'Admin Hệ thống'}</span>
                    </div>
                </div>
            `;
        }

        const isTeacherOrAdmin = p.Object === 'Giáo viên' || p.Object === 'Admin' || p.Email === 'nguyenhaunghia@gmail.com';
        const isStudentOrAdmin = p.Object === 'Học sinh' || p.Object === 'Admin' || p.Email === 'nguyenhaunghia@gmail.com';

        if (isTeacherOrAdmin) {
            document.getElementById('menu-management').style.display = 'inline-block';
            document.getElementById('menu-teacher').style.display = 'inline-block';
            if (currentPage === 'create-room') document.getElementById('menu-create-room').style.display = 'inline-block';
        }
        if (isStudentOrAdmin) {
            document.getElementById('menu-student').style.display = 'inline-block';
        }

        const btnCreateGlobal = document.getElementById('btnCreateGlobal');
        if (btnCreateGlobal && currentPage === 'create-room') {
            btnCreateGlobal.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openCreateRoomModal === 'function') openCreateRoomModal();
            });
        }

        // [KÍCH HOẠT]: Gọi hàm chạy Slide ảnh nền sau khi đã xác thực xong
        startPanelSlideshow();

        return data; 
    } catch(e) {
        if(authContainer) authContainer.innerHTML = `<p class="text-red-500 font-bold text-sm"><i class="fas fa-exclamation-triangle"></i> Lỗi kết nối Server</p>`;
        return null;
    }
}