# QuickTow - Design Document

## Overview

QuickTow is a tow truck booking and dispatch management system designed for the Pakistan market. It connects customers needing roadside assistance with available tow truck drivers through an admin-managed platform.

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, EJS Templates |
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2 with connection pooling) |
| Session | express-session (server-side) |
| Language | JavaScript (CommonJS) |

### System Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Customer    │────▶│  Express.js  │────▶│   MySQL     │
│  (Browser)   │◀────│  Server      │◀────│   Database  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────┴─────┐ ┌────┴─────┐
              │  Driver   │ │  Admin   │
              │  Portal   │ │  Panel   │
              └───────────┘ └──────────┘
```

## User Roles

### 1. Customer
- Views landing page with services info
- Fills booking form (name, phone, vehicle, pickup/dropoff, truck type)
- Receives tracking code (QT-XXXXXX format)
- Tracks order status in real-time
- Can view blogs and about page

### 2. Driver
- Logs in with registered phone number
- Views assigned active bookings
- Updates booking status: dispatched → on_the_way → arrived → completed
- Shares live GPS location
- Views recent completed deliveries

### 3. Admin
- Secret URL path (configurable via `ADMIN_PATH` env var)
- Logs in with username/password
- Dashboard with stats (total, pending, active, completed bookings)
- Manages bookings (assign driver, update status, cancel)
- Manages drivers (add, delete, view status)
- Posts blog articles

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `drivers` | Driver info, truck type, status, GPS location |
| `bookings` | Customer bookings, tracking code, status, driver assignment |
| `status_history` | Audit trail of all status changes with timestamps |
| `admins` | Admin login credentials |
| `blogs` | Blog articles |

### Booking Status Flow

```
pending → assigned → dispatched → on_the_way → arrived → completed
                                                          ↗
                                            cancelled ────┘
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, services, how-it-works, stats, testimonials, CTA |
| Booking | `/booking` | Form to request tow truck |
| Tracking | `/track` | Enter tracking code, view status + history |
| About | `/about` | Company info and features |
| Blogs | `/blogs` | Blog articles list |
| Driver Login | `/driver` | Phone-based login |
| Driver Panel | `/driver/panel` | Active bookings, status updates, location sharing |
| Admin Login | `/{ADMIN_PATH}` | Username/password login |
| Admin Dashboard | `/{ADMIN_PATH}/dashboard` | Stats, booking management, driver management, blog posting |

## Design Principles

- **Mobile-first** responsive design
- **Bilingual** (English/Urdu) with RTL support
- **Dark theme** hero and stats sections with warm orange (#f39c12) accent
- **Card-based** layout for services, testimonials, features
- **WhatsApp integration** floating button for quick contact
- **Minimal JavaScript** — most interactions are server-rendered with EJS

## Color Palette

| Color | Usage |
|-------|-------|
| `#1a252f` | Dark backgrounds |
| `#2c3e50` | Secondary dark |
| `#f39c12` | Primary accent (orange) |
| `#e67e22` | Primary dark |
| `#27ae60` | Success / green accent |
| `#ffffff` | Card backgrounds |
| `#f8f9fa` | Page background |
