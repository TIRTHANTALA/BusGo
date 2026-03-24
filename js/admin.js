/* ========================================
   BusGo - Admin Dashboard Module
   Admin Management Functions
   ======================================== */

// ----------------------------------------
// Initialize
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    checkAdminAuth();
    initializeSidebar();
    initializeCharts();
    loadAdminData();
});

// ----------------------------------------
// Auth Check
// ----------------------------------------
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('busgo_user') || 'null');

    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
}

// ----------------------------------------
// Get All Users from localStorage
// ----------------------------------------
function getAllUsers() {
    // Get registered users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');
    // Filter only 'user' role
    return storedUsers.filter(u => u.role === 'user');
}

// ----------------------------------------
// Save Users to localStorage
// ----------------------------------------
function saveUsersToStorage(users) {
    // Get current stored users
    let allStoredUsers = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');

    // Update users in the array
    users.forEach(updatedUser => {
        const index = allStoredUsers.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) {
            allStoredUsers[index] = updatedUser;
        }
    });

    localStorage.setItem('busgo_registered_users', JSON.stringify(allStoredUsers));
}

// ----------------------------------------
// Sidebar Toggle
// ----------------------------------------
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

function initializeSidebar() {
    document.addEventListener('click', function (e) {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.querySelector('[onclick="toggleSidebar()"]');

        if (window.innerWidth < 992 &&
            sidebar.classList.contains('show') &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// ----------------------------------------
// Section Navigation
// ----------------------------------------
function showSection(sectionId) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Admin Dashboard',
        'users': 'All Users',
        'buses': 'All Buses',
        'routes': 'All Routes',
        'bookings': 'All Bookings',

    };
    pageTitle.textContent = titles[sectionId] || 'Admin Dashboard';

    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });

    if (window.innerWidth < 992) {
        document.getElementById('sidebar').classList.remove('show');
    }
}

// ----------------------------------------
// Charts
// ----------------------------------------
function initializeCharts() {
    animateChartBars();
}

function animateChartBars() {
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach((bar, index) => {
        const height = bar.style.height;
        bar.style.height = '0';
        setTimeout(() => {
            bar.style.transition = 'height 0.5s ease';
            bar.style.height = height;
        }, index * 50);
    });
}

// ----------------------------------------
// Load Dashboard Data
// ----------------------------------------
function loadAdminData() {
    loadQuickStats();
    loadUsers();
    loadAllBuses();
    loadAllRoutes();
    loadAllBookings();
    initBusRouteForms();
}

function loadQuickStats() {
    // 1. Get All Bookings (System + User)
    const bookings = getAllBookings();

    // 2. Calculate Stats
    const totalBookings = bookings.length;

    // Today's Bookings & Cancellations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = bookings.filter(b => {
        // Check if booked today (if bookedOn exists) or travel date is today
        // Since we don't track bookedOn reliably yet, let's use travelDate as proxy for "Active Today"
        const travelDate = new Date(b.travelDate);
        travelDate.setHours(0, 0, 0, 0);
        return travelDate.getTime() === today.getTime() && b.status !== 'cancelled';
    }).length;

    const cancellations = bookings.filter(b => {
        if (b.status !== 'cancelled') return false;
        // Check if cancelled today
        if (b.cancelledOn) {
            const cancelDate = new Date(b.cancelledOn);
            cancelDate.setHours(0, 0, 0, 0);
            return cancelDate.getTime() === today.getTime();
        }
        return false;
    }).length;

    const buses = MockAPI.getCombinedBuses();

    // 3. Update UI
    updateStat('statTotalUsers', getAllUsers().length);
    updateStat('statTotalBuses', buses.length);
    updateStat('statTotalRoutes', MockAPI.getCombinedRoutes().length);
    updateStat('statTotalBookings', totalBookings);

    // Quick Stats Cards
    updateStat('quickTotalBookings', totalBookings);
    updateStat('quickTodayBookings', todayBookings);
    updateStat('quickCancellations', cancellations);
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getAllBookings() {
    let allBookings = [];
    // System bookings
    const systemBookings = JSON.parse(localStorage.getItem('busgo_system_bookings') || '[]');
    allBookings = [...systemBookings];

    // User bookings (backup check)
    const users = getAllUsers();
    users.forEach(user => {
        const userBookings = JSON.parse(localStorage.getItem(`busgo_bookings_${user._id}`) || '[]');
        userBookings.forEach(ub => {
            if (!allBookings.find(sb => sb.pnr === ub.pnr)) {
                allBookings.push(ub);
            }
        });
    });

    // Guest bookings
    const guestBookings = JSON.parse(localStorage.getItem('busgo_bookings_guest') || '[]');
    guestBookings.forEach(gb => {
        if (!allBookings.find(sb => sb.pnr === gb.pnr)) {
            allBookings.push(gb);
        }
    });

    return allBookings;
}

