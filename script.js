// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
const ADMIN_EMAIL = 'nguyenhaunghia@gmail.com'; 
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzQYy-sHngMGL4OcNRVz_TM1bwH6vb6nDOMW4zQ2iw3aOqN7Y_KcDywaWTIWy0tvVnsnQ/exec';


window.addEventListener('DOMContentLoaded', () => {
    const userData = checkAuthAndRenderUI();
    initCanvas();
    animateCanvas();
    loadDataByPrivilege(userData);
    initVisitCounter();
    loadAffiliateAds();
    loadDriveImagesAuto(); 
});


function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `tech-toast ${type}`;
    let icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}

function logActivity(uid, nickname, action) {
    if (!WEB_APP_URL || WEB_APP_URL.includes('DÁN_URL')) return;
    fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ uid, nickname, action }) }).catch(e=>e);
}

function checkAuthAndRenderUI() {
    if (!window.location.href.includes('login.html')) {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userDataString = sessionStorage.getItem('userData');
        if (isLoggedIn !== 'true' || !userDataString) {
            renderUserProfile(null); return null;
        }
        const userData = JSON.parse(userDataString);
        renderUserProfile(userData); return userData;
    }
    return null;
}

// 🌟 ĐÃ SỬA: Đưa thẻ Profile về lại dưới chân Ver, chia khối rõ ràng không bị đè Logo
function renderUserProfile(user) {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    // Reset lại style để không bay lung tung
    container.style.position = 'relative';
    container.style.top = 'auto';
    container.style.left = 'auto';
    container.style.transform = 'none';
    
    if (user) {
        const userRole = user.object ? String(user.object).toUpperCase() : 'THÀNH VIÊN';
        const avatarSrc = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%; margin-top: 10px; padding-top: 15px; border-top: 1px dashed rgba(0,0,0,0.1);">
                <div onclick="openProfileModal()" style="background: #e0f2fe; color: #2563eb; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; border: 1px solid #bae6fd; transition: 0.2s;" title="Cập nhật thông tin">
                    <img src="${avatarSrc}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                    <span style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</span>
                    <i class="fas fa-chevron-down" style="font-size: 0.7rem; color: #64748b;"></i>
                </div>

                <div style="color: #1e293b; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-user-tie" style="color: #1d4ed8;"></i> ${userRole}
                </div>

                <i class="fas fa-power-off" onclick="logout()" title="Đăng xuất" style="color: #ef4444; font-size: 1.2rem; cursor: pointer; transition: 0.2s; margin-left: 5px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#ef4444'"></i>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="width: 100%; display: flex; justify-content: center; margin-top: 10px; padding-top: 15px; border-top: 1px dashed rgba(0,0,0,0.1);">
                <div onclick="window.location.href='login.html'" class="tech-login-btn" style="padding: 8px 24px; font-size: 0.9rem;">
                    <i class="fas fa-user-astronaut"></i> ĐĂNG NHẬP
                </div>
            </div>
        `; 
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

// --- GOOGLE SHEETS FETCH ---
async function loadDataByPrivilege(user) {
    let loadNHN = false; let loadHocSinh = false;
    if (user) {
        if (user.account && String(user.account).toLowerCase() === ADMIN_EMAIL.toLowerCase()) { loadNHN = true; loadHocSinh = true; } 
        if (user.object && String(user.object).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('hoc sinh')) loadHocSinh = true;
    }
    const [nhnData, csdlData, hocSinhData] = await Promise.all([
        loadNHN ? fetchSheetData('NHN') : Promise.resolve([]),
        fetchSheetData('CSDL'), 
        loadHocSinh ? fetchSheetData('Hoc_Sinh') : Promise.resolve([])
    ]);
    renderDynamicMenu([...(nhnData||[]), ...(csdlData||[]), ...(hocSinhData||[])]);
}

async function fetchSheetData(sheetName) {
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheetName}`);
        const text = await res.text();
        return parseData(JSON.parse(text.substring(47).slice(0, -2)));
    } catch (e) { return []; }
}

