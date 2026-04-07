const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const DocumentRequest = require('./models/DocumentRequest');
const Activity = require('./models/Activity');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();
connectDB();

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============= MIDDLEWARE =============
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://127.0.0.1:5000', null],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= SERVE FRONTEND =============
app.use(express.static(path.join(__dirname, '../front-end/html')));  // serve HTML files at root
app.use(express.static(path.join(__dirname, '../front-end')));        // serve css/js/images
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/html/login-selection.html'));
});

// ============= EMAIL TRANSPORTER =============
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ============= OTP SESSION STORE =============
const otpSessions = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
async function sendOTPEmail(email, otp) {
    await transporter.sendMail({
        from: `"Kiosora Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Admin Login OTP - Kiosora',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;border:1px solid #e5e7eb;border-radius:12px;">
                <h2 style="color:#9333ea;margin-bottom:0.5rem;">Admin Login Verification</h2>
                <p style="color:#6b7280;">Your one-time password for Kiosora Admin access:</p>
                <div style="background:#f5f3ff;border-radius:8px;padding:1.5rem;text-align:center;margin:1.5rem 0;">
                    <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.5rem;color:#7e22ce;">${otp}</span>
                </div>
                <p style="color:#6b7280;font-size:0.875rem;">This code expires in <strong>5 minutes</strong>. Do not share this with anyone.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
                <p style="color:#9ca3af;font-size:0.75rem;">If you did not request this, please ignore this email.</p>
            </div>
        `
    });
}

// ============= AUTH MIDDLEWARE =============
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
const adminMiddleware = (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied. Admin only.' });
    next();
};

