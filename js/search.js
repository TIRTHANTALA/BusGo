/* ========================================
   BusGo - Search Results Page
   Bus Search & Display Functionality
   ======================================== */

// ----------------------------------------
// State
// ----------------------------------------
let searchResults = [];
let filteredResults = [];
let currentFilters = {
    departure: [],
    busType: [],
    priceMin: 0,
    priceMax: 5000,

    amenities: [],
    operators: [],
    seatsAvailable: false
};
let currentSort = 'price-low';

// ----------------------------------------
// Initialize on DOM Load
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    initializePage();
});

async function initializePage() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from') || 'Mumbai';
    const to = urlParams.get('to') || 'Pune';
    const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
    const passengers = urlParams.get('passengers') || 1;

    // Update UI with search params
    updateSearchDisplay(from, to, date);

    // Initialize components

    initializePriceSlider();
    initializeFilterListeners();
    initializeSortButtons();
    initializeMobileFilter();

    // Load bus results
    await loadBusResults(from, to, date);
}

// ----------------------------------------
// Update Search Display
// ----------------------------------------
function updateSearchDisplay(from, to, date) {
    // Update route display
    const routeDisplay = document.getElementById('routeDisplay');
    const dateDisplay = document.getElementById('dateDisplay');

    if (routeDisplay) {
        routeDisplay.textContent = `${capitalize(from)} → ${capitalize(to)}`;
    }

    if (dateDisplay) {
        dateDisplay.textContent = formatDisplayDate(date);
    }

    // Populate dropdowns first
    populateModifyCityDropdowns();

    // Update modify search form
    const modifyFromCity = document.getElementById('modifyFromCity');
    const modifyToCity = document.getElementById('modifyToCity');
    const modifyDate = document.getElementById('modifyDate');

    if (modifyFromCity) modifyFromCity.value = from;
    if (modifyToCity) modifyToCity.value = to;
    if (modifyDate) modifyDate.value = date; // date is already YYYY-MM-DD from URL params
}

