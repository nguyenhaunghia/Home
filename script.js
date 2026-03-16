// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
const ADMIN_EMAIL = 'nguyenhaunghia@gmail.com'; 
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyRYVaA8nrL6_YDj-F9Gk1Sj6wT5Gcyhr2IbXhGiD9PQD-WouO9rj30dk0SMge5nTs4bA/exec';

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    const userData = checkAuthAndRenderUI();
    initCanvas();
    animateCanvas();
    loadDataByPrivilege(userData);
});




// --- HỆ THỐNG TOAST THÔNG BÁO ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `tech-toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
    container.appendChild(toast);

    // Kích hoạt hiệu ứng trượt vào
    setTimeout(() => toast.classList.add('show'), 10);

    // Tự động xóa sau 4 giây
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}




// --- GHI LOG HOẠT ĐỘNG ---
function logActivity(uid, nickname, action) {
    if (!WEB_APP_URL || WEB_APP_URL.includes('DÁN_URL')) return;
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ uid: uid, nickname: nickname, action: action })
    }).catch(err => console.log('Log Error:', err));
}

// --- AUTH & UI LOGIC ---
function checkAuthAndRenderUI() {
    if (!window.location.href.includes('login.html')) {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userDataString = sessionStorage.getItem('userData');
        
        if (isLoggedIn !== 'true' || !userDataString) {
            renderUserProfile(null); 
            return null;
        }

        const userData = JSON.parse(userDataString);
        renderUserProfile(userData); 
        return userData;
    }
    return null;
}

function renderUserProfile(user) {
    const container = document.getElementById('user-profile-container');
    if (container) {
        if (user) {
            const avatarSrc = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
            const userRole = user.object ? String(user.object).toUpperCase() : 'THÀNH VIÊN';
            
            container.innerHTML = `
                <div class="tech-user-card">
                    <div class="avatar-crystal-ring" onclick="openProfileModal()" style="cursor:pointer;" title="Cập nhật thông tin">
                        <img src="${avatarSrc}" class="user-avatar" alt="Avatar">
                    </div>
                    <div class="user-info" onclick="openProfileModal()" style="cursor:pointer;" title="Cập nhật thông tin">
                        <div class="user-role"><i class="fas fa-shield-alt"></i> ${userRole}</div>
                        <div class="user-name">${user.name}</div>
                    </div>
                    <div class="logout-btn-wrapper" onclick="logout()" title="Ngắt kết nối hệ thống">
                        <i class="fas fa-power-off"></i>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="tech-login-btn" onclick="window.location.href='login.html'" title="Kết nối vào hệ thống">
                    <i class="fas fa-user-astronaut"></i>
                    <span>ĐĂNG NHẬP</span>
                </div>
            `; 
        }
    }
}

function logout() {
    const userDataString = sessionStorage.getItem('userData');
    if (userDataString) {
        const user = JSON.parse(userDataString);
        logActivity(user.uid || 'Khách', user.nickname || user.name, 'Đăng xuất');
    }
    sessionStorage.clear();
    setTimeout(() => { window.location.href = 'index.html'; }, 300);
}

// --- DATA LOADING LOGIC ---
async function loadDataByPrivilege(user) {
    let loadNHN = false; let loadHocSinh = false;

    if (user) {
        if (user.account && String(user.account).toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            loadNHN = true; loadHocSinh = true; 
        } 
        if (user.object) {
            const objStr = String(user.object).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (objStr.includes('hoc sinh')) loadHocSinh = true;
        }
    }

    const [nhnData, csdlData, hocSinhData] = await Promise.all([
        loadNHN ? fetchSheetData('NHN') : Promise.resolve([]),
        fetchSheetData('CSDL'), 
        loadHocSinh ? fetchSheetData('Hoc_Sinh') : Promise.resolve([])
    ]);

    let finalCards = [];
    if (nhnData && nhnData.length > 0) finalCards = [...finalCards, ...nhnData];
    if (csdlData && csdlData.length > 0) finalCards = [...finalCards, ...csdlData];
    if (hocSinhData && hocSinhData.length > 0) finalCards = [...finalCards, ...hocSinhData];

    renderDashboard(finalCards);
}