// ----------------------------------------
// Load Users Table
// ----------------------------------------
function loadUsers() {
    const users = getAllUsers();
    const tbody = document.getElementById('usersTableBody');

    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No registered users yet</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map((user, index) => {
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        const isBlocked = user.status === 'blocked';
        const joinDate = user.createdAt ? formatDate(user.createdAt) : 'N/A';

        return `
            <tr class="${isBlocked ? 'table-danger' : ''}">
                <td>#U${String(index + 1).padStart(3, '0')}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center" style="width:32px;height:32px;">${initial}</div>
                        ${user.name}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${joinDate}</td>
                <td>${user.bookings || 0}</td>
                <td>
                    <span class="badge bg-${isBlocked ? 'danger' : 'success'}">${isBlocked ? 'Blocked' : 'Active'}</span>
                </td>
                <td>
                    ${isBlocked ?
                `<button class="btn btn-sm btn-outline-success" onclick="unblockUser('${user._id}')"><i class="fas fa-check"></i> Unblock</button>` :
                `<button class="btn btn-sm btn-outline-danger" onclick="blockUser('${user._id}')"><i class="fas fa-ban"></i> Block</button>`
            }
                </td>
            </tr>
        `;
    }).join('');
}

// ----------------------------------------
// Load Operators Table
// ----------------------------------------
// loadOperators function removed

