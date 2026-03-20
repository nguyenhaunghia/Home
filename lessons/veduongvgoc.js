// ==========================================
// BÀI 3: VẼ ĐƯỜNG THẲNG VUÔNG GÓC
// ==========================================

window.startLesson = async function(env) {
    const { ctxDraw, textInst, geoEngine } = env;

    // Cài đặt tiêu đề lên Header
    document.querySelector('.header-title').innerText = "VẼ ĐƯỜNG VUÔNG GÓC";
    document.querySelector('.tool-title').style.display = "none";
    
    // Vòng lặp vĩnh cửu chống tràn bộ nhớ (RAM)
    while (true) {
        // --- BƯỚC 1: XÁC ĐỊNH ĐƯỜNG THẲNG GỐC AB ---
        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm A";
        textInst.style.color = "#d93025";
        let pointA = await geoEngine.getClickPoint('A', false, "point"); // Hiện ngay nhãn A (nằm trên)

        textInst.innerText = "Hãy nhấp chuột chọn vị trí điểm B";
        let pointB = await geoEngine.getClickPoint('B', false, "point"); // Hiện ngay nhãn B (nằm trên)

        textInst.innerText = "Đang kẻ đường thẳng AB...";
        textInst.style.color = "#f4b400"; 
        // Truyền đầy đủ 'A', 'B' vào hàm vẽ để đóng mộc viền trắng bảo vệ nhãn ở bước cuối
        await geoEngine.drawSegment(pointA, pointB, "", "", true); 

        // --- BƯỚC 2: XÁC ĐỊNH ĐIỂM C ---
        textInst.innerText = "Nhấp chuột để chọn điểm C (nằm ngoài đường thẳng)";
        textInst.style.color = "#d93025";
        // Cho nhãn C nằm dưới (isBelow = true) để thuận mắt
        let pointC = await geoEngine.getClickPoint('C', true, "point"); 

        // --- BƯỚC 3: DÙNG Ê-KE VÀ THƯỚC KẺ ĐƯỜNG VUÔNG GÓC ---
        textInst.innerText = "Đang dùng Ê-ke xác định và kẻ đường thẳng vuông góc...";
        textInst.style.color = "#f4b400"; 
        
        // Truyền đầy đủ các tham số: 
        // Vẽ đường thẳng (true), Tên đường "d", Cắt tại "H", Hiện góc vuông (true), và Tên điểm gốc "C" để bảo vệ nhãn
        await geoEngine.drawPerpendicular(pointA, pointB, pointC, true, "d", "H", true, "C");

        // --- BƯỚC 4: KẾT THÚC VÀ LÀM LẠI ---
        textInst.innerText = "Hoàn thành! Nhấp chuột bất kỳ để làm bài mới.";
        textInst.style.color = "#0f9d58"; 
        
        // Chờ người dùng click chuột để reset
        await geoEngine.getClickPoint(""); 
        
        // Xóa sạch bảng vẽ, chuẩn bị cho vòng lặp mới
        ctxDraw.clearRect(0, 0, 800, 600);
        geoEngine.clearTools();
    }
};