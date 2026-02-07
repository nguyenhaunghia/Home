// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
// Admin Email constant giữ lại để tham chiếu nếu cần, nhưng logic hiển thị NHN giờ dựa vào trạng thái Login
const ADMIN_EMAIL = 'nguyenhaunghia@gmail.com'; 

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Check Login & Render UI (Không bắt buộc login nữa)
    const userData = checkAuthAndRenderUI();

    // 2. Start Canvas Animation
    initCanvas();
    animateCanvas();

    // 3. Load Data based on User Status (Guest or Member)
    loadDataByPrivilege(userData);
});

// --- AUTH & UI LOGIC ---
function checkAuthAndRenderUI() {
    // Only run if NOT on login page
    if (!window.location.href.includes('login.html')) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userDataString = localStorage.getItem('userData');
        
        // UPDATE: Nếu chưa login, không redirect nữa, chỉ return null (Chế độ Guest)
        if (isLoggedIn !== 'true' || !userDataString) {
            renderUserProfile(null); // Render trạng thái Guest (trống)
            return null;
        }

        const userData = JSON.parse(userDataString);
        renderUserProfile(userData); // Render thông tin User
        return userData;
    }
    return null;
}

function renderUserProfile(user) {
    const container = document.getElementById('user-profile-container');
    if (container) {
        if (user) {
            // ĐÃ ĐĂNG NHẬP: Hiển thị Profile
            container.innerHTML = `
                <div class="user-profile">
                    <span class="user-name">${user.name}</span>
                    <img src="${user.avatar || 'https://via.placeholder.com/36'}" class="user-avatar" alt="User">
                    <i class="fas fa-power-off btn-logout" title="Đăng xuất" onclick="logout()"></i>
                </div>
            `;
        } else {
            // CHƯA ĐĂNG NHẬP (GUEST): Ẩn profile hoặc để trống
            container.innerHTML = ''; 
        }
    }
}

function logout() {
    localStorage.clear();
    // Reload lại trang index để về chế độ Guest (chỉ hiện CSDL)
    window.location.href = 'index.html';
}

// --- DATA LOADING LOGIC (LOGIC MỚI UPDATE) ---
async function loadDataByPrivilege(user) {
    let finalCards = [];
    
    // UPDATE: Logic hiển thị theo yêu cầu mới
    
    // 1. Nếu đã đăng nhập (User tồn tại) -> Load sheet NHN trước
    if (user) {
        console.log('User detected: Loading NHN data...');
        const nhnData = await fetchSheetData('NHN');
        if (nhnData) {
            // Có thể đánh dấu hoặc xử lý đặc biệt nếu cần, ở đây chỉ cần push vào trước
            finalCards = [...finalCards, ...nhnData];
        }
    }

    // 2. Load sheet CSDL (Luôn thực hiện cho cả Guest và User)
    // Các card này sẽ nằm sau card NHN (nếu có)
    console.log('Loading Standard Database...');
    const csdlData = await fetchSheetData('CSDL');
    if (csdlData) {
        finalCards = [...finalCards, ...csdlData];
    }

    // 3. Render toàn bộ
    renderDashboard(finalCards);
}

// --- GOOGLE SHEET FETCHING (GIỮ NGUYÊN) ---
async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        return parseData(json.table.rows);
    } catch (error) {
        console.error(`Error loading sheet ${sheetName}:`, error);
        return [];
    }
}

function parseData(rows) {
    const cards = [];
    let currentCard = null, currentL1 = null, currentL2 = null;

    rows.forEach(row => {
        const c = row.c;
        if (!c || !c[0]) return;
        
        const level = c[0] ? c[0].v : 0;
        const icon = c[1] ? c[1].v : 'fas fa-cube';
        let color = c[2] ? c[2].v : '#22d3ee';
        if (color === '#000000') color = '#e2e8f0';
        
        const label = c[3] ? c[3].v : 'Undefined';
        const link = c[4] ? c[4].v : '#';
        const note = c[5] ? c[5].v : '';

        const item = { level, icon, color, label, link, note, children: [] };

        if (level === 0) { 
            currentCard = item; cards.push(currentCard); currentL1 = null; 
        } else if (level === 1) { 
            if (currentCard) { currentL1 = item; currentCard.children.push(currentL1); currentL2 = null; } 
        } else if (level === 2) { 
            if (currentL1) { currentL2 = item; currentL1.children.push(currentL2); } 
        } else if (level === 3) { 
            if (currentL2) { currentL2.children.push(item); }
        }
    });
    return cards;
}

// --- RENDER (GIỮ NGUYÊN) ---
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
    } else {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="submenu-item" ${onClickAttr} title="${item.note || ''}">
                <span style="display:flex; align-items:center; gap:8px;">
                    ${item.level === 3 ? '<i class="fas fa-angle-right" style="font-size:0.6rem"></i>' : ''}
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

// --- CANVAS (GIỮ NGUYÊN) ---
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
