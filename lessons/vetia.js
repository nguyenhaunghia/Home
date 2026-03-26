// ==========================================
// BÀI 5: VẼ TIA (CÓ ĐIỂM GỐC VÀ HƯỚNG)
// ==========================================

window.startLesson = async function(env) {
    const { ctxDraw, textInst, geoEngine } = env;

    document.querySelector('.header-title').innerText = "VẼ TIA";
    document.querySelector('.tool-title').style.display = "none";
    
    while (true) {
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm gốc O";
        textInst.style.color = "#d93025";
        let pointOrigin = await geoEngine.getClickPoint('O', false, "point");

        textInst.innerText = "Hãy nhấp chuột chọn hướng của tia (x)";
        // QUAN TRỌNG: Gọi tham số "direction" để lấy chấm nhỏ màu đen
        let pointDirection = await geoEngine.getClickPoint('x', false, "direction");

        textInst.innerText = "Kẻ tia đi qua gốc O và hướng x...";
        textInst.style.color = "#f4b400"; 
        
        await geoEngine.drawRay(pointOrigin, pointDirection, "", "");

        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        await geoEngine.getClickPoint(""); 
        
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};