// --- GOOGLE SHEET FETCHING ---
async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheetName}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        return parseData(json);
    } catch (error) { return []; }
}

// --- PARSE DATA ---
function parseData(json) {
    let colMap = {}; let startRow = 0;
    const cleanKey = (str) => str ? String(str).trim().toLowerCase() : '';
    
    const hasLabels = json.table.cols && json.table.cols.some(c => c && c.label);
    if (hasLabels) {
        json.table.cols.forEach((col, idx) => { if (col && col.label) colMap[cleanKey(col.label)] = idx; });
    } else if (json.table.rows && json.table.rows.length > 0) {
        json.table.rows[0].c.forEach((cell, idx) => { if (cell && cell.v) colMap[cleanKey(cell.v)] = idx; });
        startRow = 1;
    }

    const getVal = (row, colName, defaultVal = '') => {
        const idx = colMap[cleanKey(colName)];
        if (idx !== undefined && row.c[idx]) {
            const cell = row.c[idx];
            return cell.v !== null ? cell.v : (cell.f || defaultVal);
        }
        return defaultVal;
    };

    const cards = []; let currentCard = null; let currentL1 = null; let currentL2 = null; let currentL3 = null; let currentL4 = null;

    for (let i = startRow; i < json.table.rows.length; i++) {
        const row = json.table.rows[i];
        if (!row || !row.c) continue;

        const levelRaw = getVal(row, 'Level', null);
        if (levelRaw === null && !getVal(row, 'Label')) continue;

        const level = levelRaw !== null ? Number(levelRaw) : 0;
        const icon = getVal(row, 'Icon', 'fas fa-cube');
        let color = getVal(row, 'Color', '#22d3ee');
        if (color === '#000000') color = '#e2e8f0';
        
        const label = getVal(row, 'Label', 'Undefined');
        const link = getVal(row, 'Link', '#');
        const note = getVal(row, 'Note', '');
        const item = { level, icon, color, label, link, note, children: [] };

        if (level === 0) { currentCard = item; cards.push(currentCard); currentL1 = null; currentL2 = null; currentL3 = null; currentL4 = null; } 
        else if (level === 1) { if (currentCard) { currentL1 = item; currentCard.children.push(currentL1); currentL2 = null; currentL3 = null; currentL4 = null; } } 
        else if (level === 2) { if (currentL1) { currentL2 = item; currentL1.children.push(currentL2); currentL3 = null; currentL4 = null; } } 
        else if (level === 3) { if (currentL2) { currentL3 = item; currentL2.children.push(currentL3); currentL4 = null; } }
        else if (level === 4) { if (currentL3) { currentL4 = item; currentL3.children.push(currentL4); } }
        else if (level === 5) { if (currentL4) { currentL4.children.push(item); } }
    }
    return cards;
}

// --- RENDER ---
function renderDashboard(cards) {
    const grid = document.getElementById('dynamic-grid');
    grid.innerHTML = '';
    if (cards.length === 0) { grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#94a3b8; font-family:\'Roboto Mono\'">NO DATA AVAILABLE</div>'; return; }

    cards.forEach((card, index) => {
        const col = document.createElement('div');
        col.className = 'edu-col';
        col.style.animationDelay = `${index * 0.05}s`;

        const cardColor = card.color;
        const cardHtml = document.createElement('div');
        cardHtml.className = 'edu-card';
        cardHtml.style.borderTop = `3px solid ${cardColor}`;

        const headerHtml = `
            <div class="card-header-block">
                <div class="edu-icon-box" style="color:${cardColor}; border-color:${cardColor}50;">
                    <i class="${card.icon}"></i>
                </div>
                <h3 class="edu-title">${card.label}</h3>
            </div>
        `;

        const menuContainer = document.createElement('div');
        menuContainer.className = 'edu-menu';
        
        if (card.children && card.children.length > 0) { card.children.forEach(child => menuContainer.appendChild(createMenuItem(child))); } 
        else { menuContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Coming Soon</div>`; }

        cardHtml.innerHTML = headerHtml;
        cardHtml.appendChild(menuContainer);
        col.appendChild(cardHtml);
        grid.appendChild(col);
    });
}

function createMenuItem(item) {
    const hasChildren = item.children && item.children.length > 0;
    const isLevel1 = item.level === 1;
    let onClickAttr = '';
    
    if (hasChildren) onClickAttr = 'onclick="toggleSub(this)"';
    else if (item.link && item.link.length > 5) onClickAttr = `onclick="window.open('${item.link}', '_blank')"`;

    if (isLevel1) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="edu-menu-item" ${onClickAttr} title="${item.note || ''}">
                <div class="menu-left">
                    <i class="${item.icon}" style="color: ${item.color}; width:20px; text-align:center; font-size:0.9rem;"></i>
                    <span>${item.label}</span>
                </div>
                ${hasChildren ? '<i class="fas fa-chevron-down rotate-icon"></i>' : ''}
            </div>
        `;
        if (hasChildren) {
            const subDiv = document.createElement('div');
            subDiv.className = 'submenu';
            item.children.forEach(c => subDiv.appendChild(createMenuItem(c)));
            div.appendChild(subDiv);
        }
        return div;
    } 
    else {
        const iconHtml = `<i class="${item.icon}" style="color:${item.color}; font-size:0.75rem; width:18px; text-align:center; margin-right:4px;"></i>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="submenu-item" ${onClickAttr} title="${item.note || ''}">
                <span style="display:flex; align-items:center; gap:6px;">${iconHtml} ${item.label}</span>
                 ${hasChildren ? '<i class="fas fa-chevron-down rotate-icon"></i>' : ''}
            </div>
        `;
        if (hasChildren) {
            const subSubDiv = document.createElement('div');
            subSubDiv.className = 'submenu';
            item.children.forEach(c => subSubDiv.appendChild(createMenuItem(c)));
            wrapper.appendChild(subSubDiv);
        }
        return wrapper;
    }
}

function toggleSub(el) {
    let sub = el.nextElementSibling;
    if (!sub) sub = el.parentElement.querySelector('.submenu');
    const icon = el.querySelector('.rotate-icon');
    if (sub && sub.classList.contains('submenu')) {
        sub.classList.toggle('active');
        if (icon) icon.classList.toggle('active');
    }
}

// --- CANVAS ---
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    const count = Math.floor(width / 9);
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width, y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
            size: Math.random() * 1.8, alpha: Math.random()
        });
    }
}
function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha * 0.6})`;
        ctx.fill();
    }
    requestAnimationFrame(animateCanvas);
}
window.addEventListener('resize', initCanvas);

// =================================================================
// HỆ THỐNG MODAL CẬP NHẬT THÔNG TIN TÀI KHOẢN
// =================================================================
function injectModalHTML() {
    if(document.getElementById('profile-modal')) return;
    const modalHTML = `
        <div id="profile-modal" class="tech-modal-overlay">
            <div class="tech-modal-content">
                <div class="tech-modal-header">
                    <h3><i class="fas fa-user-astronaut"></i> CẬP NHẬT THÔNG TIN TÀI KHOẢN NGƯỜI DÙNG</h3>
                    <i class="fas fa-times close-modal" onclick="closeProfileModal()"></i>
                </div>
                <div class="tech-modal-body" id="profile-modal-body">
                    <div style="text-align:center; color: var(--primary-neon);"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>
                </div>
                <div class="modal-footer-btn">
                    <button class="btn-save-modal" onclick="saveProfileModal()" id="btn-save-profile" style="display:none;">CẬP NHẬT</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openProfileModal() {
    injectModalHTML();
    const modal = document.getElementById('profile-modal');
    modal.classList.add('active');
    
    const userStr = sessionStorage.getItem('userData');
    if(!userStr) return;
    const user = JSON.parse(userStr);
    
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getUserProfile', uid: user.uid })
    })
    .then(res => res.json())
    .then(json => {
        if(json.success) renderProfileForm(json.data);
        else document.getElementById('profile-modal-body').innerHTML = `<div style="color:#f87171;">Lỗi: ${json.error}</div>`;
    })
    .catch(err => {
        document.getElementById('profile-modal-body').innerHTML = `<div style="color:#f87171;">Lỗi kết nối máy chủ!</div>`;
    });
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if(modal) modal.classList.remove('active');
}

