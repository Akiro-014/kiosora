const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:5000" : "https://kiosora.onrender.com";
// Dashboard JavaScript - Updated with iframe PDF Viewer

let currentUser = null;

// ============================================
// INITIALIZE DASHBOARD
// ============================================
function initDashboard() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) { window.location.href = 'login.html'; return; }

    const raw = JSON.parse(userStr);

    // Normalize all possible field name variations (backend may return different casing)
    currentUser = {
        ...raw,
        fullName:    raw.fullName    || raw.full_name   || raw.name         || '',
        studentCode: raw.studentCode || raw.student_code || raw.code        || '',
        gradeLevel:  raw.gradeLevel  || raw.grade_level  || raw.grade       || '',
        birthday:    raw.birthday    || raw.birthdate   || '',
        address:     raw.address     || '',
        email:       raw.email       || '',
        password:    raw.password    || '',
        strand:      raw.strand      || '',
    };

    loadUserProfile();
    loadRecentActivity();
    addActivity('Successfully logged in to your account', 'login');
    setupEventListeners();
}

function loadUserProfile() {
    document.getElementById('profileName').textContent    = currentUser.fullName.toUpperCase();
    document.getElementById('profileCode').textContent    = currentUser.studentCode;
    document.getElementById('profileGrade').textContent   = `Grade ${currentUser.gradeLevel}`;
    document.getElementById('profileBirthday').textContent = formatDate(currentUser.birthday);
    document.getElementById('profileAddress').textContent  = currentUser.address;
    document.getElementById('profileEmail').textContent    = currentUser.email;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('btnEditProfile').addEventListener('click', openEditProfile);
    document.getElementById('btnChangePassword').addEventListener('click', openChangePassword);
    document.getElementById('evaluationFormBtn').addEventListener('click', () => openDocumentModal('evaluation'));
    document.getElementById('enrollmentFormBtn').addEventListener('click',  () => openDocumentModal('enrollment'));
    document.getElementById('certificateFormBtn').addEventListener('click', () => openDocumentModal('certificate'));
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);
    document.getElementById('changePasswordForm').addEventListener('submit', (e) => handleChangePassword(e));
    setupPdfButtons();

    // Load document requests and print history
    loadMyDocumentRequests();
}

// ============================================
// PDF BUTTONS — iframe print/open pattern
// ============================================
function setupPdfButtons() {
    const evalViewer   = document.getElementById('evaluationPdfViewer');
    const enrollViewer = document.getElementById('enrollmentPdfViewer');
    const certViewer   = document.getElementById('certificatePdfViewer');


    const printEvalBtn = document.getElementById('printEvaluationPdfBtn');
    if (printEvalBtn) printEvalBtn.onclick = () => {
        if (evalViewer && evalViewer.contentWindow) {
            evalViewer.contentWindow.focus();
            const onAfter = () => { addActivity('Printed Evaluation Form', 'print'); window.removeEventListener('afterprint', onAfter); };
            window.addEventListener('afterprint', onAfter);
            evalViewer.contentWindow.print();
        } else { window.open('../pdf/evaluation.pdf', '_blank'); }
    };


    const printEnrollBtn = document.getElementById('printEnrollmentPdfBtn');
    if (printEnrollBtn) printEnrollBtn.onclick = () => {
        if (enrollViewer && enrollViewer.contentWindow) {
            enrollViewer.contentWindow.focus();
            const onAfter = () => { addActivity('Printed Enrollment Form', 'print'); window.removeEventListener('afterprint', onAfter); };
            window.addEventListener('afterprint', onAfter);
            enrollViewer.contentWindow.print();
        } else { window.open('../pdf/enrollment.pdf', '_blank'); }
    };


    const printCertBtn = document.getElementById('printCertificatePdfBtn');
    if (printCertBtn) printCertBtn.onclick = () => {
        const certViewer = document.getElementById('certificatePdfViewer');
        if (certViewer && certViewer.contentWindow) {
            certViewer.contentWindow.focus();
            const onAfter = () => { addActivity('Printed Certificate of Enrollment', 'print'); window.removeEventListener('afterprint', onAfter); };
            window.addEventListener('afterprint', onAfter);
            certViewer.contentWindow.print();
        } else {
            window.open('../pdf/certificate.pdf', '_blank');
        }
    };
}

