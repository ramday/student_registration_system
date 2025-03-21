let courses = [];
let rollNumber = localStorage.getItem('rollNumber');

async function loadCourses() {
    const response = await fetch('/courses');
    courses = await response.json();
    displayCourses(courses);
    loadSchedule();
    loadNotifications();
}

function displayCourses(coursesToDisplay) {
    const tbody = document.querySelector('#courseTable tbody');
    tbody.innerHTML = '';
    coursesToDisplay.forEach(course => {
        const availableSeats = course.seats - course.registeredStudents.length;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.name}</td>
            <td>${course.department}</td>
            <td>${course.level}</td>
            <td>${course.time}</td>
            <td>${course.day}</td>
            <td>${availableSeats}</td>
            <td>${course.prerequisites.join(', ') || 'None'}</td>
            <td><button onclick="registerCourse('${course._id}')">Register</button></td>
            <td><button class="subscribe-btn" onclick="subscribeToCourse('${course._id}')">Subscribe</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function registerCourse(courseId) {
    const response = await fetch('/course/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, courseId })
    });
    const data = await response.json();
    if (data.success) {
        alert('Course registered successfully!');
        loadCourses();
    } else {
        alert(data.message);
    }
}

async function subscribeToCourse(courseId) {
    const response = await fetch('/course/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, courseId })
    });
    const data = await response.json();
    if (data.success) {
        alert('Subscribed to course! You will be notified when a seat becomes available.');
    }
}

async function loadSchedule() {
    const response = await fetch(`/student/schedule/${rollNumber}`);
    const schedule = await response.json();
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        calendar.appendChild(dayDiv);

        const coursesOnDay = schedule.filter(s => s.day === day);
        coursesOnDay.forEach(course => {
            const courseDiv = document.createElement('div');
            courseDiv.innerHTML = `${course.courseName} (${course.time}) <button onclick="removeCourse('${course.courseId}')">Remove</button>`;
            calendar.appendChild(courseDiv);
        });
    });
}

async function loadNotifications() {
    const response = await fetch(`/student/notifications/${rollNumber}`);
    const notifications = await response.json();
    if (notifications.length > 0) {
        notifications.forEach(notification => {
            showNotification(notification.message);
        });
        // Clear notifications after displaying
        await fetch(`/student/notifications/clear/${rollNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function removeCourse(courseId) {
    const response = await fetch('/course/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, courseId })
    });
    const data = await response.json();
    if (data.success) {
        alert('Course removed successfully!');
        if (data.availableSeats) {
            showNotification('A seat is now available in a course you subscribed to!');
        }
        loadSchedule(); // Refresh the schedule
        loadCourses(); // Refresh the course list
    } else {
        alert('Error removing course');
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

document.getElementById('courseFilterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const department = document.getElementById('department').value;
    const level = document.getElementById('level').value;
    const time = document.getElementById('time').value;
    const day = document.getElementById('day').value;

    const filteredCourses = courses.filter(course => {
        return (!department || course.department === department) &&
               (!level || course.level === level) &&
               (!time || course.time === time) &&
               (!day || course.day === day);
    });

    displayCourses(filteredCourses);
});

window.onload = loadCourses;