function parseData(json) {
    let colMap = {}; let startRow = 0;
    const cleanKey = (str) => str ? String(str).trim().toLowerCase() : '';
    if (json.table.cols && json.table.cols.some(c => c && c.label)) {
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
        let color = getVal(row, 'Color', '#2563eb'); if (color === '#000000') color = '#3b82f6'; 
        const item = { level, icon, color, label: getVal(row, 'Label', 'Undefined'), link: getVal(row, 'Link', '#'), note: getVal(row, 'Note', ''), children: [] };

        if (level === 0) { currentCard = item; cards.push(currentCard); currentL1 = currentL2 = currentL3 = currentL4 = null; } 
        else if (level === 1 && currentCard) { currentL1 = item; currentCard.children.push(currentL1); currentL2 = currentL3 = currentL4 = null; } 
        else if (level === 2 && currentL1) { currentL2 = item; currentL1.children.push(currentL2); currentL3 = currentL4 = null; } 
        else if (level === 3 && currentL2) { currentL3 = item; currentL2.children.push(currentL3); currentL4 = null; }
        else if (level === 4 && currentL3) { currentL4 = item; currentL3.children.push(currentL4); }
        else if (level === 5 && currentL4) { currentL4.children.push(item); }
    }
    return cards;
}

// --- RENDER MENU ĐA CẤP ---
function renderDynamicMenu(menuData) {
    const menuContainer = document.getElementById('dynamic-main-nav');
    if (!menuContainer) return;

    const panelMenu = menuContainer.closest('.panel-menu');
    if (panelMenu) { panelMenu.id = 'panel-menu-container'; panelMenu.style.position = 'relative'; }

    let dropdownsWrapper = document.getElementById('dynamic-dropdowns-wrapper');
    if (!dropdownsWrapper) {
        dropdownsWrapper = document.createElement('div'); dropdownsWrapper.id = 'dynamic-dropdowns-wrapper';
        if (panelMenu) panelMenu.appendChild(dropdownsWrapper);
    }

    menuContainer.innerHTML = ''; dropdownsWrapper.innerHTML = '';
    if (menuData.length === 0) { menuContainer.innerHTML = '<span style="color:#94a3b8; font-size:0.9rem;">Chưa có dữ liệu khóa học</span>'; return; }
    
    // ĐÃ BỎ: Dòng code chèn nút "Trang chủ" tại đây theo đúng yêu cầu của bạn.

    function buildNestedHTML(item) {
        const hasChildren = item.children && item.children.length > 0;
        const iconHtml = `<i class="${item.icon}" style="color: ${item.color}; width: 18px; text-align: center; margin-right: 5px;"></i>`;
        let hrefAttr = (item.link && item.link.length > 2 && item.link !== '#') ? `href="${item.link}" target="_blank"` : 'href="javascript:void(0)"';

        if (hasChildren) {
            let html = `<div class="nav-item-nested">`;
            html += `<a href="#" class="nested-toggle" title="${item.note || ''}">${iconHtml} ${item.label} <i class="fas fa-caret-right caret-icon"></i></a>`;
            html += `<div class="dropdown-content nested-dropdown">`;
            item.children.forEach(child => { html += buildNestedHTML(child); });
            html += `</div></div>`; return html;
        } else {
            return `<a ${hrefAttr} title="${item.note || ''}" onclick="event.stopPropagation();">${iconHtml} ${item.label}</a>`;
        }
    }

    menuData.forEach((cardData, index) => {
        const hasChildren = cardData.children && cardData.children.length > 0;
        const dropId = `root-drop-${index}`;
        const iconHtml = `<i class="${cardData.icon}" style="color: ${cardData.color}; width: 18px; text-align: center; margin-right: 5px;"></i>`;
        let hrefAttr = (cardData.link && cardData.link.length > 2 && cardData.link !== '#') ? `href="${cardData.link}" target="_blank"` : 'href="javascript:void(0)"';

        const navItem = document.createElement('div'); navItem.className = 'nav-item';
        if (hasChildren) navItem.dataset.dropTarget = dropId; 
        navItem.innerHTML = `<a ${hrefAttr} class="nav-link-custom root-toggle" title="${cardData.note || ''}">${iconHtml} ${cardData.label} ${hasChildren ? '<i class="fas fa-chevron-down root-caret"></i>' : ''}</a>`;
        menuContainer.appendChild(navItem);

        if (hasChildren) {
            const dropMenu = document.createElement('div'); dropMenu.id = dropId; dropMenu.className = 'dropdown-content root-dropdown';
            let childHtml = ''; cardData.children.forEach(child => { childHtml += buildNestedHTML(child); });
            dropMenu.innerHTML = childHtml; dropdownsWrapper.appendChild(dropMenu);
        }
    });

    let activeRootDropdown = null;
    const hideAllRootDropdowns = () => {
        if (activeRootDropdown) { activeRootDropdown.classList.remove('show'); activeRootDropdown = null; }
        document.querySelectorAll('.active-nested').forEach(el => el.classList.remove('active-nested'));
    };

    menuContainer.querySelectorAll('.nav-item[data-drop-target]').forEach(item => {
        item.addEventListener('click', function(e) { 
            e.preventDefault(); e.stopPropagation();
            const targetId = this.dataset.dropTarget; const drop = document.getElementById(targetId);
            if (activeRootDropdown && activeRootDropdown.id === targetId) { hideAllRootDropdowns(); } 
            else {
                hideAllRootDropdowns();
                if (drop) {
                    const rect = this.getBoundingClientRect(); const containerRect = document.getElementById('panel-menu-container').getBoundingClientRect();
                    drop.style.left = (rect.left - containerRect.left) + 'px'; drop.style.top = (rect.bottom - containerRect.top) + 'px'; 
                    drop.classList.add('show'); activeRootDropdown = drop;
                }
            }
        });
    });

    dropdownsWrapper.querySelectorAll('.nested-toggle').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const parentNested = this.parentElement; 
            const isCurrentlyActive = parentNested.classList.contains('active-nested');
            const siblings = parentNested.parentElement.querySelectorAll('.nav-item-nested');
            siblings.forEach(sib => { if (sib !== parentNested) sib.classList.remove('active-nested'); });
            if (isCurrentlyActive) { parentNested.classList.remove('active-nested'); } else { parentNested.classList.add('active-nested'); }
        });
    });

    dropdownsWrapper.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', hideAllRootDropdowns);
    menuContainer.addEventListener('wheel', function(e) {
        if (e.deltaY !== 0) { e.preventDefault(); menuContainer.scrollLeft += e.deltaY * 1.5; }
    }, { passive: false });

    // ----------------------------------------------------
    // THUẬT TOÁN KIỂM TRA VÀ HIỂN THỊ MŨI TÊN BÁO HIỆU
    // ----------------------------------------------------
    const leftIndicator = document.getElementById('scroll-indicator-left');
    const rightIndicator = document.getElementById('scroll-indicator-right');

    function checkMenuOverflow() {
        if (!leftIndicator || !rightIndicator) return;
        
        // Kiểm tra xem menu có dài hơn khung hiển thị không
        const isScrollable = menuContainer.scrollWidth > menuContainer.clientWidth;
        
        if (isScrollable) {
            // Nếu đã cuộn sang phải (thì bên trái đang bị che) -> Hiện mũi tên trái
            if (menuContainer.scrollLeft > 5) leftIndicator.classList.add('visible');
            else leftIndicator.classList.remove('visible');
            
            // Nếu cuộn chưa chạm mép phải (thì bên phải đang bị che) -> Hiện mũi tên phải
            // (-1 để bù trừ sai số pixel của một số trình duyệt)
            if (menuContainer.scrollLeft < menuContainer.scrollWidth - menuContainer.clientWidth - 1) {
                rightIndicator.classList.add('visible');
            } else {
                rightIndicator.classList.remove('visible');
            }
        } else {
            // Nếu menu ngắn, hiển thị đủ -> Ẩn cả 2 mũi tên
            leftIndicator.classList.remove('visible');
            rightIndicator.classList.remove('visible');
        }
    }

    // Gắn sự kiện để máy tính liên tục kiểm tra khi người dùng cuộn hoặc co giãn trình duyệt
    menuContainer.addEventListener('scroll', checkMenuOverflow);
    window.addEventListener('resize', checkMenuOverflow);
    
    // Chạy kiểm tra ngay sau khi menu vừa tải xong (Delay 100ms để đợi DOM vẽ xong)
    setTimeout(checkMenuOverflow, 100);
}




