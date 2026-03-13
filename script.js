// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
const ADMIN_EMAIL = 'nguyenhaunghia@gmail.com'; 
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwt9YHB1exYZT946oTkzLBmdjx2QvyP-tW6JaQQwE2Y4FdP_Hy-MiqWF3WZPhhoffAd3A/exec';

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    const userData = checkAuthAndRenderUI();
    initCanvas();
    animateCanvas();
    loadDataByPrivilege(userData);
});

// --- GHI LOG HOẠT ĐỘNG ---
// Nhận thêm biến uid
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
            // Tự động tạo Avatar hạt giống theo tên nếu người dùng chưa có
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
            // ---> MỚI: NẾU CHƯA ĐĂNG NHẬP, HIỂN THỊ NÚT LOGIN NEON <---
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
        // Bắn cả UID lên Google Sheet
        logActivity(user.uid || 'Khách', user.nickname || user.name, 'Đăng xuất');
    }
    
    sessionStorage.clear();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 300);
}

// --- DATA LOADING LOGIC ---
async function loadDataByPrivilege(user) {
    console.log('User status:', user);
    
    let loadNHN = false;
    let loadHocSinh = false;

    if (user) {
        if (user.account && String(user.account).toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            loadNHN = true;
            loadHocSinh = true; 
        } 
        
        if (user.object) {
            const objStr = String(user.object)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
                
            if (objStr.includes('hoc sinh')) {
                loadHocSinh = true;
            }
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
    } catch (error) {
        console.error(`Error loading sheet ${sheetName}:`, error);
        return [];
    }
}

// --- PARSE DATA (HOÀN TOÀN TÌM THEO TÊN CỘT) ---
function parseData(json) {
    let colMap = {};
    let startRow = 0;
    const cleanKey = (str) => str ? String(str).trim().toLowerCase() : '';
    
    const hasLabels = json.table.cols && json.table.cols.some(c => c && c.label);
    
    if (hasLabels) {
        json.table.cols.forEach((col, idx) => {
            if (col && col.label) colMap[cleanKey(col.label)] = idx;
        });
    } else if (json.table.rows && json.table.rows.length > 0) {
        json.table.rows[0].c.forEach((cell, idx) => {
            if (cell && cell.v) colMap[cleanKey(cell.v)] = idx;
        });
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

    const cards = [];
    let currentCard = null;
    let currentL1 = null;
    let currentL2 = null;
    let currentL3 = null;
    let currentL4 = null;

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

        if (level === 0) { 
            currentCard = item; 
            cards.push(currentCard); 
            currentL1 = null; currentL2 = null; currentL3 = null; currentL4 = null;
        } 
        else if (level === 1) { 
            if (currentCard) { 
                currentL1 = item; 
                currentCard.children.push(currentL1); 
                currentL2 = null; currentL3 = null; currentL4 = null;
            } 
        } 
        else if (level === 2) { 
            if (currentL1) { 
                currentL2 = item; 
                currentL1.children.push(currentL2); 
                currentL3 = null; currentL4 = null;
            } 
        } 
        else if (level === 3) { 
            if (currentL2) { 
                currentL3 = item;
                currentL2.children.push(currentL3);
                currentL4 = null;
            }
        }
        else if (level === 4) {
            if (currentL3) {
                currentL4 = item;
                currentL3.children.push(currentL4);
            }
        }
        else if (level === 5) {
            if (currentL4) {
                currentL4.children.push(item);
            }
        }
    }
    return cards;
}

// --- RENDER ---
function renderDashboard(cards) {
    const grid = document.getElementById('dynamic-grid');
    grid.innerHTML = '';

    if (cards.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#94a3b8; font-family:\'Roboto Mono\'">NO DATA AVAILABLE</div>';
        return;
    }

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
        
        if (card.children && card.children.length > 0) {
            card.children.forEach(child => menuContainer.appendChild(createMenuItem(child)));
        } else {
            menuContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Coming Soon</div>`;
        }

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
                <span style="display:flex; align-items:center; gap:6px;">
                    ${iconHtml}
                    ${item.label}
                </span>
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
                    <h3><i class="fas fa-user-astronaut"></i> HỒ SƠ TÀI KHOẢN</h3>
                    <i class="fas fa-times close-modal" onclick="closeProfileModal()"></i>
                </div>
                <div class="tech-modal-body" id="profile-modal-body">
                    <div style="text-align:center; color: var(--primary-neon);"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>
                </div>
                <div class="modal-footer-btn">
                    <button class="btn-save-modal" onclick="saveProfileModal()" id="btn-save-profile" style="display:none;">LƯU THAY ĐỔI</button>
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

// --- HÀM TẮT/MỞ HIỂN THỊ MẬT KHẨU TRONG MODAL ---
function toggleModalPwd(inputId, iconEl) {
    const inp = document.getElementById(inputId);
    if(inp.type === 'password') {
        inp.type = 'text';
        iconEl.classList.remove('fa-eye');
        iconEl.classList.add('fa-eye-slash');
    } else {
        inp.type = 'password';
        iconEl.classList.remove('fa-eye-slash');
        iconEl.classList.add('fa-eye');
    }
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
                <button class="btn-change-avatar" onclick="document.getElementById('upd-avatar-file').click()"><i class="fas fa-camera"></i> ĐỔI ẢNH</button>
            </div>

            <div class="modal-right-col">
                <input type="hidden" id="upd-uid" value="${data.uid}">
                <input type="hidden" id="upd-avatar-base64" value="">
                <input type="hidden" id="upd-avatar-old" value="${data.Avatar || ''}">

                <div class="form-grid-2">
                    <div class="form-group-modal"><label>HỌ VÀ TÊN</label><input type="text" id="upd-fullname" value="${data.FullName}"></div>
                    <div class="form-group-modal"><label>NICKNAME (GỢI NHỚ)</label><input type="text" id="upd-nickname" value="${data.NickName}"></div>
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

    // XỬ LÝ SỰ KIỆN KHI CHỌN ẢNH XONG
    document.getElementById('upd-avatar-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(file) {
            if(file.size > 2.5 * 1024 * 1024) { // Cấm ảnh lớn hơn 2.5MB chống tràn bộ nhớ Drive
                alert('Vui lòng chọn ảnh có kích thước dưới 2.5MB để đảm bảo hiệu suất!');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                document.getElementById('upd-avatar-img').src = evt.target.result; // Hiện preview
                document.getElementById('upd-avatar-base64').value = evt.target.result; // Lưu chuỗi Base64
            }
            reader.readAsDataURL(file);
        }
    });
}

// --- GỬI DỮ LIỆU LÊN SERVER ---
function saveProfileModal() {
    const btn = document.getElementById('btn-save-profile');
    const msg = document.getElementById('modal-msg');
    
    // Kiểm tra mật khẩu xác nhận
    const pwd = document.getElementById('upd-password').value;
    const pwdConf = document.getElementById('upd-password-confirm').value;
    
    if (pwd !== '' && pwd !== pwdConf) {
        msg.style.color = "#f87171"; 
        msg.innerText = "LỖI: Mật khẩu xác nhận không khớp!";
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
        Avatar: document.getElementById('upd-avatar-old').value, // Link cũ
        avatarBase64: document.getElementById('upd-avatar-base64').value, // Dữ liệu ảnh mới
        Password: pwd,
        AccountUpdate: JSON.parse(sessionStorage.getItem('userData')).account || 'Unknown'
    };

    btn.disabled = true; btn.innerText = "ĐANG TẢI LÊN...";
    msg.style.color = "var(--primary-neon)"; msg.innerText = "Đang xử lý dữ liệu và Hình ảnh...";

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateUserProfile', profileData: profileData })
    })
    .then(res => res.json())
    .then(json => {
        if(json.success) {
            msg.style.color = "#4ade80"; msg.innerText = "Cập nhật thành công!";
            
            // Cập nhật lại SessionStorage 
            let userSession = JSON.parse(sessionStorage.getItem('userData'));
            userSession.name = profileData.FullName;
            userSession.nickname = profileData.NickName;
            if(json.newAvatar) userSession.avatar = json.newAvatar; // Nhận link avatar Drive từ server trả về
            
            sessionStorage.setItem('userData', JSON.stringify(userSession));
            
            // Render lại góc trái Dashboard
            renderUserProfile(userSession);
            logActivity(profileData.uid, profileData.NickName, 'Cập nhật Profile');
            
            setTimeout(closeProfileModal, 1500);
        } else {
            msg.style.color = "#f87171"; msg.innerText = "Lỗi: " + json.error;
            btn.disabled = false; btn.innerText = "LƯU THAY ĐỔI";
        }
    })
    .catch(err => {
        msg.style.color = "#f87171"; msg.innerText = "Lỗi kết nối máy chủ!";
        btn.disabled = false; btn.innerText = "LƯU THAY ĐỔI";
    });
}