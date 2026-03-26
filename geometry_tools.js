// ==========================================
// CẤU HÌNH SAI SỐ HÌNH ẢNH (Hiệu chuẩn thủ công)
// ==========================================
const CONFIG = {
    // 1. SAI SỐ CÂY BÚT CHÌ (Pencil)
    PENCIL_OFFSET_X: -11,  
    PENCIL_OFFSET_Y: 5,    
    PENCIL_ANGLE: Math.PI / 6, 

    // 2. SAI SỐ CÂY THƯỚC (Ruler)
    RULER_GAP: 6,          
    RULER_ZERO_OFFSET: 12, 
    RULER_TRANSPARENT_TOP: 0.0, 

    // 3. SAI SỐ Ê-KE (Set Square)
    EKE_OFFSET_X: 5, // Dịch chuyển góc vuông Eke qua trái/phải để khớp H
    EKE_OFFSET_Y: 0, // Dịch chuyển góc vuông Eke lên/xuống để khớp cạnh AB
    EKE_GAP: 3,      // Khoảng hở mép Ê-ke so với đường thẳng (px)

    // 4. THÔNG SỐ THỜI GIAN (Điều khiển nhịp độ bài học)
    DELAY_SHORT: 500,      
    DELAY_NORMAL: 2000,    
    DELAY_LONG: 2500,      
    SPEED_MOVE: 2500,      
    SPEED_DRAW: 3500,
    
    // 5. SAI SỐ THƯỚC ĐO GÓC (Protractor) - ĐÃ SỬA: Đưa vào trong ngoặc của CONFIG
    PROTRACTOR_OFFSET_X: 0, // Dịch trái/phải để tâm thước khớp đỉnh góc
    PROTRACTOR_OFFSET_Y: 0  // Dịch lên/xuống mép dưới của thước
};


// ==========================================
// THƯ VIỆN ĐỘNG CƠ HÌNH HỌC - SMART SCHOOL
// ==========================================

