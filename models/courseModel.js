const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true },
    time: { type: String, required: true },
    day: { type: String, required: true },
    seats: { type: Number, required: true },
    prerequisites: [{ type: String }],
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

module.exports = mongoose.model('Course', courseSchema);