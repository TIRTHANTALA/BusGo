/* ========================================
   BusGo - Filter & Sort Module
   Advanced Filtering for Search Results
   ======================================== */

// ----------------------------------------
// Filter Configuration
// ----------------------------------------
const FilterConfig = {
    departureTimes: {
        morning: { label: 'Morning', range: [6, 12], icon: 'fa-sun' },
        afternoon: { label: 'Afternoon', range: [12, 18], icon: 'fa-cloud-sun' },
        evening: { label: 'Evening', range: [18, 24], icon: 'fa-cloud-moon' },
        night: { label: 'Night', range: [0, 6], icon: 'fa-moon' }
    },
    busTypes: {
        'ac-sleeper': { label: 'AC Sleeper', icon: 'fa-snowflake' },
        'ac-seater': { label: 'AC Seater', icon: 'fa-snowflake' },
        'non-ac-sleeper': { label: 'Non-AC Sleeper', icon: 'fa-wind' },
        'non-ac-seater': { label: 'Non-AC Seater', icon: 'fa-wind' }
    },
    amenities: {
        'wifi': { label: 'WiFi', icon: 'fa-wifi' },
        'charging': { label: 'Charging Point', icon: 'fa-plug' },
        'water': { label: 'Water Bottle', icon: 'fa-tint' },
        'blanket': { label: 'Blanket', icon: 'fa-blanket' },
        'tv': { label: 'TV', icon: 'fa-tv' }
    },
    sortOptions: {
        'price-low': { label: 'Price: Low to High', field: 'price', order: 'asc' },
        'price-high': { label: 'Price: High to Low', field: 'price', order: 'desc' },
        'departure': { label: 'Departure Time', field: 'departureTime', order: 'asc' },
        'duration': { label: 'Duration', field: 'durationMinutes', order: 'asc' },
        'seats': { label: 'Seats Available', field: 'availableSeats', order: 'desc' }
    }
};

// ----------------------------------------
// Filter State Manager
// ----------------------------------------
class FilterManager {
    constructor() {
        this.filters = this.getDefaultFilters();
        this.originalData = [];
        this.filteredData = [];
        this.onFilterChange = null;
    }

    getDefaultFilters() {
        return {
            departure: [],
            busType: [],
            priceRange: { min: 0, max: 10000 },
            amenities: [],
            amenities: [],
            operators: [],
            seatsAvailable: false,
            sortBy: 'price-low'
        };
    }

    setData(data) {
        this.originalData = [...data];
        this.filteredData = [...data];
    }

    setFilter(filterType, value) {
        this.filters[filterType] = value;
        this.applyFilters();
    }

    toggleFilter(filterType, value) {
        if (!Array.isArray(this.filters[filterType])) {
            this.filters[filterType] = [];
        }

        const index = this.filters[filterType].indexOf(value);
        if (index > -1) {
            this.filters[filterType].splice(index, 1);
        } else {
            this.filters[filterType].push(value);
        }

        this.applyFilters();
    }

    clearFilters() {
        this.filters = this.getDefaultFilters();
        this.applyFilters();
    }

    clearFilterType(filterType) {
        if (Array.isArray(this.filters[filterType])) {
            this.filters[filterType] = [];
        } else if (typeof this.filters[filterType] === 'object') {
            this.filters[filterType] = { min: 0, max: 10000 };
        } else if (typeof this.filters[filterType] === 'boolean') {
            this.filters[filterType] = false;
            this.filters[filterType] = 0;
        }

        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.originalData.filter(item => {
            // Departure Time Filter
            if (this.filters.departure.length > 0) {
                const hour = parseInt(item.departureTime.split(':')[0]);
                const period = this.getTimePeriod(hour);
                if (!this.filters.departure.includes(period)) return false;
            }

            // Bus Type Filter
            if (this.filters.busType.length > 0) {
                if (!this.filters.busType.includes(item.busType)) return false;
            }

            // Price Range Filter
            if (item.price < this.filters.priceRange.min ||
                item.price > this.filters.priceRange.max) {
                return false;
            }



            // Amenities Filter
            if (this.filters.amenities.length > 0) {
                const hasAll = this.filters.amenities.every(a =>
                    item.amenities && item.amenities.includes(a)
                );
                if (!hasAll) return false;
            }

            // Operator Filter
            if (this.filters.operators.length > 0) {
                if (!this.filters.operators.includes(item.operatorName)) return false;
            }

            // Seats Available Filter
            if (this.filters.seatsAvailable && item.availableSeats < 1) {
                return false;
            }

            return true;
        });

        // Apply Sorting
        this.applySort();

        // Trigger callback
        if (this.onFilterChange) {
            this.onFilterChange(this.filteredData, this.getActiveFilterCount());
        }
    }

