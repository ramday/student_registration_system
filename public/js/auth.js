document.getElementById('studentLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById('rollNumber').value;

    const response = await fetch('/login/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber })
    });
    const data = await response.json();

    if (data.success) {
        localStorage.setItem('rollNumber', rollNumber);
        window.location.href = data.redirect;
    } else {
        window.location.href = data.redirect;
    }
});

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const response = await fetch('/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    if (data.success) {
        window.location.href = data.redirect;
    } else {
        window.location.href = data.redirect;
    }
});