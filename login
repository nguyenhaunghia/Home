<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - TOÁN TIN</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Rajdhani:wght@600;700&family=Roboto+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <link rel="stylesheet" href="style.css"> <style>
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-card {
            width: 100%;
            max-width: 400px;
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-tech);
            border-radius: 16px;
            padding: 40px 30px;
            box-shadow: 0 0 40px rgba(14, 165, 233, 0.2);
            position: relative;
            overflow: hidden;
        }
        .login-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 3px;
            background: linear-gradient(90deg, transparent, var(--primary-neon), transparent);
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h2 {
            font-family: 'Rajdhani', sans-serif;
            font-size: 2rem;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        .input-group-custom {
            margin-bottom: 20px;
            position: relative;
        }
        .input-group-custom label {
            display: block;
            font-size: 0.8rem;
            color: var(--primary-neon);
            margin-bottom: 8px;
            font-family: 'Roboto Mono', monospace;
        }
        .input-group-custom i {
            position: absolute;
            left: 15px;
            top: 40px;
            color: var(--text-dim);
        }
        .input-group-custom input {
            width: 100%;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px 15px 12px 45px;
            color: white;
            outline: none;
            transition: 0.3s;
        }
        .input-group-custom input:focus {
            border-color: var(--primary-neon);
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
        }
        .btn-login {
            width: 100%;
            padding: 12px;
            background: var(--primary-neon);
            border: none;
            border-radius: 8px;
            color: white;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
        }
        .btn-login:hover {
            filter: brightness(1.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(14, 165, 233, 0.4);
        }
        #login-msg {
            text-align: center;
            margin-top: 15px;
            font-size: 0.85rem;
            min-height: 20px;
        }
        .loader-dots { display: none; }
    </style>
</head>
<body>
    <canvas id="hero-canvas"></canvas>

    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="tech-badge">SECURE ACCESS</div>
                <h2>LOGIN</h2>
            </div>

            <form id="login-form">
                <div class="input-group-custom">
                    <label>IDENTIFIER</label>
                    <i class="fas fa-user-shield"></i>
                    <input type="text" id="username" placeholder="ID, Account, or Name..." required>
                </div>

                <div class="input-group-custom">
                    <label>PASSWORD</label>
                    <i class="fas fa-lock"></i>
                    <input type="password" id="password" placeholder="••••••••" required>
                </div>

                <button type="submit" class="btn-login" id="btn-text">INITIALIZE LOGIN</button>
                <div id="login-msg"></div>
            </form>
        </div>
    </div>

    <script src="script.js"></script> <script>
        // Cấu hình riêng cho Login
        const USER_SHEET_NAME = 'User';
        
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userInp = document.getElementById('username').value.trim().toLowerCase();
            const passInp = document.getElementById('password').value;
            const msg = document.getElementById('login-msg');
            const btn = document.getElementById('btn-text');

            msg.innerText = "Verifying credentials...";
            msg.style.color = "var(--primary-neon)";
            btn.disabled = true;

            try {
                const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${USER_SHEET_NAME}`;
                const response = await fetch(url);
                const text = await response.text();
                const json = JSON.parse(text.substring(47).slice(0, -2));
                const rows = json.table.rows;

                let authenticatedUser = null;

                for (let row of rows) {
                    const c = row.c;
                    if (!c) continue;

                    // Mapping các cột từ sheet User
                    const userData = {
                        userID: c[0] ? String(c[0].v).toLowerCase() : '',
                        name: c[1] ? String(c[1].v).toLowerCase() : '',
                        remName: c[2] ? String(c[2].v).toLowerCase() : '',
                        account: c[6] ? String(c[6].v).toLowerCase() : '',
                        password: c[9] ? String(c[9].v) : '',
                        fullName: c[1] ? c[1].v : 'User'
                    };

                    // Kiểm tra khớp bất kỳ thông tin định danh nào
                    const isUserMatch = (
                        userInp === userData.userID || 
                        userInp === userData.name || 
                        userInp === userData.remName || 
                        userInp === userData.account
                    );

                    if (isUserMatch && passInp === userData.password) {
                        authenticatedUser = userData;
                        break;
                    }
                }

                if (authenticatedUser) {
                    msg.innerText = "Access Granted! Redirecting...";
                    msg.style.color = "#4ade80";
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userName', authenticatedUser.fullName);
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    msg.innerText = "Invalid identifier or password.";
                    msg.style.color = "#f87171";
                    btn.disabled = false;
                }

            } catch (error) {
                console.error(error);
                msg.innerText = "Connection error. Please try again.";
                msg.style.color = "#f87171";
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
