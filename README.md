# QuickTow - Emergency Towing Service

A full-stack web application for managing emergency tow truck bookings, driver dispatch, and real-time tracking. Built for the Pakistan market with English/Urdu bilingual support.

## Features

- **Customer Booking** - Request a tow truck with pickup/dropoff locations
- **Tracking** - Real-time order tracking with status history
- **Driver Portal** - Drivers can log in, view assignments, update status & share location
- **Admin Dashboard** - Manage bookings, assign drivers, add drivers, post blogs
- **Bilingual** - Full English and Urdu language support
- **Responsive** - Mobile-first design

## Tech Stack

- **Backend:** Node.js, Express.js
- **Templating:** EJS
- **Database:** MySQL (mysql2)
- **Session:** express-session
- **Language:** JavaScript (CommonJS)

## Project Structure

```
website/
├── app.js              # Main application file (routes & logic)
├── config/
│   ├── db.js           # MySQL connection pool
│   └── schema.sql      # Database schema & seed data
├── views/              # EJS templates
│   ├── landing.ejs
│   ├── booking.ejs
│   ├── tracking.ejs
│   ├── blogs.ejs
│   ├── about.ejs
│   ├── driver-login.ejs
│   ├── driver-panel.ejs
│   ├── admin-login.ejs
│   ├── admin-dash.ejs
│   └── loading.ejs
├── public/             # Static assets (CSS, JS, images)
├── locales/
│   ├── en.json         # English translations
│   └── ur.json         # Urdu translations
├── .env.example        # Environment variables template
└── package.json
```

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/mjuiiuid87238/website.git
   cd website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (see `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Set up MySQL database:
   ```bash
   mysql -u root -p < config/schema.sql
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. Open `http://localhost:3000`

## Default Admin Credentials

- **Username:** admin
- **Password:** admin123

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/booking` | Book a tow truck |
| `/track` | Track your order |
| `/blogs` | Blog articles |
| `/about` | About us |
| `/driver` | Driver login |
| `/driver/panel` | Driver dashboard |
| `/{ADMIN_PATH}` | Admin login |
| `/{ADMIN_PATH}/dashboard` | Admin panel |

## License

ISC
