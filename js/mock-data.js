/* ========================================
   BusGo - Mock Data & API Simulation
   Simulates MongoDB Database Responses
   ======================================== */

// ----------------------------------------
// Users Collection
// ----------------------------------------
let mockUsers = [
    {
        _id: "adm_001",
        name: "Admin User",
        email: "admin@busgo.com",
        phone: "+91 98765 99999",
        password: "admin123",
        role: "admin",
        createdAt: "2024-01-01T00:00:00Z"
    }
];

// ----------------------------------------
// Persistent User Storage
// ----------------------------------------
// Load registered users from localStorage and merge with defaults
function initializeUsers() {
    const storedUsers = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');
    storedUsers.forEach(storedUser => {
        if (!mockUsers.find(u => u.email === storedUser.email)) {
            mockUsers.push(storedUser);
        }
    });
}

// Save new users to localStorage (excluding default mock users)
function saveUsersToStorage() {
    const defaultEmails = ['admin@busgo.com'];
    const customUsers = mockUsers.filter(u => !defaultEmails.includes(u.email));
    localStorage.setItem('busgo_registered_users', JSON.stringify(customUsers));
}

// Initialize users on load
initializeUsers();

// ----------------------------------------
// Buses Collection
// ----------------------------------------
const mockBuses = []; // Fresh start, add buses via Admin Dashboard

// ----------------------------------------
// Routes/Schedules Collection
// ----------------------------------------
const mockRoutes = []; // Fresh start, add routes via Admin Dashboard

// ----------------------------------------
// Bookings Collection
// ----------------------------------------
const mockBookings = []; // Fresh start, no initial bookings



// ----------------------------------------
// Cities Collection (Predefined 10 Cities)
// ----------------------------------------
const mockCities = [
    { id: 'mumbai', name: 'Mumbai' },
    { id: 'pune', name: 'Pune' },
    { id: 'delhi', name: 'Delhi' },
    { id: 'bangalore', name: 'Bangalore' },
    { id: 'chennai', name: 'Chennai' },
    { id: 'hyderabad', name: 'Hyderabad' },
    { id: 'kolkata', name: 'Kolkata' },
    { id: 'ahmedabad', name: 'Ahmedabad' },
    { id: 'jaipur', name: 'Jaipur' },
    { id: 'surat', name: 'Surat' }
];

// ----------------------------------------
// Seat Availability (Dynamic) - Proper 1x2 Layout
// ----------------------------------------
// ----------------------------------------
// System-wide Bookings (Simulated Database)
// ----------------------------------------
function getSystemBookings() {
    const defaultBookings = mockBookings; // Start with mock bookings (currently empty)
    const storedBookings = JSON.parse(localStorage.getItem('busgo_system_bookings') || '[]');
    return [...defaultBookings, ...storedBookings];
}