function toggleModalPwd(inputId, iconEl) {
    const inp = document.getElementById(inputId);
    if(inp.type === 'password') { inp.type = 'text'; iconEl.classList.remove('fa-eye'); iconEl.classList.add('fa-eye-slash'); } 
    else { inp.type = 'password'; iconEl.classList.remove('fa-eye-slash'); iconEl.classList.add('fa-eye'); }
}


// --- VẼ FORM VỚI BỐ CỤC MỚI TRÁI PHẢI ---
function renderProfileForm(data) {
    const body = document.getElementById('profile-modal-body');
    const avatarSrc = data.Avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.FullName)}`;
    
    const formHtml = `
        <div class="modal-layout">
            <div class="modal-left-col">
                <div class="avatar-preview-box">
                    <img id="upd-avatar-img" src="${avatarSrc}">
                </div>
                <input type="file" id="upd-avatar-file" style="display:none" accept="image/png, image/jpeg, image/gif">
                <button class="btn-change-avatar" id="btn-trigger-upload" onclick="document.getElementById('upd-avatar-file').click()"><i class="fas fa-camera"></i></button>
            </div>

            <div class="modal-right-col">
                <input type="hidden" id="upd-uid" value="${data.uid}">
                <input type="hidden" id="upd-avatar-base64" value="">
                <input type="hidden" id="upd-avatar-old" value="${data.Avatar || ''}">

                <div class="form-grid-2">
                    <div class="form-group-modal"><label>HỌ VÀ TÊN</label><input type="text" id="upd-fullname" value="${data.FullName}"></div>
                    <div class="form-group-modal"><label>NICKNAME</label><input type="text" id="upd-nickname" value="${data.NickName}"></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group-modal"><label>EMAIL LIÊN HỆ</label><input type="email" id="upd-email" value="${data.Email || ''}"></div>
                    <div class="form-group-modal"><label>ĐIỆN THOẠI</label><input type="text" id="upd-phone" value="${data.Phone || ''}"></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group-modal"><label>NGÀY SINH</label><input type="text" id="upd-birthday" placeholder="DD/MM/YYYY" value="${data.BirthDay}"></div>
                    <div class="form-group-modal">
                        <label>GIỚI TÍNH</label>
                        <select id="upd-gender">
                            <option value="Nam" ${data.Gender==='Nam'?'selected':''}>Nam</option>
                            <option value="Nữ" ${data.Gender==='Nữ'?'selected':''}>Nữ</option>
                            <option value="Khác" ${data.Gender==='Khác'?'selected':''}>Khác</option>
                        </select>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group-modal"><label>TRƯỜNG HỌC</label><input type="text" id="upd-school" value="${data.SchoolName || ''}"></div>
                    <div class="form-group-modal"><label>LỚP</label><input type="text" id="upd-class" value="${data.ClassName || ''}"></div>
                </div>
                <div class="form-group-modal" style="margin-bottom:15px;"><label>ĐỊA CHỈ</label><input type="text" id="upd-address" value="${data.Address || ''}"></div>
                
                <div class="form-grid-2">
                    <div class="form-group-modal pos-relative">
                        <label>ĐỔI MẬT KHẨU</label>
                        <input type="password" id="upd-password" placeholder="Bỏ trống nếu không đổi" style="padding-right:35px;">
                        <i class="fas fa-eye modal-pwd-toggle" onclick="toggleModalPwd('upd-password', this)"></i>
                    </div>
                    <div class="form-group-modal pos-relative">
                        <label>XÁC NHẬN MẬT KHẨU</label>
                        <input type="password" id="upd-password-confirm" placeholder="Nhập lại mật khẩu mới" style="padding-right:35px;">
                        <i class="fas fa-eye modal-pwd-toggle" onclick="toggleModalPwd('upd-password-confirm', this)"></i>
                    </div>
                </div>
            </div>
        </div>
        <div id="modal-msg" style="margin-top: 15px; font-size: 0.85rem; font-family:'Roboto Mono'; text-align:center;"></div>
    `;
    body.innerHTML = formHtml;
    document.getElementById('btn-save-profile').style.display = 'block';

    // XỬ LÝ ẢNH & BÁO HIỆU
    document.getElementById('upd-avatar-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(!file) return;

        // Thay vì alert, gọi showToast
        if(file.size > 2.5 * 1024 * 1024) { 
            showToast('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2.5MB!', 'warning');
            return; 
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const MAX_WIDTH = 300; const MAX_HEIGHT = 300;
                let width = img.width; let height = img.height;
                if (width > height && width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } 
                else if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }

                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('upd-avatar-img').src = dataUrl; 
                document.getElementById('upd-avatar-base64').value = dataUrl; 
                
                const btn = document.getElementById('btn-trigger-upload');
                btn.innerHTML = '<i class="fas fa-check-circle"></i>';
                btn.style.background = '#4ade80';
                btn.style.color = '#000';
            }
            img.src = evt.target.result;
        }
        reader.readAsDataURL(file);
    });
}

// --- GỬI DỮ LIỆU & BÁO TOAST ---
async function saveProfileModal() {
    const btn = document.getElementById('btn-save-profile');
    const msg = document.getElementById('modal-msg');
    
    const pwd = document.getElementById('upd-password').value;
    const pwdConf = document.getElementById('upd-password-confirm').value;
    
    if (pwd !== '' && pwd !== pwdConf) { 
        showToast("Mật khẩu xác nhận không khớp!", "warning"); 
        return; 
    }
    
    const profileData = {
        uid: document.getElementById('upd-uid').value,
        FullName: document.getElementById('upd-fullname').value,
        NickName: document.getElementById('upd-nickname').value,
        Email: document.getElementById('upd-email').value,
        BirthDay: document.getElementById('upd-birthday').value,
        Gender: document.getElementById('upd-gender').value,
        Phone: document.getElementById('upd-phone').value,
        Address: document.getElementById('upd-address').value,
        SchoolName: document.getElementById('upd-school').value,
        ClassName: document.getElementById('upd-class').value,
        Avatar: document.getElementById('upd-avatar-old').value, 
        avatarBase64: document.getElementById('upd-avatar-base64').value, 
        Password: pwd,
        AccountUpdate: JSON.parse(sessionStorage.getItem('userData')).account || 'Unknown'
    };

    try {
        btn.disabled = true; btn.innerText = "ĐANG TẢI LÊN...";
        msg.style.color = "var(--primary-neon)"; msg.innerText = "Hệ thống đang đồng bộ dữ liệu...";

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateUserProfile', profileData: profileData })
        });

        const rawText = await response.text();

        if (rawText.toLowerCase().includes("<!doctype html>") || rawText.toLowerCase().includes("<html")) {
            showToast("Lỗi phân quyền hệ thống. Máy chủ từ chối kết nối.", "error");
            throw new Error("Lỗi HTML");
        }

        let json;
        try { json = JSON.parse(rawText); } 
        catch (parseErr) {
            showToast("Dữ liệu phản hồi bị lỗi định dạng.", "error");
            throw new Error("Lỗi Parse JSON");
        }

        if (json.success) {
            msg.style.color = "#4ade80"; msg.innerText = "Cập nhật thành công!";
            showToast("Hồ sơ đã được cập nhật thành công!", "success");
            
            let userSession = JSON.parse(sessionStorage.getItem('userData'));
            userSession.name = profileData.FullName;
            userSession.nickname = profileData.NickName;
            if(json.newAvatar) userSession.avatar = json.newAvatar; 
            sessionStorage.setItem('userData', JSON.stringify(userSession));
            
            renderUserProfile(userSession);
            logActivity(profileData.uid, profileData.NickName, 'Cập nhật Profile');
            setTimeout(closeProfileModal, 1500);
        } else {
            showToast(json.error, "error");
            throw new Error(json.error);
        }

    } catch (err) {
        msg.style.color = "#f87171"; msg.innerText = ""; // Xóa chữ chờ
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
            showToast("Lỗi kết nối mạng. Vui lòng thử lại sau!", "error");
        }
    } finally {
        btn.disabled = false; btn.innerText = "CẬP NHẬT";
    }
}

// ==========================================
// HỆ THỐNG FETCH QUẢNG CÁO TỪ GOOGLE SHEETS (FIX ẢNH GOOGLE DRIVE & FALLBACK)
// ==========================================
async function loadAffiliateAds() {
    const sheetId = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
    const sheetName = 'Advertisement';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

    try {
        const response = await fetch(url);
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);

        let headers = data.table.cols.map(c => c.label ? c.label.toLowerCase().trim() : '');
        let dataRows = data.table.rows;

        // Xử lý dòng tiêu đề
        if (!headers.includes('title') && dataRows.length > 0) {
            headers = dataRows[0].c.map(cell => cell && cell.v ? String(cell.v).toLowerCase().trim() : '');
            dataRows.shift();
        }

        // Dò tìm vị trí cột
        const idxField   = headers.findIndex(h => h.includes('field'));
        const idxAvatar  = headers.findIndex(h => h.includes('avatar'));
        const idxTitle   = headers.findIndex(h => h.includes('title'));
        const idxLink    = headers.findIndex(h => h.includes('link'));
        const idxComment = headers.findIndex(h => h.includes('comment') || h.includes('note')); 
        const idxEmbed   = headers.findIndex(h => h.includes('embed') || h.includes('code'));

        if (idxTitle === -1) throw new Error("Thiếu cột 'Title'");

        // Rút trích dữ liệu
        let adsList = dataRows.map(row => {
            const getVal = (index) => (index !== -1 && row.c[index] && row.c[index].v !== null) ? String(row.c[index].v) : '';
            return {
                field:   getVal(idxField),
                avatar:  getVal(idxAvatar),
                title:   getVal(idxTitle),
                link:    getVal(idxLink) || '#',
                comment: getVal(idxComment),
                embed:   getVal(idxEmbed)
            };
        });

        // Lọc thẻ trống & Xáo trộn ngẫu nhiên
        adsList = adsList.filter(ad => ad.title.trim() !== '');
        adsList = adsList.sort(() => 0.5 - Math.random());

        renderAffiliateAds(adsList);

    } catch (error) {
        console.error('Lỗi tải dữ liệu quảng cáo:', error);
    }
}

function getAdIcon(field) {
    const f = field.toLowerCase();
    if (f.includes('lập trình') || f.includes('code')) return 'fa-laptop-code';
    if (f.includes('toán') || f.includes('math')) return 'fa-square-root-variable';
    if (f.includes('ngoại ngữ') || f.includes('tiếng')) return 'fa-language';
    if (f.includes('kỹ năng') || f.includes('skill')) return 'fa-brain';
    if (f.includes('sách') || f.includes('book')) return 'fa-book-open';
    return 'fa-rocket'; 
}

// Hàm "Phép thuật": Vượt rào bảo mật của Google Drive để nhúng ảnh
function getDirectImageUrl(url) {
    if (!url) return '';
    url = url.trim();
    // Bắt ID của file Google Drive (chuỗi dài >= 25 ký tự)
    let match = url.match(/[-\w]{25,}/); 
    if (url.includes('drive.google.com') && match) {
        // Sử dụng Server lh3.googleusercontent.com để render ảnh trực tiếp
        return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url; // Trả lại bình thường nếu không phải link Drive
}

function renderAffiliateAds(ads) {
    const container = document.getElementById('dynamic-aff-container');
    container.innerHTML = ''; 

    ads.forEach(ad => {
        const iconClass = getAdIcon(ad.field);
        
        // --- XỬ LÝ CỘT TRÁI (TỈ LỆ 1: Avatar hoặc Icon) ---
        let leftColHtml = '';
        if (ad.avatar && ad.avatar.length > 5) {
            let directImgUrl = getDirectImageUrl(ad.avatar);
            // Kỹ thuật Fallback: onerror sẽ tự động biến ảnh lỗi thành Icon
            leftColHtml = `<img src="${directImgUrl}" class="aff-avatar" alt="Avatar" onerror="this.outerHTML='<i class=\\'fas ${iconClass} aff-icon\\'></i>'">`;
        } else {
            leftColHtml = `<i class="fas ${iconClass} aff-icon"></i>`;
        }

        // --- XỬ LÝ CỘT PHẢI (TỈ LỆ 3: Title + [Embed OR Comment]) ---
        let rightContentHtml = '';
        if (ad.embed && ad.embed.trim() !== '') {
            rightContentHtml = `<div class="aff-embed">${ad.embed}</div>`;
        } else if (ad.comment && ad.comment.trim() !== '') {
            rightContentHtml = `<span class="aff-comment-sm">${ad.comment}</span>`;
        }

        const html = `
            <div class="aff-item" title="${ad.title}" onclick="if('${ad.link}' !== '#') window.open('${ad.link}', '_blank');">
                <div class="aff-left-col">${leftColHtml}</div>
                <div class="aff-right-col">
                    <span class="aff-title-sm">${ad.title}</span>
                    ${rightContentHtml}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    // --- BẮT SỰ KIỆN LĂN CHUỘT GIỮA ---
    container.addEventListener('wheel', function(e) {
        if (e.deltaY !== 0) {
            e.preventDefault(); 
            this.scrollBy({
                left: e.deltaY > 0 ? 320 : -320, 
                behavior: 'smooth'
            });
        }
    }, { passive: false });
}

window.addEventListener('DOMContentLoaded', loadAffiliateAds);




// ==========================================
// HỆ THỐNG ĐẾM LƯỢT TRUY CẬP (HIT COUNTER API)
// ==========================================
function initVisitCounter() {
    const counterElement = document.getElementById('visit-count');
    if (!counterElement) return;

    // Namespace định danh duy nhất cho dự án của bạn (tránh trùng lặp với web khác)
    const namespace = 'nshome_smartschool_2026'; 
    const key = 'total_visits';

    // Gọi API miễn phí từ counterapi.dev
    fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`)
        .then(response => response.json())
        .then(data => {
            // Hiển thị số, tự động thêm dấu phẩy (vd: 1,234) và đệm số 0 ở đầu
            counterElement.innerText = data.count.toLocaleString('en-US').padStart(4, '0');
        })
        .catch(error => {
            console.error('Lỗi hệ thống đếm truy cập:', error);
            counterElement.innerText = 'ERROR';
        });
}

// Bổ sung gọi hàm initVisitCounter vào sự kiện DOMContentLoaded hiện có
window.addEventListener('DOMContentLoaded', () => {
    initVisitCounter();
});