// ============================================
// OPEN DOCUMENT MODAL
// ============================================
function openDocumentModal(type) {
    const dateStr = formatDate(new Date().toISOString().split('T')[0]);

    if (type === 'evaluation') {
        document.getElementById('evalName').textContent  = currentUser.fullName;
        document.getElementById('evalCode').textContent  = currentUser.studentCode;
        document.getElementById('evalGrade').textContent = `Grade ${currentUser.gradeLevel}`;
        document.getElementById('evalDate').textContent  = dateStr;
        openModal('evaluationModal');
        addActivity('Opened Evaluation Form', 'document');

    } else if (type === 'enrollment') {
        document.getElementById('enrollName').textContent  = currentUser.fullName;
        document.getElementById('enrollCode').textContent  = currentUser.studentCode;
        document.getElementById('enrollGrade').textContent = `Grade ${currentUser.gradeLevel}`;
        document.getElementById('enrollDate').textContent  = dateStr;
        openModal('enrollmentModal');
        addActivity('Opened Enrollment Form', 'document');

    } else if (type === 'certificate') {
        // Auto-fill the live generated certificate with student profile data
        const now = new Date();
        const dayNum    = now.getDate();
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const yearFull  = now.getFullYear();

        // Ordinal suffix for day
        const ordinal = (n) => {
            const s = ['th','st','nd','rd'], v = n % 100;
            return n + (s[(v-20)%10] || s[v] || s[0]);
        };

        // Academic year: e.g. 2025-2026
        const academicYear = `${yearFull - 1}-${yearFull}`;

        // Student number
        const studentNum = currentUser.studentCode || '';

        document.getElementById('certBodyName').textContent       = currentUser.fullName.toUpperCase();
        document.getElementById('certBodyGrade').textContent      = currentUser.gradeLevel;
        document.getElementById('certBodyYear').textContent       = academicYear;
        document.getElementById('certBodyStudentNum').textContent  = studentNum;
        document.getElementById('certBodyDay').textContent        = ordinal(dayNum);
        document.getElementById('certBodyMonth').textContent      = monthName;
        document.getElementById('certBodyYearIssued').textContent = yearFull;

        openModal('certificateModal');

        // Write the certificate into the iframe so it displays full-page (like enrollment PDF viewer)
        setTimeout(() => {
            const certEl = document.getElementById('generatedCertificate');
            const certViewer = document.getElementById('certificatePdfViewer');
            if (certEl && certViewer) {
                const iframeDoc = certViewer.contentDocument || certViewer.contentWindow.document;
                const studentName = document.getElementById('certBodyName').textContent.trim();
                const studentGrade = document.getElementById('certBodyGrade').textContent.trim();
                const studentYear = document.getElementById('certBodyYear').textContent.trim();
                const studentNum = document.getElementById('certBodyStudentNum').textContent.trim();
                const certDay = document.getElementById('certBodyDay').textContent.trim();
                const certMonth = document.getElementById('certBodyMonth').textContent.trim();
                const certYearIssued = document.getElementById('certBodyYearIssued').textContent.trim();

                iframeDoc.open();
                iframeDoc.write(`<!DOCTYPE html><html><head>
                    <style>
                        * { margin:0; padding:0; box-sizing:border-box; }
                        body { background:#fff; font-family:'Times New Roman',Times,serif; font-size:13px; line-height:1.7; color:#000; padding:72px 80px 80px; }
                        @page { size: 8.5in 13in; margin: 0; }
                        @media print { body { margin:0; padding:72px 80px 80px; } }
                        .letterhead { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
                        .letterhead img { width:70px; height:70px; object-fit:contain; }
                        .letterhead-text { text-align:center; flex:1; padding:0 12px; }
                        .cert-title { text-align:center; font-size:16px; font-weight:bold; letter-spacing:1px; margin:28px 0; }
                        p { margin-bottom:24px; text-align:justify; }
                        .underline { border-bottom:1px solid #000; padding:0 2px; display:inline; font-weight:bold; }
                        .underline-sm { border-bottom:1px solid #000; padding:0 2px; display:inline; }
                        .underline-md { border-bottom:1px solid #000; padding:0 2px; display:inline; }
                        .sig-line { border-bottom:1px solid #000; width:220px; margin-top:32px; margin-bottom:4px; }
                    </style>
                </head><body>
                    <div class="letterhead">
                        <img src="../images/two.png" alt="Siembre High School Logo" onerror="this.style.display='none'">
                        <div class="letterhead-text">
                            <div style="font-size:11px;">Republic of the Philippines</div>
                            <div style="font-size:13px;font-weight:bold;">Department of Education</div>
                            <div style="font-size:11px;">Region V – Bicol Region</div>
                            <div style="font-size:11px;">Schools Division Office of Camarines Sur</div>
                            <div style="font-size:11px;">Siembre High School</div>
                            <div style="font-size:11px;">Brgy. Siembre , Bombon Camarines Sur</div>
                        </div>
                        <img src="../images/deped-logo.png" alt="DepEd Logo" onerror="this.style.display='none'">
                    </div>
                    <hr style="border:none;border-top:3px solid #000;margin:6px 0 2px;">
                    <hr style="border:none;border-top:1px solid #000;margin:0 0 0;">

                    <div class="cert-title">CERTIFICATE OF ENROLLMENT</div>

                    <p>To Whom It May Concern:</p>

                    <p>This is to certify that <span class="underline">${studentName}</span> is currently enrolled as Grade <span class="underline-sm">${studentGrade}</span> student at Siembre High School for this Academic Year <span class="underline-md">${studentYear}</span>.</p>

                    <p>His/Her Student Number is <span class="underline-md">${studentNum}</span>.</p>

                    <p>This certification is being issued upon the request of the learner for whatever legal purpose it may serve him/her best.</p>

                    <p>Issued this <span class="underline-sm">${certDay}</span> day of <span class="underline-md">${certMonth}</span>, <em>${certYearIssued}</em> at Siembre High School, Siembre, Bombon, Camarines Sur.</p>

                    <p style="margin-bottom:4px;">Noted by:</p>
                    <div class="sig-line"></div>
                    <div style="font-size:12px;">ADVISER</div>
                </body></html>`);
                iframeDoc.close();
            }
        }, 100);

        addActivity('Generated Certificate of Enrollment', 'document');
    }
}

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
    addActivity('Logged out from the system', 'logout');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ============================================
