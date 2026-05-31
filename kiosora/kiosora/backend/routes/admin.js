const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const DocumentRequest = require('../models/DocumentRequest');
const Activity = require('../models/Activity');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all students (with filters)
router.get('/students', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { search, grade } = req.query;
        
        let query = {};
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { studentCode: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (grade) {
            query.gradeLevel = grade;
        }
        
        const students = await Student.find(query)
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create student (admin)
router.post('/students', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { fullName, birthday, email, address, gradeLevel, password } = req.body;
        
        // Generate student code
        const studentCode = await Student.generateStudentCode(gradeLevel);
        
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
        
        const studentData = student.toObject();
        delete studentData.password;
        
        res.json(studentData);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update student
router.put('/students/:studentCode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { fullName, birthday, email, address, gradeLevel, password } = req.body;
        
        const updateData = { fullName, birthday, email, address, gradeLevel };
        
        if (password) {
            updateData.password = password;
        }
        
        const student = await Student.findOneAndUpdate(
            { studentCode: req.params.studentCode },
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete student
router.delete('/students/:studentCode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Student.findOneAndDelete({ studentCode: req.params.studentCode });
        await DocumentRequest.deleteMany({ studentCode: req.params.studentCode });
        await Activity.deleteMany({ studentCode: req.params.studentCode });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all document requests
router.get('/requests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { filter } = req.query;
        
        let query = {};
        if (filter && filter !== 'all') {
            query.documentType = filter;
        }
        
        const requests = await DocumentRequest.find(query)
            .populate('studentCode', 'fullName email gradeLevel')
            .sort({ requestDate: -1 });
        
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update request status
router.put('/requests/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        
        const updateData = { status };
        if (status === 'printed') {
            updateData.printedAt = new Date();
        } else if (status === 'viewed') {
            updateData.viewedAt = new Date();
        }
        
        const request = await DocumentRequest.findByIdAndUpdate(
            req.params.requestId,
            updateData,
            { new: true }
        );
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all activities
router.get('/activities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const activities = await Activity.find()
            .populate('studentCode', 'fullName')
            .sort({ timestamp: -1 })
            .limit(50);
        
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear activities
router.delete('/activities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Activity.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeToday = await Activity.distinct('studentCode', {
            timestamp: { $gte: today }
        });
        
        const totalRequests = await DocumentRequest.countDocuments();
        
        const thisMonth = new Date();
        thisMonth.setMonth(thisMonth.getMonth(), 1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const monthlyRequests = await DocumentRequest.countDocuments({
            requestDate: { $gte: thisMonth }
        });

        const form137Count = await DocumentRequest.countDocuments({ documentType: 'form_137' });
        const goodMoralCount = await DocumentRequest.countDocuments({ documentType: 'good_moral' });
        const matriculationCount = await DocumentRequest.countDocuments({ documentType: 'matriculation' });
        
        res.json({
            totalStudents,
            activeToday: activeToday.length,
            totalRequests,
            monthlyRequests,
            form137Count,
            goodMoralCount,
            matriculationCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;