// --- ADS SYSTEM ---
async function loadAffiliateAds() {
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Advertisement`);
        const text = await res.text();
        const data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));

        let headers = data.table.cols.map(c => c.label ? c.label.toLowerCase().trim() : '');
        let dataRows = data.table.rows;
        if (!headers.includes('title') && dataRows.length > 0) {
            headers = dataRows[0].c.map(cell => cell && cell.v ? String(cell.v).toLowerCase().trim() : '');
            dataRows.shift();
        }

        const idxField = headers.findIndex(h => h.includes('field')); const idxAvatar = headers.findIndex(h => h.includes('avatar'));
        const idxTitle = headers.findIndex(h => h.includes('title')); const idxLink = headers.findIndex(h => h.includes('link'));
        const idxComment = headers.findIndex(h => h.includes('comment') || h.includes('note')); const idxEmbed = headers.findIndex(h => h.includes('embed') || h.includes('code'));
        if (idxTitle === -1) throw new Error("Thiếu cột 'Title'");

        let adsList = dataRows.map(row => {
            const getVal = (index) => (index !== -1 && row.c[index] && row.c[index].v !== null) ? String(row.c[index].v) : '';
            return { field: getVal(idxField), avatar: getVal(idxAvatar), title: getVal(idxTitle), link: getVal(idxLink) || '#', comment: getVal(idxComment), embed: getVal(idxEmbed) };
        });
        renderAffiliateAds(adsList.filter(ad => ad.title.trim() !== '').sort(() => 0.5 - Math.random()));
    } catch (e) {}
}

function getAdIcon(field) {
    const f = field.toLowerCase();
    if (f.includes('lập trình') || f.includes('code')) return 'fa-laptop-code';
    if (f.includes('toán') || f.includes('math')) return 'fa-square-root-variable';
    if (f.includes('ngoại ngữ') || f.includes('tiếng')) return 'fa-language';
    if (f.includes('kỹ năng') || f.includes('skill')) return 'fa-brain';
    return 'fa-rocket'; 
}


// Hàm chuyển đổi Link Google Drive sang Link ảnh Thumbnail sắc nét
function getDirectImageUrl(url) {
    if (!url) return '';
    let match = url.match(/[-\w]{25,}/); 
    if (url.includes('drive.google.com') && match) {
        // Dùng API thumbnail của Drive để load ảnh mượt và không bị lỗi quyền truy cập
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w200`; 
    }
    return url; 
}

