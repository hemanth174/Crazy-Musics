// script.js
document.getElementById('signinForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic Validation
    if (email === 'ramasaiahemanth@gmail.com' && password === 'HEMANTH') {
        alert('Sign-In Successful!');
        errorMessage.style.display = 'none';
    } else {
        errorMessage.textContent = 'Invalid email or password.';
        errorMessage.style.display = 'block';
    }
});