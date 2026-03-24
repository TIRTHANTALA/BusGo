/* ========================================
   BusGo - Authentication Module
   Handles Login, Register, Role Management
   ======================================== */

// ----------------------------------------
// Authentication State
// ----------------------------------------
let currentUser = null;

// Check for existing session on page load
function checkAuth() {
    const savedUser = localStorage.getItem('busgo_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

// ----------------------------------------
// Login Handler
// ----------------------------------------
async function handleLogin(email, password, role) {
    try {
        const response = await MockAPI.loginUser(email, password, role);

        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('busgo_user', JSON.stringify(currentUser));
            localStorage.setItem('busgo_token', response.token);

            updateUIForLoggedInUser();

            // Close modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();

            // Redirect based on role or pending redirect
            const redirectUrl = sessionStorage.getItem('postLoginRedirect');
            if (redirectUrl && role !== 'admin') { // Admins usually go to dashboard
                sessionStorage.removeItem('postLoginRedirect');
                window.location.href = redirectUrl;
            } else {
                redirectBasedOnRole(role);
            }

            return { success: true };
        } else {
            return { success: false, message: response.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'An error occurred. Please try again.' };
    }
}

// ----------------------------------------
// Register Handler
// ----------------------------------------
async function handleRegister(userData) {
    try {
        const response = await MockAPI.registerUser(userData);

        if (response.success) {
            // Auto-login after registration
            currentUser = response.user;
            localStorage.setItem('busgo_user', JSON.stringify(currentUser));

            updateUIForLoggedInUser();

            // Close modal
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();

            // Show success message
            showToast('Registration successful! Welcome to BusGo.', 'success');

            return { success: true };
        } else {
            return { success: false, message: response.message };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'An error occurred. Please try again.' };
    }
}

// ----------------------------------------
// Logout Handler
// ----------------------------------------
function logout() {
    currentUser = null;
    localStorage.removeItem('busgo_user');
    localStorage.removeItem('busgo_token');

    // Redirect to home
    window.location.href = 'index.html';
}

// ----------------------------------------
// UI Updates
// ----------------------------------------
function updateUIForLoggedInUser() {
    if (!currentUser) return;

    // Hide login/register buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userNameDisplay = document.getElementById('userNameDisplay');

    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    if (userNameDisplay) userNameDisplay.textContent = currentUser.name;

    // Update navigation based on role
    updateNavigationByRole(currentUser.role);
}

function updateNavigationByRole(role) {
    const userMenus = document.querySelectorAll('.user-menu');
    const adminMenus = document.querySelectorAll('.admin-menu');

    // Hide all role-specific menus first
    userMenus.forEach(el => el.classList.remove('d-none'));
    adminMenus.forEach(el => el.classList.add('d-none'));

    // Show menus based on role
    if (role === 'admin') {
        adminMenus.forEach(el => el.classList.remove('d-none'));
    }
}

function redirectBasedOnRole(role) {
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        // Check for pending booking
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (pendingBooking) {
            const booking = JSON.parse(pendingBooking);
            sessionStorage.removeItem('pendingBooking');
            const params = new URLSearchParams({
                routeId: booking.routeId,
                busId: booking.busId,
                date: booking.date,
                passengers: booking.passengers
            });
            window.location.href = `booking.html?${params.toString()}`;
        }
        // Otherwise stay on current page
    }
}

// ----------------------------------------
// Role Check Functions
// ----------------------------------------
function isLoggedIn() {
    return currentUser !== null;
}

function getCurrentUser() {
    return currentUser;
}

function getUserRole() {
    return currentUser ? currentUser.role : null;
}

function isUser() {
    return currentUser && currentUser.role === 'user';
}

// function isOperator() { ... } removed

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// ----------------------------------------
// Protected Route Check
// ----------------------------------------
function requireAuth(allowedRoles = ['user', 'admin']) {
    if (!isLoggedIn()) {
        // If login modal is available on current page, show it
        const loginModalElement = document.getElementById('loginModal');
        if (loginModalElement) {
            showToast('Please login to continue', 'warning');
            const loginModal = new bootstrap.Modal(loginModalElement);
            loginModal.show();
        } else {
            // Otherwise redirect to home with login action and return url
            const returnUrl = encodeURIComponent(window.location.href);
            window.location.href = `index.html?action=login&redirect=${returnUrl}`;
        }
        return false;
    }

    if (!allowedRoles.includes(currentUser.role)) {
        showToast('You do not have permission to access this page', 'danger');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// ----------------------------------------
// Toast Notification
// ----------------------------------------
function showToast(message, type = 'info') {
    // Create toast container if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = {
        'success': 'bg-success',
        'danger': 'bg-danger',
        'warning': 'bg-warning',
        'info': 'bg-info'
    }[type] || 'bg-info';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();

    // Remove from DOM after hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ----------------------------------------
// Form Handlers (Attach to DOM)
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication status
    checkAuth();

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
            submitBtn.disabled = true;

            const result = await handleLogin(email, password, role);

            if (!result.success) {
                showToast(result.message, 'danger');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('registerName');
            const emailInput = document.getElementById('registerEmail');
            const phoneInput = document.getElementById('registerPhone');
            const passwordInput = document.getElementById('registerPassword');

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const password = passwordInput.value;

            // Validation
            let isValid = true;
            let firstInvalid = null;

            const setError = (input, msg) => {
                input.classList.add('is-invalid');
                let errorDiv = input.nextElementSibling;
                if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'invalid-feedback';
                    input.parentNode.insertBefore(errorDiv, input.nextSibling);
                }
                errorDiv.textContent = msg;
                isValid = false;
                if (!firstInvalid) firstInvalid = input;
            };

            const clearError = (input) => {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                const errorDiv = input.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('invalid-feedback')) errorDiv.remove();
            };

            // Validate Name
            if (!name || !/^[A-Za-z\s]{2,}$/.test(name)) {
                setError(nameInput, 'Name must contain only letters and be at least 2 characters');
            } else {
                clearError(nameInput);
            }

            // Validate Email
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError(emailInput, 'Please enter a valid email address');
            } else {
                clearError(emailInput);
            }

            // Validate Phone
            if (!phone || !/^\d{10}$/.test(phone)) {
                setError(phoneInput, 'Phone number must be exactly 10 digits');
            } else {
                clearError(phoneInput);
            }

            // Validate Password (min 6 chars for security)
            if (!password || password.length < 6) {
                setError(passwordInput, 'Password must be at least 6 characters');
            } else {
                clearError(passwordInput);
            }

            if (!isValid) {
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const userData = {
                name: name,
                email: email,
                phone: phone,
                password: password,
                role: 'user',
                bookings: 0
            };

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
            submitBtn.disabled = true;

            const result = await handleRegister(userData);

            if (!result.success) {
                showToast(result.message, 'danger');
            }

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
});

// Demo Login Helper (for testing)
function demoLogin(role) {
    const credentials = {
        'user': { email: 'john@email.com', password: 'password123' },
        'admin': { email: 'admin@busgo.com', password: 'admin123' }
    };

    const cred = credentials[role];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
        document.getElementById('loginRole').value = role;
    }
}