// Hàm render thẻ quảng cáo và cài đặt Auto-scroll
function renderAffiliateAds(ads) {
    const container = document.getElementById('dynamic-aff-container');
    container.innerHTML = ''; 
    ads.forEach(ad => {
        const iconClass = getAdIcon(ad.field);
        
        // Render hình ảnh thay vì icon nếu có link Avatar
        let leftColHtml = (ad.avatar && ad.avatar.length > 5) 
            ? `<img src="${getDirectImageUrl(ad.avatar)}" class="aff-avatar" alt="Avatar" style="width:100%; height:100%; border-radius:6px; object-fit:cover;" onerror="this.outerHTML='<i class=\\'fas ${iconClass} aff-icon\\'></i>'">` 
            : `<i class="fas ${iconClass} aff-icon"></i>`;
            
        let rightContentHtml = ad.embed ? `<div class="aff-embed">${ad.embed}</div>` : ad.comment ? `<span class="aff-desc">${ad.comment}</span>` : '';
        
        container.insertAdjacentHTML('beforeend', `
            <div class="aff-item-card" title="${ad.title}" onclick="if('${ad.link}' !== '#') window.open('${ad.link}', '_blank');">
                <div class="aff-icon-box">${leftColHtml}</div>
                <div class="aff-content-box"><span class="aff-title">${ad.title}</span>${rightContentHtml}</div>
            </div>
        `);
    });

    // ----------------------------------------------------
    // TÍNH NĂNG TỰ ĐỘNG CUỘN (AUTO SCROLL)
    // ----------------------------------------------------
    let scrollAmount = 1; // Số pixel cuộn mỗi lần (Tốc độ)
    let adScrollInterval = setInterval(autoScroll, 40); // 40ms cuộn 1 lần (để tạo độ mượt như video)

    function autoScroll() {
        // Nếu cuộn đến kịch lề phải (-1px sai số) thì quay lại đầu tiên
        if(container.scrollLeft >= (container.scrollWidth - container.clientWidth - 1)) {
            container.scrollLeft = 0;
        } else {
            container.scrollLeft += scrollAmount;
        }
    }

    // Khi người dùng rê chuột vào -> DỪNG CUỘN để họ đọc và bấm
    container.addEventListener('mouseenter', () => clearInterval(adScrollInterval));
    
    // Khi người dùng đưa chuột ra -> TIẾP TỤC CUỘN
    container.addEventListener('mouseleave', () => {
        adScrollInterval = setInterval(autoScroll, 40);
    });

    // Vẫn cho phép người dùng cuộn tay bằng con lăn chuột (Wheel)
    container.addEventListener('wheel', function(e) {
        if (e.deltaY !== 0) { 
            e.preventDefault(); 
            this.scrollBy({ left: e.deltaY > 0 ? 320 : -320, behavior: 'smooth' }); 
        }
    }, { passive: false });
}