// EDIT PROFILE
// ============================================
function openEditProfile() {
    document.getElementById('editFullName').value = currentUser.fullName;
    const rawBirthday = currentUser.birthday;
    let formattedBirthday = rawBirthday;
    if (rawBirthday) {
        const d = new Date(rawBirthday);
        if (!isNaN(d)) {
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(d.getUTCDate()).padStart(2, '0');
            const yyyy = d.getUTCFullYear();
            formattedBirthday = `${mm}/${dd}/${yyyy}`;
        }
    }
    document.getElementById('editBirthday').value = formattedBirthday;
    document.getElementById('editEmail').value    = currentUser.email;
    document.getElementById('editAddress').value  = currentUser.address;
    openModal('editProfileModal');
}

async function handleEditProfile(e) {
    e.preventDefault();
    currentUser.fullName = document.getElementById('editFullName').value;

    // Convert MM/DD/YYYY input back to YYYY-MM-DD so UTC parsing in formatDate stays correct
    const rawBdInput = document.getElementById('editBirthday').value;
    if (rawBdInput && rawBdInput.includes('/')) {
        const parts = rawBdInput.split('/');
        if (parts.length === 3) {
            currentUser.birthday = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
        } else {
            currentUser.birthday = rawBdInput;
        }
    } else {
        currentUser.birthday = rawBdInput;
    }

    currentUser.email    = document.getElementById('editEmail').value;
    currentUser.address  = document.getElementById('editAddress').value;

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(API_BASE + '/api/student/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentCode: currentUser.studentCode,
                fullName:    currentUser.fullName,
                birthday:    currentUser.birthday,
                email:       currentUser.email,
                address:     currentUser.address
            })
        });
        const data = await res.json();
        if (data.user) currentUser = { ...currentUser, ...data.user };
    } catch(err) {
        console.warn('Backend unavailable, saving locally only.');
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    loadUserProfile();
    addActivity('Updated profile information', 'profile');
    closeModal('editProfileModal');
    showToast('Profile updated successfully!', 'success');
}

