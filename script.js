// --- CONFIG ---
const SHEET_ID = '1HoArwLdyt3SOLSF19L6D5Bhl0GXEYKALb2kPijZLet4';
const SHEET_NAME = 'CSDL';

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    animateCanvas();
    fetchSheetData().then(data => {
        if (data) renderDashboard(data);
    });
});

// --- FETCH DATA ---
async function fetchSheetData() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        return parseData(json.table.rows);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('dynamic-grid').innerHTML = '<div style="color:red; text-align:center;">Load Failed</div>';
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

        if (level === 0) { currentCard = item; cards.push(currentCard); currentL1 = null; }
        else if (level === 1) { if (currentCard) { currentL1 = item; currentCard.children.push(currentL1); currentL2 = null; } }
        else if (level === 2) { if (currentL1) { currentL2 = item; currentL1.children.push(currentL2); } }
        else if (level === 3) { if (currentL2) currentL2.children.push(item); }
    });
    return cards;
}

// --- RENDER ---
function renderDashboard(cards) {
    const grid = document.getElementById('dynamic-grid');
    grid.innerHTML = '';

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

// --- CANVAS BACKGROUND ---
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
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            size: Math.random() * 1.8,
            alpha: Math.random()
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