// --- COUNTER ---
function initVisitCounter() {
    const counterElement = document.getElementById('visit-count');
    if (!counterElement) return;
    fetch(`https://api.counterapi.dev/v1/nshome_smartschool_2026/total_visits/up`)
        .then(r => r.json())
        .then(data => { counterElement.innerText = data.count.toLocaleString('en-US').padStart(4, '0'); })
        .catch(e => { counterElement.innerText = 'ERROR'; });
}

// --- CANVAS ---
const canvas = document.getElementById('hero-canvas');
let ctx, width, height, particles = [];
if (canvas) {
    ctx = canvas.getContext('2d');
    function initCanvas() {
        width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; particles = [];
        for (let i = 0; i < Math.floor(width / 9); i++) { particles.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, size: Math.random() * 1.8, alpha: Math.random() }); }
    }
    function animateCanvas() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i]; p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0; if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha * 0.6})`; ctx.fill();
        }
        requestAnimationFrame(animateCanvas);
    }
    window.addEventListener('resize', initCanvas);
}

// --- MODAL PROFILE ---
function openProfileModal() {
    if(!document.getElementById('profile-modal')) {
        document.body.insertAdjacentHTML('beforeend', `<div id="profile-modal" class="tech-modal-overlay"><div class="tech-modal-content"><div class="tech-modal-header"><h3><i class="fas fa-user-astronaut"></i> CẬP NHẬT TÀI KHOẢN</h3><i class="fas fa-times close-modal" onclick="closeProfileModal()"></i></div><div class="tech-modal-body" id="profile-modal-body"><div style="text-align:center; color: var(--primary-neon);"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div></div><div class="modal-footer-btn"><button class="btn-save-modal" onclick="saveProfileModal()" id="btn-save-profile" style="display:none;">CẬP NHẬT</button></div></div></div>`);
    }
    document.getElementById('profile-modal').classList.add('active');
    const userStr = sessionStorage.getItem('userData');
    if(!userStr) return; const user = JSON.parse(userStr);
    
    fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'getUserProfile', uid: user.uid }) })
    .then(res => res.json()).then(json => {
        if(json.success) renderProfileForm(json.data);
        else document.getElementById('profile-modal-body').innerHTML = `<div style="color:#f87171;">Lỗi: ${json.error}</div>`;
    }).catch(err => { document.getElementById('profile-modal-body').innerHTML = `<div style="color:#f87171;">Lỗi kết nối máy chủ!</div>`; });
}

function closeProfileModal() { const m = document.getElementById('profile-modal'); if(m) m.classList.remove('active'); }
function toggleModalPwd(id, icon) { const inp = document.getElementById(id); if(inp.type === 'password') { inp.type = 'text'; icon.classList.replace('fa-eye','fa-eye-slash'); } else { inp.type = 'password'; icon.classList.replace('fa-eye-slash','fa-eye'); } }

function renderProfileForm(data) {
    const avatarSrc = data.Avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.FullName)}`;
    document.getElementById('profile-modal-body').innerHTML = `
        <div class="modal-layout">
            <div class="modal-left-col">
                <div class="avatar-preview-box"><img id="upd-avatar-img" src="${avatarSrc}"></div>
                <input type="file" id="upd-avatar-file" style="display:none" accept="image/png, image/jpeg, image/gif">
                <button class="btn-change-avatar" id="btn-trigger-upload" onclick="document.getElementById('upd-avatar-file').click()"><i class="fas fa-camera"></i></button>
            </div>
            <div class="modal-right-col">
                <input type="hidden" id="upd-uid" value="${data.uid}"><input type="hidden" id="upd-avatar-base64" value=""><input type="hidden" id="upd-avatar-old" value="${data.Avatar || ''}">
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
                    <div class="form-group-modal"><label>GIỚI TÍNH</label><select id="upd-gender"><option value="Nam" ${data.Gender==='Nam'?'selected':''}>Nam</option><option value="Nữ" ${data.Gender==='Nữ'?'selected':''}>Nữ</option><option value="Khác" ${data.Gender==='Khác'?'selected':''}>Khác</option></select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group-modal"><label>TRƯỜNG HỌC</label><input type="text" id="upd-school" value="${data.SchoolName || ''}"></div>
                    <div class="form-group-modal"><label>LỚP</label><input type="text" id="upd-class" value="${data.ClassName || ''}"></div>
                </div>
                <div class="form-group-modal" style="margin-bottom:15px;"><label>ĐỊA CHỈ</label><input type="text" id="upd-address" value="${data.Address || ''}"></div>
                <div class="form-grid-2">
                    <div class="form-group-modal pos-relative"><label>ĐỔI MẬT KHẨU</label><input type="password" id="upd-password" placeholder="Bỏ trống nếu không đổi" style="padding-right:35px;"><i class="fas fa-eye modal-pwd-toggle" onclick="toggleModalPwd('upd-password', this)"></i></div>
                    <div class="form-group-modal pos-relative"><label>XÁC NHẬN MẬT KHẨU</label><input type="password" id="upd-password-confirm" placeholder="Nhập lại mật khẩu mới" style="padding-right:35px;"><i class="fas fa-eye modal-pwd-toggle" onclick="toggleModalPwd('upd-password-confirm', this)"></i></div>
                </div>
            </div>
        </div>
        <div id="modal-msg" style="margin-top: 15px; font-size: 0.85rem; font-family:'Roboto Mono'; text-align:center;"></div>
    `;
    document.getElementById('btn-save-profile').style.display = 'block';

    document.getElementById('upd-avatar-file').addEventListener('change', function(e) {
        const file = e.target.files[0]; if(!file) return;
        if(file.size > 2.5 * 1024 * 1024) { showToast('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2.5MB!', 'warning'); return; }
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                let width = img.width; let height = img.height;
                if (width > height && width > 300) { height *= 300 / width; width = 300; } else if (height > 300) { width *= 300 / height; height = 300; }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('upd-avatar-img').src = dataUrl; document.getElementById('upd-avatar-base64').value = dataUrl; 
                const btn = document.getElementById('btn-trigger-upload'); btn.innerHTML = '<i class="fas fa-check-circle"></i>'; btn.style.background = '#4ade80'; btn.style.color = '#000';
            }; img.src = evt.target.result;
        }; reader.readAsDataURL(file);
    });
}

