# 🚌 BusGo - Online Bus Ticket Booking System

> India's trusted online bus ticket booking platform — search routes, book seats, and manage your travel all in one place.

---

## ✨ Features

### 👤 User Side
- 🔍 **Search Buses** — Search available buses by source city, destination city, and travel date
- 🎫 **Book Tickets** — Select seats and confirm bookings with passenger details
- 📋 **My Bookings** — View, track, and cancel existing bookings
- 🔐 **Authentication** — Register & login with role-based access (User / Admin)

### 🛡️ Admin Side
- 📊 **Dashboard** — Overview of total users, bookings, routes, and revenue
- 🚌 **Manage Buses** — Add, edit, and delete bus listings
- 🗺️ **Manage Routes** — Configure routes with cities, distances, and fares
- 👥 **Manage Users** — View all registered users
- 📑 **All Bookings** — Monitor and manage all platform bookings

---

## 🗂️ Project Structure

```
BusGo/
│
├── index.html          # Home page with search form & hero section
├── search.html         # Search results — available buses listing
├── booking.html        # Seat selection & booking confirmation
├── my-bookings.html    # User's booking history & management
├── admin.html          # Admin dashboard (buses, routes, users, bookings)
│
├── css/
│   ├── style.css       # Main stylesheet
│   └── animations.css  # Animation effects
│
└── js/
    └── (JavaScript files for logic & localStorage handling)
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Page structure & markup |
| CSS3 | Custom styling & animations |
| Bootstrap 5.3 | Responsive UI components |
| Font Awesome 6 | Icons throughout the app |
| Vanilla JavaScript | App logic, routing, localStorage |
| localStorage | Client-side data persistence |

---

## 🚀 Getting Started

### Prerequisites
No installation needed! Just a modern web browser.

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/busgo.git
   ```

2. **Navigate to the project folder**
   ```bash
   cd busgo
   ```

3. **Open `index.html` in your browser**
   ```bash
   # Simply double-click index.html
   # Or use Live Server extension in VS Code
   ```

> ✅ No backend or build tools required. Everything runs in the browser.

---

## 📸 Pages Overview

| Page | Description |
|---|---|
| `index.html` | Landing page with bus search form |
| `search.html` | Lists available buses for the selected route & date |
| `booking.html` | Seat selection and passenger detail entry |
| `my-bookings.html` | Logged-in user's booking history |
| `admin.html` | Admin panel to manage the entire platform |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@busgo.com | admin123 |
| User | Register via the Sign Up form | — |