// ============= HEALTH CHECK =============
app.get('/api/health', async (req, res) => {
    const mongoose = require('mongoose');
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ============= AUTH ROUTES =============

// Student Login
app.post('/api/auth/student/login', async (req, res) => {
    try {
        const { studentCode, password } = req.body;
        const student = await Student.findOne({ studentCode });
        if (!student) return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await student.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        student.lastLogin = new Date();
        await student.save();
        const token = jwt.sign({ id: student._id, studentCode: student.studentCode, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        await Activity.create({ studentCode: student.studentCode, activityType: 'login', description: 'Logged in to the system' });
        const userData = student.toObject();
        delete userData.password;
        res.json({ success: true, token, user: userData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Login (username + password) → sends OTP
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const otp = generateOTP();
        const sessionId = generateSessionId();
        otpSessions.set(sessionId, { email: admin.email, adminId: admin._id, otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        await sendOTPEmail(admin.email, otp);

        res.json({ success: true, sessionId, email: admin.email });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Google Sign-In → verifies token + checks whitelist → sends OTP
app.post('/api/auth/admin/google-signin', async (req, res) => {
    try {
        const { idToken } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // Check if Gmail is a registered admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(403).json({ error: 'Access denied. This Google account is not authorized as an admin.' });
        }

        const otp = generateOTP();
        const sessionId = generateSessionId();
        otpSessions.set(sessionId, { email: admin.email, adminId: admin._id, otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        await sendOTPEmail(admin.email, otp);

        res.json({ success: true, sessionId, email: admin.email });
    } catch (error) {
        console.error('Google sign-in error:', error);
        res.status(500).json({ error: 'Google verification failed' });
    }
});

// Verify OTP → issues JWT
app.post('/api/auth/admin/verify-otp', async (req, res) => {
    try {
        const { sessionId, otp, email } = req.body;
        const session = otpSessions.get(sessionId);
        if (!session) return res.status(400).json({ error: 'Session expired. Please login again.' });
        if (Date.now() > session.expiresAt) {
            otpSessions.delete(sessionId);
            return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
        }
        if (session.otp !== otp) return res.status(400).json({ error: 'Invalid OTP code.' });
        if (session.email !== email) return res.status(400).json({ error: 'Session mismatch.' });

        otpSessions.delete(sessionId);
        const admin = await Admin.findById(session.adminId);
        const token = jwt.sign({ id: admin._id, username: admin.username, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        const adminData = admin.toObject();
        delete adminData.password;
        res.json({ success: true, token, admin: adminData });
    } catch (error) {
        console.error('OTP verify error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Resend OTP
app.post('/api/auth/admin/resend-otp', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const oldSession = otpSessions.get(sessionId);
        if (!oldSession) return res.status(400).json({ error: 'Session not found. Please login again.' });

        otpSessions.delete(sessionId);
        const otp = generateOTP();
        const newSessionId = generateSessionId();
        otpSessions.set(newSessionId, { email: oldSession.email, adminId: oldSession.adminId, otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        await sendOTPEmail(oldSession.email, otp);

        res.json({ success: true, sessionId: newSessionId });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
});

// Student Registration
app.post('/api/auth/student/register', async (req, res) => {
    try {
        const { fullName, birthday, email, address, gradeLevel, password } = req.body;
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(400).json({ error: 'Email already registered' });
        const studentCode = await Student.generateStudentCode(gradeLevel);
        const student = new Student({ studentCode, fullName, birthday, email, address, gradeLevel, password });
        await student.save();
        res.json({ success: true, studentCode: student.studentCode, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generate student code preview
app.get('/api/auth/student/generate-code/:gradeLevel', async (req, res) => {
    try {
        const code = await Student.generateStudentCode(req.params.gradeLevel);
        res.json({ code });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============= STUDENT ROUTES =============
app.get('/api/student/profile/:studentCode', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findOne({ studentCode: req.params.studentCode }).select('-password');
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/student/request-document', authMiddleware, async (req, res) => {
    try {
        const { studentCode, studentName, documentType, purpose, status } = req.body;

        // Prevent duplicate pending requests for the same document type
        if (!status || status === 'pending') {
            const existing = await DocumentRequest.findOne({
                studentCode,
                documentType,
                status: { $in: ['pending', 'processing', 'ready'] }
            });
            if (existing) {
                return res.status(400).json({ error: 'You already have a pending request for this document.' });
            }
        }

        const request = new DocumentRequest({
            studentCode,
            studentName: studentName || '',
            documentType,
            purpose:     purpose || '',
            status:      status  || 'pending'
        });
        await request.save();

        await Activity.create({
            studentCode,
            activityType: status === 'completed' ? 'print' : 'document',
            description:  status === 'completed'
                ? `Printed ${documentType.replace(/_/g, ' ')}`
                : `Requested ${documentType.replace(/_/g, ' ')}`
        });

        res.json({ success: true, requestId: request._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/student/requests/:studentCode', authMiddleware, async (req, res) => {
    try {
        const requests = await DocumentRequest.find({ studentCode: req.params.studentCode }).sort({ requestDate: -1 });
        res.json(requests);
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/student/activity/:studentCode', authMiddleware, async (req, res) => {
    try {
        const activities = await Activity.find({ studentCode: req.params.studentCode }).sort({ timestamp: -1 }).limit(20);
        res.json(activities);
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/student/requests/:requestId', authMiddleware, async (req, res) => {
    try {
        await DocumentRequest.findByIdAndDelete(req.params.requestId);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ============= ADMIN ROUTES =============
app.get('/api/admin/students', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { search, grade } = req.query;
        let query = {};
        if (search) query.$or = [{ fullName: { $regex: search, $options: 'i' } }, { studentCode: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        if (grade) query.gradeLevel = grade;
        const students = await Student.find(query).select('-password').sort({ createdAt: -1 });
        res.json(students);
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/admin/students/:studentCode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const student = await Student.findOne({ studentCode: req.params.studentCode }).select('-password');
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/admin/students', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { fullName, birthday, email, address, gradeLevel, password } = req.body;
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(400).json({ error: 'Email already registered' });
        const studentCode = await Student.generateStudentCode(gradeLevel);
        const student = new Student({ studentCode, fullName, birthday, email, address, gradeLevel, password });
        await student.save();
        const studentData = student.toObject();
        delete studentData.password;
        res.json(studentData);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/admin/students/:studentCode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { studentCode } = req.params;
        const updateData = { ...req.body };
        delete updateData._id; delete updateData.studentCode; delete updateData.createdAt; delete updateData.__v;
        const student = await Student.findOne({ studentCode });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        if (updateData.fullName) student.fullName = updateData.fullName;
        if (updateData.gradeLevel) student.gradeLevel = updateData.gradeLevel;
        if (updateData.email) student.email = updateData.email;
        if (updateData.birthday) student.birthday = updateData.birthday;
        if (updateData.address) student.address = updateData.address;
        if (updateData.password) student.password = updateData.password;
        await student.save();
        const updatedStudent = student.toObject();
        delete updatedStudent.password;
        res.json(updatedStudent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/admin/students/:studentCode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Student.findOneAndDelete({ studentCode: req.params.studentCode });
        await DocumentRequest.deleteMany({ studentCode: req.params.studentCode });
        await Activity.deleteMany({ studentCode: req.params.studentCode });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/requests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { filter } = req.query;
        let query = {};
        if (filter && filter !== 'all') query.documentType = { $regex: filter, $options: 'i' };

        const requests = await DocumentRequest.find(query).sort({ requestDate: -1 });
        const requestsWithStudent = await Promise.all(requests.map(async (r) => {
            let studentName = r.studentName || '';
            if (!studentName) {
                const student = await Student.findOne({ studentCode: r.studentCode }).select('fullName');
                studentName = student ? student.fullName : 'Unknown';
            }
            return { ...r.toObject(), studentName };
        }));
        res.json(requestsWithStudent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/admin/requests/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const updateData = { status };
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (status === 'completed') updateData.completedAt = new Date();
        if (status === 'ready')     updateData.readyAt     = new Date();

        const request = await DocumentRequest.findByIdAndUpdate(
            req.params.requestId, updateData, { new: true }
        );
        if (!request) return res.status(404).json({ error: 'Request not found' });

        await Activity.create({
            studentCode:  request.studentCode,
            activityType: 'document',
            description:  `Document request for "${(request.documentType || '').replace(/_/g, ' ')}" updated to "${status}"`
        });

        res.json({ success: true, request });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/activities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const activities = await Activity.find().sort({ timestamp: -1 }).limit(100);
        const activitiesWithStudent = await Promise.all(activities.map(async (act) => {
            if (act.studentCode) {
                const student = await Student.findOne({ studentCode: act.studentCode }).select('fullName');
                return { ...act.toObject(), studentName: student ? student.fullName : 'Unknown' };
            }
            return act.toObject();
        }));
        res.json(activitiesWithStudent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/admin/activities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Activity.deleteMany({});
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const activeToday = await Activity.distinct('studentCode', { timestamp: { $gte: today } });
        const totalRequests = await DocumentRequest.countDocuments();
        const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
        const monthlyRequests = await DocumentRequest.countDocuments({ requestDate: { $gte: thisMonth } });
        res.json({ totalStudents, activeToday: activeToday.length, totalRequests, monthlyRequests });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= STUDENT CHANGE PASSWORD =============
app.post('/api/student/change-password', authMiddleware, async (req, res) => {
    try {
        const { studentCode, currentPassword, newPassword } = req.body;

        const student = await Student.findOne({ studentCode });
        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

        const isMatch = await student.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

        student.password = newPassword;
        await student.save();

        await Activity.create({
            studentCode,
            activityType: 'security',
            description: 'Changed password'
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ============= STUDENT UPDATE PROFILE =============
app.put('/api/student/update-profile', authMiddleware, async (req, res) => {
    try {
        const { studentCode, fullName, birthday, email, address } = req.body;

        const student = await Student.findOneAndUpdate(
            { studentCode },
            { fullName, birthday, email, address },
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

        await Activity.create({
            studentCode,
            activityType: 'profile',
            description: 'Updated profile information'
        });

        res.json({ success: true, user: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Ready for connections\n`);
});