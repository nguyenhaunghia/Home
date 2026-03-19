// ==========================================
// BÀI 1: VẼ ĐOẠN THẲNG
// ==========================================

window.startLesson = async function(env) {
    // 1. Nhận các công cụ từ môi trường truyền vào
    const { ctxDraw, textInst, geoEngine } = env;

    // 2. Cài đặt tiêu đề bài học lên Header (thay thế chữ MATH) và ẩn tiêu đề phụ
    document.querySelector('.header-title').innerText = "VẼ TRUNG ĐIỂM ĐOẠN THẲNG";
    document.querySelector('.tool-title').style.display = "none";
    
    // Vòng lặp vĩnh cửu giúp bài học tự động lặp lại mà không cần tải lại trang
    while (true) {
        // Bước 1: Đợi học sinh click lấy điểm A
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A');

        // Bước 2: Đợi học sinh click lấy điểm B
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B');

        // Bước 3: Thực hiện vẽ đoạn thẳng
        textInst.innerText = "Đang thực hiện vẽ mô phỏng...";
        textInst.style.color = "#f4b400"; 
        
        // Vì getClickPoint đã vẽ sẵn 2 chữ A và B ở trên rồi, 
        // nên ta gọi hàm drawSegment với tham số tên rỗng để không in đè chữ lên nhau.
        await geoEngine.drawSegment(pointA, pointB, "", "");

        // Bước 4: Hoàn thành và đợi 1 cú click bất kỳ để reset bài mới
        textInst.innerText = "Hoàn thành! Nhấp chuột để vẽ bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        // Lợi dụng hàm getClickPoint truyền vào rỗng để "chờ" cú click cuối cùng
        await geoEngine.getClickPoint(""); 
        
        // Reset bảng để vòng lặp quay lại từ đầu
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};