function populateModifyCityDropdowns() {
    const fromSelect = document.getElementById('modifyFromCity');
    const toSelect = document.getElementById('modifyToCity');

    if (!fromSelect || !toSelect || !window.MockAPI?.mockCities) return;

    const cities = window.MockAPI.mockCities;
    const createOption = (city) => `<option value="${city.name}">${city.name}</option>`;
    const options = cities.map(createOption).join('');

    // Keep the first "Select City" option and append common cities
    fromSelect.innerHTML = '<option value="">Select City</option>' + options;
    toSelect.innerHTML = '<option value="">Select City</option>' + options;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// ----------------------------------------
// Load Bus Results
// ----------------------------------------
async function loadBusResults(from, to, date) {
    showSkeleton(true);

    try {
        searchResults = await MockAPI.searchBuses(from, to, date);
        filteredResults = [...searchResults];

        // Update bus count
        const busCount = document.getElementById('busCount');
        if (busCount) {
            busCount.textContent = `${searchResults.length} Buses Found`;
        }

        // Populate operator filters
        populateOperatorFilters();

        // Apply initial sort and render
        applySortAndRender();

    } catch (error) {
        console.error('Error loading buses:', error);
        showNoResults(true);
    }

    showSkeleton(false);
}

// ----------------------------------------
// Render Bus Cards
// ----------------------------------------
function renderBusCards() {
    const busResultsContainer = document.getElementById('busResults');
    if (!busResultsContainer) return;

    // Hide skeleton
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.style.display = 'none';

    if (filteredResults.length === 0) {
        showNoResults(true);
        return;
    }

    showNoResults(false);

    busResultsContainer.innerHTML = filteredResults.map((bus, index) => `
        <div class="bus-card mb-3 animate-fade-in" style="animation-delay: ${index * 0.05}s;">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <h6 class="bus-name mb-1">${bus.operatorName}</h6>
                    <p class="bus-type mb-2">${bus.busTypeDisplay}</p>

                </div>
                <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="text-center">
                            <p class="bus-time mb-0">${bus.departureTime}</p>
                            <small class="text-muted">${bus.fromCity}</small>
                        </div>
                        <div class="text-center px-3">
                            <small class="bus-duration text-muted">${bus.duration}</small>
                            <div class="route-line-mini"></div>
                        </div>
                        <div class="text-center">
                            <p class="bus-time mb-0">${bus.arrivalTime}</p>
                            <small class="text-muted">${bus.toCity}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="d-flex flex-wrap gap-1 mb-2">
                        ${bus.amenities.map(a => `
                            <span class="badge bg-light text-dark border me-1">${getAmenityName(a)}</span>
                        `).join('')}
                    </div>
                    ${bus.availableSeats > 0 ? `
                        <small class="text-success">
                            <i class="fas fa-chair me-1"></i>${bus.availableSeats} Seats Left
                        </small>
                    ` : `
                        <small class="text-danger fw-bold">
                            <i class="fas fa-times-circle me-1"></i>Sold Out
                        </small>
                    `}
                </div>
                <div class="col-md-3 text-end">
                    <p class="bus-price mb-1">₹${bus.price}</p>
                    <small class="text-muted text-decoration-line-through d-block mb-2">
                        ₹${Math.round(bus.price * 1.15)}
                    </small>
                    <button class="btn ${bus.availableSeats > 0 ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="selectBus('${bus.routeId}', '${bus.busId}')"
                            ${bus.availableSeats === 0 ? 'disabled' : ''}>
                        ${bus.availableSeats > 0 ? 'Select Seats' : 'Sold Out'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getAmenityIcon(amenity) {
    const icons = {
        'wifi': 'fa-wifi',
        'charging': 'fa-plug',
        'water': 'fa-tint',
        'blanket': 'fa-blanket',
        'tv': 'fa-tv'
    };
    return icons[amenity] || 'fa-check';
}

function getAmenityName(amenity) {
    const names = {
        'wifi': 'WiFi',
        'charging': 'Charging Point',
        'water': 'Water Bottle',
        'blanket': 'Blanket',
        'tv': 'TV/Entertainment'
    };
    return names[amenity] || amenity;
}

// ----------------------------------------
// Select Bus - Redirect to Booking
// ----------------------------------------
function selectBus(routeId, busId) {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to book a ticket', 'warning');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();

        // Store pending booking info to redirect after login
        sessionStorage.setItem('pendingBooking', JSON.stringify({
            routeId: routeId,
            busId: busId,
            date: new URLSearchParams(window.location.search).get('date') || new Date().toISOString().split('T')[0],
            passengers: new URLSearchParams(window.location.search).get('passengers') || 1
        }));
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams({
        routeId: routeId,
        busId: busId,
        date: urlParams.get('date') || new Date().toISOString().split('T')[0],
        passengers: urlParams.get('passengers') || 1
    });

    window.location.href = `booking.html?${params.toString()}`;
}

// ----------------------------------------
// Filter Functions
// ----------------------------------------
function initializeFilterListeners() {
    // Departure time filters
    document.querySelectorAll('input[name="departure"]').forEach(input => {
        input.addEventListener('change', function () {
            updateDepartureFilter();
            applyFilters();
        });
    });

    // Bus type filters
    document.querySelectorAll('#busTypeAC, #busTypeNonAC, #busTypeSleeper, #busTypeSeater').forEach(input => {
        input.addEventListener('change', function () {
            updateBusTypeFilter();
            applyFilters();
        });
    });



    // Amenity filters
    document.querySelectorAll('#amenityWifi, #amenityCharging, #amenityWater, #amenityBlanket').forEach(input => {
        input.addEventListener('change', function () {
            updateAmenityFilter();
            applyFilters();
        });
    });

    // Seats available filter
    const seatsAvailable = document.getElementById('seatsAvailable');
    if (seatsAvailable) {
        seatsAvailable.addEventListener('change', function () {
            currentFilters.seatsAvailable = this.checked;
            applyFilters();
        });
    }
}

function updateDepartureFilter() {
    currentFilters.departure = [];
    document.querySelectorAll('input[name="departure"]:checked').forEach(input => {
        currentFilters.departure.push(input.value);
    });
}

function updateBusTypeFilter() {
    currentFilters.busType = [];
    if (document.getElementById('busTypeAC')?.checked) {
        currentFilters.busType.push('ac-sleeper', 'ac-seater');
    }
    if (document.getElementById('busTypeNonAC')?.checked) {
        currentFilters.busType.push('non-ac-sleeper', 'non-ac-seater');
    }
    if (document.getElementById('busTypeSleeper')?.checked) {
        currentFilters.busType.push('ac-sleeper', 'non-ac-sleeper');
    }
    if (document.getElementById('busTypeSeater')?.checked) {
        currentFilters.busType.push('ac-seater', 'non-ac-seater');
    }
}

function updateAmenityFilter() {
    currentFilters.amenities = [];
    if (document.getElementById('amenityWifi')?.checked) currentFilters.amenities.push('wifi');
    if (document.getElementById('amenityCharging')?.checked) currentFilters.amenities.push('charging');
    if (document.getElementById('amenityWater')?.checked) currentFilters.amenities.push('water');
    if (document.getElementById('amenityBlanket')?.checked) currentFilters.amenities.push('blanket');
}

function applyFilters() {
    filteredResults = searchResults.filter(bus => {
        // Departure time filter
        if (currentFilters.departure.length > 0) {
            const hour = parseInt(bus.departureTime.split(':')[0]);
            let period = '';
            if (hour >= 6 && hour < 12) period = 'morning';
            else if (hour >= 12 && hour < 18) period = 'afternoon';
            else if (hour >= 18 && hour < 24) period = 'evening';
            else period = 'night';

            if (!currentFilters.departure.includes(period)) return false;
        }

        // Bus type filter
        if (currentFilters.busType.length > 0) {
            if (!currentFilters.busType.includes(bus.busType)) return false;
        }

        // Price filter
        if (bus.price < currentFilters.priceMin || bus.price > currentFilters.priceMax) {
            return false;
        }



        // Amenities filter
        if (currentFilters.amenities.length > 0) {
            const hasAllAmenities = currentFilters.amenities.every(a => bus.amenities.includes(a));
            if (!hasAllAmenities) return false;
        }

        // Operator filter
        if (currentFilters.operators.length > 0) {
            if (!currentFilters.operators.includes(bus.operatorName)) return false;
        }

        // Seats available filter
        if (currentFilters.seatsAvailable && bus.availableSeats < 1) {
            return false;
        }

        return true;
    });

    updateFilterCount();
    applySortAndRender();
}

function clearAllFilters() {
    // Reset filter state
    currentFilters = {
        departure: [],
        busType: [],
        priceMin: 0,
        priceMax: 5000,
        amenities: [],
        operators: [],
        seatsAvailable: false
    };

    // Reset UI checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="departure"]').forEach(cb => cb.checked = false);


    // Reset price slider
    const priceSlider = document.getElementById('priceSlider');
    if (priceSlider && priceSlider.noUiSlider) {
        priceSlider.noUiSlider.set([0, 5000]);
    }

    // Apply filters
    applyFilters();
}

function updateFilterCount() {
    const count =
        currentFilters.departure.length +
        currentFilters.busType.length +
        currentFilters.amenities.length +
        currentFilters.operators.length +

        (currentFilters.seatsAvailable ? 1 : 0);

    const filterCountEl = document.getElementById('activeFilterCount');
    if (filterCountEl) {
        filterCountEl.textContent = `${count} filters applied`;
        filterCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ----------------------------------------
// Sort Functions
// ----------------------------------------
function initializeSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            applySortAndRender();
        });
    });
}

function applySortAndRender() {
    // Sort filtered results
    filteredResults.sort((a, b) => {
        switch (currentSort) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'departure':
                return a.departureTime.localeCompare(b.departureTime);
            case 'duration':
                return a.durationMinutes - b.durationMinutes;

            default:
                return 0;
        }
    });

    renderBusCards();
}

// ----------------------------------------
// Price Slider
// ----------------------------------------
function initializePriceSlider() {
    const priceSlider = document.getElementById('priceSlider');
    if (!priceSlider || typeof noUiSlider === 'undefined') return;

    noUiSlider.create(priceSlider, {
        start: [0, 3000],
        connect: true,
        range: {
            'min': 0,
            'max': 5000
        },
        step: 50,
        tooltips: false
    });

    const minPriceEl = document.getElementById('minPrice');
    const maxPriceEl = document.getElementById('maxPrice');

    priceSlider.noUiSlider.on('update', function (values) {
        currentFilters.priceMin = Math.round(values[0]);
        currentFilters.priceMax = Math.round(values[1]);

        if (minPriceEl) minPriceEl.textContent = currentFilters.priceMin;
        if (maxPriceEl) maxPriceEl.textContent = currentFilters.priceMax;
    });

    priceSlider.noUiSlider.on('change', function () {
        applyFilters();
    });
}

// ----------------------------------------
// Operator Filters
// ----------------------------------------
function populateOperatorFilters() {
    const container = document.getElementById('operatorFilters');
    if (!container) return;

    const operators = [...new Set(searchResults.map(b => b.operatorName))];

    container.innerHTML = operators.map(op => `
        <div class="form-check">
            <input class="form-check-input filter-checkbox" type="checkbox" value="${op}" id="operator_${op.replace(/\s/g, '_')}">
            <label class="form-check-label" for="operator_${op.replace(/\s/g, '_')}">
                ${op}
            </label>
        </div>
    `).join('');

    // Add listeners
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', function () {
            if (this.checked) {
                currentFilters.operators.push(this.value);
            } else {
                currentFilters.operators = currentFilters.operators.filter(o => o !== this.value);
            }
            applyFilters();
        });
    });
}

// ----------------------------------------
// Mobile Filter
// ----------------------------------------
function initializeMobileFilter() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');

    if (filterToggle && filterSidebar) {
        filterToggle.addEventListener('click', function () {
            filterSidebar.classList.toggle('show');
            filterOverlay.classList.toggle('show');
        });
    }

    if (filterOverlay) {
        filterOverlay.addEventListener('click', function () {
            filterSidebar.classList.remove('show');
            filterOverlay.classList.remove('show');
        });
    }
}

// ----------------------------------------
// Date Picker
// ----------------------------------------


// ----------------------------------------
// Modify Search
// ----------------------------------------
const modifySearchForm = document.getElementById('modifySearchForm');
if (modifySearchForm) {
    modifySearchForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const from = document.getElementById('modifyFromCity').value;
        const to = document.getElementById('modifyToCity').value;

        if (from === to) {
            showToast('From and To cities cannot be the same', 'warning');
            return;
        }

        const params = new URLSearchParams({
            from: from,
            to: to,
            date: document.getElementById('modifyDate').value || new Date().toISOString().split('T')[0],
            passengers: 1
        });

        window.location.href = `search.html?${params.toString()}`;
    });
}

// ----------------------------------------
// Utility Functions
// ----------------------------------------
function showSkeleton(show) {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) {
        skeleton.style.display = show ? 'block' : 'none';
    }
}

function showNoResults(show) {
    const noResults = document.getElementById('noResults');
    const busResults = document.getElementById('busResults');

    if (noResults) {
        noResults.classList.toggle('d-none', !show);
    }

    if (busResults && show) {
        // Clear bus cards but keep skeleton hidden
        const skeleton = document.getElementById('skeletonLoader');
        busResults.innerHTML = '';
        if (skeleton) busResults.appendChild(skeleton);
    }
}

function swapCities() {
    const from = document.getElementById('modifyFromCity');
    const to = document.getElementById('modifyToCity');

    if (from && to) {
        const temp = from.value;
        from.value = to.value;
        to.value = temp;
    }
}
