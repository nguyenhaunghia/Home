// ==========================================
// BÀI THỰC HÀNH: VẼ GÓC KHI BIẾT SỐ ĐO
// Đã nâng cấp: Tia xuyên qua x, Dấu chấm siêu nhỏ, Tự động Zoom thước
// ==========================================

function askForAngle(textInst) {
    return new Promise(resolve => {
        textInst.innerHTML = `
            <span style="color: #083344;">Bước 3: Nhập số đo góc (Nhấn phím <b>Enter</b> để xác nhận):</span>
            <input type="number" id="angle-input" value="60" min="1" max="360" style="width: 80px; margin: 0 10px; padding: 4px 8px; font-family: 'Roboto Mono'; font-weight: bold; border: 2px solid #0891b2; border-radius: 6px; outline: none;">
        `;
        
        const inputField = document.getElementById('angle-input');
        inputField.focus(); 

        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                let val = parseFloat(this.value);
                if (!isNaN(val) && val > 0 && val <= 360) {
                    resolve(val); 
                } else {
                    alert("Vui lòng nhập số đo hợp lệ từ 1 đến 360 độ!");
                }
            }
        });
    });
}

window.startLesson = async function(env) {
    const { ctxDraw, textInst, geoEngine } = env;

    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) headerTitle.innerText = "VẼ GÓC BIẾT SỐ ĐO";
    const toolTitle = document.querySelector('.tool-title');
    if (toolTitle) toolTitle.style.display = "none";

    while (true) {
        // --- BƯỚC 1: XÁC ĐỊNH ĐỈNH O ---
        textInst.innerText = "Bước 1: Hãy nhấp chuột chọn vị trí điểm O (Đỉnh góc).";
        textInst.style.color = "#d93025";
        let vertex = await geoEngine.getClickPoint('O', true, 'point');

        // --- BƯỚC 2: ĐỊNH HƯỚNG TIA GỐC OX ---
        textInst.innerText = "Bước 2: Hãy nhấp chuột chọn một điểm để xác định hướng tia Ox.";
        textInst.style.color = "#f4b400";
        let ray1Point = await geoEngine.getClickPoint('x', false, 'direction');

        // --- BƯỚC 3: NHẬP SỐ ĐO GÓC ---
        let measure = await askForAngle(textInst);

        // --- BƯỚC 4: HỆ THỐNG MÔ PHỎNG VẼ ---
        textInst.innerText = `Bước 4: Đang kẻ tia gốc Ox...`;
        textInst.style.color = "#0891b2";

        // TÍNH TOÁN CỰ LY: Đo khoảng cách O-x để đảm bảo tia dài qua khỏi x
        let distOx = Math.hypot(ray1Point.x - vertex.x, ray1Point.y - vertex.y);
        let rayLength = Math.max(260, distOx + 80); // Luôn phóng qua x thêm 80px, tối thiểu 260px
        
        let startRad = Math.atan2(ray1Point.y - vertex.y, ray1Point.x - vertex.x);
        let endPt1 = { 
            x: vertex.x + rayLength * Math.cos(startRad), 
            y: vertex.y + rayLength * Math.sin(startRad) 
        };

        // Kẻ tia Ox
        await geoEngine.drawRay(vertex, endPt1, "", "", "direction");

        // Động cơ tính tỷ lệ Zoom thước đo góc sao cho bao trọn 80% độ dài tia
        let proWidth = Math.max(280, rayLength * 0.85); 

        // Đưa thước đo độ vào với Size đã được tính
        textInst.innerText = `Bước 5: Đặt tâm thước đo góc trùng với đỉnh O, vạch 0° trùng tia Ox...`;
        if (typeof geoEngine.animateProtractorMove === 'function') {
            await geoEngine.animateProtractorMove(vertex, startRad, geoEngine.CONFIG?.SPEED_MOVE || 2500, proWidth);
            await geoEngine.sleep(1000);

            // Tỷ lệ vạch số thường cách tâm một khoảng = 42% chiều rộng thước (Bạn có thể tinh chỉnh 0.42 này cho khớp ảnh thước của bạn)
            let markDist = proWidth * 0.42; 
            let endRad = startRad - (measure * Math.PI / 180); 
            let markPt = { 
                x: vertex.x + markDist * Math.cos(endRad), 
                y: vertex.y + Math.sin(endRad) * markDist 
            };
            
            textInst.innerText = `Bước 6: Đánh dấu ở vạch ${measure}° trên thước đo góc.`;
            geoEngine.drawPencilSprite(markPt.x, markPt.y);
            await geoEngine.sleep(500);
            
            // ÉP KIỂU NÉT: Dùng "direction" để tạo dấu phẩy siêu nhỏ 0.8px thay vì cục tròn to
            geoEngine.drawPoint(markPt, "", false, "direction"); 
            await geoEngine.sleep(1500);

            geoEngine.clearTools();
            await geoEngine.sleep(500);

            // Kẻ tia Oy
            textInst.innerText = `Bước 7: Kẻ tia Oy đi qua đỉnh và điểm vừa làm dấu...`;
            let endPt2 = { 
                x: vertex.x + rayLength * Math.cos(endRad), 
                y: vertex.y + Math.sin(endRad) * rayLength 
            };
            await geoEngine.drawRay(vertex, endPt2, "", "y", "direction");
        }

    
        // Đóng mộc Sư phạm lên cuối cùng
        if (typeof drawPedagogicalAngle === "function") {
            drawPedagogicalAngle(
                ctxDraw, 
                vertex, 
                ray1Point, 
                measure, 
                { vertex: '', ray1: '', ray2: '' }, 
                // THÊM drawLines: false ĐỂ KHÔNG ĐÈ NÉT LÊN ĐƯỜNG BÚT CHÌ
                { showMeasure: true, rayLength: rayLength, drawLines: false } 
            );
        }


        // --- KẾT THÚC ---
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ trên bảng để thực hành lại.";
        textInst.style.color = "#0f9d58"; 
        await geoEngine.getClickPoint("", false, "none"); 
        ctxDraw.clearRect(0, 0, ctxDraw.canvas.width, ctxDraw.canvas.height);
        geoEngine.clearTools();
    }
};