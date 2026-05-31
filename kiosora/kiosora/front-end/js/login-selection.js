const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:5000" : "https://kiosora.onrender.com";
// Login Selection Page JavaScript
// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '50582739638-amppusg45ug5qfosk64jf7u5h3989pav.apps.googleusercontent.com';

// Add animation on page load
document.addEventListener('DOMContentLoaded', function() {
    loadGoogleScript();

    const loginButtons = document.querySelectorAll('.login-button');
    loginButtons.forEach((button, index) => {
        button.style.opacity = '0';
        button.style.transform = 'translateY(20px)';
        setTimeout(() => {
            button.style.transition = 'all 0.5s ease-out';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, 200 + (index * 150));
    });

    const adminLoginBtn = document.querySelector('.login-button:not([href="login.html"])');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAdminLoginModal();
        });
    }
});

function loadGoogleScript() {
    if (document.getElementById('google-gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

let tempAdminSession = null;
let otpTimerInterval = null;

// ============= ADMIN LOGIN MODAL =============
function showAdminLoginModal() {
    const modalHTML = `
        <div id="adminLoginModal" class="admin-login-modal active">
            <div class="admin-login-content">
                <div class="admin-login-header">
                    <h2>Administrator Login</h2>
                    <button class="admin-modal-close" onclick="closeAdminModal()">&times;</button>
                </div>

                <!-- Step 1: Sign in options -->
                <div id="stepSignIn" class="admin-step active">
                    <div class="admin-login-form">
                        <p class="signin-subtitle">Sign in with your authorized Google account</p>
                        <div id="googleBtnContainer" style="display:flex; justify-content:center; margin-bottom:1rem;"></div>
                        <div id="googleSignInError" class="admin-error-message"></div>
                        <div class="divider"><span>OR</span></div>
                        <button type="button" class="email-password-toggle" onclick="showEmailPasswordForm()">
                            Use Email &amp; Password Instead
                        </button>
                    </div>
                </div>

                <!-- Step 2: Email & Password Login -->
                <div id="stepEmailPassword" class="admin-step">
                    <form id="adminLoginForm" class="admin-login-form">
                        <div class="admin-form-group">
                            <label>Admin Username</label>
                            <input type="text" id="adminUsername" class="admin-input" placeholder="Enter username" required>
                        </div>
                        <div class="admin-form-group">
                            <label>Admin Password</label>
                            <input type="password" id="adminPassword" class="admin-input" required>
                        </div>
                        <div id="adminLoginError" class="admin-error-message"></div>
                        <button type="submit" class="admin-submit-btn">
                            <span class="btn-text">Login</span>
                            <span class="btn-loader" style="display:none;">
                                <svg class="spinner" viewBox="0 0 24 24">
                                    <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="white" stroke-width="3" fill="none"></circle>
                                </svg>
                            </span>
                        </button>
                        <button type="button" class="admin-link-btn" onclick="backToSignIn()">
                            &larr; Back to Sign in options
                        </button>
                    </form>
                </div>

                <!-- Step 3: OTP Verification -->
                <div id="stepTwoFactor" class="admin-step">
                    <div class="admin-login-form">
                        <div class="twofa-header">
                            <h3>Two-Factor Authentication</h3>
                            <p class="twofa-subtitle">Enter the OTP sent to your email</p>
                        </div>
                        <div class="admin-info-card">
                            <svg class="admin-avatar-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div>
                                <div class="admin-email-display" id="adminEmailDisplay"></div>
                                <div class="admin-access-label">Admin Access</div>
                            </div>
                        </div>
                        <div class="email-icon-wrapper">
                            <svg class="email-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M3 8L10.89 13.26C11.21 13.47 11.58 13.59 12 13.59C12.42 13.59 12.79 13.47 13.11 13.26L21 8M5 19H19C20.1 19 21 18.1 21 17V7C21 5.9 20.1 5 19 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19Z" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <p class="verification-message">We've sent a 6-digit code to</p>
                        <p class="verification-email" id="verificationEmailDisplay"></p>
                        <div class="otp-input-container">
                            <input type="text" maxlength="1" class="otp-digit" data-index="0" />
                            <input type="text" maxlength="1" class="otp-digit" data-index="1" />
                            <input type="text" maxlength="1" class="otp-digit" data-index="2" />
                            <input type="text" maxlength="1" class="otp-digit" data-index="3" />
                            <input type="text" maxlength="1" class="otp-digit" data-index="4" />
                            <input type="text" maxlength="1" class="otp-digit" data-index="5" />
                        </div>
                        <div class="otp-timer-wrapper">
                            <div id="otpTimer" class="otp-timer-display">05:00</div>
                        </div>
                        <div id="otpError" class="admin-error-message"></div>
                        <button type="button" class="resend-code-btn" onclick="resendOTP()">Resend Code</button>
                        <button type="button" id="verifyOtpBtn" class="admin-submit-btn" onclick="handleOTPVerification()">
                            <span class="btn-text">Verify</span>
                            <span class="btn-loader" style="display:none;">
                                <svg class="spinner" viewBox="0 0 24 24">
                                    <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="white" stroke-width="3" fill="none"></circle>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    addAdminModalStyles();
    document.body.style.overflow = 'hidden';
    setTimeout(() => initGoogleSignInButton(), 400);
}

// ============= GOOGLE OAUTH =============
function initGoogleSignInButton() {
    if (!window.google) {
        setTimeout(initGoogleSignInButton, 500);
        return;
    }
    // Sign out any existing session to force account picker every time
    window.google.accounts.id.disableAutoSelect();
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        prompt_parent_id: undefined,
        itp_support: true
    });
    window.google.accounts.id.renderButton(
        document.getElementById('googleBtnContainer'),
        { theme: 'outline', size: 'large', width: 300, text: 'signin_with' }
    );
}

async function handleGoogleCredentialResponse(response) {
    const errorDiv = document.getElementById('googleSignInError');
    errorDiv.style.display = 'none';

    try {
        const res = await fetch(API_BASE + '/api/auth/admin/google-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });

        const data = await res.json();

        if (data.success) {
            tempAdminSession = { sessionId: data.sessionId, email: data.email };
            showTwoFactorStep(data.email);
            startOTPTimer();
        } else {
            errorDiv.textContent = data.error || 'Access denied. Your Google account is not authorized.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        errorDiv.textContent = 'Connection error. Make sure the server is running.';
        errorDiv.style.display = 'block';
    }
}

// ============= EMAIL/PASSWORD LOGIN =============
function showEmailPasswordForm() {
    document.getElementById('stepSignIn').classList.remove('active');
    document.getElementById('stepEmailPassword').classList.add('active');
    setTimeout(() => {
        document.getElementById('adminUsername').focus();
        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    }, 300);
}

function backToSignIn() {
    document.getElementById('stepEmailPassword').classList.remove('active');
    document.getElementById('stepSignIn').classList.add('active');
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminLoginError');
    const submitBtn = e.target.querySelector('.admin-submit-btn');

    setButtonLoading(submitBtn, true);
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(API_BASE + '/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (data.success) {
            tempAdminSession = { sessionId: data.sessionId, email: data.email };
            showTwoFactorStep(data.email);
            startOTPTimer();
        } else {
            errorDiv.textContent = data.error || 'Invalid credentials';
            errorDiv.style.display = 'block';
            setButtonLoading(submitBtn, false);
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Make sure the server is running.';
        errorDiv.style.display = 'block';
        setButtonLoading(submitBtn, false);
    }
}

// ============= OTP =============
function showTwoFactorStep(email) {
    document.getElementById('stepSignIn').classList.remove('active');
    document.getElementById('stepEmailPassword').classList.remove('active');
    document.getElementById('stepTwoFactor').classList.add('active');
    document.getElementById('adminEmailDisplay').textContent = email;
    document.getElementById('verificationEmailDisplay').textContent = email;
    setTimeout(() => {
        setupOTPInputs();
        document.querySelector('.otp-digit').focus();
    }, 300);
}

function setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-digit');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (!/^\d*$/.test(e.target.value)) { e.target.value = ''; return; }
            if (e.target.value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) otpInputs[index - 1].focus();
            if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                navigator.clipboard.readText().then(text => {
                    const digits = text.replace(/\D/g, '').slice(0, 6);
                    digits.split('').forEach((d, i) => { if (otpInputs[i]) otpInputs[i].value = d; });
                    if (otpInputs[digits.length - 1]) otpInputs[digits.length - 1].focus();
                });
            }
        });
    });
}

function startOTPTimer() {
    let timeLeft = 300;
    const timerDisplay = document.getElementById('otpTimer');
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        timerDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            timerDisplay.textContent = '00:00';
            timerDisplay.style.color = '#dc2626';
            const err = document.getElementById('otpError');
            err.textContent = 'OTP expired. Please request a new code.';
            err.style.display = 'block';
        }
    }, 1000);
}

async function handleOTPVerification() {
    const otpInputs = document.querySelectorAll('.otp-digit');
    const otp = Array.from(otpInputs).map(i => i.value).join('');
    const errorDiv = document.getElementById('otpError');
    const verifyBtn = document.getElementById('verifyOtpBtn');

    errorDiv.style.display = 'none';
    if (otp.length !== 6) {
        errorDiv.textContent = 'Please enter all 6 digits';
        errorDiv.style.display = 'block';
        return;
    }

    setButtonLoading(verifyBtn, true);
    try {
        const response = await fetch(API_BASE + '/api/auth/admin/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: tempAdminSession.sessionId, otp, email: tempAdminSession.email })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
            if (otpTimerInterval) clearInterval(otpTimerInterval);
            showSuccessAnimation();
            setTimeout(() => { window.location.href = 'admin-dashboard.html'; }, 1500);
        } else {
            errorDiv.textContent = data.error || 'Invalid OTP code';
            errorDiv.style.display = 'block';
            setButtonLoading(verifyBtn, false);
            otpInputs.forEach(i => i.value = '');
            otpInputs[0].focus();
        }
    } catch (error) {
        errorDiv.textContent = 'Verification failed. Please try again.';
        errorDiv.style.display = 'block';
        setButtonLoading(verifyBtn, false);
    }
}

async function resendOTP() {
    const resendBtn = event.target;
    const originalText = resendBtn.textContent;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    try {
        const response = await fetch(API_BASE + '/api/auth/admin/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: tempAdminSession.sessionId, email: tempAdminSession.email })
        });
        const data = await response.json();

        if (data.success) {
            tempAdminSession.sessionId = data.sessionId;
            const msg = document.createElement('div');
            msg.className = 'success-message-inline';
            msg.textContent = 'New code sent!';
            resendBtn.parentElement.insertBefore(msg, resendBtn);
            setTimeout(() => msg.remove(), 3000);
            document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
            document.querySelector('.otp-digit').focus();
            startOTPTimer();
        } else {
            alert('Failed to resend. Please try again.');
        }
    } catch (error) {
        alert('Failed to resend. Please try again.');
    }
    resendBtn.textContent = originalText;
    resendBtn.disabled = false;
}

// ============= HELPERS =============
function showSuccessAnimation() {
    document.querySelector('.admin-login-content').innerHTML = `
        <div class="success-animation">
            <svg class="checkmark" viewBox="0 0 52 52">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2>Verification Successful!</h2>
            <p>Redirecting to admin dashboard...</p>
        </div>
    `;
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    if (isLoading) { btnText.style.display = 'none'; btnLoader.style.display = 'inline-block'; button.disabled = true; }
    else { btnText.style.display = 'inline'; btnLoader.style.display = 'none'; button.disabled = false; }
}

function closeAdminModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) { modal.remove(); document.body.style.overflow = 'auto'; }
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    if (window.google) window.google.accounts.id.cancel();
}

function addAdminModalStyles() {
    if (document.getElementById('adminModalStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminModalStyles';
    style.textContent = `
        .admin-login-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:10000; align-items:center; justify-content:center; backdrop-filter:blur(8px); }
        .admin-login-modal.active { display:flex; }
        .admin-login-content { background:white; border-radius:12px; width:90%; max-width:500px; box-shadow:0 25px 70px rgba(0,0,0,0.4); animation:slideIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55); max-height:90vh; overflow-y:auto; }
        @keyframes slideIn { from { transform:translateY(-50px) scale(0.9); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
        .admin-login-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem 2rem; border-bottom:1px solid #e5e7eb; }
        .admin-login-header h2 { margin:0; color:#1f2937; font-size:1.5rem; }
        .admin-modal-close { background:none; border:none; font-size:2rem; cursor:pointer; color:#9ca3af; transition:all 0.2s; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:6px; }
        .admin-modal-close:hover { background:#f3f4f6; color:#374151; }
        .admin-step { display:none; }
        .admin-step.active { display:block; animation:fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .admin-login-form { padding:2rem; }
        .signin-subtitle { text-align:center; color:#6b7280; margin-bottom:1.5rem; font-size:0.95rem; }
        .divider { display:flex; align-items:center; gap:1rem; margin:1.25rem 0; color:#9ca3af; font-size:0.85rem; }
        .divider::before, .divider::after { content:''; flex:1; height:1px; background:#e5e7eb; }
        .email-password-toggle { width:100%; padding:0.75rem; background:white; color:#374151; border:1px solid #d1d5db; border-radius:8px; font-size:0.9rem; cursor:pointer; transition:all 0.2s; }
        .email-password-toggle:hover { background:#f9fafb; border-color:#9ca3af; }
        .admin-form-group { margin-bottom:1.25rem; }
        .admin-form-group label { display:block; font-size:0.875rem; font-weight:500; color:#374151; margin-bottom:0.5rem; }
        .admin-input { width:100%; padding:0.75rem 1rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.95rem; transition:all 0.2s; box-sizing:border-box; }
        .admin-input:focus { outline:none; border-color:#9333ea; box-shadow:0 0 0 3px rgba(147,51,234,0.1); }
        .admin-error-message { background:#fef2f2; color:#dc2626; padding:0.75rem 1rem; border-radius:8px; font-size:0.875rem; margin-bottom:1rem; border:1px solid #fecaca; display:none; }
        .admin-submit-btn { width:100%; padding:0.875rem; background:#9333ea; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-bottom:0.75rem; }
        .admin-submit-btn:hover { background:#7e22ce; }
        .admin-submit-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .admin-link-btn { width:100%; padding:0.5rem; background:none; border:none; color:#6b7280; font-size:0.875rem; cursor:pointer; text-align:center; }
        .admin-link-btn:hover { color:#374151; }
        .twofa-header { text-align:center; margin-bottom:1.5rem; }
        .twofa-header h3 { color:#1f2937; margin-bottom:0.25rem; }
        .twofa-subtitle { color:#6b7280; font-size:0.9rem; }
        .admin-info-card { display:flex; align-items:center; gap:1rem; padding:1rem; background:#f5f3ff; border-radius:8px; margin-bottom:1.5rem; }
        .admin-avatar-icon { width:40px; height:40px; flex-shrink:0; }
        .admin-email-display { font-weight:600; color:#1f2937; font-size:0.95rem; }
        .admin-access-label { font-size:0.8rem; color:#9333ea; font-weight:500; }
        .email-icon-wrapper { display:flex; justify-content:center; margin-bottom:1rem; }
        .email-icon { width:56px; height:56px; padding:0.875rem; background:#f3e8ff; border-radius:50%; }
        .verification-message { text-align:center; color:#6b7280; font-size:0.9rem; margin-bottom:0.25rem; }
        .verification-email { text-align:center; color:#1f2937; font-weight:600; font-size:1rem; margin-bottom:1.5rem; }
        .otp-input-container { display:flex; gap:0.5rem; justify-content:center; margin-bottom:1.5rem; }
        .otp-digit { width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:600; border:1px solid #d1d5db; border-radius:6px; transition:all 0.2s; background:#f9fafb; }
        .otp-digit:focus { outline:none; border-color:#9333ea; background:white; box-shadow:0 0 0 3px rgba(147,51,234,0.1); }
        .otp-timer-wrapper { text-align:center; margin-bottom:1.5rem; }
        .otp-timer-display { font-size:1.75rem; font-weight:700; color:#9333ea; font-variant-numeric:tabular-nums; }
        .resend-code-btn { width:auto; padding:0.5rem 1.5rem; background:white; color:#374151; border:1px solid #d1d5db; border-radius:6px; font-size:0.875rem; font-weight:500; cursor:pointer; margin:0 auto 1.5rem auto; display:block; transition:all 0.2s; }
        .resend-code-btn:hover { background:#f9fafb; border-color:#9ca3af; }
        .resend-code-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .success-message-inline { text-align:center; color:#10b981; font-size:0.875rem; margin-bottom:0.75rem; }
        .spinner { width:20px; height:20px; animation:rotate 1s linear infinite; }
        @keyframes rotate { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .spinner-circle { stroke-dasharray:60; stroke-dashoffset:0; animation:dash 1.5s ease-in-out infinite; }
        @keyframes dash { 0% { stroke-dashoffset:60; } 50% { stroke-dashoffset:15; } 100% { stroke-dashoffset:60; } }
        .success-animation { text-align:center; padding:3rem 2rem; }
        .checkmark { width:80px; height:80px; margin:0 auto 1.5rem; display:block; }
        .checkmark-circle { stroke:#10b981; stroke-width:2; stroke-dasharray:166; stroke-dashoffset:166; animation:stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards; }
        .checkmark-check { stroke:#10b981; stroke-width:3; stroke-linecap:round; stroke-dasharray:48; stroke-dashoffset:48; animation:stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.8s forwards; }
        @keyframes stroke { 100% { stroke-dashoffset:0; } }
        .success-animation h2 { color:#1f2937; margin-bottom:0.5rem; }
        .success-animation p { color:#6b7280; }
        @media (max-width:480px) { .admin-login-content { width:95%; } .otp-digit { width:40px; height:50px; font-size:1.25rem; } }
    `;
    document.head.appendChild(style);
}