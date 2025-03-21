const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    rollNumber: { type: String, required: true, unique: true },
    schedule: [{ courseId: String, time: String, day: String, courseName: String }],
    registeredCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    notifications: [{ message: String, timestamp: { type: Date, default: Date.now } }] 
});

module.exports = mongoose.model('Student', studentSchema);