async function saveProfileModal() {
    const btn = document.getElementById('btn-save-profile'); const msg = document.getElementById('modal-msg');
    const pwd = document.getElementById('upd-password').value; const pwdConf = document.getElementById('upd-password-confirm').value;
    if (pwd !== '' && pwd !== pwdConf) { showToast("Mật khẩu xác nhận không khớp!", "warning"); return; }
    
    const profileData = {
        uid: document.getElementById('upd-uid').value, FullName: document.getElementById('upd-fullname').value, NickName: document.getElementById('upd-nickname').value,
        Email: document.getElementById('upd-email').value, BirthDay: document.getElementById('upd-birthday').value, Gender: document.getElementById('upd-gender').value,
        Phone: document.getElementById('upd-phone').value, Address: document.getElementById('upd-address').value, SchoolName: document.getElementById('upd-school').value,
        ClassName: document.getElementById('upd-class').value, Avatar: document.getElementById('upd-avatar-old').value, avatarBase64: document.getElementById('upd-avatar-base64').value, 
        Password: pwd, AccountUpdate: JSON.parse(sessionStorage.getItem('userData')).account || 'Unknown'
    };

    try {
        btn.disabled = true; btn.innerText = "ĐANG TẢI LÊN..."; msg.style.color = "var(--primary-neon)"; msg.innerText = "Đang đồng bộ dữ liệu...";
        const response = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateUserProfile', profileData: profileData }) });
        const rawText = await response.text();
        if (rawText.toLowerCase().includes("<!doctype html>")) { showToast("Lỗi phân quyền hệ thống.", "error"); throw new Error("Lỗi HTML"); }
        let json; try { json = JSON.parse(rawText); } catch (e) { showToast("Lỗi định dạng dữ liệu.", "error"); throw new Error("JSON Error"); }

        if (json.success) {
            msg.style.color = "#4ade80"; msg.innerText = "Thành công!"; showToast("Đã cập nhật hồ sơ!", "success");
            let userSession = JSON.parse(sessionStorage.getItem('userData'));
            userSession.name = profileData.FullName; userSession.nickname = profileData.NickName; if(json.newAvatar) userSession.avatar = json.newAvatar; 
            sessionStorage.setItem('userData', JSON.stringify(userSession));
            renderUserProfile(userSession); logActivity(profileData.uid, profileData.NickName, 'Cập nhật Profile');
            setTimeout(closeProfileModal, 1500);
        } else { showToast(json.error, "error"); throw new Error(json.error); }
    } catch (err) {
        msg.style.color = "#f87171"; msg.innerText = ""; 
    } finally { btn.disabled = false; btn.innerText = "CẬP NHẬT"; }
}


// ==========================================
// HỆ THỐNG KÉO & RENDER HÌNH ẢNH TỪ GOOGLE DRIVE
// ==========================================
function loadDriveImagesAuto() {
    // ID Thư mục của bạn
    const PANEL_FOLDER_ID = '1dBOxexPs8Y3UfFQ2mf78DLiwj8DEKhGA';
    const CAROUSEL_FOLDER_ID = '1UuCdEpKT9mpuAmJnUeqZxlvmBjlImM2c';

    // 1. Kéo ảnh cho Khối Panel Tiêu đề
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getDriveImages', folderId: PANEL_FOLDER_ID })
    })
    .then(res => res.json())
    .then(json => {
        if (json.success && json.data.length > 0) {
            startPanelSlideshow(json.data);
        }
    }).catch(err => console.log("Lỗi tải ảnh Panel:", err));

    // 2. Kéo ảnh cho Khối Slideshow Carousel
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getDriveImages', folderId: CAROUSEL_FOLDER_ID })
    })
    .then(res => res.json())
    .then(json => {
        if (json.success && json.data.length > 0) {
            renderCarousel(json.data);
        } else {
            document.getElementById('carousel-inner-container').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f87171;">Không có ảnh trong thư mục.</div>';
        }
    }).catch(err => {
        document.getElementById('carousel-inner-container').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f87171;">Lỗi kết nối ảnh.</div>';
    });
}

