// ==========================================
// CẤU HÌNH SAI SỐ HÌNH ẢNH (Hiệu chuẩn thủ công)
// ==========================================
const CONFIG = {
    // 1. SAI SỐ CÂY BÚT CHÌ (Pencil)
    PENCIL_OFFSET_X: -11,  // Chỉnh ngòi bút qua Trái/Phải (Số âm là dịch sang trái, số dương là dịch sang phải)
    PENCIL_OFFSET_Y: 5,    // Chỉnh ngòi bút lên/Xuống (Số âm là nhích lên trên, số dương là nhích xuống dưới)
    PENCIL_ANGLE: Math.PI / 6, // Góc nghiêng của bút (Mặc định nghiêng 30 độ cho tay phải)

    // 2. SAI SỐ CÂY THƯỚC (Ruler)
    RULER_GAP: 6,          // Khoảng hở giữa mép thước và vạch đen 
    RULER_ZERO_OFFSET: 13, // Độ lệch từ mép trái của ảnh thước đến "vạch số 0" (px). Chỉnh số này để vạch 0 khớp điểm A!
    RULER_TRANSPARENT_TOP: 0.0, // Tỉ lệ viền trong suốt ở mép trên của ảnh thước 

    // 3. THÔNG SỐ THỜI GIAN (Điều khiển nhịp độ bài học)
    DELAY_SHORT: 500,      // Nhịp nghỉ ngắn (Cất đồ nghề)
    DELAY_NORMAL: 1000,    // Nhịp suy ngẫm (Chờ học sinh nhìn)
    DELAY_LONG: 2000,      // Nhịp nghỉ dài
    SPEED_MOVE: 1500,      // Tốc độ bay của thước (ms)
    SPEED_DRAW: 3500       // Tốc độ kéo bút vẽ đường thẳng (ms)
};

// ==========================================
// THƯ VIỆN ĐỘNG CƠ HÌNH HỌC - SMART SCHOOL
// ==========================================

