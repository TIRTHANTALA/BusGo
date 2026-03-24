/* ========================================
   BusGo - Booking Flow Module
   Seat Selection, Passenger Details, Payment
   ======================================== */

// ----------------------------------------
// State
// ----------------------------------------
let bookingState = {
    busDetails: null,
    selectedSeats: [],
    passengers: [],
    baseFare: 0,
    taxes: 0,

    totalAmount: 0,
    paymentMethod: 'upi'
};

// ----------------------------------------
// Initialize on DOM Load
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    initializeBooking();
    initializePaymentMethods();
    loadAvailableCoupons();
});

// ----------------------------------------
// Initialize Booking
// ----------------------------------------
async function initializeBooking() {
    const urlParams = new URLSearchParams(window.location.search);
    const routeId = urlParams.get('routeId');
    const busId = urlParams.get('busId');
    const date = urlParams.get('date');
    const passengers = parseInt(urlParams.get('passengers')) || 1;

    if (!routeId || !busId || !date) {
        showToast('Invalid booking details. Missing route, bus, or date.', 'danger');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    try {
        bookingState.busDetails = await MockAPI.getBusDetails(busId, routeId, date);

        if (!bookingState.busDetails) {
            showToast('Bus details not found', 'danger');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        updateBusInfoDisplay();
        renderSeatLayout();
        updateBookingSummary();

    } catch (error) {
        console.error('Error loading booking:', error);
        showToast('Error loading booking details', 'danger');
        setTimeout(() => window.location.href = 'index.html', 2000);
    }
}

// Fallback functions removed

// ----------------------------------------
// Update Bus Info Display
// ----------------------------------------
function updateBusInfoDisplay() {
    const bus = bookingState.busDetails;
    const route = bus.route;

    // Header Info
    document.getElementById('busNameDisplay').textContent = bus.operatorName;
    document.getElementById('busTypeDisplay').textContent = bus.busTypeDisplay;
    document.getElementById('departureTimeDisplay').textContent = route.departureTime;
    document.getElementById('arrivalTimeDisplay').textContent = route.arrivalTime;
    document.getElementById('fromCityDisplay').textContent = route.fromCityDisplay;
    document.getElementById('toCityDisplay').textContent = route.toCityDisplay;
    document.getElementById('durationDisplay').textContent = route.duration;

    // Amenities
    const amenitiesContainer = document.getElementById('busAmenitiesDisplay');
    if (amenitiesContainer && bus.amenities) {
        amenitiesContainer.innerHTML = bus.amenities.map(a =>
            `<span class="badge bg-white text-dark border">${getAmenityName(a)}</span>`
        ).join('');
    }

    // Summary
    document.getElementById('summaryFrom').textContent = route.fromCityDisplay;
    document.getElementById('summaryTo').textContent = route.toCityDisplay;
    document.getElementById('summaryDate').textContent = formatDisplayDate(bus.travelDate);
    document.getElementById('summaryBusName').textContent = bus.operatorName;
    document.getElementById('summaryBusType').textContent = bus.busTypeDisplay;
    document.getElementById('summaryTime').textContent = `${route.departureTime} - ${route.arrivalTime}`;
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// ----------------------------------------
// Render Seat Layout - Proper 1x2 Configuration
// ----------------------------------------
function renderSeatLayout() {
    const seats = bookingState.busDetails.seats;
    const lowerDeck = document.getElementById('lowerDeck');
    const upperDeck = document.getElementById('upperDeck');
    const upperDeckContainer = document.getElementById('upperDeckContainer');
    const isSleeper = bookingState.busDetails.busType.includes('sleeper');

    const lowerSeats = seats.filter(s => s.deck === 'lower');
    const upperSeats = seats.filter(s => s.deck === 'upper');

    // Generate lower deck with proper 1x2 layout
    lowerDeck.innerHTML = generateDeckHTML(lowerSeats, isSleeper);

    // Generate upper deck only for sleeper buses
    if (isSleeper && upperSeats.length > 0) {
        upperDeck.innerHTML = generateDeckHTML(upperSeats, isSleeper);
        if (upperDeckContainer) upperDeckContainer.style.display = 'block';
    } else {
        if (upperDeckContainer) upperDeckContainer.style.display = 'none';
    }

    // Add click listeners
    document.querySelectorAll('.seat:not(.booked):not(.ladies-booked)').forEach(seatEl => {
        seatEl.addEventListener('click', function () {
            toggleSeatSelection(this.dataset.seatNumber);
        });
    });
}

function generateDeckHTML(seats, isSleeper) {
    let html = '<div class="bus-layout">';

    // Group seats by rows (3 seats per row for sleeper, 4 for seater)
    const seatsPerRow = isSleeper ? 3 : 4;
    const totalRows = Math.ceil(seats.length / seatsPerRow);

    for (let row = 0; row < totalRows; row++) {
        const rowSeats = seats.slice(row * seatsPerRow, (row + 1) * seatsPerRow);

        html += '<div class="seat-row">';

        if (isSleeper) {
            // Sleeper: 1 + aisle + 2 layout
            // Left side (1 berth)
            const leftSeat = rowSeats.find(s => s.position === 'left');
            if (leftSeat) {
                html += `<div class="seat-group left">${createSeatHTML(leftSeat, true)}</div>`;
            }

            // Aisle
            html += '<div class="aisle"></div>';

            // Right side (2 berths)
            const rightSeats = rowSeats.filter(s => s.position === 'right');
            html += '<div class="seat-group right">';
            rightSeats.forEach(seat => {
                html += createSeatHTML(seat, true);
            });
            html += '</div>';
        } else {
            // Seater: 2 + aisle + 2 layout
            // Left side (2 seats)
            const leftSeats = rowSeats.filter(s => s.position === 'left');
            html += '<div class="seat-group left">';
            leftSeats.forEach(seat => {
                html += createSeatHTML(seat, false);
            });
            html += '</div>';

            // Aisle
            html += '<div class="aisle"></div>';

            // Right side (2 seats)
            const rightSeats = rowSeats.filter(s => s.position === 'right');
            html += '<div class="seat-group right">';
            rightSeats.forEach(seat => {
                html += createSeatHTML(seat, false);
            });
            html += '</div>';
        }

        html += '</div>';
    }

    html += '</div>';
    return html;
}

function createSeatHTML(seat, isSleeper) {
    const isSelected = bookingState.selectedSeats.includes(seat.seatNumber);
    let statusClass = seat.status;

    if (isSelected) statusClass = 'selected';

    const seatTypeClass = isSleeper ? 'sleeper-berth' : 'seater-seat';

    return `
        <div class="seat ${statusClass} ${seatTypeClass}" 
             data-seat-number="${seat.seatNumber}" 
             data-price="${seat.price}"
             title="Seat ${seat.seatNumber} - ₹${seat.price}"
             ${seat.status === 'booked' ? 'disabled' : ''}>
            <span class="seat-number">${seat.seatNumber}</span>
            <span class="seat-price">₹${seat.price}</span>
        </div>
    `;
}

// ----------------------------------------
// Seat Selection
// ----------------------------------------
function toggleSeatSelection(seatNumber) {
    const seatEl = document.querySelector(`[data-seat-number="${seatNumber}"]`);
    if (!seatEl || seatEl.classList.contains('booked') || seatEl.classList.contains('ladies-booked')) return;

    const index = bookingState.selectedSeats.indexOf(seatNumber);

    if (index > -1) {
        // Deselect
        bookingState.selectedSeats.splice(index, 1);
        seatEl.classList.remove('selected');

        // Restore original status
        const seatData = bookingState.busDetails.seats.find(s => s.seatNumber === seatNumber);
        if (seatData) {
            seatEl.classList.add(seatData.status);
        }
    } else {
        // Check max seats
        if (bookingState.selectedSeats.length >= 6) {
            showToast('Maximum 6 seats can be selected', 'warning');
            return;
        }

        // Select
        bookingState.selectedSeats.push(seatNumber);
        seatEl.classList.remove('available', 'ladies');
        seatEl.classList.add('selected');

        // Animate
        seatEl.classList.add('seat-select-animate');
        setTimeout(() => seatEl.classList.remove('seat-select-animate'), 300);
    }

    updateSeatSelection();
    updateBookingSummary();
}

function updateSeatSelection() {
    const selectedDisplay = document.getElementById('selectedSeatsDisplay');
    const seatTotalDisplay = document.getElementById('seatTotalDisplay');
    const proceedBtn = document.getElementById('proceedStep2');

    if (bookingState.selectedSeats.length === 0) {
        selectedDisplay.textContent = 'None';
        seatTotalDisplay.textContent = '0';
        proceedBtn.disabled = true;
    } else {
        selectedDisplay.textContent = bookingState.selectedSeats.join(', ');

        // Calculate total
        let total = 0;
        bookingState.selectedSeats.forEach(seatNum => {
            const seat = bookingState.busDetails.seats.find(s => s.seatNumber === seatNum);
            if (seat) total += seat.price;
        });

        bookingState.baseFare = total;
        seatTotalDisplay.textContent = total.toLocaleString();
        proceedBtn.disabled = false;
    }
}

// ----------------------------------------
// Booking Summary
// ----------------------------------------
function updateBookingSummary() {
    const baseFare = Number(bookingState.baseFare) || 0;
    const taxes = Math.round(baseFare * 0.05); // 5% tax
    const total = baseFare + taxes;

    bookingState.taxes = taxes;
    bookingState.totalAmount = total;

    document.getElementById('summarySeats').textContent =
        bookingState.selectedSeats.length > 0 ? bookingState.selectedSeats.join(', ') : '-';
    document.getElementById('summaryPassengers').textContent = bookingState.selectedSeats.length;
    document.getElementById('summaryBaseFare').textContent = baseFare.toLocaleString();
    document.getElementById('summaryTaxes').textContent = taxes.toLocaleString();
    document.getElementById('summaryTotal').textContent = total.toLocaleString();

    // Update payment button
    document.getElementById('finalAmountBtn').textContent = total.toLocaleString();
}

// ----------------------------------------
// Step Navigation
// ----------------------------------------
function goToStep(step) {
    // Validate before moving
    if (step === 2 && bookingState.selectedSeats.length === 0) {
        showToast('Please select at least one seat', 'warning');
        return;
    }

    if (step === 3) {
        if (!validatePassengerDetails()) {
            return;
        }
        collectPassengerDetails();
    }

    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(el => el.classList.add('d-none'));

    // Show target step
    document.getElementById(`step${step}`).classList.remove('d-none');

    // Update progress
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index + 1 < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (index + 1 === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });

    document.querySelectorAll('.progress-line').forEach((el, index) => {
        if (index + 1 < step) {
            el.classList.add('completed');
        } else {
            el.classList.remove('completed');
        }
    });

    // Generate passenger forms if going to step 2
    if (step === 2) {
        generatePassengerForms();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------
// Passenger Forms
// ----------------------------------------
function generatePassengerForms() {
    const container = document.getElementById('passengerForms');

    container.innerHTML = bookingState.selectedSeats.map((seat, index) => `
        <div class="passenger-form mb-4 p-3 bg-light rounded">
            <h6 class="mb-3">
                <i class="fas fa-user text-primary me-2"></i>
                Passenger ${index + 1} - Seat ${seat}
            </h6>
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-control passenger-name" data-seat="${seat}" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Age *</label>
                    <input type="number" class="form-control passenger-age" data-seat="${seat}" min="1" max="100" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Gender *</label>
                    <select class="form-select passenger-gender" data-seat="${seat}" required>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

function validatePassengerDetails() {
    let isValid = true;
    let firstInvalidInput = null;

    // Helper to set error
    const setError = (input, message) => {
        input.classList.add('is-invalid');
        // Check if error message element exists, if not create one
        let errorDiv = input.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        errorDiv.textContent = message;
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = input;
    };

    const clearError = (input) => {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.remove();
        }
    };

    // 1. Validate Passenger Names
    document.querySelectorAll('.passenger-name').forEach(input => {
        const value = input.value.trim();
        // Name: Letters and spaces only, min 2 chars
        const nameRegex = /^[A-Za-z\s]{2,}$/;

        if (!value) {
            setError(input, 'Name is required');
        } else if (!nameRegex.test(value)) {
            setError(input, 'Name must contain only letters and be at least 2 characters');
        } else {
            clearError(input);
        }
    });

    // 2. Validate Passenger Ages
    document.querySelectorAll('.passenger-age').forEach(input => {
        const value = input.value;
        // Age: Numeric, 1-100
        if (!value) {
            setError(input, 'Age is required');
        } else {
            const age = parseInt(value);
            if (isNaN(age) || age < 1 || age > 100) {
                setError(input, 'Age must be between 1 and 100');
            } else {
                clearError(input);
            }
        }
    });

    // 3. Validate Gender
    document.querySelectorAll('.passenger-gender').forEach(input => {
        if (!input.value) {
            setError(input, 'Gender is required');
        } else {
            clearError(input);
        }
    });

    // 4. Validate Contact Email
    const emailInput = document.getElementById('contactEmail');
    const emailValue = emailInput.value.trim();
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValue) {
        setError(emailInput, 'Email is required');
    } else if (!emailRegex.test(emailValue)) {
        setError(emailInput, 'Please enter a valid email address');
    } else {
        clearError(emailInput);
    }

    // 5. Validate Contact Phone
    const phoneInput = document.getElementById('contactPhone');
    const phoneValue = phoneInput.value.trim();
    // Phone: Exactly 10 digits
    const phoneRegex = /^\d{10}$/;

    if (!phoneValue) {
        setError(phoneInput, 'Phone number is required');
    } else if (!phoneRegex.test(phoneValue)) {
        setError(phoneInput, 'Phone number must be exactly 10 digits');
    } else {
        clearError(phoneInput);
    }

    if (!isValid) {
        showToast('Please correct the errors in the form', 'danger');
        if (firstInvalidInput) {
            firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidInput.focus();
        }
    }

    return isValid;
}

function collectPassengerDetails() {
    bookingState.passengers = [];

    bookingState.selectedSeats.forEach(seat => {
        const name = document.querySelector(`.passenger-name[data-seat="${seat}"]`).value;
        const age = document.querySelector(`.passenger-age[data-seat="${seat}"]`).value;
        const gender = document.querySelector(`.passenger-gender[data-seat="${seat}"]`).value;

        bookingState.passengers.push({
            name,
            age: parseInt(age),
            gender,
            seat
        });
    });

    bookingState.contactEmail = document.getElementById('contactEmail').value;
    bookingState.contactPhone = document.getElementById('contactPhone').value;
}

// ----------------------------------------
// Payment Methods
// ----------------------------------------
function initializePaymentMethods() {
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener('change', function () {
            // Hide all details
            document.querySelectorAll('.payment-details').forEach(el => el.classList.add('d-none'));

            // Show selected details
            const detailsId = this.id.replace('pay', '').toLowerCase() + 'Details';
            const details = document.getElementById(detailsId);
            if (details) details.classList.remove('d-none');

            bookingState.paymentMethod = this.value;
        });
    });
}



// ----------------------------------------
// Payment Processing
// ----------------------------------------
async function processPayment() {
    // Show processing modal
    const processingModal = new bootstrap.Modal(document.getElementById('processingModal'));
    processingModal.show();

    try {
        const route = bookingState.busDetails.route;
        const bookingData = {
            userId: getCurrentUser()?._id || 'guest',
            userName: bookingState.passengers[0]?.name || 'Guest',
            routeId: route._id,
            busId: bookingState.busDetails._id,
            operatorId: bookingState.busDetails.operatorId,
            fromCity: route.fromCityDisplay || route.fromCity || 'Unknown',
            toCity: route.toCityDisplay || route.toCity || 'Unknown',
            travelDate: bookingState.busDetails.travelDate,
            departureTime: route.departureTime,
            arrivalTime: route.arrivalTime,
            busName: bookingState.busDetails.operatorName || bookingState.busDetails.busName || 'Bus',
            busType: bookingState.busDetails.busTypeDisplay || bookingState.busDetails.busType || 'Standard',
            seats: bookingState.selectedSeats,
            passengers: bookingState.passengers,
            baseFare: bookingState.baseFare,
            taxes: bookingState.taxes,
            discount: 0,
            couponCode: null,
            totalAmount: bookingState.totalAmount,
            paymentMethod: bookingState.paymentMethod,
            contactEmail: bookingState.contactEmail,
            contactPhone: bookingState.contactPhone
        };

        const result = await MockAPI.createBooking(bookingData);

        processingModal.hide();

        if (result.success) {
            // Update ticket preview
            updateTicketPreview(result.booking);

            // Show success modal
            setTimeout(() => {
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
            }, 300);

            // Save booking to localStorage
            saveBookingToLocal(result.booking);
        } else {
            showToast('Booking failed. Please try again.', 'danger');
        }

    } catch (error) {
        console.error('Payment error:', error);
        processingModal.hide();
        showToast('Payment failed. Please try again.', 'danger');
    }
}

function updateTicketPreview(booking) {
    document.getElementById('ticketFrom').textContent = booking.fromCity;
    document.getElementById('ticketTo').textContent = booking.toCity;
    document.getElementById('ticketDeparture').textContent = booking.departureTime;
    document.getElementById('ticketArrival').textContent = booking.arrivalTime;
    document.getElementById('ticketBus').textContent = booking.busName;
    document.getElementById('ticketDate').textContent = formatDisplayDate(booking.travelDate);
    document.getElementById('ticketSeats').textContent = booking.seats.join(', ');
    document.getElementById('ticketPNR').textContent = booking.pnr;
    document.getElementById('ticketAmount').textContent = `₹${booking.totalAmount.toLocaleString()}`;
}

function saveBookingToLocal(booking) {
    const user = getCurrentUser();
    const storageKey = user ? `busgo_bookings_${user._id}` : 'busgo_bookings_guest';
    const bookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
    // Ensure the booking object has the correct travel date from the flow, not just current timestamp
    // booking.travelDate is already set in processPayment from busDetails.travelDate
    bookings.unshift(booking);
    localStorage.setItem(storageKey, JSON.stringify(bookings));
}

// ----------------------------------------
// Utility
// ----------------------------------------
function getCurrentUser() {
    const user = localStorage.getItem('busgo_user');
    return user ? JSON.parse(user) : null;
}

function getAmenityName(amenity) {
    const names = {
        'wifi': 'WiFi',
        'charging': 'Charging Point',
        'water': 'Water Bottle',
        'blanket': 'Blanket',
        'tv': 'TV'
    };
    return names[amenity] || amenity;
}