// ----------------------------------------
// Load All Buses
// ----------------------------------------
function loadAllBuses() {
    const tbody = document.getElementById('allBusesTableBody');
    if (!tbody) return;

    // Get combined buses (mock + operator-added)
    const allBuses = MockAPI.getCombinedBuses();

    if (allBuses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-bus fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No buses registered yet</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allBuses.map((bus, index) => {
        const busTypeDisplay = bus.busTypeDisplay || bus.busType || 'N/A';
        const status = bus.status || 'active';
        const seats = bus.totalSeats || bus.seats || 'N/A';

        let typeBadgeClass = 'bg-secondary';
        if (busTypeDisplay.toLowerCase().includes('sleeper')) typeBadgeClass = 'bg-primary';
        else if (busTypeDisplay.toLowerCase().includes('seater')) typeBadgeClass = 'bg-success';

        return `
            <tr>
                <td>#B${String(index + 1).padStart(3, '0')}</td>
                <td>${bus.busName || bus.name}</td>
                <td>${bus.operatorName || 'Unknown'}</td>
                <td><span class="badge ${typeBadgeClass}">${busTypeDisplay}</span></td>
                <td>${seats}</td>
                <td><span class="badge bg-${status === 'active' ? 'success' : 'danger'}">${status === 'active' ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBus('${bus._id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    // Update bus count stat
    const statBuses = document.getElementById('statTotalBuses');
    if (statBuses) statBuses.textContent = allBuses.length;
}

// ----------------------------------------
// Load All Bookings
// ----------------------------------------
function loadAllBookings() {
    const tbody = document.getElementById('allBookingsTableBody');
    if (!tbody) return;

    // Collect all bookings from all users
    const allBookings = [];
    const users = getAllUsers();

    users.forEach(user => {
        const bookingsKey = `busgo_bookings_${user._id}`;
        const userBookings = JSON.parse(localStorage.getItem(bookingsKey) || '[]');
        userBookings.forEach(b => {
            allBookings.push({ ...b, userName: user.name });
        });
    });

    if (allBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-ticket-alt fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No bookings yet</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allBookings.map(booking => `
        <tr>
            <td><span class="text-primary fw-bold">${booking.pnr}</span></td>
            <td>${booking.userName || 'Guest'}</td>
            <td>${booking.fromCity} → ${booking.toCity}</td>
            <td>${booking.busName || 'N/A'}</td>
            <td>${formatDate(booking.travelDate)}</td>
            <td>₹${booking.totalAmount?.toLocaleString() || 0}</td>
            <td><span class="badge bg-${booking.status === 'cancelled' ? 'danger' : 'success'}">${booking.status || 'Confirmed'}</span></td>
        </tr>
    `).join('');
}

// ----------------------------------------
// Load All Routes
// ----------------------------------------
function loadAllRoutes() {
    const tbody = document.getElementById('allRoutesTableBody');
    if (!tbody) return;

    const allRoutes = MockAPI.getCombinedRoutes();
    const allBuses = MockAPI.getCombinedBuses();

    if (allRoutes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <i class="fas fa-route fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No routes added yet</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allRoutes.map((route, index) => {
        const bus = allBuses.find(b => b._id === route.busId) || { name: 'Unknown Bus' };
        const status = 'active'; // simplified

        return `
            <tr>
                <td>#R${String(index + 1).padStart(3, '0')}</td>
                <td><span class="fw-bold text-primary">${route.fromCityDisplay}</span></td>
                <td><span class="fw-bold text-success">${route.toCityDisplay}</span></td>
                <td>${bus.busName || bus.name}</td>
                <td>${route.departureTime}</td>
                <td>${route.arrivalTime}</td>
                <td>₹${route.price}</td>
                <td><span class="badge bg-success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRoute('${route._id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// ----------------------------------------
// Initialize Forms
// ----------------------------------------
function initBusRouteForms() {
    // Add Bus Form
    const addBusForm = document.getElementById('addBusForm');
    if (addBusForm) {
        addBusForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const newBus = {
                _id: 'bus_' + Date.now(),
                operatorId: "adm_001",
                operatorName: document.getElementById('busOperatorName').value || "BusGo Travels",
                busName: document.getElementById('busName').value,
                busType: document.getElementById('busType').value,
                busTypeDisplay: document.getElementById('busType').options[document.getElementById('busType').selectedIndex].text,
                totalSeats: parseInt(document.getElementById('busSeats').value),
                seats: parseInt(document.getElementById('busSeats').value), // keeping for compatibility
                registrationNumber: document.getElementById('busRegNo').value,
                status: 'active',
                amenities: [
                    document.getElementById('amenityWifi').checked ? 'wifi' : null,
                    document.getElementById('amenityCharging').checked ? 'charging' : null,
                    document.getElementById('amenityWater').checked ? 'water' : null,
                    document.getElementById('amenityBlanket').checked ? 'blanket' : null
                ].filter(Boolean),
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            const existingBuses = JSON.parse(localStorage.getItem('busgo_buses') || '[]');
            existingBuses.push(newBus);
            localStorage.setItem('busgo_buses', JSON.stringify(existingBuses));

            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBusModal'));
            modal.hide();
            addBusForm.reset();
            showToast('Bus added successfully!', 'success');
            loadAllBuses();
            loadDashboardStats();
        });
    }

    // Add Route Form
    const addRouteForm = document.getElementById('addRouteForm');
    if (addRouteForm) {
        // Populate bus dropdown when modal opens
        const routeModal = document.getElementById('addRouteModal');
        if (routeModal) {
            routeModal.addEventListener('show.bs.modal', function () {
                const busSelect = document.getElementById('routeBusId');
                const buses = MockAPI.getCombinedBuses();
                // Use _id for value and busName for display
                busSelect.innerHTML = buses.map(b => `<option value="${b._id}">${b.busName} (${b.busTypeDisplay})</option>`).join('');

                // Populate cities
                const routeFrom = document.getElementById('routeFrom');
                const routeTo = document.getElementById('routeTo');
                if (routeFrom && routeTo && window.MockAPI?.mockCities) {
                    const cities = window.MockAPI.mockCities;
                    const options = cities.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
                    routeFrom.innerHTML = '<option value="">Select City</option>' + options;
                    routeTo.innerHTML = '<option value="">Select City</option>' + options;
                }
            });
        }

        addRouteForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fromCity = document.getElementById('routeFrom').value;
            const toCity = document.getElementById('routeTo').value;

            if (fromCity === toCity) {
                showToast('From and To cities cannot be the same', 'warning');
                return;
            }

            const newRoute = {
                _id: 'route_' + Date.now(),
                busId: document.getElementById('routeBusId').value,
                operatorId: "adm_001",
                fromCity: fromCity.toLowerCase(),
                fromCityDisplay: fromCity,
                toCity: toCity.toLowerCase(),
                toCityDisplay: toCity,
                departureTime: document.getElementById('routeDepTime').value,
                arrivalTime: document.getElementById('routeArrTime').value,
                duration: "4h 00m", // Placeholder, would calculate in real app
                durationMinutes: 240,
                price: parseInt(document.getElementById('routePrice').value),
                operatingDays: ["Daily"],
                status: "active"
            };

            // Save to localStorage
            const existingRoutes = JSON.parse(localStorage.getItem('busgo_routes') || '[]');
            existingRoutes.push(newRoute);
            localStorage.setItem('busgo_routes', JSON.stringify(existingRoutes));

            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('addRouteModal'));
            modal.hide();
            addRouteForm.reset();
            showToast('Route added successfully!', 'success');
            loadAllRoutes();
            loadDashboardStats();
        });
    }
}

