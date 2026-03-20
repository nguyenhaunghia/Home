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
    DELAY_NORMAL: 1000,    
    DELAY_LONG: 1500,      
    SPEED_MOVE: 1500,      
    SPEED_DRAW: 3500       
};

// ==========================================
// THƯ VIỆN ĐỘNG CƠ HÌNH HỌC - SMART SCHOOL
// ==========================================

class GeometryEngine {
    // NÂNG CẤP: Bổ sung imgEke vào hàm khởi tạo
    constructor(ctxDraw, ctxTools, imgRuler, imgPencil, imgEke, canvasWidth = 800, canvasHeight = 600) {
        this.ctxDraw = ctxDraw;     
        this.ctxTools = ctxTools;   
        this.imgRuler = imgRuler;   
        this.imgPencil = imgPencil; 
        this.imgEke = imgEke;       // <--- TÀI SẢN MỚI
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

    // THÊM MỚI: Vẽ Ê-ke tĩnh
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

    // THÊM MỚI: Di chuyển Ê-ke bay vào
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

    // THÊM MỚI: Đặt Ê-ke đứng yên, kéo bút kẻ nét đứt
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
        // Ưu tiên kẻ từ TRÊN xuống DƯỚI để thước luôn nằm bên Trái/Dưới
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

        // Dùng drawA và drawB cho các hiệu ứng bay vào và vẽ
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

        // Đóng mộc chữ lên trên cùng với góc né đã tính
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
    // HÀM CHÍNH 4: VẼ TIA (Ray)
    // ==========================================
    
// ==========================================
    // HÀM CHÍNH 4: VẼ TIA (Đã nâng cấp tự nhận diện Hoa/Thường)
    // Tham số bổ sung: dirStyle (Nếu null, hệ thống sẽ tự quét chữ cái để quyết định)
    // ==========================================
async drawRay(originPt, directionPt, labelOrigin = "", labelDirection = "", dirStyle = null) {
        // TỰ ĐỘNG NHẬN DIỆN SƯ PHẠM:
        // Nếu không truyền dirStyle, hệ thống quét chữ cái: Chữ HOA -> Điểm (point), Chữ thường -> Hướng (direction)
        if (dirStyle === null) {
            if (labelDirection !== "" && labelDirection === labelDirection.toUpperCase()) {
                dirStyle = "point";
            } else {
                dirStyle = "direction";
            }
        }

        let angleLine = Math.atan2(directionPt.y - originPt.y, directionPt.x - originPt.x);
        let angleAwayOrigin = angleLine + Math.PI; 
        let angleLabelDir = angleLine + Math.PI / 4; 

        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");
        this.drawPoint(directionPt, labelDirection, angleLabelDir, dirStyle);

        let dx = directionPt.x - originPt.x, dy = directionPt.y - originPt.y;
        let length = Math.hypot(dx, dy);
        let drawStart = originPt, drawEnd = directionPt;

        if (length > 0) {
            let extendLen = 60; 
            let ux = dx / length, uy = dy / length;
            drawEnd = { x: directionPt.x + ux * extendLen, y: directionPt.y + uy * extendLen };
        }

        // ==========================================
        // CẬP NHẬT LUẬT SƯ PHẠM: TAY TRÁI THƯỚC, TAY PHẢI BÚT
        // Ưu tiên kẻ từ TRÊN xuống DƯỚI. Đảm bảo thước luôn nằm Trái/Dưới.
        // ==========================================
        let A, B;
        if (drawStart.y < drawEnd.y) {
            A = drawStart; B = drawEnd; 
        } else if (drawStart.y > drawEnd.y) {
            A = drawEnd; B = drawStart; 
        } else {
            A = (drawStart.x < drawEnd.x) ? drawStart : drawEnd;
            B = (drawStart.x < drawEnd.x) ? drawEnd : drawStart;
        }

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

        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");
        this.drawPoint(directionPt, labelDirection, angleLabelDir, dirStyle);
    }

// ==========================================
    // HÀM CHÍNH 5: VẼ GÓC (Angle)
    // ==========================================
    async drawAngle(originPt, pt1, pt2, labelOrigin = "O", label1 = "x", label2 = "y") {
        // Lần 1: Truyền rỗng ("") cho điểm gốc để drawRay không tự in O
        await this.drawRay(originPt, pt1, "", label1);
        
        // Lần 2: Truyền rỗng ("") cho điểm gốc
        await this.drawRay(originPt, pt2, "", label2);

        // TOÁN HỌC ĐÓN ĐẦU: Đẩy nhãn O ra xa khỏi góc nhọn
        let angleLine1 = Math.atan2(pt1.y - originPt.y, pt1.x - originPt.x);
        let angleLine2 = Math.atan2(pt2.y - originPt.y, pt2.x - originPt.x);
        
        let midAngle = (angleLine1 + angleLine2) / 2;
        if (Math.abs(angleLine1 - angleLine2) > Math.PI) {
            midAngle += Math.PI;
        }
        let angleAwayOrigin = midAngle + Math.PI;
        
        // Đóng mộc chữ O một lần duy nhất ở vị trí né đẹp nhất
        this.drawPoint(originPt, labelOrigin, angleAwayOrigin, "point");

        // Vẽ vòng cung đỏ
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
    // HÀM CHÍNH 3: VẼ ĐƯỜNG / ĐOẠN THẲNG VUÔNG GÓC (Kịch bản chuẩn SGK)
    // Tham số: (A, B) tạo đường gốc, C là điểm đi qua.
    // Các tùy chọn: isLine (Đường thẳng/Đoạn thẳng), labelLine (Tên đường), labelIntersection (Tên điểm H), showRightAngle (Ký hiệu vuông)
    // Đã Fix lỗi H nằm ngoài AB
    // Bổ sung tham số labelC ở cuối cùng để đóng mộc bảo vệ điểm C
    // ==========================================
    async drawPerpendicular(A, B, C, isLine = false, labelLine = "", labelIntersection = "H", showRightAngle = true, labelC = "C") {
        let H = this.getProjectionPoint(A, B, C);
        
        // 1. Kẻ nét đứt nếu H nằm ngoài AB
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

        // 2. Tính toán góc lật Ê-ke và góc né của H, C
        let angleAB = Math.atan2(B.y - A.y, B.x - A.x);
        let lenHA = Math.hypot(A.x - H.x, A.y - H.y);
        let lenHB = Math.hypot(B.x - H.x, B.y - H.y);
        if (lenHA > lenHB) angleAB += Math.PI; 

        let cx = C.x - H.x, cy = C.y - H.y;
        let localCy = -cx * Math.sin(angleAB) + cy * Math.cos(angleAB);
        let flipY = localCy > 0 ? -1 : 1; 

        // TOÁN HỌC ĐÓN ĐẦU: H dạt ra xa C, C dạt ra xa H
        let angleH_dodge = Math.atan2(H.y - C.y, H.x - C.x);
        let angleC_dodge = Math.atan2(C.y - H.y, C.x - H.x);

        // 3. Ê-ke hoạt động
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

        // 4. Tính toán độ dài đường kẻ
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

        // ==========================================
        // CẬP NHẬT LUẬT SƯ PHẠM: TAY TRÁI THƯỚC, TAY PHẢI BÚT
        // Ưu tiên kẻ từ TRÊN xuống DƯỚI. Đảm bảo thước luôn nằm Trái/Dưới.
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

        // 5. Thước thẳng hoạt động
        await this.animateRulerMove(drawA, drawB, CONFIG.SPEED_MOVE);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.drawRulerSprite(drawA, drawB); 
        this.drawPencilSprite(drawA.x, drawA.y); 
        await this.sleep(CONFIG.DELAY_NORMAL); 
        await this.animateLineDraw(drawA, drawB, CONFIG.SPEED_DRAW);
        await this.sleep(CONFIG.DELAY_NORMAL); 
        this.clearTools(); 
        await this.sleep(CONFIG.DELAY_SHORT); 

        // 6. Đóng mộc ký hiệu và nhãn đè lên đường kẻ
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
        // SỬA LỖI BÓNG MA: Dùng 'true' để đóng mộc trùng khít 100% với vị trí lúc click chuột
        if (labelC !== "") {
            this.drawPoint(C, labelC, true, "point");
        }
    }
}