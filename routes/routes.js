const express = require('express');
const router = express.Router();
const Student = require('../models/studentModel');
const Course = require('../models/courseModel');

// Serve pages
router.get('/', (req, res) => res.sendFile('views/index.html', { root: '.' }));
router.get('/student', (req, res) => res.sendFile('views/student.html', { root: '.' }));
router.get('/admin', (req, res) => res.sendFile('views/admin.html', { root: '.' }));
router.get('/error', (req, res) => res.sendFile('views/error.html', { root: '.' }));

// Student login
router.post('/login/student', async (req, res) => {
    const { rollNumber } = req.body;
    const student = await Student.findOne({ rollNumber });
    if (student) {
        res.json({ success: true, redirect: '/student' });
    } else {
        res.json({ success: false, redirect: '/error' });
    }
});

// Admin login (hardcoded for simplicity)
router.post('/login/admin', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, redirect: '/admin' });
    } else {
        res.json({ success: false, redirect: '/error' });
    }
});

// Get all courses
router.get('/courses', async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
});

// Get a single course by ID
router.get('/courses/:id', async (req, res) => {
    const course = await Course.findById(req.params.id);
    res.json(course);
});

// Add course
router.post('/course/add', async (req, res) => {
    try {
        const { name, department, level, time, day, seats, prerequisites } = req.body;
        const course = new Course({
            name,
            department,
            level,
            time,
            day,
            seats,
            prerequisites: prerequisites ? prerequisites.split(',').map(p => p.trim()) : [],
            registeredStudents: []
        });
        await course.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ success: false, message: 'Error adding course' });
    }
});

// Update course
router.post('/course/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, level, time, day, seats, prerequisites } = req.body;
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const previousSeats = course.seats;
        await Course.findByIdAndUpdate(id, {
            name,
            department,
            level,
            time,
            day,
            seats,
            prerequisites: prerequisites && typeof prerequisites === 'string' ? prerequisites.split(',').map(p => p.trim()) : prerequisites || []
        });

        // Check if seats increased and notify subscribed students
        if (seats > previousSeats) {
            const updatedCourse = await Course.findById(id);
            const availableSeats = seats - updatedCourse.registeredStudents.length;
            if (availableSeats > 0) {
                const students = await Student.find({ subscriptions: id });
                students.forEach(async (student) => {
                    student.notifications.push({ message: `A seat is now available in ${updatedCourse.name}!` });
                    student.subscriptions = student.subscriptions.filter(sub => sub.toString() !== id.toString());
                    await student.save();
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Error updating course' });
    }
});

// Delete course
router.post('/course/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Course.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ success: false, message: 'Error deleting course' });
    }
});

// Register student for course
router.post('/course/register', async (req, res) => {
    try {
        const { rollNumber, courseId } = req.body;
        const student = await Student.findOne({ rollNumber }).populate('registeredCourses');
        const course = await Course.findById(courseId);

        // Check for scheduling conflicts
        const conflict = student.schedule.some(s => s.time === course.time && s.day === course.day);
        if (conflict) {
            return res.json({ success: false, message: 'Scheduling conflict detected' });
        }

        // Check seat availability
        if (course.seats <= course.registeredStudents.length) {
            return res.json({ success: false, message: 'No seats available' });
        }

        // Check prerequisites
        const completedCourses = student.registeredCourses.map(c => c.name);
        const missingPrereqs = course.prerequisites.some(prereq => !completedCourses.includes(prereq));
        if (missingPrereqs) {
            return res.json({ success: false, message: 'Missing prerequisites' });
        }

        // Register the course
        student.schedule.push({ courseId, time: course.time, day: course.day, courseName: course.name });
        student.registeredCourses.push(course._id);
        course.registeredStudents.push(student._id);
        await student.save();
        await course.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering course:', error);
        res.status(500).json({ success: false, message: 'Error registering course' });
    }
});

