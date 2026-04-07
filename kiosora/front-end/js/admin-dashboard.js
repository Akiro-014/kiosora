// ============= TOAST NOTIFICATION =============
function showToast(message, type = 'success') {
    const existing = document.getElementById('adminToast');
    if (existing) existing.remove();
    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    const toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast admin-toast-' + type;
    toast.innerHTML = '<span class="admin-toast-icon">' + (icons[type] || icons.success) + '</span><span class="admin-toast-message">' + message + '</span>';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============= INITIALIZATION =============
let currentEditStudent = null;
let currentDeleteStudent = null;
let currentFilter = 'all';
let adminToken = localStorage.getItem('adminToken');

// ============= INITIALIZATION =============
async function initAdminDashboard() {
    // Check if admin is logged in
    if (!adminToken) {
        window.location.href = 'login-selection.html';
        return;
    }

    // Setup event listeners
    setupAdminEventListeners();
    
    // Load data
    await loadStatistics();
    await loadStudentsTable();
    await loadDocumentRequests();
    await loadActivityMonitor();
}

// ============= SETUP EVENT LISTENERS =============
function setupAdminEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Tab navigation
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Add student button
    const addBtn = document.getElementById('btnAddStudent');
    if (addBtn) {
        addBtn.addEventListener('click', openAddStudentModal);
    }
    
    // Student form submission
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleSaveStudent);
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchStudents');
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }
    
    const filterGrade = document.getElementById('filterGrade');
    if (filterGrade) {
        filterGrade.addEventListener('change', filterStudents);
    }
    
    // Clear activity button
    const clearBtn = document.getElementById('btnClearActivity');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllActivity);
    }
    
    // Document filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadDocumentRequests();
        });
    });
}

// ============= HANDLE ADMIN LOGOUT =============
function handleAdminLogout() {
    openLogoutModal();
}

function openLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Set up confirm button click handler
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    if (confirmBtn) {
        confirmBtn.onclick = confirmLogout;
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function confirmLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login-selection.html';
}

// ============= SWITCH TAB =============
function switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabContent = document.getElementById(`${tabName}Tab`);
    if (tabContent) tabContent.classList.add('active');
    
    if (tabName === 'students') loadStudentsTable();
    else if (tabName === 'requests') loadDocumentRequests();
    else if (tabName === 'activity') loadActivityMonitor();
}

// ============= LOAD STATISTICS =============
async function loadStatistics() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const stats = await response.json();
        
        document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
        document.getElementById('activeStudents').textContent = stats.activeToday || 0;
        document.getElementById('totalRequests').textContent = stats.totalRequests || 0;
        document.getElementById('monthlyRequests').textContent = stats.monthlyRequests || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============= LOAD STUDENTS TABLE =============
