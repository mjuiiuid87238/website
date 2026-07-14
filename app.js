const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Load translations
const locales = {
    en: JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'en.json'), 'utf8')),
    ur: JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'ur.json'), 'utf8'))
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Language middleware
app.use((req, res, next) => {
    let lang = req.query.lang || req.session?.lang || 'en';
    // Parse cookie manually
    const cookies = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(c => {
            const [key, val] = c.trim().split('=');
            if (key && val) cookies[key] = val;
        });
    }
    if (!lang && cookies.lang) lang = cookies.lang;
    if (!locales[lang]) lang = 'en';
    req.lang = lang;
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
    res.locals.t = locales[lang];
    res.locals.lang = lang;
    res.locals.langSwitch = lang === 'en' ? 'ur' : 'en';
    next();
});

// Generate tracking code
function generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'QT-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ===== CUSTOMER ROUTES =====

// 1. Landing Page
app.get('/', (req, res) => {
    res.render('landing');
});

// 2. Booking Page (GET)
app.get('/booking', (req, res) => {
    res.render('booking', { success: null, trackingCode: null });
});

// 3. Booking Process (POST)
app.post('/book', async (req, res) => {
    const { customer_name, phone, car_model, pickup_location, dropoff_location, service_type } = req.body;
    
    if (!customer_name || customer_name.trim().length < 2 || customer_name.trim().length > 100) {
        return res.render('booking', { success: null, trackingCode: null, error: "Name must be 2-100 characters." });
    }
    if (!phone || !/^03\d{9}$/.test(phone.trim())) {
        return res.render('booking', { success: null, trackingCode: null, error: "Enter a valid Pakistani phone number (03XXXXXXXXX)." });
    }
    if (!car_model || car_model.trim().length < 2 || car_model.trim().length > 100) {
        return res.render('booking', { success: null, trackingCode: null, error: "Vehicle model must be 2-100 characters." });
    }
    if (!pickup_location || pickup_location.trim().length < 3) {
        return res.render('booking', { success: null, trackingCode: null, error: "Pickup location is required." });
    }
    if (!dropoff_location || dropoff_location.trim().length < 3) {
        return res.render('booking', { success: null, trackingCode: null, error: "Dropoff location is required." });
    }
    const allowedTypes = ['Standard Tow', 'Flatbed', 'Accident Recovery', 'standard', 'flatbed', 'accident_recovery'];
    if (!service_type || !allowedTypes.includes(service_type)) {
        return res.render('booking', { success: null, trackingCode: null, error: "Invalid service type." });
    }

    const tracking_code = generateTrackingCode();
    try {
        await db.execute(
            `INSERT INTO bookings (customer_name, phone, car_model, pickup_location, dropoff_location, service_type, tracking_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [customer_name.trim(), phone.trim(), car_model.trim(), pickup_location.trim(), dropoff_location.trim(), service_type, tracking_code]
        );
        res.render('booking', { success: "Tow truck requested successfully!", trackingCode: tracking_code, error: null });
    } catch (err) {
        console.error('Booking error:', err.message);
        res.render('booking', { success: null, trackingCode: null, error: "Database error. Please try again. " + err.message });
    }
});

// 4. Tracking Page (GET)
app.get('/track', (req, res) => {
    res.render('tracking', { booking: null, error: null, code: '' });
});

// 5. Track Booking (POST)
app.post('/track', async (req, res) => {
    const { tracking_code } = req.body;
    try {
        const [rows] = await db.execute(
            `SELECT b.*, d.name as driver_name, d.phone as driver_phone, d.truck_number, d.truck_type as driver_truck_type, d.location_lat, d.location_lng 
             FROM bookings b 
             LEFT JOIN drivers d ON b.driver_id = d.id 
             WHERE b.tracking_code = ?`,
            [tracking_code]
        );
        if (rows.length > 0) {
            const [history] = await db.execute(
                'SELECT * FROM status_history WHERE booking_id = ? ORDER BY created_at DESC',
                [rows[0].id]
            );
            res.render('tracking', { booking: rows[0], error: null, code: tracking_code, history: history });
        } else {
            res.render('tracking', { booking: null, error: "No booking found with this tracking code.", code: tracking_code });
        }
    } catch (err) {
        res.status(500).send("Error");
    }
});

// 6. API: Get driver location for tracking
app.get('/api/driver-location/:bookingId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT d.location_lat, d.location_lng, d.name, d.truck_number, b.status 
             FROM bookings b 
             JOIN drivers d ON b.driver_id = d.id 
             WHERE b.id = ?`,
            [req.params.bookingId]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json(null);
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 7. Blogs Page
app.get('/blogs', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM blogs ORDER BY created_at DESC');
        res.render('blogs', { blogs: rows });
    } catch (err) {
        res.status(500).send("Error fetching blogs.");
    }
});

// 8. About Us Page
app.get('/about', (req, res) => {
    res.render('about');
});

// ===== DRIVER ROUTES =====

// 9. Driver Login
app.get('/driver', (req, res) => {
    res.render('driver-login', { error: null });
});

app.post('/driver/login', async (req, res) => {
    const { phone } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM drivers WHERE phone = ?', [phone]);
        if (rows.length > 0) {
            req.session.driverId = rows[0].id;
            req.session.driverName = rows[0].name;
            res.redirect('/driver/panel');
        } else {
            res.render('driver-login', { error: "Driver not found. Contact admin." });
        }
    } catch (err) {
        res.status(500).send("Login error");
    }
});

// 10. Driver Panel
app.get('/driver/panel', async (req, res) => {
    if (!req.session.driverId) return res.redirect('/driver');
    try {
        const [bookings] = await db.execute(
            `SELECT * FROM bookings WHERE driver_id = ? AND status NOT IN ('completed', 'cancelled') ORDER BY id DESC`,
            [req.session.driverId]
        );
        const [completed] = await db.execute(
            `SELECT * FROM bookings WHERE driver_id = ? AND status = 'completed' ORDER BY id DESC LIMIT 5`,
            [req.session.driverId]
        );
        res.render('driver-panel', { 
            bookings, 
            completed,
            driverName: req.session.driverName,
            driverId: req.session.driverId
        });
    } catch (err) {
        res.status(500).send("Error loading panel");
    }
});

// 11. Driver Update Status
app.post('/driver/update-status', async (req, res) => {
    if (!req.session.driverId) return res.redirect('/driver');
    const { booking_id, status, lat, lng, note } = req.body;
    const allowedStatuses = ['dispatched', 'on_the_way', 'arrived', 'completed'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    if (lat && (isNaN(lat) || lat < -90 || lat > 90)) {
        return res.status(400).json({ error: 'Invalid latitude' });
    }
    if (lng && (isNaN(lng) || lng < -180 || lng > 180)) {
        return res.status(400).json({ error: 'Invalid longitude' });
    }
    try {
        await db.execute('UPDATE bookings SET status = ? WHERE id = ? AND driver_id = ?', [status, booking_id, req.session.driverId]);
        
        await db.execute(
            'INSERT INTO status_history (booking_id, status, location_lat, location_lng, note) VALUES (?, ?, ?, ?, ?)',
            [booking_id, status, lat || null, lng || null, note || null]
        );

        if (status === 'completed') {
            await db.execute('UPDATE drivers SET status = "available" WHERE id = ?', [req.session.driverId]);
        } else {
            await db.execute('UPDATE drivers SET status = "on_trip", location_lat = ?, location_lng = ? WHERE id = ?', [lat || null, lng || null, req.session.driverId]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 12. Driver Update Location
app.post('/driver/update-location', async (req, res) => {
    if (!req.session.driverId) return res.status(401).json({ error: 'Not authenticated' });
    const { lat, lng } = req.body;
    try {
        await db.execute('UPDATE drivers SET location_lat = ?, location_lng = ? WHERE id = ?', [lat, lng, req.session.driverId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 13. Driver Logout
app.get('/driver/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/driver');
});

// ===== ADMIN ROUTES =====

const adminPath = process.env.ADMIN_PATH || 'admin-secret-x9k2m';

// 14. Admin Login
app.get('/' + adminPath, (req, res) => {
    res.render('admin-login', { error: null, adminPath: adminPath });
});

app.post('/' + adminPath + '/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('admin-login', { error: "Please enter username and password.", adminPath: adminPath });
    }
    try {
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ? AND password = ?', [username.trim(), password.trim()]);
        if (rows.length > 0) {
            req.session.isAdmin = true;
            res.redirect('/' + adminPath + '/dashboard');
        } else {
            res.render('admin-login', { error: "Invalid Username or Password!", adminPath: adminPath });
        }
    } catch (err) {
        console.error('Admin login error:', err.message);
        res.render('admin-login', { error: "Database connection error. Check if MySQL is running.", adminPath: adminPath });
    }
});
app.get('/' + adminPath + '/dashboard', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    try {
        const [bookings] = await db.execute('SELECT * FROM bookings ORDER BY id DESC');
        const [drivers] = await db.execute('SELECT * FROM drivers ORDER BY id DESC');
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status IN ('assigned','dispatched','on_the_way') THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM bookings
        `);
        res.render('admin-dash', { bookings, drivers, stats: stats[0] || { total: 0, pending: 0, active: 0, completed: 0 }, adminPath: adminPath });
    } catch (err) {
        res.status(500).send("Dashboard data error");
    }
});
// 1 Admin Assign Driver
app.post('/' + adminPath + '/assign-driver', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    const { booking_id, driver_id } = req.body;
    try {
        await db.execute('UPDATE bookings SET driver_id = ?, status = "assigned" WHERE id = ?', [driver_id, booking_id]);
        await db.execute('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driver_id]);
        await db.execute(
            'INSERT INTO status_history (booking_id, status, note) VALUES (?, "assigned", "Driver assigned by admin")',
            [booking_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 17. Admin Add Driver
app.post('/' + adminPath + '/add-driver', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    const { name, phone, truck_type, truck_number } = req.body;
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).send("Invalid driver name");
    }
    if (!phone || !/^03\d{9}$/.test(phone.trim())) {
        return res.status(400).send("Invalid phone number");
    }
    const allowedTypes = ['standard', 'flatbed', 'accident_recovery'];
    if (!truck_type || !allowedTypes.includes(truck_type)) {
        return res.status(400).send("Invalid truck type");
    }
    if (!truck_number || truck_number.trim().length < 2 || truck_number.trim().length > 50) {
        return res.status(400).send("Invalid truck number");
    }
    try {
        await db.execute(
            'INSERT INTO drivers (name, phone, truck_type, truck_number, status) VALUES (?, ?, ?, ?, "available")',
            [name.trim(), phone.trim(), truck_type, truck_number.trim()]
        );
        res.redirect('/' + adminPath + '/dashboard');
    } catch (err) {
        res.status(500).send("Driver add error");
    }
});

// 18. Admin Update Booking Status
app.post('/' + adminPath + '/update-booking-status', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    const { booking_id, status } = req.body;
    const allowedStatuses = ['pending', 'assigned', 'dispatched', 'on_the_way', 'arrived', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, booking_id]);
        await db.execute(
            'INSERT INTO status_history (booking_id, status, note) VALUES (?, ?, "Updated by admin")',
            [booking_id, status]
        );
        if (status === 'completed' || status === 'cancelled') {
            const [booking] = await db.execute('SELECT driver_id FROM bookings WHERE id = ?', [booking_id]);
            if (booking[0] && booking[0].driver_id) {
                await db.execute('UPDATE drivers SET status = "available" WHERE id = ?', [booking[0].driver_id]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 19. Admin Delete Driver
app.post('/' + adminPath + '/delete-driver', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    const { driver_id } = req.body;
    try {
        await db.execute('DELETE FROM drivers WHERE id = ?', [driver_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 20. Admin Add Blog
app.post('/' + adminPath + '/add-blog', async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/' + adminPath);
    const { title, content } = req.body;
    if (!title || title.trim().length < 3 || title.trim().length > 255) {
        return res.status(400).send("Title must be 3-255 characters");
    }
    if (!content || content.trim().length < 10) {
        return res.status(400).send("Content must be at least 10 characters");
    }
    try {
        await db.execute('INSERT INTO blogs (title, content) VALUES (?, ?)', [title.trim(), content.trim()]);
        res.redirect('/admin/dashboard');
    } catch (err) {
        res.status(500).send("Blog error");
    }
});

// 21. Admin Logout
app.get('/' + adminPath + '/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/' + adminPath);
});

// 22. API: Get all drivers
app.get('/api/drivers', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM drivers WHERE status = "available"');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding:80px 20px; font-family:system-ui;">
            <h1 style="font-size:4rem; margin:0;">404</h1>
            <p style="font-size:1.2rem; color:#666;">Page not found</p>
            <a href="/" style="color:#e74c3c; text-decoration:none; font-weight:600;">← Go Home</a>
        </div>
    `);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.listen(process.env.PORT || 3000, () => console.log("Server active on: http://localhost:" + (process.env.PORT || 3000)));
