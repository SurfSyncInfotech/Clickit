-- ============================================================
--  CLICKIT – single database file (MySQL 8)
--  Run once:   mysql -u root -p < database/clickit.sql
--  or:         npm --prefix backend run db:init
--  WARNING: drops and recreates the `clickit` database.
-- ============================================================
DROP DATABASE IF EXISTS clickit;
CREATE DATABASE clickit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clickit;

-- ---------- Super admin + sub users (Role / Mail id / Password / Menus / Permissions) ----------
CREATE TABLE admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(40)  NOT NULL DEFAULT 'Account Manager',   -- 'Superadmin' has full access
  menus         JSON NOT NULL,                                     -- e.g. ["dashboard","staff"]
  perms         JSON NOT NULL,                                     -- subset of view/approve/reject/edit
  cities        JSON NOT NULL,                                     -- ["*"] or ["Mumbai","Delhi"]
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Cities & service areas ----------
CREATE TABLE cities (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(80) NOT NULL UNIQUE,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  image   VARCHAR(255) NULL                 -- optional photo shown on the website
);
CREATE TABLE areas (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name    VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_city_area (city_id, name),
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- ---------- Services ----------
CREATE TABLE services (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  name   VARCHAR(100) NOT NULL,
  icon   VARCHAR(16)  NOT NULL DEFAULT 'broom',   -- icon key: broom, dishes, kitchen, bath, dust, fan, cook, laundry
  descr  VARCHAR(255) NOT NULL DEFAULT '',
  price  INT NOT NULL,                 -- INR for the base duration
  mins   INT NOT NULL,                 -- base duration in minutes
  active TINYINT(1) NOT NULL DEFAULT 1,
  image  VARCHAR(255) NULL                  -- optional photo shown on the website
);

-- ---------- Staff (registration -> super admin approves) ----------
CREATE TABLE staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  city          VARCHAR(80)  NOT NULL,
  area          VARCHAR(100) NOT NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  online        TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staff_city (city, status, online)
);

-- ---------- Customers ----------
CREATE TABLE customers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Bookings ----------
CREATE TABLE bookings (
  id            VARCHAR(12) PRIMARY KEY,
  customer_id   INT NOT NULL,
  staff_id      INT NULL,
  service_id    INT NOT NULL,
  service_name  VARCHAR(100) NOT NULL,     -- snapshot at booking time
  icon          VARCHAR(16)  NOT NULL,
  mins          INT NOT NULL,
  price         INT NOT NULL,
  city          VARCHAR(80)  NOT NULL,
  area          VARCHAR(100) NOT NULL,
  address       VARCHAR(500) NOT NULL,
  status        ENUM('requested','accepted','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
  delay_reason  VARCHAR(255) NULL,
  rated         TINYINT(1) NOT NULL DEFAULT 0,
  settled       TINYINT(1) NOT NULL DEFAULT 0,
  payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',   -- set by the customer after the job is completed
  payment_method ENUM('cash','upi') NULL,
  upi_ref       VARCHAR(40) NULL,
  paid_at       DATETIME NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at   DATETIME NULL,
  eta_mins      TINYINT NULL,                  -- arrival time promised by the Expert when accepting (10 or 15)
  started_at    DATETIME NULL,
  completed_at  DATETIME NULL,
  INDEX idx_b_city_status (city, status),
  INDEX idx_b_staff (staff_id),
  INDEX idx_b_customer (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (staff_id)    REFERENCES staff(id),
  FOREIGN KEY (service_id)  REFERENCES services(id)
);

-- staff who declined a request (so the popup is not shown to them again)
CREATE TABLE booking_declines (
  booking_id VARCHAR(12) NOT NULL,
  staff_id   INT NOT NULL,
  PRIMARY KEY (booking_id, staff_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id)   REFERENCES staff(id) ON DELETE CASCADE
);

-- ---------- Before / After photos ----------
CREATE TABLE booking_photos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(12) NOT NULL,
  kind       ENUM('before','after') NOT NULL,
  url        VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photo_booking (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ---------- Feedback ----------
CREATE TABLE feedback (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  VARCHAR(12) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  staff_id    INT NULL,
  rating      TINYINT NOT NULL,
  comment     VARCHAR(500) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (rating BETWEEN 1 AND 5),
  FOREIGN KEY (booking_id)  REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (staff_id)    REFERENCES staff(id)
);

-- ---------- Weekly settlements ----------
CREATE TABLE settlements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  staff_id   INT NOT NULL,
  jobs       INT NOT NULL,
  gross      INT NOT NULL,
  payout     INT NOT NULL,
  status     ENUM('pending','paid') NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);
CREATE TABLE settlement_bookings (
  settlement_id INT NOT NULL,
  booking_id    VARCHAR(12) NOT NULL,
  PRIMARY KEY (settlement_id, booking_id),
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id)    REFERENCES bookings(id)
);

-- ---------- Notifications (stored per user; admins share role-wide ones with recipient_id NULL) ----------
CREATE TABLE notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  role         ENUM('admin','staff','user') NOT NULL,
  recipient_id INT NULL,                 -- staff.id / customers.id; NULL = every admin
  type         VARCHAR(30) NOT NULL,     -- booking, payment, staff, feedback, settlement ...
  title        VARCHAR(120) NOT NULL,
  body         VARCHAR(255) NOT NULL DEFAULT '',
  ref          VARCHAR(40) NULL,         -- related booking id
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_n_recipient (role, recipient_id, is_read, created_at)
);

