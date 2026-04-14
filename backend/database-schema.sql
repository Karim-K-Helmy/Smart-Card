CREATE TABLE Categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    whatsapp_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    account_type ENUM('STAR','PRO') NOT NULL,
    profile_slug VARCHAR(100) NOT NULL UNIQUE,
    profile_image VARCHAR(255),
    bio TEXT,
    status ENUM('active','pending','frozen','deleted') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE PersonalProfiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    job_title VARCHAR(100),
    about_text TEXT,
    birth_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE BusinessProfiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    business_name VARCHAR(100),
    logo VARCHAR(255),
    business_description TEXT,
    address VARCHAR(255),
    category_id INT,
    promo_box_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL
);

CREATE TABLE Products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0.00,
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL
);

CREATE TABLE SocialLinks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE CardPlans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    features TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration_days INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CardOrders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    card_plan_id INT NOT NULL,
    order_status ENUM('pending','waiting_payment','under_review','approved','rejected') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_plan_id) REFERENCES CardPlans(id) ON DELETE RESTRICT
);

CREATE TABLE PaymentMethods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    method_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    account_name VARCHAR(100),
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PaymentReceipts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    card_order_id INT NOT NULL,
    user_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    transferred_amount DECIMAL(10,2) NOT NULL,
    transfer_date DATETIME,
    receipt_image VARCHAR(255) NOT NULL,
    note TEXT,
    review_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by_admin_id INT,
    review_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_order_id) REFERENCES CardOrders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES PaymentMethods(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES Admins(id) ON DELETE SET NULL
);

CREATE TABLE Cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    card_order_id INT NOT NULL,
    card_code VARCHAR(100) NOT NULL UNIQUE,
    qr_code_image VARCHAR(255),
    qr_code_value VARCHAR(255),
    short_link VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT FALSE,
    activated_at DATETIME,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_order_id) REFERENCES CardOrders(id) ON DELETE CASCADE
);

CREATE TABLE AdminActions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    user_id INT,
    action_type ENUM('freeze','unfreeze','edit','delete','approve_payment','reject_payment') NOT NULL,
    target_table VARCHAR(50),
    target_id INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Admins(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
