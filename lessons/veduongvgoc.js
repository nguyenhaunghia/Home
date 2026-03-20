// ==========================================
// BÀI 3: VẼ ĐƯỜNG THẲNG VUÔNG GÓC
// ==========================================

window.startLesson = async function(env) {
    const { ctxDraw, textInst, geoEngine } = env;

    document.querySelector('.header-title').innerText = "VẼ ĐƯỜNG VUÔNG GÓC";
    document.querySelector('.tool-title').style.display = "none";
    
    while (true) {
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A');

        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B');

        textInst.innerText = "Đang kẻ đường thẳng AB...";
        textInst.style.color = "#f4b400"; 
        await geoEngine.drawSegment(pointA, pointB, "", "", true); // Kẻ đường thẳng AB kéo dài

        textInst.innerText = "Nhấp chuột để chọn điểm C (nằm ngoài đường thẳng)";
        textInst.style.color = "#d93025";
        let pointC = await geoEngine.getClickPoint('C', true);

        textInst.innerText = "Đang dùng Ê-ke xác định và kẻ đường thẳng vuông góc...";
        textInst.style.color = "#f4b400"; 
        
        // ---------------------------------------------------
        // SỬ DỤNG HÀM MỚI VỚI ĐẦY ĐỦ THAM SỐ TÙY CHỈNH:
        // geoEngine.drawPerpendicular(A, B, C, isLine, labelLine, labelIntersection, showRightAngle)
        // Dưới đây là: Vẽ ĐƯỜNG THẲNG (true), tên là "d", cắt tại "H", và có vẽ góc vuông (true)
        // ---------------------------------------------------
        await geoEngine.drawPerpendicular(pointA, pointB, pointC, true, "d", "H", true);

        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        await geoEngine.getClickPoint(""); 
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};