function saveSystemBooking(booking) {
    const bookings = JSON.parse(localStorage.getItem('busgo_system_bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('busgo_system_bookings', JSON.stringify(bookings));
}

function getOccupiedSeats(busId, routeId, date) {
    const allBookings = getSystemBookings();

    const relevantBookings = allBookings.filter(b =>
        b.busId === busId &&
        b.routeId === routeId &&
        b.travelDate === date &&
        b.status === 'confirmed'
    );

    // Map occupied seats to passenger gender
    let occupiedSeats = {}; // { 'L1': 'Male', 'L2': 'Female' }

    relevantBookings.forEach(booking => {
        if (booking.passengers && Array.isArray(booking.passengers)) {
            booking.passengers.forEach(p => {
                if (p.seat) occupiedSeats[p.seat] = p.gender;
            });
        } else if (booking.seats && Array.isArray(booking.seats)) {
            // Fallback for legacy data without detailed passenger info
            booking.seats.forEach(s => {
                if (!occupiedSeats[s]) occupiedSeats[s] = 'Male';
            });
        }
    });

    return occupiedSeats;
}

// ----------------------------------------
// Seat Availability (Dynamic) - Real Logic
// ----------------------------------------
function generateSeatLayout(busType, totalSeats, busId, routeId, date, price) {
    const seats = [];
    const isSleeperBus = busType.includes('sleeper');

    // Get actual booked seats with gender info
    const occupiedSeats = getOccupiedSeats(busId, routeId, date);

    // Removed hardcoded ladies seats logic. 
    // Pink seats now ONLY appear if booked by a female.

    if (isSleeperBus) {
        // Sleeper bus: 2 decks, each with 1+2 layout (3 per row)
        // Sleeper bus: 2 decks, each with 1+2 layout (3 per row)
        const lowerDeckSeats = Math.ceil(totalSeats / 2);
        const upperDeckSeats = totalSeats - lowerDeckSeats;

        // Lower Deck
        let currentDeckSeats = 0;
        let row = 1;
        while (currentDeckSeats < lowerDeckSeats) {
            // Left side (1 sleeper berth)
            if (currentDeckSeats < lowerDeckSeats) {
                seats.push(createSeat(`L${(row - 1) * 3 + 1}`, 'lower', 'left', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            // Right side (2 sleeper berths)
            if (currentDeckSeats < lowerDeckSeats) {
                seats.push(createSeat(`L${(row - 1) * 3 + 2}`, 'lower', 'right', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            if (currentDeckSeats < lowerDeckSeats) {
                seats.push(createSeat(`L${(row - 1) * 3 + 3}`, 'lower', 'right', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            row++;
        }

        // Upper Deck
        currentDeckSeats = 0;
        row = 1;
        while (currentDeckSeats < upperDeckSeats) {
            // Left side (1 sleeper berth)
            if (currentDeckSeats < upperDeckSeats) {
                seats.push(createSeat(`U${(row - 1) * 3 + 1}`, 'upper', 'left', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            // Right side (2 sleeper berths)
            if (currentDeckSeats < upperDeckSeats) {
                seats.push(createSeat(`U${(row - 1) * 3 + 2}`, 'upper', 'right', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            if (currentDeckSeats < upperDeckSeats) {
                seats.push(createSeat(`U${(row - 1) * 3 + 3}`, 'upper', 'right', occupiedSeats, busType, price));
                currentDeckSeats++;
            }
            row++;
        }
    } else {
        // Seater bus: Only lower deck, 2+2 layout (4 per row)
        const rows = Math.ceil(totalSeats / 4);

        for (let row = 1; row <= rows; row++) {
            // Left side (2 seats)
            if (seats.length < totalSeats) seats.push(createSeat(`S${(row - 1) * 4 + 1}`, 'lower', 'left', occupiedSeats, busType, price));
            if (seats.length < totalSeats) seats.push(createSeat(`S${(row - 1) * 4 + 2}`, 'lower', 'left', occupiedSeats, busType, price));
            // Right side (2 seats)
            if (seats.length < totalSeats) seats.push(createSeat(`S${(row - 1) * 4 + 3}`, 'lower', 'right', occupiedSeats, busType, price));
            if (seats.length < totalSeats) seats.push(createSeat(`S${(row - 1) * 4 + 4}`, 'lower', 'right', occupiedSeats, busType, price));
        }
    }

    return seats;
}

function createSeat(seatNumber, deck, position, occupiedSeats, busType, price) {
    let status = 'available';

    if (seatNumber in occupiedSeats) {
        const gender = occupiedSeats[seatNumber];
        if (gender && (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f')) {
            status = 'ladies-booked';
        } else {
            status = 'booked';
        }
    }

    // Use route price if available, otherwise fallback to defaults
    let seatPrice = price;
    if (!seatPrice) {
        seatPrice = busType.includes('sleeper') ? 850 : 550;
    }

    return {
        seatNumber,
        deck,
        position,
        status,
        price: parseInt(seatPrice)
    };
}

// ----------------------------------------
// Mock API Functions
// ----------------------------------------

/**
 * Simulate API call to search buses
 * In real app: GET /api/buses/search?from=mumbai&to=pune&date=2024-12-25
 */
async function searchBuses(from, to, date) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = [];

    // Get combined buses and routes (mock + operator-added)
    const allBuses = getCombinedBuses();
    const allRoutes = getCombinedRoutes();

    allRoutes.forEach(route => {
        const fromMatch = route.fromCity?.toLowerCase() === from.toLowerCase() ||
            route.fromCityDisplay?.toLowerCase() === from.toLowerCase();
        const toMatch = route.toCity?.toLowerCase() === to.toLowerCase() ||
            route.toCityDisplay?.toLowerCase() === to.toLowerCase();

        if (fromMatch && toMatch && route.status === 'active') {
            const bus = allBuses.find(b => b._id === route.busId);
            if (bus) {
                const totalSeats = parseInt(bus.totalSeats || bus.seats || 40);
                const occupiedSeatsMap = getOccupiedSeats(bus._id, route._id, date);
                const occupiedCount = Object.keys(occupiedSeatsMap).length;
                const availableSeatsCount = Math.max(0, totalSeats - occupiedCount);

                // Calculate duration dynamically
                const durationObj = calculateDuration(route.departureTime, route.arrivalTime);

                results.push({
                    routeId: route._id,
                    busId: bus._id,
                    operatorId: bus.operatorId || route.operatorId,
                    operatorName: bus.operatorName || 'Unknown Operator',
                    busName: bus.busName || bus.name,
                    busType: bus.busType,
                    busTypeDisplay: bus.busTypeDisplay || bus.busType,
                    fromCity: route.fromCityDisplay || route.fromCity,
                    toCity: route.toCityDisplay || route.toCity,
                    departureTime: route.departureTime,
                    arrivalTime: route.arrivalTime,
                    duration: durationObj.formatted,
                    durationMinutes: durationObj.minutes,
                    price: route.price,
                    amenities: bus.amenities || [],
                    availableSeats: availableSeatsCount > 0 ? availableSeatsCount : 0,
                    totalSeats: totalSeats,
                    travelDate: date
                });
            }
        }
    });

    return results;
}

/**
 * Calculate duration between two times (HH:MM)
 * Handles next-day arrival (e.g., 22:00 -> 06:00)
 */
function calculateDuration(depTime, arrTime) {
    if (!depTime || !arrTime) return { minutes: 0, formatted: '0h 00m' };

    const [depHours, depMinutes] = depTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrTime.split(':').map(Number);

    const depTotalMinutes = depHours * 60 + depMinutes;
    let arrTotalMinutes = arrHours * 60 + arrMinutes;

    // If arrival is earlier than departure, assume next day
    if (arrTotalMinutes < depTotalMinutes) {
        arrTotalMinutes += 24 * 60; // Add 24 hours
    }

    const durationMinutes = arrTotalMinutes - depTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return {
        minutes: durationMinutes,
        formatted: `${hours}h ${minutes.toString().padStart(2, '0')}m`
    };
}

/**
 * Simulate API call to get bus details with seat layout
 * In real app: GET /api/buses/:busId/seats?date=2024-12-25
 */
async function getBusDetails(busId, routeId, date) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get combined buses and routes
    const allBuses = getCombinedBuses();
    const allRoutes = getCombinedRoutes();

    const bus = allBuses.find(b => b._id === busId);
    const route = allRoutes.find(r => r._id === routeId);

    if (!bus || !route) return null;

    // Calculate duration
    const durationObj = calculateDuration(route.departureTime, route.arrivalTime);
    const routeWithDuration = {
        ...route,
        duration: durationObj.formatted,
        durationMinutes: durationObj.minutes
    };

    return {
        ...bus,
        route: routeWithDuration,
        seats: generateSeatLayout(bus.busType, bus.totalSeats || bus.seats || 40, busId, routeId, date, route.price),
        travelDate: date
    };
}



/**
 * Simulate API call to create booking
 * In real app: POST /api/bookings
 */
async function createBooking(bookingData) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Backend Validation Simulation
    if (!bookingData.passengers || bookingData.passengers.length === 0) {
        return { success: false, message: 'No passengers provided' };
    }

    for (const p of bookingData.passengers) {
        if (!p.name || !/^[A-Za-z\s]{2,}$/.test(p.name)) {
            return { success: false, message: `Invalid name for passenger seat ${p.seat}` };
        }
        if (!p.age || p.age < 1 || p.age > 100) {
            return { success: false, message: `Invalid age for passenger seat ${p.seat}` };
        }
        if (!p.gender) {
            return { success: false, message: `Gender required for passenger seat ${p.seat}` };
        }
    }

    if (!bookingData.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.contactEmail)) {
        return { success: false, message: 'Invalid contact email' };
    }
    if (!bookingData.contactPhone || !/^\d{10}$/.test(bookingData.contactPhone)) {
        return { success: false, message: 'Invalid contact phone' };
    }

    const pnr = 'BG' + Date.now().toString().slice(-9);

    const newBooking = {
        _id: 'bkg_' + Date.now(),
        pnr: pnr,
        ...bookingData,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
    };

    saveSystemBooking(newBooking);

    // Update User Booking Count
    if (bookingData.userId && bookingData.userId !== 'guest') {
        const users = JSON.parse(localStorage.getItem('busgo_registered_users') || '[]');
        const userIndex = users.findIndex(u => u._id === bookingData.userId);

        if (userIndex !== -1) {
            // Ensure numeric addition
            const currentBookings = parseInt(users[userIndex].bookings) || 0;
            users[userIndex].bookings = currentBookings + 1;
            localStorage.setItem('busgo_registered_users', JSON.stringify(users));
        }
    }

    return {
        success: true,
        booking: newBooking
    };
}

/**
 * Simulate API call for user login
 * In real app: POST /api/auth/login
 */
async function loginUser(email, password, role) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(
        u => u.email === email && u.password === password && u.role === role
    );

    if (!user) {
        return { success: false, message: 'Invalid credentials' };
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
        return { success: false, message: 'Your account has been blocked. Please contact support.' };
    }

    // In real app, would return JWT token
    return {
        success: true,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token: 'mock_jwt_token_' + Date.now()
    };
}

/**
 * Simulate API call for user registration
 * In real app: POST /api/auth/register
 */
async function registerUser(userData) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Backend Validation Simulation
    if (!userData.name || !/^[A-Za-z\s]{2,}$/.test(userData.name)) {
        return { success: false, message: 'Invalid name format' };
    }
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        return { success: false, message: 'Invalid email format' };
    }
    if (!userData.phone || !/^\d{10}$/.test(userData.phone)) {
        return { success: false, message: 'Invalid phone number format' };
    }

    const existingUser = mockUsers.find(u => u.email === userData.email);

    if (existingUser) {
        return { success: false, message: 'Email already registered' };
    }

    const newUser = {
        _id: 'usr_' + Date.now(),
        ...userData,
        role: 'user', // Force role to user if not admin (which shouldn't be registering here anyway)
        status: 'active',
        createdAt: new Date().toISOString(),
        bookings: []
    };

    mockUsers.push(newUser);

    // Save to localStorage for persistence
    saveUsersToStorage();

    return {
        success: true,
        user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    };
}

/**
 * Simulate API call to cancel booking
 * Updates system-wide storage to release seats
 */
async function cancelBooking(pnr) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update system bookings
    let systemBookings = JSON.parse(localStorage.getItem('busgo_system_bookings') || '[]');
    const bookingIndex = systemBookings.findIndex(b => b.pnr === pnr);

    if (bookingIndex !== -1) {
        systemBookings[bookingIndex].status = 'cancelled';
        localStorage.setItem('busgo_system_bookings', JSON.stringify(systemBookings));
        return { success: true };
    }

    return { success: false, message: 'Booking not found' };
}

// ----------------------------------------
// Get All Additional Buses (Added by Admin)
// ----------------------------------------
function getAllAdditionalBuses() {
    return JSON.parse(localStorage.getItem('busgo_buses') || '[]');
}

// ----------------------------------------
// Get All Additional Routes (Added by Admin)
// ----------------------------------------
function getAllAdditionalRoutes() {
    return JSON.parse(localStorage.getItem('busgo_routes') || '[]');
}

// ----------------------------------------
// Get Combined Buses (Mock + Admin Added)
// ----------------------------------------
function getCombinedBuses() {
    const additionalBuses = getAllAdditionalBuses();
    return [...mockBuses, ...additionalBuses];
}

// ----------------------------------------
// Get Combined Routes (Mock + Admin Added)
// ----------------------------------------
function getCombinedRoutes() {
    const additionalRoutes = getAllAdditionalRoutes();
    return [...mockRoutes, ...additionalRoutes];
}

// Export for use in other files
window.MockAPI = {
    searchBuses,
    getBusDetails,
    createBooking,
    cancelBooking,
    loginUser,
    registerUser,
    mockBuses,
    mockRoutes,
    mockBookings,
    mockUsers,
    mockCities,
    getAllAdditionalBuses,
    getAllAdditionalRoutes,
    getCombinedBuses,
    getCombinedRoutes
};