class GeometryEngine {
    constructor(ctxDraw, ctxTools, imgRuler, imgPencil, canvasWidth = 800, canvasHeight = 600) {
        this.ctxDraw = ctxDraw;     
        this.ctxTools = ctxTools;   
        this.imgRuler = imgRuler;   
        this.imgPencil = imgPencil; 
        this.width = canvasWidth;
        this.height = canvasHeight;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearTools() {
        this.ctxTools.clearRect(0, 0, this.width, this.height);
    }

    // ==========================================
    // HÀM TƯƠNG TÁC: LẤY TỌA ĐỘ CHUỘT
    // ==========================================
    
    async getClickPoint(label = "", isBelow = false) {
        return new Promise(resolve => {
            // SỬA LẠI: Lắng nghe trên lớp giấy vẽ cố định (lớp này mới nhận được click)
            const canvas = this.ctxDraw.canvas; 
            
            const handleClick = (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                const scaleY = this.height / rect.height;
                
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                const point = {x, y};
                
                this.drawPoint(point, label, isBelow);
                canvas.removeEventListener('click', handleClick);
                resolve(point);
            };
            
            canvas.addEventListener('click', handleClick);
        });
    }

    // ------------------------------------------
    // CÁC HÀM PHỤ TRỢ (VẼ TĨNH)
    // ------------------------------------------

    drawPoint(point, label = "", isBelow = false) {
        if (!point) return;
        
        // Luôn vẽ chấm tròn xanh tại vị trí đầu mút
        this.ctxDraw.beginPath();
        this.ctxDraw.arc(point.x, point.y, 4, 0, Math.PI * 2);
        this.ctxDraw.fillStyle = '#1a73e8';
        this.ctxDraw.fill();
        
        // Chỉ in text khi tham số label có nội dung (khác rỗng)
        if (label !== "") {
            this.ctxDraw.fillStyle = '#000';
            this.ctxDraw.font = 'bold 18px Arial';
            let yOffset = isBelow ? 25 : -10;
            this.ctxDraw.fillText(label, point.x - 5, point.y + yOffset);
        }
    }

    drawRulerSprite(A, B, customPos = null) {
        let angle = Math.atan2(B.y - A.y, B.x - A.x);
        let distance = Math.hypot(B.x - A.x, B.y - A.y);
        let posX = customPos ? customPos.x : A.x;
        let posY = customPos ? customPos.y : A.y;

        this.ctxTools.save();
        this.ctxTools.translate(posX, posY);
        this.ctxTools.rotate(angle);
        
        let minWidth = distance + CONFIG.RULER_ZERO_OFFSET + 50;
        let rulerWidth = Math.max(minWidth, 300);
        let rulerHeight = rulerWidth * (this.imgRuler.height / this.imgRuler.width);

        let offsetY = CONFIG.RULER_GAP - (rulerHeight * CONFIG.RULER_TRANSPARENT_TOP); 
        let offsetX = -CONFIG.RULER_ZERO_OFFSET; 

        this.ctxTools.drawImage(this.imgRuler, offsetX, offsetY, rulerWidth, rulerHeight); 
        this.ctxTools.restore();
    }

    drawPencilSprite(x, y) {
        this.ctxTools.save();
        this.ctxTools.translate(x, y);
        this.ctxTools.rotate(CONFIG.PENCIL_ANGLE); 
        
        let pencilWidth = 55; 
        let pencilHeight = pencilWidth * (this.imgPencil.height / this.imgPencil.width);
        
        let drawX = CONFIG.PENCIL_OFFSET_X;
        let drawY = -pencilHeight + CONFIG.PENCIL_OFFSET_Y;

        this.ctxTools.drawImage(this.imgPencil, drawX, drawY, pencilWidth, pencilHeight); 
        this.ctxTools.restore();
    }

    drawTickMark(ctx, A, B, type = 1) {
        if (!type || type <= 0) return; 

        let midX = (A.x + B.x) / 2;
        let midY = (A.y + B.y) / 2;
        let angle = Math.atan2(B.y - A.y, B.x - A.x);
        
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        let spacing = 4; 
        let startX = -(type - 1) * spacing / 2; 

        for (let i = 0; i < type; i++) {
            ctx.beginPath();
            ctx.moveTo(startX + (i * spacing), -6); 
            ctx.lineTo(startX + (i * spacing), 6); 
            ctx.stroke();
        }
        ctx.restore();
    }

    // ------------------------------------------
    // CÁC HÀM PHỤ TRỢ (ANIMATION)
    // ------------------------------------------

    async animateRulerMove(A, B, duration) {
        const startTime = performance.now();
        const startX = -100; 
        const startY = this.height + 100;

        return new Promise(resolve => {
            const step = (now) => {
                let progress = (now - startTime) / duration;
                if(progress > 1) progress = 1;

                let easeProgress = 1 - Math.pow(1 - progress, 3);
                let currentX = startX + (A.x - startX) * easeProgress;
                let currentY = startY + (A.y - startY) * easeProgress;

                this.clearTools();
                this.drawRulerSprite(A, B, {x: currentX, y: currentY});

                if(progress < 1) {
                    requestAnimationFrame(step); 
                } else {
                    resolve(); 
                }
            }
            requestAnimationFrame(step);
        });
    }

    async animateLineDraw(A, B, duration) {
        const startTime = performance.now();
        return new Promise(resolve => {
            const step = (now) => {
                let progress = (now - startTime) / duration;
                if(progress > 1) progress = 1;

                let currentX = A.x + (B.x - A.x) * progress;
                let currentY = A.y + (B.y - A.y) * progress;

                this.clearTools();
                this.drawRulerSprite(A, B);

                this.ctxTools.beginPath();
                this.ctxTools.moveTo(A.x, A.y);
                this.ctxTools.lineTo(currentX, currentY);
                this.ctxTools.strokeStyle = 'black';
                this.ctxTools.lineWidth = 2;
                this.ctxTools.stroke();

                this.drawPencilSprite(currentX, currentY);

                if(progress < 1) {
                    requestAnimationFrame(step); 
                } else {
                    this.ctxDraw.beginPath();
                    this.ctxDraw.moveTo(A.x, A.y);
                    this.ctxDraw.lineTo(B.x, B.y);
                    this.ctxDraw.strokeStyle = 'black';
                    this.ctxDraw.lineWidth = 2;
                    this.ctxDraw.stroke();
                    resolve(); 
                }
            }
            requestAnimationFrame(step);
        });
    }

    // ==========================================
    // HÀM CHÍNH 1: VẼ ĐOẠN THẲNG
    // ==========================================
    
    async drawSegment(pt1, pt2, label1 = "", label2 = "") {
        let A, B, labelA, labelB;
        if (pt1.x < pt2.x) {
            A = pt1; B = pt2; 
            labelA = label1; labelB = label2;
        } else if (pt1.x > pt2.x) {
            A = pt2; B = pt1; 
            labelA = label2; labelB = label1; 
        } else {
            A = (pt1.y < pt2.y) ? pt1 : pt2;
            B = (pt1.y < pt2.y) ? pt2 : pt1;
            labelA = (pt1.y < pt2.y) ? label1 : label2;
            labelB = (pt1.y < pt2.y) ? label2 : label1;
        }

        this.drawPoint(A, labelA);
        this.drawPoint(B, labelB);

        await this.animateRulerMove(A, B, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 

        this.drawRulerSprite(A, B); 
        this.drawPencilSprite(A.x, A.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        await this.animateLineDraw(A, B, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 

        this.clearTools(); 
        this.drawRulerSprite(A, B); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT);
    }

    // ==========================================
    // HÀM CHÍNH 2: VẼ TRUNG ĐIỂM
    // ==========================================
    
    async drawMidpoint(pt1, pt2, label = "M", markType = null) {
        let A, B;
        if (pt1.x < pt2.x) {
            A = pt1; B = pt2; 
        } else if (pt1.x > pt2.x) {
            A = pt2; B = pt1; 
        } else {
            A = (pt1.y < pt2.y) ? pt1 : pt2;
            B = (pt1.y < pt2.y) ? pt2 : pt1;
        }

        let midM = {
            x: (A.x + B.x) / 2,
            y: (A.y + B.y) / 2
        };

        await this.animateRulerMove(A, B, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 

        this.drawRulerSprite(A, B);
        this.drawPencilSprite(midM.x, midM.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        this.drawPoint(midM, label, true);
        await this.sleep(CONFIG.DELAY_LONG); 

        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        if (markType) {
            this.drawTickMark(this.ctxDraw, A, midM, markType);
            this.drawTickMark(this.ctxDraw, midM, B, markType);
        }
    }



// ==========================================
    // CÁC HÀM TOÁN HỌC & KÝ HIỆU NÂNG CAO
    // ==========================================

    // 1. Hàm tính tọa độ chân đường vuông góc (H) hạ từ C xuống AB
    getProjectionPoint(A, B, C) {
        let dx = B.x - A.x;
        let dy = B.y - A.y;
        let lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return A; // Đề phòng A trùng B
        
        // Công thức chiếu vector hình học giải tích
        let dot = (C.x - A.x) * dx + (C.y - A.y) * dy;
        let param = dot / lenSq;
        
        return {
            x: A.x + param * dx,
            y: A.y + param * dy
        };
    }

    // 2. Hàm vẽ ký hiệu góc vuông chuẩn xác
    drawRightAngleMark(ctx, A, B, C, H) {
        let angleAB = Math.atan2(B.y - A.y, B.x - A.x);
        
        ctx.save();
        ctx.translate(H.x, H.y);
        ctx.rotate(angleAB);
        
        // Dùng ma trận xoay để xác định C nằm ở nửa mặt phẳng trên hay dưới
        let cx = C.x - H.x;
        let cy = C.y - H.y;
        let localCy = -cx * Math.sin(angleAB) + cy * Math.cos(angleAB);
        let signY = localCy > 0 ? 1 : -1;

        // Tính xem đoạn HA hay HB dài hơn để vẽ góc vuông quay về phần không gian rộng hơn
        let lenHA = Math.hypot(A.x - H.x, A.y - H.y);
        let lenHB = Math.hypot(B.x - H.x, B.y - H.y);
        let signX = lenHB >= lenHA ? 1 : -1;
        
        let size = 12; // Kích thước cạnh của ô vuông đỏ (px)
        
        ctx.beginPath();
        ctx.moveTo(signX * size, 0);
        ctx.lineTo(signX * size, signY * size);
        ctx.lineTo(0, signY * size);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    // ==========================================
    // HÀM CHÍNH 3: VẼ ĐƯỜNG VUÔNG GÓC TỪ C XUỐNG AB
    // Tham số: Tọa độ 3 điểm A, B, C và cờ bật/tắt ký hiệu góc vuông
    // ==========================================
    async drawPerpendicular(A, B, C, showRightAngle = true) {
        // 1. Máy tính nhẩm tìm chân đường cao H
        let H = this.getProjectionPoint(A, B, C);
        
        // 2. Ép buộc kẻ từ Trái sang Phải (nguyên tắc thuận tay phải)
        let startPt = C, endPt = H;
        if (C.x > H.x) {
            startPt = H; endPt = C;
        }

        // Bước 1: Bay thước thẳng đến đoạn cần kẻ
        await this.animateRulerMove(startPt, endPt, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 

        // Bước 2: Đặt bút
        this.drawRulerSprite(startPt, endPt);
        this.drawPencilSprite(startPt.x, startPt.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        // Bước 3: Kéo bút vẽ đoạn CH (hoặc HC)
        await this.animateLineDraw(startPt, endPt, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 

        // Bước 4: Ẩn đồ nghề
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT); 

        // Bước 5: In ký hiệu góc vuông đỏ tại H nếu có yêu cầu
        if (showRightAngle) {
            this.drawRightAngleMark(this.ctxDraw, A, B, C, H);
            
            // Vẽ thêm 1 chấm xanh nhỏ chốt ở chân đường cao cho đẹp
            this.drawPoint(H, "", false);
        }
    }




















} // <--- ĐÓNG NGOẶC CLASS TẠI ĐÂY LÀ CHUẨN XÁC NHẤT!

