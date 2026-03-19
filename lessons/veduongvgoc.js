// ==========================================
// BÀI 3: VẼ ĐƯỜNG VUÔNG GÓC
// ==========================================

window.startLesson = async function(env) {
    // 1. Nhận các công cụ từ môi trường truyền vào
    const { ctxDraw, textInst, geoEngine } = env;

    // 2. Cài đặt tiêu đề bài học lên Header và ẩn tiêu đề phụ
    document.querySelector('.header-title').innerText = "VẼ ĐƯỜNG VUÔNG GÓC";
    document.querySelector('.tool-title').style.display = "none";
    
    // 3. Vòng lặp kịch bản bài học (Tự động lặp lại không cần tải trang)
    while (true) {
        // --- BƯỚC 1: XÁC ĐỊNH ĐOẠN THẲNG AB LÀM GỐC ---
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A');

        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B');

        textInst.innerText = "Bước 1: Đang kẻ đoạn thẳng AB...";
        textInst.style.color = "#f4b400"; 
        
        // Kẻ đoạn thẳng AB (không in thêm tên để tránh đè chữ)
        await geoEngine.drawSegment(pointA, pointB, "", "");

        // --- BƯỚC 2: CHỌN ĐIỂM C ---
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm C (nằm ngoài đoạn thẳng)";
        textInst.style.color = "#d93025";
        
        // Truyền true vào tham số thứ 2 để chữ C hiện bên dưới chấm xanh cho đẹp
        let pointC = await geoEngine.getClickPoint('C', true);

        // --- BƯỚC 3: VẼ ĐƯỜNG VUÔNG GÓC TỪ C XUỐNG AB ---
        textInst.innerText = "Bước 2: Đang kẻ đường vuông góc từ C xuống AB...";
        textInst.style.color = "#f4b400"; 
        
        // Gọi hàm kẻ vuông góc, tham số true để dập ký hiệu góc vuông màu đỏ
        await geoEngine.drawPerpendicular(pointA, pointB, pointC, true);

        // --- BƯỚC 4: KẾT THÚC VÀ CHỜ LÀM LẠI ---
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        // Chờ 1 cú click bất kỳ để reset bài
        await geoEngine.getClickPoint(""); 
        
        // Xóa sạch bảng vẽ để vòng lặp quay lại từ đầu
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};