    applySort() {
        const sortConfig = FilterConfig.sortOptions[this.filters.sortBy];
        if (!sortConfig) return;

        this.filteredData.sort((a, b) => {
            let valA = a[sortConfig.field];
            let valB = b[sortConfig.field];

            // Handle string comparison for time
            if (sortConfig.field === 'departureTime') {
                valA = this.timeToMinutes(valA);
                valB = this.timeToMinutes(valB);
            }

            if (sortConfig.order === 'asc') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    }

    setSortBy(sortKey) {
        this.filters.sortBy = sortKey;
        this.applySort();

        if (this.onFilterChange) {
            this.onFilterChange(this.filteredData, this.getActiveFilterCount());
        }
    }

    getTimePeriod(hour) {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 24) return 'evening';
        return 'night';
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    getActiveFilterCount() {
        let count = 0;

        count += this.filters.departure.length;
        count += this.filters.busType.length;
        count += this.filters.amenities.length;
        count += this.filters.operators.length;


        if (this.filters.seatsAvailable) count++;
        if (this.filters.priceRange.min > 0 || this.filters.priceRange.max < 10000) count++;

        return count;
    }

    getFilteredData() {
        return this.filteredData;
    }

    getFilters() {
        return this.filters;
    }

    getUniqueOperators() {
        return [...new Set(this.originalData.map(item => item.operatorName))];
    }

    getPriceRange() {
        if (this.originalData.length === 0) return { min: 0, max: 5000 };

        const prices = this.originalData.map(item => item.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }
}

// ----------------------------------------
// Filter UI Generator
// ----------------------------------------
class FilterUI {
    constructor(containerId, filterManager) {
        this.container = document.getElementById(containerId);
        this.filterManager = filterManager;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="filter-header d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filters</h5>
                <button class="btn btn-link btn-sm text-danger p-0" id="clearAllFilters">
                    Clear All
                </button>
            </div>
            
            ${this.renderDepartureFilter()}
            ${this.renderPriceFilter()}
            ${this.renderBusTypeFilter()}
            ${this.renderAmenityFilter()}
            ${this.renderOperatorFilter()}
            ${this.renderSeatsFilter()}
        `;

        this.attachEventListeners();
    }

    renderDepartureFilter() {
        const times = FilterConfig.departureTimes;

        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-clock me-2"></i>Departure Time
                </h6>
                <div class="time-slots">
                    ${Object.entries(times).map(([key, config]) => `
                        <label class="time-slot-btn">
                            <input type="checkbox" name="departure" value="${key}">
                            <span>
                                <i class="fas ${config.icon}"></i><br>
                                ${config.label}<br>
                                <small>${config.range[0]}AM-${config.range[1] > 12 ? config.range[1] - 12 + 'PM' : config.range[1] + 'AM'}</small>
                            </span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPriceFilter() {
        const range = this.filterManager.getPriceRange();

        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-rupee-sign me-2"></i>Price Range
                </h6>
                <div id="priceSlider" class="mb-3"></div>
                <div class="d-flex justify-content-between">
                    <span class="small text-muted">₹<span id="minPriceDisplay">${range.min}</span></span>
                    <span class="small text-muted">₹<span id="maxPriceDisplay">${range.max}</span></span>
                </div>
            </div>
        `;
    }

    renderBusTypeFilter() {
        const types = FilterConfig.busTypes;

        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-bus me-2"></i>Bus Type
                </h6>
                ${Object.entries(types).map(([key, config]) => `
                    <div class="form-check">
                        <input class="form-check-input filter-checkbox" type="checkbox" 
                               value="${key}" id="busType_${key}" name="busType">
                        <label class="form-check-label" for="busType_${key}">
                            <i class="fas ${config.icon} me-1"></i> ${config.label}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }



    renderAmenityFilter() {
        const amenities = FilterConfig.amenities;

        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-concierge-bell me-2"></i>Amenities
                </h6>
                ${Object.entries(amenities).map(([key, config]) => `
                    <div class="form-check">
                        <input class="form-check-input filter-checkbox" type="checkbox" 
                               value="${key}" id="amenity_${key}" name="amenity">
                        <label class="form-check-label" for="amenity_${key}">
                            <i class="fas ${config.icon} me-1"></i> ${config.label}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderOperatorFilter() {
        const operators = this.filterManager.getUniqueOperators();

        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-building me-2"></i>Bus Operator
                </h6>
                ${operators.map(op => `
                    <div class="form-check">
                        <input class="form-check-input filter-checkbox" type="checkbox" 
                               value="${op}" id="operator_${op.replace(/\s/g, '_')}" name="operator">
                        <label class="form-check-label" for="operator_${op.replace(/\s/g, '_')}">
                            ${op}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSeatsFilter() {
        return `
            <div class="filter-group mb-4">
                <h6 class="filter-title">
                    <i class="fas fa-chair me-2"></i>Availability
                </h6>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="seatsAvailable" name="seatsAvailable">
                    <label class="form-check-label" for="seatsAvailable">
                        Show buses with available seats only
                    </label>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Clear all filters
        document.getElementById('clearAllFilters')?.addEventListener('click', () => {
            this.filterManager.clearFilters();
            this.resetAllCheckboxes();
        });

        // Departure time
        document.querySelectorAll('input[name="departure"]').forEach(input => {
            input.addEventListener('change', () => {
                this.filterManager.toggleFilter('departure', input.value);
            });
        });

        // Bus type
        document.querySelectorAll('input[name="busType"]').forEach(input => {
            input.addEventListener('change', () => {
                this.filterManager.toggleFilter('busType', input.value);
            });
        });



        // Amenities
        document.querySelectorAll('input[name="amenity"]').forEach(input => {
            input.addEventListener('change', () => {
                this.filterManager.toggleFilter('amenities', input.value);
            });
        });

        // Operator
        document.querySelectorAll('input[name="operator"]').forEach(input => {
            input.addEventListener('change', () => {
                this.filterManager.toggleFilter('operators', input.value);
            });
        });

        // Seats available
        document.getElementById('seatsAvailable')?.addEventListener('change', (e) => {
            this.filterManager.setFilter('seatsAvailable', e.target.checked);
        });
    }

    resetAllCheckboxes() {
        this.container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });


    }
}

// ----------------------------------------
// Export
// ----------------------------------------
window.FilterConfig = FilterConfig;
window.FilterManager = FilterManager;
window.FilterUI = FilterUI;
