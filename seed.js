const mongoose = require('mongoose');
const Student = require('./models/studentModel');
const Course = require('./models/courseModel');
require('dotenv').config(); // Load environment variables from .env file

// Connect to MongoDB using the MONGODB_URI from .env
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB for seeding');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Seed data
const seedData = async () => {
    try {
        // Clear existing data (optional, comment out if you don't want to clear)
        await Student.deleteMany({});
        await Course.deleteMany({});
        console.log('Cleared existing data');

        // Seed students
        const students = [
            { rollNumber: '12345', schedule: [], registeredCourses: [], subscriptions: [], notifications: [] },
            { rollNumber: '67890', schedule: [], registeredCourses: [], subscriptions: [], notifications: [] }
        ];
        await Student.insertMany(students);
        console.log('Seeded students');

        // Seed courses
        const courses = [
            {
                name: 'Introduction to Programming',
                department: 'CS',
                level: '100',
                time: 'Morning',
                day: 'Monday',
                seats: 30,
                prerequisites: [],
                registeredStudents: []
            },
            {
                name: 'Circuit Analysis',
                department: 'EE',
                level: '200',
                time: 'Afternoon',
                day: 'Tuesday',
                seats: 25,
                prerequisites: ['Introduction to Programming'],
                registeredStudents: []
            },
            {
                name: 'Data Structures',
                department: 'CS',
                level: '200',
                time: 'Morning',
                day: 'Wednesday',
                seats: 20,
                prerequisites: ['Introduction to Programming'],
                registeredStudents: []
            }
        ];
        await Course.insertMany(courses);
        console.log('Seeded courses');

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedData();