const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    birthday: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    gradeLevel: {
        type: String,
        required: true,
        enum: ['07', '08', '09', '10', '11', '12']
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate unique student code - keeps incrementing until a free code is found
studentSchema.statics.generateStudentCode = async function(gradeLevel) {
    const students = await this.find({ gradeLevel }).sort({ studentCode: -1 });

    let nextNumber = 1;

    if (students.length > 0) {
        const lastCode = students[0].studentCode;
        const lastNumber = parseInt(lastCode.split('-')[1]);
        nextNumber = lastNumber + 1;
    }

    // Keep incrementing until we find a code that doesn't exist
    let newCode;
    let attempts = 0;
    do {
        newCode = `${gradeLevel}-${nextNumber.toString().padStart(3, '0')}`;
        const existing = await this.findOne({ studentCode: newCode });
        if (!existing) break;
        nextNumber++;
        attempts++;
    } while (attempts < 1000);

    return newCode;
};

module.exports = mongoose.model('Student', studentSchema);