// Remove student from course
router.post('/course/remove', async (req, res) => {
    try {
        const { rollNumber, courseId } = req.body;
        const student = await Student.findOne({ rollNumber });
        const course = await Course.findById(courseId);

        student.schedule = student.schedule.filter(s => s.courseId !== courseId);
        student.registeredCourses = student.registeredCourses.filter(c => c.toString() !== courseId);
        course.registeredStudents = course.registeredStudents.filter(s => s.toString() !== student._id.toString());

        // Check if seats are now available and notify subscribed students
        const availableSeats = course.seats - course.registeredStudents.length;
        if (availableSeats > 0) {
            const subscribedStudents = await Student.find({ subscriptions: courseId });
            subscribedStudents.forEach(async (subStudent) => {
                subStudent.notifications.push({ message: `A seat is now available in ${course.name}!` });
                subStudent.subscriptions = subStudent.subscriptions.filter(sub => sub.toString() !== courseId.toString());
                await subStudent.save();
            });
        }

        await student.save();
        await course.save();
        res.json({ success: true, availableSeats: availableSeats > 0 });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).json({ success: false, message: 'Error removing course' });
    }
});

// Subscribe to a course
router.post('/course/subscribe', async (req, res) => {
    try {
        const { rollNumber, courseId } = req.body;
        const student = await Student.findOne({ rollNumber });
        if (!student.subscriptions.includes(courseId)) {
            student.subscriptions.push(courseId);
            await student.save();
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error subscribing to course:', error);
        res.status(500).json({ success: false, message: 'Error subscribing to course' });
    }
});

// Get student schedule
router.get('/student/schedule/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const student = await Student.findOne({ rollNumber }).populate('registeredCourses');
        res.json(student.schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ success: false, message: 'Error fetching schedule' });
    }
});

// Get student notifications
router.get('/student/notifications/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const student = await Student.findOne({ rollNumber });
        res.json(student.notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// Clear student notifications
router.post('/student/notifications/clear/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const student = await Student.findOne({ rollNumber });
        student.notifications = [];
        await student.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ success: false, message: 'Error clearing notifications' });
    }
});

// Get registered students for a course by course name
router.get('/report/students-by-name/:courseName', async (req, res) => {
    try {
        const { courseName } = req.params;
        const course = await Course.findOne({ name: courseName }).populate('registeredStudents');
        if (course) {
            res.json(course.registeredStudents);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching students by course name:', error);
        res.status(500).json({ success: false, message: 'Error fetching students' });
    }
});

// Get all student registrations
router.get('/report/all-registrations', async (req, res) => {
    try {
        const students = await Student.find().populate('registeredCourses');
        const registrations = students.flatMap(student => 
            student.registeredCourses.map(course => ({
                rollNumber: student.rollNumber,
                courseId: course._id,
                courseName: course.name
            }))
        );
        res.json(registrations);
    } catch (error) {
        console.error('Error fetching all registrations:', error);
        res.status(500).json({ success: false, message: 'Error fetching registrations' });
    }
});

// Get courses with available seats
router.get('/report/available-seats', async (req, res) => {
    try {
        const courses = await Course.find();
        const availableCourses = courses.filter(course => course.seats > course.registeredStudents.length);
        res.json(availableCourses);
    } catch (error) {
        console.error('Error fetching available seats:', error);
        res.status(500).json({ success: false, message: 'Error fetching available seats' });
    }
});

// Admin override: Add student to full course
router.post('/course/override', async (req, res) => {
    try {
        const { rollNumber, courseName } = req.body;
        const student = await Student.findOne({ rollNumber });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const course = await Course.findOne({ name: courseName });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        student.schedule.push({ courseId: course._id, time: course.time, day: course.day, courseName: course.name });
        student.registeredCourses.push(course._id);
        course.registeredStudents.push(student._id);
        await student.save();
        await course.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error overriding registration:', error);
        res.status(500).json({ success: false, message: 'Error overriding registration' });
    }
});

module.exports = router;