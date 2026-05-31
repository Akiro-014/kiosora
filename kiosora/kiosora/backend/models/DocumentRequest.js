const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
    studentCode:  { type: String, required: true },
    studentName:  { type: String, default: '' },
    documentType: { type: String, required: true },
    purpose:      { type: String, default: '' },
    status:       { type: String, enum: ['pending','processing','ready','completed','rejected'], default: 'pending' },
    adminNotes:   { type: String, default: '' },
    requestDate:  { type: Date, default: Date.now },
    readyAt:      { type: Date },
    completedAt:  { type: Date }
});

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);