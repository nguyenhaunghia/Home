document.addEventListener("DOMContentLoaded", function() {
    const canvasElement = document.getElementById("mario-canvas");
    
    // Khởi tạo máy ảo JS-DOS
    Dos(canvasElement, {
        // Cấu hình lõi xử lý WebAssembly
        wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js"
    }).ready(function(fs, main) {
        
        // Link file game Mario gốc đã đóng gói sẵn cho web (dung lượng rất nhẹ)
        const gameZipUrl = "mario.zip";

        // Tải và giải nén file vào máy ảo
        fs.extract(gameZipUrl).then(function() {
            
            // Lệnh chạy file thực thi trong môi trường DOS ảo
            // Lệnh chỉ đường cho DOS: chui vào thư mục 'mario' trước (cd mario), sau đó mới chạy 'MARIO.EXE'
            main(["-c", "cd mario", "-c", "MARIO.EXE"]).then(function(ci) {
                console.log("Hệ thống: Game Mario đã khởi chạy thành công!");
                // Khóa con trỏ chuột vào khung game khi học sinh click vào
                DosController.lockMouse(canvasElement);
            });
            
        }).catch(function(err) {
            console.error("Lỗi khi tải dữ liệu game:", err);
            alert("Đường truyền không ổn định. Vui lòng tải lại trang!");
        });
    });
});