// ----------------------------------------
// Delete Functions
// ----------------------------------------
function deleteBus(busId) {
    if (!confirm('Are you sure you want to delete this bus?')) return;

    // Check for existing bookings
    const allBookings = getAllBookings();
    const hasBookings = allBookings.some(b => b.busId === busId && b.status === 'confirmed');

    if (hasBookings) {
        showToast('Cannot delete bus with active bookings.', 'danger');
        return;
    }

    let buses = JSON.parse(localStorage.getItem('busgo_buses') || '[]');
    // Use _id for comparison
    const initialLength = buses.length;
    buses = buses.filter(b => b._id !== busId);

    localStorage.setItem('busgo_buses', JSON.stringify(buses));

    showToast('Bus deleted successfully!', 'success');
    loadAllBuses();
    loadDashboardStats();
}

function deleteRoute(routeId) {
    if (!confirm('Are you sure you want to delete this route?')) return;

    // Check for existing bookings
    const allBookings = getAllBookings();
    const hasBookings = allBookings.some(b => b.routeId === routeId && b.status === 'confirmed');

    if (hasBookings) {
        showToast('Cannot delete route with active bookings.', 'danger');
        return;
    }

    let routes = JSON.parse(localStorage.getItem('busgo_routes') || '[]');
    // Use _id for comparison
    routes = routes.filter(r => r._id !== routeId);
    localStorage.setItem('busgo_routes', JSON.stringify(routes));

    showToast('Route deleted successfully!', 'success');
    loadAllRoutes();
    loadDashboardStats();
}
// ----------------------------------------
// User Management
// ----------------------------------------
function blockUser(userId) {
    if (!confirm('Are you sure you want to block this user?')) return;

    let allUsers = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');
    const userIndex = allUsers.findIndex(u => u._id === userId);

    if (userIndex !== -1) {
        allUsers[userIndex].status = 'blocked';
        localStorage.setItem('busgo_registered_users', JSON.stringify(allUsers));
        showToast('User blocked successfully!', 'success');
        loadUsers();
        loadDashboardStats();
    }
}

function unblockUser(userId) {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    let allUsers = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');
    const userIndex = allUsers.findIndex(u => u._id === userId);

    if (userIndex !== -1) {
        allUsers[userIndex].status = 'active';
        localStorage.setItem('busgo_registered_users', JSON.stringify(allUsers));
        showToast('User unblocked successfully!', 'success');
        loadUsers();
        loadDashboardStats();
    }
}

// ----------------------------------------
// Operator Management
// ----------------------------------------
// Operator Management functions removed

// ----------------------------------------
// Utility Functions
// ----------------------------------------
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// ----------------------------------------
// Toast Notification
// ----------------------------------------
function showToast(message, type = 'info') {
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
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ----------------------------------------
// Logout
// ----------------------------------------
function logout() {
    localStorage.removeItem('busgo_user');
    localStorage.removeItem('busgo_token');
    window.location.href = 'index.html';
}
