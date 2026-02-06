/** * ==========================================================================
 * 1. CẤU HÌNH DÙNG CHUNG (GLOBAL CONFIG)
 * ========================================================================== */

const API_URL = "https://script.google.com/macros/s/AKfycbx5Y8lIHmsmtykfqcvx3QQXEZgLWg6G6AyyUEGPOHL20DaVCmrdiKrN707j-UVK0-YV/exec"; 

/** * 2. HÀM GỌI SERVER DÙNG CHUNG (API BRIDGE)
 * Thay thế hoàn toàn cho google.script.run ở mọi trang  */
async function callBackend(action, data = {}) {
    // Kiểm tra xem URL đã có chưa
    if (!API_URL || API_URL.includes("URL_CỦA_BẠN")) {
        console.error("CHƯA CẤU HÌNH API_URL TRONG SCRIPT.JS");
        return { success: false, error: "Chưa cấu hình API URL" };
    }

    const url = `${API_URL}?action=${action}&data=${encodeURIComponent(JSON.stringify(data))}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error("Lỗi kết nối API:", e);
        // Trả về cấu trúc lỗi chuẩn để các trang không bị crash
        return { success: false, error: "Lỗi kết nối Server: " + e.message }; 
    }
}

/**
 * ==========================================================================
 * HỆ THỐNG THÔNG BÁO (SWEETALERT2 WRAPPERS)
 * ==========================================================================
 */
const SystemToast = Swal.mixin({ 
    toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    showClass: { popup: 'animate__animated animate__fadeInUp' },
    hideClass: { popup: 'animate__animated animate__fadeOutDown' },
    didOpen: (toast) => { 
        toast.addEventListener('mouseenter', Swal.stopTimer); 
        toast.addEventListener('mouseleave', Swal.resumeTimer); 
    }
});

// Hàm hiển thị Toast thông báo nhanh
function showToast(message, type = 'info') {
    SystemToast.fire({ icon: type, title: message });
}

// Hàm hiển thị Loading
function showLoading(msg = 'Đang xử lý...') {
    Swal.fire({
        title: msg,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
}

function closeLoading() { Swal.close(); }

/**
 * ==========================================================================
 * XÁC NHẬN & FORM NHẬP LIỆU (MODERN UI)
 * ==========================================================================
 */
function SystemConfirm(title, message, btnText = "Đồng ý", btnCancel = "Hủy bỏ") {
    return Swal.fire({
        html: `
            <div class="modern-content">
                <div class="modern-icon-box"><i class="bi bi-question-lg"></i></div>
                <h3 class="modern-title">${title}</h3>
                <p class="modern-text">${message}</p>
            </div>
            <div class="modern-actions"></div> `,
        showCancelButton: true,
        confirmButtonText: btnText,
        cancelButtonText: btnCancel,
        buttonsStyling: false,
        customClass: {
            popup: 'modern-popup',
            confirmButton: 'btn-sys-yes',
            cancelButton: 'btn-sys-no',
            actions: 'modern-actions' 
        },
        width: 600,
        focusConfirm: false,
        allowOutsideClick: false
    });
}

function logoutConfirm() {
    SystemConfirm('Đăng xuất?', 'Bạn muốn thoát khỏi phiên làm việc?', 'Đăng xuất', 'Hủy')
    .then((r) => {
        if (r.isConfirmed) { 
            localStorage.removeItem('userData'); 
            // Điều hướng về URL gốc của ứng dụng
            if (typeof APP_URL !== 'undefined') {
                window.top.location.href = APP_URL; 
            } else {
                window.location.reload();
            }
        }
    });
}

/**
 * Tự động chạy khi trang load xong
 */
document.addEventListener("DOMContentLoaded", function() {
    console.log("Hệ thống giao diện đã sẵn sàng.");
});