// ============================================
// CHANGE PASSWORD — verifies via backend API
// ============================================
function openChangePassword() {
    document.getElementById('changePasswordForm').reset();
    document.getElementById('passwordError').style.display = 'none';
    openModal('changePasswordModal');
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword     = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv        = document.getElementById('passwordError');
    const submitBtn       = document.querySelector('#changePasswordForm .btn-primary');

    errorDiv.style.display = 'none';

    if (newPassword.length < 6) {
        errorDiv.textContent = 'New password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Updating...'; }

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(API_BASE + '/api/student/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentCode: currentUser.studentCode,
                currentPassword,
                newPassword
            })
        });

        const data = await res.json();

        if (data.success) {
            currentUser.password = newPassword;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            addActivity('Changed account password', 'security');
            closeModal('changePasswordModal');
            showToast('Password changed successfully!', 'success');
        } else {
            errorDiv.textContent = data.error || 'Current password is incorrect';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        console.error('Change password error:', err);
        errorDiv.textContent = 'Connection error. Make sure the server is running.';
        errorDiv.style.display = 'block';
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Update Password'; }
}

// ============================================
// MODAL HELPERS
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) { e.target.classList.remove('active'); document.body.style.overflow = 'auto'; }
});

// ============================================
// ACTIVITY LOG
// ============================================
function addActivity(text, type) {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.unshift({ id: Date.now(), studentCode: currentUser.studentCode, text, type, timestamp: new Date().toISOString() });
    if (activities.length > 20) activities.splice(20);
    localStorage.setItem('activities', JSON.stringify(activities));
    loadRecentActivity();
}

function loadRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const userActivities = activities.filter(a => a.studentCode === currentUser.studentCode);
    const activityList = document.getElementById('activityList');
    if (userActivities.length === 0) {
        activityList.innerHTML = `<div class="activity-item"><div class="activity-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><div class="activity-content"><p class="activity-text">No recent activity</p><p class="activity-time">Start using the portal</p></div></div>`;
        return;
    }
    activityList.innerHTML = userActivities.slice(0, 5).map(a => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(a.type)}</div>
            <div class="activity-content"><p class="activity-text">${a.text}</p><p class="activity-time">${getTimeAgo(a.timestamp)}</p></div>
        </div>`).join('');
}

function getActivityIcon(type) {
    const icons = {
        login:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>',
        logout:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>',
        profile:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
        security: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
        document: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
        print:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>',
        view:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'
    };
    return icons[type] || icons['document'];
}

function getTimeAgo(timestamp) {
    const diffMs    = new Date() - new Date(timestamp);
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);
    if (diffMins < 1)   return 'Just now';
    if (diffMins < 60)  return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const existing = document.getElementById('dashToast');
    if (existing) existing.remove();

    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        error:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    };

    const toast = document.createElement('div');
    toast.id = 'dashToast';
    toast.className = `dash-toast dash-toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.success}<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('dash-toast-show'));
    setTimeout(() => {
        toast.classList.remove('dash-toast-show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// DOCUMENT REQUEST SYSTEM
// ============================================
const DOC_LABELS = {
    form_137:      'Form 137',
    good_moral:    'Good Moral Certificate',
    matriculation: 'Matriculation Form',
    evaluation:    'Evaluation Form',
    enrollment:    'Enrollment Form',
    certificate:   'Certificate of Enrollment'
};

let pendingDocType = null;

const DOC_ICONS = {
    form_137:      '📋',
    good_moral:    '🏅',
    matriculation: '🎓',
    evaluation:    '📅',
    enrollment:    '📄',
    certificate:   '🛡️'
};

// Called from dropdown select button
function openRequestFromSelect() {
    const select = document.getElementById('docTypeSelect');
    const docType = select.value;
    if (!docType) {
        showToast('Please select a document first', 'warning');
        return;
    }
    openRequestModal(docType);
    select.value = '';
}

// Clear completed/rejected requests
async function clearCompletedRequests() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/api/student/requests/${currentUser.studentCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();
        const toDelete = Array.isArray(requests)
            ? requests.filter(r => ['completed', 'rejected'].includes(r.status))
            : [];

        await Promise.all(toDelete.map(r =>
            fetch(`${API_BASE}/api/student/requests/${r._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ));

        showToast('Cleared completed requests!', 'success');
        loadMyDocumentRequests();
    } catch (err) {
        showToast('Failed to clear requests', 'error');
    }
}

// Called from onclick in HTML cards
function openRequestModal(docType) {
    pendingDocType = docType;
    document.getElementById('requestModalTitle').textContent = `Request: ${DOC_LABELS[docType]}`;
    document.getElementById('requestDocName').textContent    = DOC_LABELS[docType];
    document.getElementById('requestDocDesc').textContent    = getDocDescription(docType);
    document.getElementById('requestDocIconLarge').textContent = DOC_ICONS[docType] || '📄';
    document.getElementById('requestDocIconLarge').style.fontSize = '3rem';
    document.getElementById('requestDocIconLarge').style.textAlign = 'center';
    document.getElementById('requestPurpose').value          = '';
    openModal('requestDocModal');
}

function closeRequestModal() {
    closeModal('requestDocModal');
    pendingDocType = null;
}

function getDocDescription(docType) {
    const descs = {
        form_137:      'Official transcript of records. Usually required for transferring schools or college applications.',
        good_moral:    'Certificate of good character issued by the school. Required for scholarships and other applications.',
        matriculation: 'Subject enrollment form for the current semester. Required for official enrollment records.'
    };
    return descs[docType] || 'Official school document.';
}

async function submitDocumentRequest() {
    if (!pendingDocType) return;

    const purpose = document.getElementById('requestPurpose').value.trim();
    const token   = localStorage.getItem('token');
    const btn     = document.querySelector('#requestDocModal .btn-primary');

    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    try {
        const res = await fetch(API_BASE + '/api/student/request-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentCode:  currentUser.studentCode,
                studentName:  currentUser.fullName,
                documentType: pendingDocType,
                purpose:      purpose
            })
        });

        const data = await res.json();

        if (data.success) {
            const submittedLabel = DOC_LABELS[pendingDocType] || pendingDocType;
            closeRequestModal();
            showToast('Request submitted!', 'success');
            addActivity(`Requested ${submittedLabel}`, 'document');
            loadMyDocumentRequests();
        } else {
            showToast(data.error || 'Failed to submit request', 'warning');
        }
    } catch (err) {
        showToast('Connection error. Make sure the server is running.', 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = 'Submit Request'; }
}

async function loadMyDocumentRequests() {
    const container = document.getElementById('myRequestsList');
    if (!container) return;

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE}/api/student/requests/${currentUser.studentCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();

        // Filter only requested docs (not printed ones)
        const docRequests = Array.isArray(requests)
            ? requests.filter(r => ['form_137', 'good_moral', 'matriculation'].includes(r.documentType))
            : [];

        if (!docRequests.length) {
            container.innerHTML = `<p class="no-requests-text">No requests yet</p>`;
            const clearBtn = document.getElementById('btnClearRequests');
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }

        const hasCompleted = docRequests.some(r => ['completed', 'rejected'].includes(r.status));
        const clearBtn = document.getElementById('btnClearRequests');
        if (clearBtn) clearBtn.style.display = hasCompleted ? 'flex' : 'none';

        const statusLabel = {
            pending:    '⏳ Pending',
            processing: '🔄 Processing',
            ready:      '✅ Ready for Pickup',
            completed:  '🎉 Completed',
            rejected:   '❌ Rejected'
        };
        const statusClass = {
            pending:    'req-status-pending',
            processing: 'req-status-processing',
            ready:      'req-status-ready for pickup',
            completed:  'req-status-completed',
            rejected:   'req-status-rejected'
        };

        container.innerHTML = docRequests.map(r => `
            <div class="my-request-item">
                <div class="my-request-left">
                    <span class="my-request-icon">${DOC_ICONS[r.documentType] || '📄'}</span>
                    <div class="my-request-details">
                        <span class="my-request-type">${DOC_LABELS[r.documentType] || r.documentType}</span>
                        <span class="my-request-date">${new Date(r.requestDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                        ${r.purpose ? `<span class="my-request-purpose">📝 ${r.purpose}</span>` : ''}
                        ${r.adminNotes ? `<span class="my-request-notes">💬 Admin: ${r.adminNotes}</span>` : ''}
                    </div>
                </div>
                <span class="my-request-status ${statusClass[r.status] || 'req-status-pending'}">${statusLabel[r.status] || r.status}</span>
            </div>`).join('');

    } catch (err) {
        container.innerHTML = `<p class="no-requests-text">Unable to load requests</p>`;
    }
}

// expose for onclick handlers in HTML
window.openRequestModal      = openRequestModal;
window.closeRequestModal     = closeRequestModal;
window.submitDocumentRequest = submitDocumentRequest;
window.openRequestFromSelect = openRequestFromSelect;
window.clearCompletedRequests = clearCompletedRequests;

document.addEventListener('DOMContentLoaded', initDashboard);