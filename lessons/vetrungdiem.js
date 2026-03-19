// ==========================================
// BÀI 2: VẼ TRUNG ĐIỂM CỦA ĐOẠN THẲNG
// ==========================================

window.startLesson = async function(env) {
    // 1. Nhận các công cụ từ môi trường truyền vào
    const { ctxDraw, textInst, geoEngine } = env;

    // 2. Cài đặt tiêu đề bài học lên Header (thay thế chữ MATH) và ẩn tiêu đề phụ
    document.querySelector('.header-title').innerText = "VẼ TRUNG ĐIỂM ĐOẠN THẲNG";
    document.querySelector('.tool-title').style.display = "none";
    
    // 3. Vòng lặp kịch bản bài học (Tự động lặp lại không cần tải trang)
    while (true) {
        // --- BƯỚC 1: XÁC ĐỊNH ĐOẠN THẲNG ---
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A');

        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B');

        // --- BƯỚC 2: VẼ ĐOẠN THẲNG ---
        textInst.innerText = "Bước 1: Đang kẻ đoạn thẳng AB...";
        textInst.style.color = "#f4b400"; 
        
        // Gọi hàm vẽ đoạn thẳng (truyền tên rỗng vì getClickPoint đã vẽ chữ A, B rồi)
        await geoEngine.drawSegment(pointA, pointB, "", "");

        // --- BƯỚC 3: TÌM VÀ VẼ TRUNG ĐIỂM ---
        textInst.innerText = "Bước 2: Đang đo và xác định trung điểm M...";
        
        // Gọi hàm vẽ trung điểm: Đặt tên là "M", ký hiệu 2 vạch bằng nhau (//)
        await geoEngine.drawMidpoint(pointA, pointB, "M", 2);

        // --- BƯỚC 4: KẾT THÚC VÀ CHỜ LÀM LẠI ---
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        // Dùng getClickPoint (không tên) để "giữ chân" hệ thống, chờ học sinh click
        await geoEngine.getClickPoint(""); 
        
        // Xóa sạch bảng vẽ để vòng lặp quay lại từ đầu
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};