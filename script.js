// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
const ADMIN_EMAIL = 'nguyenhaunghia@gmail.com'; 
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSeiJbdCn58ZDfZrGfB48PesLnpD03w5ouRIMIH2Y1A8HrjqWYWdQwkwN6-OKgEncT7A/exec'; // Đã cập nhật URL Ghi Log

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    const userData = checkAuthAndRenderUI();
    initCanvas();
    animateCanvas();
    loadDataByPrivilege(userData);
});

// --- GHI LOG HOẠT ĐỘNG ---
function logActivity(nickname, action) {
    if (!WEB_APP_URL || WEB_APP_URL.includes('DÁN_URL')) return;
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        // Chỉ gửi nickname và action lên server
        body: JSON.stringify({ nickname: nickname, action: action })
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
            container.innerHTML = `
                <div class="user-profile">
                    <span class="user-name">${user.name}</span>
                    <img src="${user.avatar || 'https://via.placeholder.com/36'}" class="user-avatar" alt="User">
                    <i class="fas fa-power-off btn-logout" title="Đăng xuất" onclick="logout()"></i>
                </div>
            `;
        } else {
            container.innerHTML = ''; 
        }
    }
}

function logout() {
    // Lấy thông tin phiên để ghi log trước khi xóa
    const userDataString = sessionStorage.getItem('userData');
    if (userDataString) {
        const user = JSON.parse(userDataString);
        // Ghi log Đăng xuất (chỉ truyền nickname và action)
        logActivity(user.nickname || user.name, 'Đăng xuất');
    }
    
    sessionStorage.clear();
    // Chờ log gửi đi thành công rồi mới chuyển trang
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
        // Kiểm tra Admin
        if (user.account && String(user.account).toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            loadNHN = true;
            loadHocSinh = true; 
        } 
        
        // --- CHỐNG LỖI TIẾNG VIỆT KHI ĐẨY LÊN GITHUB PAGES ---
        if (user.object) {
            // Chuẩn hóa chuỗi: Lột bỏ toàn bộ dấu tiếng Việt
            const objStr = String(user.object)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
                
            // Kiểm tra theo chuỗi "hoc sinh" không dấu
            if (objStr.includes('hoc sinh')) {
                loadHocSinh = true;
            }
        }
    }

    // Tải dữ liệu các sheet (Sử dụng đúng tên Sheet)
    const [nhnData, csdlData, hocSinhData] = await Promise.all([
        loadNHN ? fetchSheetData('NHN') : Promise.resolve([]),
        fetchSheetData('CSDL'), 
        loadHocSinh ? fetchSheetData('Hoc_Sinh') : Promise.resolve([])
    ]);

    // Ghép dữ liệu theo thứ tự NHN -> CSDL -> Hoc_Sinh
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

