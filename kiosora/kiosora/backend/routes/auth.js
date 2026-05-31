const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Activity = require('../models/Activity');

// Student Login
router.post('/student/login', async (req, res) => {
    try {
        const { studentCode, password } = req.body;
        
        // Find student
        const student = await Student.findOne({ studentCode });
        if (!student) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        student.lastLogin = new Date();
        await student.save();
        
        // Create token
        const token = jwt.sign(
            { 
                id: student._id,
                studentCode: student.studentCode,
                isAdmin: false 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        // Log activity
        await Activity.create({
            studentCode: student.studentCode,
            activityType: 'login',
            description: 'Logged in to the system'
        });
        
        // Return user data (without password)
        const userData = student.toObject();
        delete userData.password;
        
        res.json({
            success: true,
            token,
            user: userData
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find admin
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { 
                id: admin._id,
                username: admin.username,
                isAdmin: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        // Return admin data (without password)
        const adminData = admin.toObject();
        delete adminData.password;
        
        res.json({
            success: true,
            token,
            admin: adminData
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Student Registration
router.post('/student/register', async (req, res) => {
    try {
        const { fullName, birthday, email, address, gradeLevel, password } = req.body;
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ 
            $or: [{ email }, { studentCode: `${gradeLevel}-` }] 
        });
        
        if (existingStudent) {
            return res.status(400).json({ error: 'Student already exists' });
        }
        
        // Generate student code
        const studentCode = await Student.generateStudentCode(gradeLevel);
        
        // Create new student
        const student = new Student({
            studentCode,
            fullName,
            birthday,
            email,
            address,
            gradeLevel,
            password
        });
        
        await student.save();
        
        res.json({
            success: true,
            studentCode: student.studentCode,
            message: 'Registration successful'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generate student code preview
router.get('/student/generate-code/:gradeLevel', async (req, res) => {
    try {
        const code = await Student.generateStudentCode(req.params.gradeLevel);
        res.json({ code });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;