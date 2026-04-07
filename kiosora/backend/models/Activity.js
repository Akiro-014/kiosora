const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    studentCode: {
        type: String,
        ref: 'Student'
    },
    activityType: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'profile', 'security', 'document', 'print', 'view']
    },
    description: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);