-- ---------- Settings ----------
CREATE TABLE settings (
  k VARCHAR(50) PRIMARY KEY,
  v VARCHAR(100) NOT NULL
);

-- ============================================================
--  SEED DATA   (one super admin: admin@clickit.com. Staff and customers are created by you or sign up themselves)
-- ============================================================
INSERT INTO settings (k, v) VALUES ('staff_share_percent', '70');

INSERT INTO admins (name, email, password_hash, role, menus, perms, cities) VALUES
('Super Admin', 'admin@clickit.com', '$2a$10$r/VqzAWFMpNfRiTTvru7TOUnhdOZh5K3KeRbiRUI01yCNbJ0SD7j.', 'Superadmin',
 '["dashboard","staff","customers","bookings","cities","services","settlements","feedback","users"]',
 '["view","approve","reject","edit"]', '["*"]');

INSERT INTO cities (name, enabled) VALUES
('Mumbai', 1), ('Delhi', 1), ('Bengaluru', 0), ('Pune', 0), ('Hyderabad', 0), ('Gurugram', 0);

INSERT INTO areas (city_id, name) VALUES
((SELECT id FROM cities WHERE name='Mumbai'), 'Andheri'), ((SELECT id FROM cities WHERE name='Mumbai'), 'Bandra'),
((SELECT id FROM cities WHERE name='Mumbai'), 'Powai'),   ((SELECT id FROM cities WHERE name='Mumbai'), 'Thane'),
((SELECT id FROM cities WHERE name='Delhi'), 'Dwarka'),   ((SELECT id FROM cities WHERE name='Delhi'), 'Saket'),
((SELECT id FROM cities WHERE name='Delhi'), 'Rohini'),   ((SELECT id FROM cities WHERE name='Delhi'), 'Noida'),
((SELECT id FROM cities WHERE name='Bengaluru'), 'Koramangala'), ((SELECT id FROM cities WHERE name='Bengaluru'), 'HSR Layout'),
((SELECT id FROM cities WHERE name='Pune'), 'Baner'), ((SELECT id FROM cities WHERE name='Pune'), 'Kothrud'),
((SELECT id FROM cities WHERE name='Hyderabad'), 'Gachibowli'), ((SELECT id FROM cities WHERE name='Gurugram'), 'DLF Phase 3');

INSERT INTO services (name, icon, descr, price, mins) VALUES
('House Cleaning', 'broom', 'Sweeping, mopping and general home cleaning', 149, 45),
('Utensils Cleaning', 'dishes', 'Dishwashing and kitchen utensil cleaning', 99, 30),
('Kitchen Cleaning', 'kitchen', 'Platform, sink, cabinets and kitchen floor', 199, 60),
('Bathroom Cleaning', 'bath', 'Floors, tiles, fittings, mirrors and toilet', 199, 60),
('Dusting & Wiping', 'dust', 'Dust and wipe furniture, shelves and surfaces', 129, 45),
('Fan Cleaning', 'fan', 'Ceiling and wall fan cleaning within safe reach', 129, 30),
('Cooking Help', 'cook', 'Prep, chopping and basic home cooking', 249, 60);
