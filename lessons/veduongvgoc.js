/**
 * Tệp tin: vegocsodo.js
 * Công dụng: Mô phỏng quá trình vẽ góc bằng Animation trên thẻ Canvas
 * Thuộc Hệ sinh thái: Smart School (N's SoftWave)
 */

const AngleSimulator = {
    canvas: null,
    ctx: null,
    animationId: null,
    
    // Cấu hình thông số vẽ
    config: {
        x: 0, y: 0,             // Tọa độ đỉnh (Sẽ canh giữa màn hình)
        rayLength: 200,         // Độ dài tia
        arcRadius: 50,          // Bán kính cung tròn
        color: '#0891b2',       // Màu sắc chủ đạo (primary-neon)
        speed: 1.5              // Tốc độ quét góc (độ/frame)
    },

    // Biến lưu trạng thái Animation
    state: {
        isDrawing: false,
        targetAngle: 0,
        currentAngle: 0,
        phase: 0 // 0: Chờ, 1: Vẽ tia 1, 2: Quét góc, 3: Hoàn thành
    },

    // 1. Hàm Khởi tạo
    init: function() {
        // Tìm canvas trên board.html (Ưu tiên ID hero-canvas hoặc lấy canvas đầu tiên)
        this.canvas = document.getElementById('hero-canvas') || document.querySelector('canvas');
        if (!this.canvas) {
            console.error("Lỗi: Không tìm thấy thẻ <canvas> trên trang board.html");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Cập nhật tọa độ tâm
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Tạo giao diện nhập liệu (Control Panel)
        this.createUI();
    },

    resize: function() {
        // Lấy tâm canvas làm đỉnh góc
        this.config.x = this.canvas.width / 2;
        this.config.y = this.canvas.height / 2 + 50; 
    },

    // 2. Tạo Bảng điều khiển nhập góc (Tự động chèn vào HTML để không phá vỡ cấu trúc cũ)
    createUI: function() {
        if (document.getElementById('angle-sim-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'angle-sim-panel';
        panel.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; color: #083344; margin-bottom: 10px; font-size: 1.1rem; border-bottom: 2px dashed rgba(8, 145, 178, 0.3); padding-bottom: 5px;">
                <i class="fas fa-drafting-compass"></i> MÔ PHỎNG VẼ GÓC
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" id="sim-angle-input" placeholder="Nhập độ (0-360)" min="0" max="360" 
                    style="width: 130px; padding: 8px 12px; border: 1px solid rgba(8,145,178,0.3); border-radius: 6px; outline: none; font-family: 'Roboto Mono'; color: #083344; font-weight: bold;">
                <button id="sim-draw-btn" style="background: #0891b2; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(8,145,178,0.2);">
                    <i class="fas fa-play"></i> VẼ NGAY
                </button>
            </div>
            <div id="sim-msg" style="margin-top: 8px; font-size: 0.8rem; color: #ef4444; font-family: 'Inter', sans-serif;"></div>
        `;

        // CSS cho bảng điều khiển (Glassmorphism)
        Object.assign(panel.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(8, 145, 178, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            zIndex: '9999'
        });

        document.body.appendChild(panel);

        // Gắn sự kiện cho nút vẽ
        document.getElementById('sim-draw-btn').addEventListener('click', () => {
            const val = parseInt(document.getElementById('sim-angle-input').value);
            const msg = document.getElementById('sim-msg');
            
            if (isNaN(val) || val < 0 || val > 360) {
                msg.innerText = "* Vui lòng nhập góc từ 0 đến 360 độ.";
                return;
            }
            msg.innerText = "";
            this.startSimulation(val);
        });
    },

    // 3. Bắt đầu mô phỏng
    startSimulation: function(degree) {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        // Reset trạng thái
        this.state.targetAngle = degree;
        this.state.currentAngle = 0;
        this.state.phase = 1;
        this.state.isDrawing = true;

        // Xóa bảng vẽ
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Gọi vòng lặp animation
        this.animate();
    },

    // 4. Vòng lặp Animation vẽ từng frame
    animate: function() {
        if (!this.state.isDrawing) return;

        const { x, y, rayLength, arcRadius, color, speed } = this.config;
        const ctx = this.ctx;

        // Xóa lại bảng vẽ ở mỗi frame (chỉ xóa khu vực vẽ để nhẹ máy nếu cần, nhưng clearRect toàn bộ an toàn hơn)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // BƯỚC 1: Vẽ đỉnh và Tia gốc (Nằm ngang)
        const startRad = 0; // Tia gốc hướng sang phải
        const endX1 = x + rayLength;
        const endY1 = y;

        // Vẽ chấm đỉnh
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ tia 1
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX1, endY1);
        ctx.stroke();

        // BƯỚC 2: Quét vòng cung
        if (this.state.phase >= 2) {
            // Tăng góc dần lên tạo hiệu ứng quét
            if (this.state.currentAngle < this.state.targetAngle) {
                this.state.currentAngle += speed;
                if (this.state.currentAngle > this.state.targetAngle) {
                    this.state.currentAngle = this.state.targetAngle; // Khóa mốc
                    this.state.phase = 3; // Chuyển sang vẽ tia 2
                }
            }

            // Vẽ vòng cung quét (Ngược chiều kim đồng hồ)
            const currentRad = -(this.state.currentAngle * Math.PI / 180);
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Nét đứt mô phỏng đường vẽ
            ctx.arc(x, y, arcRadius, startRad, currentRad, true);
            ctx.stroke();
            ctx.setLineDash([]); // Trả lại nét liền

            // Vẽ tia thứ 2 đang chạy theo vòng cung
            const currentEndX2 = x + rayLength * Math.cos(currentRad);
            const currentEndY2 = y + Math.sin(currentRad) * rayLength;
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.moveTo(x, y);
            ctx.lineTo(currentEndX2, currentEndY2);
            ctx.stroke();
        }

        // BƯỚC 3: Hoàn thành, in số đo
        if (this.state.phase === 3) {
            this.state.isDrawing = false; // Dừng animation
            
            // Vẽ lại tia 2 cho sắc nét
            const finalRad = -(this.state.targetAngle * Math.PI / 180);
            
            ctx.font = 'bold 20px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const bisectRad = finalRad / 2;
            const textDist = arcRadius + 30;
            ctx.fillText(`${this.state.targetAngle}°`, x + textDist * Math.cos(bisectRad), y + textDist * Math.sin(bisectRad));
            
            return; // Kết thúc vòng lặp
        }

        // Chuyển pha sau khi vẽ xong tia 1
        if (this.state.phase === 1) {
            setTimeout(() => { this.state.phase = 2; }, 300); // Trễ 0.3s cho mượt
        }

        // Tiếp tục gọi frame tiếp theo
        this.animationId = requestAnimationFrame(() => this.animate());
    }
};

// Khởi chạy khi tài liệu tải xong
window.addEventListener('DOMContentLoaded', () => {
    AngleSimulator.init();
});