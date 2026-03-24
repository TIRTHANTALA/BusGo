/* ========================================
  BusGo - Main Application Script
  Home Page Functionality
  ======================================== */

// ----------------------------------------
// Initialize on DOM Load
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function () {

    initializeSearchForm();
    initializeSmoothScroll();

    // Check for login action in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'login') {
        const loginModalElement = document.getElementById('loginModal');
        if (loginModalElement) {
            const loginModal = new bootstrap.Modal(loginModalElement);
            loginModal.show();

            // Store redirect URL if present
            const redirectUrl = urlParams.get('redirect');
            if (redirectUrl) {
                sessionStorage.setItem('postLoginRedirect', redirectUrl);
            }
        }
    }
});



// ----------------------------------------
// Load Home Page Offers
// ----------------------------------------
// Offers functions removed

// ----------------------------------------
// Search Form Handler
// ----------------------------------------
// Populate city dropdowns
function populateCityDropdowns() {
    const fromSelect = document.getElementById('fromCity');
    const toSelect = document.getElementById('toCity');

    if (!fromSelect || !toSelect || !window.MockAPI?.mockCities) return;

    const cities = window.MockAPI.mockCities;

    const createOption = (city) => `<option value="${city.name}">${city.name}</option>`;
    const options = cities.map(createOption).join('');

    // Keep the first "Select City" option and append common cities
    fromSelect.innerHTML = '<option value="">Select City</option>' + options;
    toSelect.innerHTML = '<option value="">Select City</option>' + options;
}

function initializeSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;

    // Initialize cities
    populateCityDropdowns();

    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const fromCity = document.getElementById('fromCity').value;
        const toCity = document.getElementById('toCity').value;
        let travelDate = document.getElementById('travelDate').value; // No default to today

        // Fallback to today in local time if needed (though validation blocks empty dates)
        if (!travelDate) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            // We don't auto-set it here to enforce selection, but keeping logic consistent just in case refactoring happens
        }

        // Validation
        if (!fromCity || !toCity) {
            showToast('Please select both cities', 'warning');
            return;
        }

        if (!travelDate) {
            showToast('Please select a travel date', 'warning');
            return;
        }

        if (fromCity === toCity) {
            showToast('From and To cities cannot be the same', 'warning');
            return;
        }

        // Show loading
        showLoading(true);

        // Save search params and redirect
        const searchParams = new URLSearchParams({
            from: fromCity,
            to: toCity,
            date: travelDate
        });

        // Simulate loading delay
        window.location.href = `search.html?${searchParams.toString()}`;
    });
}

// ----------------------------------------
// Loading Overlay
// ----------------------------------------
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('show', show);
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// ----------------------------------------
// Smooth Scroll
// ----------------------------------------
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ----------------------------------------
// Navbar Scroll Effect
// ----------------------------------------
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow');
        } else {
            navbar.classList.remove('shadow');
        }
    }
});

// ----------------------------------------
// City Swap Functionality
// ----------------------------------------
function swapCities() {
    const fromCity = document.getElementById('fromCity') || document.getElementById('modifyFromCity');
    const toCity = document.getElementById('toCity') || document.getElementById('modifyToCity');

    if (fromCity && toCity) {
        const temp = fromCity.value;
        fromCity.value = toCity.value;
        toCity.value = temp;
    }
}

// ----------------------------------------
// Scroll Reveal Animation
// ----------------------------------------
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));
}

// ----------------------------------------
// Popular Routes Quick Search
// ----------------------------------------
function quickSearch(from, to) {
    document.getElementById('fromCity').value = from;
    document.getElementById('toCity').value = to;

    // Scroll to search form
    document.querySelector('.search-box').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    // Focus on date picker
    setTimeout(() => {
        const dateInput = document.getElementById('travelDate');
        dateInput.valueAsDate = new Date(); // Set to today or leave empty to force user pick
        dateInput.focus();
        // dateInput.showPicker(); // Optional: Programmatically open picker if supported
    }, 500);
}
