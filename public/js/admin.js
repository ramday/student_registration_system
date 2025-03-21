async function loadCourses() {
    const response = await fetch('/courses');
    const courses = await response.json();
    const tbody = document.querySelector('#manageCourseTable tbody');
    tbody.innerHTML = '';
    courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.name}</td>
            <td>${course.department}</td>
            <td>${course.level}</td>
            <td>${course.time}</td>
            <td>${course.day}</td>
            <td>${course.seats}</td>
            <td>${course.prerequisites.join(', ')}</td>
            <td>
                <button onclick="updateCourse('${course._id}')">Update</button>
                <button onclick="deleteCourse('${course._id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadStudentRegistrations() {
    const response = await fetch('/report/all-registrations');
    const registrations = await response.json();
    const tbody = document.querySelector('#studentRegistrationsTable tbody');
    tbody.innerHTML = '';
    registrations.forEach(reg => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reg.rollNumber}</td>
            <td>${reg.courseName}</td>
            <td><button onclick="removeStudentFromCourse('${reg.rollNumber}', '${reg.courseId}')">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function removeStudentFromCourse(rollNumber, courseId) {
    const response = await fetch('/course/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, courseId })
    });
    const data = await response.json();
    if (data.success) {
        alert('Student removed successfully!');
        loadStudentRegistrations(); // Refresh the table
    } else {
        alert('Error removing student');
    }
}

document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('courseName').value;
    const department = document.getElementById('courseDepartment').value;
    const level = document.getElementById('courseLevel').value;
    const time = document.getElementById('courseTime').value;
    const day = document.getElementById('courseDay').value;
    const seats = document.getElementById('courseSeats').value;
    const prerequisites = document.getElementById('coursePrerequisites').value;

    const response = await fetch('/course/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, level, time, day, seats, prerequisites })
    });
    const data = await response.json();
    if (data.success) {
        alert('Course added successfully!');
        loadCourses();
    }
});

async function updateCourse(courseId) {
    const response = await fetch(`/courses/${courseId}`);
    const course = await response.json();

    const name = prompt('Enter course name:', course.name);
    const department = prompt('Enter department:', course.department);
    const level = prompt('Enter level:', course.level);
    const time = prompt('Enter time:', course.time);
    const day = prompt('Enter day:', course.day);
    const seats = prompt('Enter seats:', course.seats);
    const prerequisites = prompt('Enter prerequisites (comma-separated):', course.prerequisites.join(', ')) || '';

    if (!name || !department || !level || !time || !day || !seats) {
        alert('All fields are required');
        return;
    }

    const responseUpdate = await fetch(`/course/update/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, level, time, day, seats, prerequisites })
    });
    const data = await responseUpdate.json();
    if (data.success) {
        alert('Course updated successfully!');
        loadCourses(); // Refresh the course list
    } else {
        alert('Error updating course');
    }
}

async function deleteCourse(courseId) {
    const response = await fetch(`/course/delete/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (data.success) {
        alert('Course deleted successfully!');
        loadCourses();
    }
}

async function generateReport(type) {
    const reportOutput = document.getElementById('reportOutput');
    reportOutput.innerHTML = '';

    if (type === 'students') {
        const courseName = prompt('Enter Course Name:');
        if (!courseName) return;
        const response = await fetch(`/report/students-by-name/${encodeURIComponent(courseName)}`);
        const students = await response.json();
        reportOutput.innerHTML = `<h3>Students Registered for ${courseName}</h3>`;
        students.forEach(student => {
            reportOutput.innerHTML += `<p>${student.rollNumber}</p>`;
        });
    } else if (type === 'available-seats') {
        const response = await fetch('/report/available-seats');
        const courses = await response.json();
        reportOutput.innerHTML = '<h3>Courses with Available Seats</h3>';
        courses.forEach(course => {
            reportOutput.innerHTML += `<p>${course.name} (${course.seats - course.registeredStudents.length} seats available)</p>`;
        });
    }
}

document.getElementById('overrideForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById('overrideRollNumber').value;
    const courseName = document.getElementById('overrideCourseName').value;

    const response = await fetch('/course/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, courseName })
    });
    const data = await response.json();
    if (data.success) {
        alert('Student added to course successfully!');
        loadStudentRegistrations(); // Refresh the registrations table
    } else {
        alert(data.message || 'Error overriding registration');
    }
});

window.onload = () => {
    loadCourses();
    loadStudentRegistrations();
};