// ==========================================
// BÀI 6: VẼ GÓC (HIỂN THỊ NHÃN NGAY LÚC CLICK)
// ==========================================

window.startLesson = async function(env) {
    const { ctxDraw, textInst, geoEngine } = env;

    document.querySelector('.header-title').innerText = "VẼ GÓC";
    document.querySelector('.tool-title').style.display = "none";
    
    while (true) {
        // 1. CHỌN ĐỈNH: Truyền chữ O để hiện ngay lập tức
        textInst.innerText = "Hãy nhấp chuột chọn Đỉnh của góc (O)";
        textInst.style.color = "#d93025";
        let pointOrigin = await geoEngine.getClickPoint('O', false, "point"); 

        // 2. CHỌN TIA 1: Truyền chữ x để hiện ngay lập tức
        textInst.innerText = "Hãy nhấp chuột chọn Hướng tia thứ nhất (x)";
        let pt1 = await geoEngine.getClickPoint('x', false, "direction");

        // 3. CHỌN TIA 2: Truyền chữ y để hiện ngay lập tức
        textInst.innerText = "Hãy nhấp chuột chọn Hướng tia thứ hai (y)";
        let pt2 = await geoEngine.getClickPoint('y', false, "direction");

        // 4. THỰC THI VẼ GÓC
        textInst.innerText = "Đang thực hiện kẻ góc...";
        textInst.style.color = "#f4b400"; 
        
        // CẬP NHẬT LOGIC: Đã có nhãn rồi thì truyền chuỗi rỗng "" vào hàm vẽ để KHÔNG show nhãn nữa
        await geoEngine.drawAngle(pointOrigin, pt1, pt2, "", "", "");

        // 5. KẾT THÚC
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        await geoEngine.getClickPoint(""); 
        
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};