// Hàm đổi hình ảnh Background cho Panel (Đổi sau mỗi 12 giây)
function startPanelSlideshow(images) {
    const panel = document.getElementById('dynamic-panel-title');
    if (!panel || images.length === 0) return;
    
    let currentIndex = 0;
    
    const changeBackground = () => {
        const imgId = images[currentIndex].id;
        const imgUrl = `https://drive.google.com/thumbnail?id=${imgId}&sz=w1920`;
        
        // KỸ THUẬT PRELOAD: Tải ngầm ảnh xong mới thay đổi nền để không bị chớp đen
        const tempImg = new Image();
        tempImg.src = imgUrl;
        
        tempImg.onload = () => {
            // Khi ảnh mới đã tải xong 100%, tiến hành đè lên ảnh cũ với hiệu ứng CSS transition đã có sẵn ở HTML
            panel.style.background = `linear-gradient(rgba(240, 249, 255, 0.7), rgba(224, 242, 254, 0.7)), url('${imgUrl}')`;
            panel.style.backgroundSize = 'cover';
            panel.style.backgroundPosition = 'center';
            
            currentIndex = (currentIndex + 1) % images.length;
        };
    };
    
    changeBackground(); 
    setInterval(changeBackground, 12000); 
}

// Hàm vẽ ảnh vào Slideshow Carousel
function renderCarousel(images) {
    const innerContainer = document.getElementById('carousel-inner-container');
    const indicatorsContainer = document.getElementById('carousel-indicators-container');
    
    if (!innerContainer || !indicatorsContainer) return;

    innerContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    images.forEach((img, index) => {
        const isActive = index === 0 ? 'active' : '';
        const imgUrl = `https://drive.google.com/thumbnail?id=${img.id}&sz=w1200`; // Link mới
        
        // Vẽ nút tròn (Indicators)
        indicatorsContainer.insertAdjacentHTML('beforeend', `
            <button type="button" data-bs-target="#schoolCarousel" data-bs-slide-to="${index}" class="${isActive}"></button>
        `);

        // Vẽ Hình ảnh
        const html = `
            <div class="carousel-item ${isActive}" style="height: 100%;">
                <img src="${imgUrl}" alt="${img.name}" style="width: 100%; height: 100%; object-fit: cover;">
                <div class="carousel-caption d-none d-md-block" style="background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 10px; backdrop-filter: blur(4px);">
                    <h5 style="margin: 0; font-weight: 700;">N's Home Smart School</h5>
                    <p style="margin: 0; font-size: 0.9rem;">Hệ sinh thái công nghệ giáo dục.</p>
                </div>
            </div>
        `;
        innerContainer.insertAdjacentHTML('beforeend', html);
    });
}