async function loadStudentsTable() {
    try {
        const search = document.getElementById('searchStudents')?.value || '';
        const grade = document.getElementById('filterGrade')?.value || '';
        
        let url = 'http://localhost:5000/api/admin/students';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        // Send grade as-is (zero-padded e.g. "07") to match stored gradeLevel values
        if (grade) params.append('grade', grade);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load students');
        
        const students = await response.json();
        const tableBody = document.getElementById('studentsTableBody');
        
        if (!tableBody) return;
        
        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                        <p>No students found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = students.map(student => `
            <tr data-code="${student.studentCode}">
                <td><strong>${student.studentCode}</strong></td>
                <td>${student.fullName || ''}</td>
                <td>Grade ${student.gradeLevel || ''}</td>
                <td>${student.email || ''}</td>
                <td>${formatDate(student.birthday)}</td>
                <td>${student.address || ''}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" onclick="openEditStudentModal('${student.studentCode}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn-action btn-reset-pw" data-code="${student.studentCode}" data-name="${student.fullName}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Reset
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteModal('${student.studentCode}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// ============= FILTER STUDENTS =============
async function filterStudents() {
    await loadStudentsTable();
}

// ============= OPEN ADD STUDENT MODAL =============
function openAddStudentModal() {
    document.getElementById('studentModalTitle').textContent = 'Add New Student';
    document.getElementById('btnSaveStudent').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('editStudentCode').value = '';
    document.getElementById('studentCodeDisplay').style.display = 'none';
    currentEditStudent = null;
    const pwg2 = document.getElementById('passwordGroup');
    if (pwg2) { pwg2.style.display = ''; document.getElementById('studentPassword').setAttribute('required',''); }
    openModal('studentModal');
}

// ============= OPEN EDIT STUDENT MODAL =============
async function openEditStudentModal(studentCode) {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            showToast('Session expired. Please login again.', 'warning');
            window.location.href = 'login-selection.html';
            return;
        }
        
        const response = await fetch(`http://localhost:5000/api/admin/students/${studentCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showToast('Authentication failed. Please login again.', 'error');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = 'login-selection.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const student = await response.json();
        currentEditStudent = student;
        
        document.getElementById('studentModalTitle').textContent = 'Edit Student';
        document.getElementById('btnSaveStudent').textContent = 'Update Student';
        document.getElementById('editStudentCode').value = student.studentCode;
        document.getElementById('studentFullName').value = student.fullName || '';
        document.getElementById('studentGrade').value = student.gradeLevel || '';
        document.getElementById('studentEmail').value = student.email || '';
        
        if (student.birthday) {
            const birthDate = new Date(student.birthday);
            const formattedDate = birthDate.toISOString().split('T')[0];
            document.getElementById('studentBirthday').value = formattedDate;
        }
        
        document.getElementById('studentAddress').value = student.address || '';
        document.getElementById('studentPassword').value = '';
        const pwg = document.getElementById('passwordGroup');
        if (pwg) { pwg.style.display = 'none'; document.getElementById('studentPassword').removeAttribute('required'); }
        
        document.getElementById('generatedCode').textContent = student.studentCode;
        document.getElementById('studentCodeDisplay').style.display = 'block';
        
        openModal('studentModal');
        
    } catch (error) {
        console.error('Error loading student:', error);
        showToast('Error loading student data', 'error');
    }
}

// ============= HANDLE SAVE STUDENT =============
async function handleSaveStudent(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showToast('Session expired. Please login again.', 'warning');
        window.location.href = 'login-selection.html';
        return;
    }
    
    const studentData = {
        fullName: document.getElementById('studentFullName').value,
        gradeLevel: document.getElementById('studentGrade').value,
        email: document.getElementById('studentEmail').value,
        birthday: document.getElementById('studentBirthday').value,
        address: document.getElementById('studentAddress').value
    };
    
    const password = document.getElementById('studentPassword').value;
    
    try {
        let url, method;
        
        if (currentEditStudent) {
            url = `http://localhost:5000/api/admin/students/${currentEditStudent.studentCode}`;
            method = 'PUT';
            if (password) studentData.password = password;
        } else {
            url = 'http://localhost:5000/api/admin/students';
            method = 'POST';
            if (!password) {
                showToast('Password is required for new students', 'warning');
                return;
            }
            studentData.password = password;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(studentData)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showToast('Authentication failed. Please login again.', 'error');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = 'login-selection.html';
                return;
            }
            
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        showToast(currentEditStudent ? 'Student updated successfully!' : 'Student added successfully!');
        closeStudentModal();
        await loadStudentsTable();
        await loadStatistics();
        
        document.getElementById('studentForm').reset();
        document.getElementById('editStudentCode').value = '';
        document.getElementById('studentCodeDisplay').style.display = 'none';
        currentEditStudent = null;
        
    } catch (error) {
        console.error('Error saving student:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ============= OPEN DELETE MODAL =============
async function openDeleteModal(studentCode) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/students?search=${studentCode}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const students = await response.json();
        const student = students.find(s => s.studentCode === studentCode);
        
        if (!student) return;
        
        currentDeleteStudent = student;
        
        document.getElementById('deleteStudentName').textContent = student.fullName;
        document.getElementById('deleteStudentCode').textContent = student.studentCode;
        
        openModal('deleteModal');
        
        document.getElementById('confirmDeleteBtn').onclick = () => deleteStudent(student.studentCode);
    } catch (error) {
        console.error('Error loading student:', error);
    }
}

// ============= DELETE STUDENT =============
async function deleteStudent(studentCode) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/students/${studentCode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeDeleteModal();
            await loadStudentsTable();
            await loadStatistics();
            await loadDocumentRequests();
            await loadActivityMonitor();
            showToast('Student deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Delete failed', 'error');
    }
}