class GeometryEngine {
    // NÂNG CẤP: Bổ sung imgEke và imgProtractor vào hàm khởi tạo
    constructor(ctxDraw, ctxTools, imgRuler, imgPencil, imgEke, imgProtractor, canvasWidth = 800, canvasHeight = 600) {
        this.ctxDraw = ctxDraw;     
        this.ctxTools = ctxTools;   
        this.imgRuler = imgRuler;   
        this.imgPencil = imgPencil; 
        this.imgEke = imgEke;       
        this.imgProtractor = imgProtractor; // <--- KHAI BÁO THÊM THƯỚC ĐO GÓC
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

    async getClickPoint(label = "", isBelow = false, style = "point") {
        return new Promise(resolve => {
            const canvas = this.ctxDraw.canvas; 
            
            const handleClick = (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                const scaleY = this.height / rect.height;
                
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                const point = {x, y};
                
                // Gọi hàm vẽ điểm với tham số style (point hoặc direction)
                this.drawPoint(point, label, isBelow, style);
                canvas.removeEventListener('click', handleClick);
                resolve(point);
            };
            
            canvas.addEventListener('click', handleClick);
        });
    }

    // ------------------------------------------
    // CÁC HÀM PHỤ TRỢ (VẼ TĨNH)
    // ------------------------------------------

    drawPoint(point, label = "", position = null, style = "point") {
        if (!point) return;
        
        if (style === "point") {
            this.ctxDraw.beginPath();
            this.ctxDraw.arc(point.x, point.y, 4, 0, Math.PI * 2);
            this.ctxDraw.fillStyle = '#1a73e8';
            this.ctxDraw.fill();
        } else if (style === "direction") {
            this.ctxDraw.beginPath();
            // CẬP NHẬT: Đổi 1.5 thành 0.8 để chấm hướng nhỏ xíu lại
            this.ctxDraw.arc(point.x, point.y, 0.8, 0, Math.PI * 2);
            this.ctxDraw.fillStyle = '#001F3F';
            this.ctxDraw.fill();
        }
        
        if (label !== "") {
            this.ctxDraw.font = (style === "direction") ? 'italic 18px Arial' : 'bold 18px Arial';
            
            let textX = point.x - 5;
            let textY = point.y - 12; 

            if (position === true) {
                textY = point.y + 25; 
            } else if (typeof position === 'number') {
                let radius = 22; 
                textX = point.x + Math.cos(position) * radius - 8;
                textY = point.y + Math.sin(position) * radius + 6; 
            }

            this.ctxDraw.lineWidth = 4;
            this.ctxDraw.strokeStyle = '#ffffff'; 
            this.ctxDraw.strokeText(label, textX, textY);

            // MÀU NHÃN MỚI: Áp dụng Xanh Đen (Navy Blue)
            this.ctxDraw.fillStyle = '#001F3F'; 
            this.ctxDraw.fillText(label, textX, textY);
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

    drawEkeSprite(H, angle, flipY = 1, customPos = null) {
        let posX = customPos ? customPos.x : H.x;
        let posY = customPos ? customPos.y : H.y;

        this.ctxTools.save();
        this.ctxTools.translate(posX, posY);
        this.ctxTools.rotate(angle);
        this.ctxTools.scale(1, flipY); 

        let ekeWidth = 220; 
        let ekeHeight = ekeWidth * (this.imgEke.height / this.imgEke.width);

        let offsetX = CONFIG.EKE_OFFSET_X;
        // Kéo Ê-ke dịch ra xa vạch đường kẻ một khoảng EKE_GAP
        let offsetY = -ekeHeight + CONFIG.EKE_OFFSET_Y - CONFIG.EKE_GAP;

        this.ctxTools.drawImage(this.imgEke, offsetX, offsetY, ekeWidth, ekeHeight); 
        this.ctxTools.restore();
    }

   // THAY THẾ 2 HÀM NÀY TRONG class GeometryEngine (geometry_tools.js)

    drawProtractorSprite(centerPt, angle, customPos = null, proWidth = 280) {
        let posX = customPos ? customPos.x : centerPt.x;
        let posY = customPos ? customPos.y : centerPt.y;

        this.ctxTools.save();
        this.ctxTools.translate(posX, posY);
        this.ctxTools.rotate(angle);

        let proHeight = proWidth * (this.imgProtractor.height / this.imgProtractor.width);

        let offsetX = -proWidth / 2 + CONFIG.PROTRACTOR_OFFSET_X;
        let offsetY = -proHeight + CONFIG.PROTRACTOR_OFFSET_Y;

        this.ctxTools.drawImage(this.imgProtractor, offsetX, offsetY, proWidth, proHeight); 
        this.ctxTools.restore();
    }

    async animateProtractorMove(centerPt, angle, duration, proWidth = 280) {
        const startTime = performance.now();
        const startX = -100; 
        const startY = this.height + 100;

        return new Promise(resolve => {
            const step = (now) => {
                let progress = (now - startTime) / duration;
                if(progress > 1) progress = 1;

                let easeProgress = 1 - Math.pow(1 - progress, 3);
                let currentX = startX + (centerPt.x - startX) * easeProgress;
                let currentY = startY + (centerPt.y - startY) * easeProgress;

                this.clearTools();
                this.drawProtractorSprite(centerPt, angle, {x: currentX, y: currentY}, proWidth);

                if(progress < 1) {
                    requestAnimationFrame(step); 
                } else {
                    resolve(); 
                }
            }
            requestAnimationFrame(step);
        });
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

    async animateEkeMove(H, angle, flipY, duration) {
        const startTime = performance.now();
        const startX = -100; 
        const startY = this.height + 100;

        return new Promise(resolve => {
            const step = (now) => {
                let progress = (now - startTime) / duration;
                if(progress > 1) progress = 1;

                let easeProgress = 1 - Math.pow(1 - progress, 3);
                let currentX = startX + (H.x - startX) * easeProgress;
                let currentY = startY + (H.y - startY) * easeProgress;

                this.clearTools();
                this.drawEkeSprite(H, angle, flipY, {x: currentX, y: currentY});

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

    async animateLineDrawEke(startPt, endPt, H, angle, flipY, duration) {
        const startTime = performance.now();
        return new Promise(resolve => {
            const step = (now) => {
                let progress = (now - startTime) / duration;
                if(progress > 1) progress = 1;

                let currentX = startPt.x + (endPt.x - startPt.x) * progress;
                let currentY = startPt.y + (endPt.y - startPt.y) * progress;

                this.clearTools();
                this.drawEkeSprite(H, angle, flipY);

                this.ctxTools.beginPath();
                this.ctxTools.moveTo(startPt.x, startPt.y);
                this.ctxTools.lineTo(currentX, currentY);
                this.ctxTools.strokeStyle = 'black';
                this.ctxTools.setLineDash([5, 5]); // Nét đứt
                this.ctxTools.lineWidth = 2;
                this.ctxTools.stroke();
                this.ctxTools.setLineDash([]); // Reset

                this.drawPencilSprite(currentX, currentY);

                if(progress < 1) {
                    requestAnimationFrame(step); 
                } else {
                    this.ctxDraw.beginPath();
                    this.ctxDraw.moveTo(startPt.x, startPt.y);
                    this.ctxDraw.lineTo(endPt.x, endPt.y);
                    this.ctxDraw.strokeStyle = 'black';
                    this.ctxDraw.setLineDash([5, 5]);
                    this.ctxDraw.lineWidth = 2;
                    this.ctxDraw.stroke();
                    this.ctxDraw.setLineDash([]);
                    resolve(); 
                }
            }
            requestAnimationFrame(step);
        });
    }

    // ==========================================
    // CÁC HÀM TOÁN HỌC & KÝ HIỆU NÂNG CAO
    // ==========================================

    getProjectionPoint(A, B, C) {
        let dx = B.x - A.x;
        let dy = B.y - A.y;
        let lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return A; 
        
        let dot = (C.x - A.x) * dx + (C.y - A.y) * dy;
        let param = dot / lenSq;
        
        return {
            x: A.x + param * dx,
            y: A.y + param * dy
        };
    }

    drawRightAngleMark(ctx, A, B, C, H) {
        let angleAB = Math.atan2(B.y - A.y, B.x - A.x);
        
        ctx.save();
        ctx.translate(H.x, H.y);
        ctx.rotate(angleAB);
        
        let cx = C.x - H.x;
        let cy = C.y - H.y;
        let localCy = -cx * Math.sin(angleAB) + cy * Math.cos(angleAB);
        let signY = localCy > 0 ? 1 : -1;

        let lenHA = Math.hypot(A.x - H.x, A.y - H.y);
        let lenHB = Math.hypot(B.x - H.x, B.y - H.y);
        let signX = lenHB >= lenHA ? 1 : -1;
        
        let size = 12; 
        
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
    // HÀM CHÍNH 1 & 2: VẼ ĐOẠN, ĐƯỜNG THẲNG & TRUNG ĐIỂM
    // ==========================================
    
    async drawSegment(pt1, pt2, label1 = "", label2 = "", isLine = false) {
        let A, B, labelA, labelB;
        if (pt1.x < pt2.x) {
            A = pt1; B = pt2; labelA = label1; labelB = label2;
        } else if (pt1.x > pt2.x) {
            A = pt2; B = pt1; labelA = label2; labelB = label1; 
        } else {
            A = (pt1.y < pt2.y) ? pt1 : pt2; B = (pt1.y < pt2.y) ? pt2 : pt1;
            labelA = (pt1.y < pt2.y) ? label1 : label2; labelB = (pt1.y < pt2.y) ? label2 : label1;
        }
        
        // TÍNH TOÁN GÓC NÉ TỰ ĐỘNG BẰNG VECTOR
        let angleAwayB = Math.atan2(A.y - B.y, A.x - B.x); // A dạt ra xa B
        let angleAwayA = Math.atan2(B.y - A.y, B.x - A.x); // B dạt ra xa A

        this.drawPoint(A, labelA, angleAwayB, "point");
        this.drawPoint(B, labelB, angleAwayA, "point");

        let drawStart = A, drawEnd = B;
        if (isLine) {
            let dx = B.x - A.x, dy = B.y - A.y;
            let length = Math.hypot(dx, dy);
            if (length > 0) {
                let extendLen = 50; 
                let ux = dx / length, uy = dy / length;
                drawStart = { x: A.x - ux * extendLen, y: A.y - uy * extendLen };
                drawEnd = { x: B.x + ux * extendLen, y: B.y + uy * extendLen };
            }
        }

        // ==========================================
        // CẬP NHẬT LUẬT SƯ PHẠM: TAY TRÁI THƯỚC, TAY PHẢI BÚT
        // ==========================================
        let drawA, drawB;
        if (drawStart.y < drawEnd.y) {
            drawA = drawStart; drawB = drawEnd; 
        } else if (drawStart.y > drawEnd.y) {
            drawA = drawEnd; drawB = drawStart; 
        } else {
            drawA = (drawStart.x < drawEnd.x) ? drawStart : drawEnd;
            drawB = (drawStart.x < drawEnd.x) ? drawEnd : drawStart;
        }

        await this.animateRulerMove(drawA, drawB, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.drawRulerSprite(drawA, drawB); 
        this.drawPencilSprite(drawA.x, drawA.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        await this.animateLineDraw(drawA, drawB, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        this.drawRulerSprite(drawA, drawB); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT);

        this.drawPoint(A, labelA, angleAwayB, "point");
        this.drawPoint(B, labelB, angleAwayA, "point");
    }

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

        let midM = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

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
    // HÀM CHÍNH 4: VẼ TIA (LUÔN VẼ TỪ GỐC ĐI RA)
    // ==========================================
    async drawRay(originPt, directionPt, labelOrigin = "", labelDirection = "", dirStyle = null) {
        if (dirStyle === null) {
            if (labelDirection !== "" && labelDirection === labelDirection.toUpperCase()) dirStyle = "point";
            else dirStyle = "direction";
        }

        let angleLine = Math.atan2(directionPt.y - originPt.y, directionPt.x - originPt.x);
        let angleAwayOrigin = angleLine + Math.PI; 
        let angleLabelDir = angleLine + Math.PI / 4; 

        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");
        this.drawPoint(directionPt, labelDirection, angleLabelDir, dirStyle);

        let dx = directionPt.x - originPt.x, dy = directionPt.y - originPt.y;
        let length = Math.hypot(dx, dy);
        
        // LUẬT SƯ PHẠM ĐÃ SỬA: Luôn lấy điểm xuất phát là Gốc (originPt)
        let drawStart = originPt;
        let drawEnd = directionPt;

        if (length > 0) {
            let extendLen = 60; 
            let ux = dx / length, uy = dy / length;
            drawEnd = { x: directionPt.x + ux * extendLen, y: directionPt.y + uy * extendLen };
        }

        // Bắt đầu mô phỏng: Kéo từ trong Gốc ra ngoài ngọn
        await this.animateRulerMove(drawStart, drawEnd, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.drawRulerSprite(drawStart, drawEnd); 
        this.drawPencilSprite(drawStart.x, drawStart.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        await this.animateLineDraw(drawStart, drawEnd, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        this.drawRulerSprite(drawStart, drawEnd); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT);

        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");
        this.drawPoint(directionPt, labelDirection, angleLabelDir, dirStyle);
    }

    // ==========================================
    // HÀM CHÍNH 5: VẼ GÓC (Angle)
    // ==========================================
    async drawAngle(originPt, pt1, pt2, labelOrigin = "O", label1 = "x", label2 = "y") {
        await this.drawRay(originPt, pt1, "", label1);
        await this.drawRay(originPt, pt2, "", label2);

        let angleLine1 = Math.atan2(pt1.y - originPt.y, pt1.x - originPt.x);
        let angleLine2 = Math.atan2(pt2.y - originPt.y, pt2.x - originPt.x);
        
        let midAngle = (angleLine1 + angleLine2) / 2;
        if (Math.abs(angleLine1 - angleLine2) > Math.PI) {
            midAngle += Math.PI;
        }
        let angleAwayOrigin = midAngle + Math.PI;
        
        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");

        let startAngle = angleLine1;
        let endAngle = angleLine2;
        let diff = endAngle - startAngle;
        
        if (diff > Math.PI) {
            startAngle = angleLine2; endAngle = angleLine1 + 2 * Math.PI;
        } else if (diff < -Math.PI) {
            startAngle = angleLine1; endAngle = angleLine2 + 2 * Math.PI;
        } else if (diff < 0) {
            startAngle = angleLine2; endAngle = angleLine1;
        }

        this.ctxDraw.beginPath();
        this.ctxDraw.arc(originPt.x, originPt.y, 30, startAngle, endAngle);
        this.ctxDraw.strokeStyle = 'red';
        this.ctxDraw.lineWidth = 2;
        this.ctxDraw.stroke();
    }

    // ==========================================
    // HÀM CHÍNH 3: VẼ ĐƯỜNG / ĐOẠN THẲNG VUÔNG GÓC
    // ==========================================
    async drawPerpendicular(A, B, C, isLine = false, labelLine = "", labelIntersection = "H", showRightAngle = true, labelC = "C") {
        let H = this.getProjectionPoint(A, B, C);
        
        let dx = B.x - A.x, dy = B.y - A.y;
        let param = ((H.x - A.x) * dx + (H.y - A.y) * dy) / (dx * dx + dy * dy);
        if (param < 0 || param > 1) {
            let nearestPt = param < 0 ? A : B;
            let ux = dx / Math.hypot(dx, dy);
            let uy = dy / Math.hypot(dx, dy);
            let extendEnd = param > 1 ? { x: H.x + ux * 30, y: H.y + uy * 30 } : { x: H.x - ux * 30, y: H.y - uy * 30 };

            this.ctxDraw.save();
            this.ctxDraw.beginPath();
            this.ctxDraw.moveTo(nearestPt.x, nearestPt.y);
            this.ctxDraw.lineTo(extendEnd.x, extendEnd.y);
            this.ctxDraw.strokeStyle = 'black';
            this.ctxDraw.lineWidth = 1.5;
            this.ctxDraw.setLineDash([5, 5]); 
            this.ctxDraw.stroke();
            this.ctxDraw.restore();
        }

        let angleAB = Math.atan2(B.y - A.y, B.x - A.x);
        let lenHA = Math.hypot(A.x - H.x, A.y - H.y);
        let lenHB = Math.hypot(B.x - H.x, B.y - H.y);
        if (lenHA > lenHB) angleAB += Math.PI; 

        let cx = C.x - H.x, cy = C.y - H.y;
        let localCy = -cx * Math.sin(angleAB) + cy * Math.cos(angleAB);
        let flipY = localCy > 0 ? -1 : 1; 

        let angleH_dodge = Math.atan2(H.y - C.y, H.x - C.x);
        let angleC_dodge = Math.atan2(C.y - H.y, C.x - H.x);

        await this.animateEkeMove(H, angleAB, flipY, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.drawEkeSprite(H, angleAB, flipY);
        this.drawPencilSprite(H.x, H.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        
        if (labelIntersection !== "") {
            this.drawPoint(H, labelIntersection, angleH_dodge, "point");
        }
        await this.sleep(CONFIG.DELAY_LONG);
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_NORMAL); 

        let drawStart = C, drawEnd = H;
        if (isLine) {
            let lineDx = H.x - C.x, lineDy = H.y - C.y;
            let length = Math.hypot(lineDx, lineDy);
            if (length > 0) {
                let extendLen = 60; 
                let ux = lineDx / length, uy = lineDy / length;
                drawStart = { x: C.x - ux * extendLen, y: C.y - uy * extendLen };
                drawEnd = { x: H.x + ux * extendLen, y: H.y + uy * extendLen };
            }
        }

        let drawA, drawB;
        if (drawStart.y < drawEnd.y) {
            drawA = drawStart; drawB = drawEnd; 
        } else if (drawStart.y > drawEnd.y) {
            drawA = drawEnd; drawB = drawStart; 
        } else {
            drawA = (drawStart.x < drawEnd.x) ? drawStart : drawEnd;
            drawB = (drawStart.x < drawEnd.x) ? drawEnd : drawStart;
        }

        await this.animateRulerMove(drawA, drawB, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.drawRulerSprite(drawA, drawB); 
        this.drawPencilSprite(drawA.x, drawA.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        await this.animateLineDraw(drawA, drawB, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT); 

        if (showRightAngle) {
            this.drawRightAngleMark(this.ctxDraw, A, B, C, H);
        }

        if (labelLine !== "") {
            this.ctxDraw.fillStyle = '#001F3F';
            this.ctxDraw.font = 'italic 18px Arial';
            this.ctxDraw.fillText(labelLine, drawEnd.x + 5, drawEnd.y + 15);
        }

        if (labelIntersection !== "") {
            this.drawPoint(H, labelIntersection, angleH_dodge, "point");
        }
        if (labelC !== "") {
            this.drawPoint(C, labelC, true, "point");
        }
    }
} // <--- Đóng ngoặc của class GeometryEngine tại đây


/**
 * Hàm vẽ góc động tuân thủ chuẩn Sư phạm Hình học (Nằm độc lập ngoài class)
 * @param {CanvasRenderingContext2D} ctx - Context 2D của Canvas
 * @param {Object} vertex - Tọa độ đỉnh góc {x, y}
 * @param {Object|null} ray1Point - Tọa độ 1 điểm để định hướng tia 1 {x, y}
 * @param {number} measure - Số đo góc (đơn vị: độ)
 * @param {Object} labels - Nhãn tên { vertex: 'O', ray1: 'x', ray2: 'y' }
 * @param {Object} options - Tùy chỉnh độ dài, màu sắc...
 */

/**
 * Hàm vẽ góc động tuân thủ chuẩn Sư phạm Hình học (Nằm độc lập ngoài class)
 */
function drawPedagogicalAngle(ctx, vertex, ray1Point, measure, labels = {}, options = {}) {
    const {
        rayLength = 150,       
        arcRadius = 35,        
        color = '#0891b2',     
        lineWidth = 2,
        showMeasure = true,
        drawLines = true       // <--- THÊM CÔNG TẮC: Mặc định là có vẽ tia
    } = options;

    let startRad;
    if (ray1Point && typeof ray1Point.x === 'number' && typeof ray1Point.y === 'number') {
        startRad = Math.atan2(ray1Point.y - vertex.y, ray1Point.x - vertex.x);
    } else {
        startRad = Math.random() * Math.PI * 2;
    }

    const endRad = startRad - (measure * Math.PI / 180);

    const end1 = { x: vertex.x + rayLength * Math.cos(startRad), y: vertex.y + rayLength * Math.sin(startRad) };
    const end2 = { x: vertex.x + rayLength * Math.cos(endRad), y: vertex.y + rayLength * Math.sin(endRad) };

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.font = 'bold 16px "Roboto Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // DÙNG CÔNG TẮC: Chỉ vẽ đè tia nếu được cho phép
    if (drawLines) {
        ctx.beginPath();
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
    }

    ctx.beginPath();
    if (measure === 90) {
        const sqSize = arcRadius * 0.6; 
        const p1 = { x: vertex.x + sqSize * Math.cos(startRad), y: vertex.y + sqSize * Math.sin(startRad) };
        const p2 = { 
            x: vertex.x + Math.sqrt(2) * sqSize * Math.cos(startRad - Math.PI/4), 
            y: vertex.y + Math.sqrt(2) * sqSize * Math.sin(startRad - Math.PI/4) 
        };
        const p3 = { x: vertex.x + sqSize * Math.cos(endRad), y: vertex.y + sqSize * Math.sin(endRad) };
        
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();
    } else {
        ctx.arc(vertex.x, vertex.y, arcRadius, startRad, endRad, true);
        ctx.stroke();
    }

    const bisectRad = (startRad + endRad) / 2; 

    if (labels.vertex) {
        const oppRad = bisectRad + Math.PI;
        ctx.fillText(labels.vertex, vertex.x + 20 * Math.cos(oppRad), vertex.y + 20 * Math.sin(oppRad));
    }

    if (labels.ray1) {
        ctx.fillText(labels.ray1, end1.x + 15 * Math.cos(startRad), end1.y + 15 * Math.sin(startRad));
    }

    if (labels.ray2) {
        ctx.fillText(labels.ray2, end2.x + 15 * Math.cos(endRad), end2.y + 15 * Math.sin(endRad));
    }

    if (showMeasure && measure !== 90) {
        const textDist = arcRadius + 20; 
        ctx.fillText(`${measure}°`, vertex.x + textDist * Math.cos(bisectRad), vertex.y + textDist * Math.sin(bisectRad));
    }

    ctx.restore();
}