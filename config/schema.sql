USE tow_db;

CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    truck_type ENUM('standard', 'flatbed', 'accident_recovery') DEFAULT 'standard',
    truck_number VARCHAR(50) NOT NULL,
    status ENUM('available', 'on_trip', 'offline') DEFAULT 'available',
    location_lat DECIMAL(10, 8) DEFAULT 33.6844,
    location_lng DECIMAL(11, 8) DEFAULT 73.0479,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_lat DECIMAL(10, 8) DEFAULT NULL,
    pickup_lng DECIMAL(11, 8) DEFAULT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    dropoff_lat DECIMAL(10, 8) DEFAULT NULL,
    dropoff_lng DECIMAL(11, 8) DEFAULT NULL,
    service_type VARCHAR(50) NOT NULL,
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('pending', 'assigned', 'dispatched', 'on_the_way', 'arrived', 'completed', 'cancelled') DEFAULT 'pending',
    driver_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    location_lat DECIMAL(10, 8) DEFAULT NULL,
    location_lng DECIMAL(11, 8) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO admins (username, password) VALUES ('admin', 'admin123');

CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO drivers (name, phone, truck_type, truck_number, status) VALUES
('Ahmed Khan', '03001234567', 'flatbed', 'TK-1234', 'available'),
('Hassan Ali', '03009876543', 'standard', 'TK-5678', 'available'),
('Usman Malik', '03005551234', 'accident_recovery', 'TK-9012', 'available'),
('Bilal Shah', '03007778888', 'flatbed', 'TK-3456', 'available');