// ============= LOAD DOCUMENT REQUESTS =============
const DOC_LABELS_ADMIN = {
    form_137:                  'Form 137',
    good_moral:                'Good Moral Certificate',
    matriculation:             'Matriculation Form',
    evaluation_form:           'Evaluation Form',
    enrollment_form:           'Enrollment Form',
    certificate_of_enrollment: 'Certificate of Enrollment',
    evaluation:                'Evaluation Form',
    enrollment:                'Enrollment Form',
    certificate:               'Certificate of Enrollment',
    evaluation_form_printed:   'Evaluation Form (Printed)',
    enrollment_form_printed:   'Enrollment Form (Printed)',
    certificate_of_enrollment_printed: 'Certificate (Printed)'
};

async function loadDocumentRequests() {
    try {
        let url = 'http://localhost:5000/api/admin/requests';
        if (currentFilter !== 'all') url += `?filter=${currentFilter}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const requests = await response.json();
        const tableBody = document.getElementById('requestsTableBody');
        if (!tableBody) return;

        // Update status counts
        const counts = { pending: 0, processing: 0, ready: 0, completed: 0 };
        requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
        const pendingEl    = document.getElementById('pendingCount');
        const processingEl = document.getElementById('processingCount');
        const readyEl      = document.getElementById('readyCount');
        const completedEl  = document.getElementById('completedCount');
        if (pendingEl)    pendingEl.textContent    = counts.pending;
        if (processingEl) processingEl.textContent = counts.processing;
        if (readyEl)      readyEl.textContent      = counts.ready;
        if (completedEl)  completedEl.textContent  = counts.completed;

        if (requests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <p>No document requests yet</p>
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = requests.map(req => {
            const docLabel = DOC_LABELS_ADMIN[req.documentType] || req.documentType || '-';
            const statusClass = {
                pending:    'status-badge-pending',
                processing: 'status-badge-processing',
                ready:      'status-badge-ready',
                completed:  'status-badge-completed',
                rejected:   'status-badge-rejected'
            }[req.status] || 'status-badge-pending';

            const statusLabel = {
                pending:    '⏳ Pending',
                processing: '🔄 Processing',
                ready:      '✅ Ready',
                completed:  '🎉 Completed',
                rejected:   '❌ Rejected'
            }[req.status] || req.status;

            const notesEscaped = (req.adminNotes || '').replace(/'/g, '&apos;').replace(/"/g, '&quot;');

            return `
                <tr>
                    <td>${formatDateTime(req.requestDate)}</td>
                    <td><strong>${req.studentCode}</strong></td>
                    <td>${req.studentName || 'Unknown'}</td>
                    <td>${docLabel}</td>
                    <td>${req.purpose || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <button class="btn-update-status" onclick="openUpdateRequestModal('${req._id}','${req.studentCode}','${docLabel}','${req.status}','${notesEscaped}')">
                            Update
                        </button>
                    </td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

// ============= UPDATE REQUEST STATUS =============
function openUpdateRequestModal(id, studentCode, docLabel, currentStatus, currentNotes) {
    document.getElementById('updateRequestId').value = id;
    document.getElementById('updateRequestStatus').value = currentStatus;
    document.getElementById('updateRequestNotes').value = currentNotes || '';
    document.getElementById('updateReqInfo').innerHTML = `
        <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:0.75rem 1rem; font-size:0.875rem;">
            <strong>${docLabel}</strong><br>
            <span style="color:#6b7280;">Student: ${studentCode}</span>
        </div>`;

    const modal = document.getElementById('updateRequestModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    document.getElementById('confirmUpdateRequestBtn').onclick = confirmUpdateRequest;
}

function closeUpdateRequestModal() {
    const modal = document.getElementById('updateRequestModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

async function confirmUpdateRequest() {
    const id         = document.getElementById('updateRequestId').value;
    const status     = document.getElementById('updateRequestStatus').value;
    const adminNotes = document.getElementById('updateRequestNotes').value.trim();
    const btn        = document.getElementById('confirmUpdateRequestBtn');

    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
        const response = await fetch(`http://localhost:5000/api/admin/requests/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status, adminNotes })
        });

        const data = await response.json();
        if (response.ok) {
            closeUpdateRequestModal();
            showToast(`Status updated to "${status}" successfully!`, 'success');
            await loadDocumentRequests();
            await loadStatistics();
            await loadActivityMonitor();
        } else {
            showToast(data.error || 'Failed to update status', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Update Status';
}

// ============= LOAD ACTIVITY MONITOR =============
async function loadActivityMonitor() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/activities', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const activities = await response.json();
        const activityList = document.getElementById('activityListAdmin');
        
        if (!activityList) return;
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item-admin">
                    <div class="activity-icon-admin">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                    </div>
                    <div class="activity-content-admin">
                        <p class="activity-text-admin">No activities recorded</p>
                        <p class="activity-meta-admin">Start monitoring student activities</p>
                    </div>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item-admin">
                <div class="activity-icon-admin">
                    ${getActivityIcon(activity.activityType)}
                </div>
                <div class="activity-content-admin">
                    <p class="activity-text-admin">
                        <strong>${activity.studentName || 'Unknown'}</strong> (${activity.studentCode || 'N/A'}) - ${activity.description}
                    </p>
                    <p class="activity-meta-admin">
                        ${formatDateTime(activity.timestamp)}
                    </p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// ============= CLEAR ALL ACTIVITY =============
async function clearAllActivity() {
    const modal = document.getElementById('clearActivityModal');
    if (modal) { modal.classList.add('active'); return; }
    await _doClearAllActivity();
}

async function _doClearAllActivity() {
    const modal = document.getElementById('clearActivityModal');
    if (modal) modal.classList.remove('active');
    try {
        const response = await fetch('http://localhost:5000/api/admin/activities', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        if (data.success) {
            await loadActivityMonitor();
            await loadDocumentRequests();
            await loadStatistics();
            showToast('All activities cleared');
        }
    } catch (error) {
        console.error('Error clearing activities:', error);
    }
}

function closeClearActivityModal() {
    const modal = document.getElementById('clearActivityModal');
    if (modal) modal.classList.remove('active');
}

window.closeClearActivityModal = closeClearActivityModal;
window._doClearAllActivity = _doClearAllActivity;

// ============= HELPER FUNCTIONS =============
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getActivityIcon(type) {
    const icons = {
        'login':    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>',
        'logout':   '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>',
        'profile':  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
        'document': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
        'print':    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>',
        'request':  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>',
        'security': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>'
    };
    return icons[type] || icons['document'];
}

// ============= MODAL FUNCTIONS =============
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});



// ============= RESET STUDENT PASSWORD =============
let _resetCode = null;

// Delegated listener — catches dynamically rendered Reset buttons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-reset-pw');
    if (!btn) return;
    _resetCode = btn.dataset.code;
    const name = btn.dataset.name || '';
    const info = document.getElementById('resetPwInfo');
    if (info) {
        info.innerHTML = '<div class="reset-pw-student-info">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>'
            + '<strong>' + name + '</strong> (' + _resetCode + ')'
            + '</div>';
    }
    document.getElementById('resetNewPassword').value = '';
    document.getElementById('resetConfirmPassword').value = '';
    const err = document.getElementById('resetPwError');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    const modal = document.getElementById('resetPasswordModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
});

function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    _resetCode = null;
}

async function submitResetPassword() {
    const newPw  = (document.getElementById('resetNewPassword').value || '').trim();
    const confPw = (document.getElementById('resetConfirmPassword').value || '').trim();
    const err    = document.getElementById('resetPwError');
    err.style.display = 'none'; err.textContent = '';

    if (newPw.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; return; }
    if (newPw !== confPw) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }

    const token = localStorage.getItem('adminToken');
    const btn   = document.querySelector('#resetPasswordModal .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Changing...'; }

    try {
        const res  = await fetch('http://localhost:5000/api/admin/students/' + _resetCode, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ password: newPw })
        });
        const data = await res.json();
        if (res.ok) {
            closeResetPasswordModal();
            showToast('Password changed successfully!', 'success');
        } else {
            err.textContent = data.error || 'Failed to change password.';
            err.style.display = 'block';
        }
    } catch (e) {
        err.textContent = 'Connection error. Please try again.';
        err.style.display = 'block';
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Reset Password'; }
}

window.closeResetPasswordModal = closeResetPasswordModal;
window.submitResetPassword     = submitResetPassword;

// ============= INITIALIZE =============
document.addEventListener('DOMContentLoaded', initAdminDashboard);

// Make functions globally available for onclick handlers
window.openEditStudentModal    = openEditStudentModal;
window.openDeleteModal         = openDeleteModal;
window.closeStudentModal       = closeStudentModal;
window.closeDeleteModal        = closeDeleteModal;
window.closeLogoutModal        = closeLogoutModal;
window.openUpdateRequestModal  = openUpdateRequestModal;
window.closeUpdateRequestModal = closeUpdateRequestModal;