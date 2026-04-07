const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const DocumentRequest = require('../models/DocumentRequest');
const Activity = require('../models/Activity');
const { authMiddleware } = require('../middleware/auth');

// Get student profile
router.get('/profile/:studentCode', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findOne({ studentCode: req.params.studentCode })
            .select('-password');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update student profile
router.put('/profile/:studentCode', authMiddleware, async (req, res) => {
    try {
        const { fullName, birthday, email, address } = req.body;
        
        const student = await Student.findOneAndUpdate(
            { studentCode: req.params.studentCode },
            { fullName, birthday, email, address },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Log activity
        await Activity.create({
            studentCode: student.studentCode,
            activityType: 'profile',
            description: 'Updated profile information'
        });
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Request document
router.post('/request-document', authMiddleware, async (req, res) => {
    try {
        const { studentCode, documentType } = req.body;
        
        const request = new DocumentRequest({
            studentCode,
            documentType,
            status: 'pending'
        });
        
        await request.save();
        
        // Log activity
        await Activity.create({
            studentCode,
            activityType: 'document',
            description: `Requested ${documentType}`
        });
        
        res.json({ 
            success: true, 
            requestId: request._id 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student's document requests
router.get('/requests/:studentCode', authMiddleware, async (req, res) => {
    try {
        const requests = await DocumentRequest.find({ 
            studentCode: req.params.studentCode 
        }).sort({ requestDate: -1 });
        
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student's activities
router.get('/activity/:studentCode', authMiddleware, async (req, res) => {
    try {
        const activities = await Activity.find({ 
            studentCode: req.params.studentCode 
        }).sort({ timestamp: -1 }).limit(20);
        
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { studentCode, currentPassword, newPassword } = req.body;
        
        const student = await Student.findOne({ studentCode });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Verify current password
        const isMatch = await student.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Update password
        student.password = newPassword;
        await student.save();
        
        // Log activity
        await Activity.create({
            studentCode,
            activityType: 'security',
            description: 'Changed password'
        });
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;