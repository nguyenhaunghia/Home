// ==========================================
// BÀI 4: VẼ ĐƯỜNG THẲNG ĐI QUA 2 ĐIỂM
// ==========================================

window.startLesson = async function(env) {
    // 1. Nhận các công cụ từ môi trường truyền vào
    const { ctxDraw, textInst, geoEngine } = env;

    // 2. Cài đặt tiêu đề bài học lên Header và ẩn tiêu đề phụ
    document.querySelector('.header-title').innerText = "VẼ ĐƯỜNG THẲNG";
    document.querySelector('.tool-title').style.display = "none";
    
    // 3. Vòng lặp kịch bản bài học (Tự động lặp lại không cần tải trang)
    while (true) {
        // --- BƯỚC 1: XÁC ĐỊNH 2 ĐIỂM ---
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A');

        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B');

        // --- BƯỚC 2: VẼ ĐƯỜNG THẲNG CÓ KÉO DÀI 2 ĐẦU ---
        textInst.innerText = "Bước 1: Đang kẻ đường thẳng đi qua A và B...";
        textInst.style.color = "#f4b400"; 
        
        // Gọi hàm vẽ đoạn thẳng nhưng bật cờ isLine = true (tham số thứ 5)
        // Vì getClickPoint đã vẽ sẵn tên A và B ở Bước 1, ta truyền chuỗi rỗng "" vào tên điểm để không in đè
        await geoEngine.drawSegment(pointA, pointB, "", "", true);

        // --- BƯỚC 3: KẾT THÚC VÀ CHỜ LÀM LẠI ---
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        // Dùng getClickPoint (không tên) để "giữ chân" hệ thống, chờ học sinh click
        await geoEngine.getClickPoint(""); 
        
        // Xóa sạch bảng vẽ để vòng lặp quay lại từ đầu
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};