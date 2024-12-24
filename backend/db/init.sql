-- Create users table if it doesn't exist
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    is_google_signup BOOLEAN DEFAULT false,
    google_id VARCHAR(255),
    profile_completed BOOLEAN DEFAULT false,
    additional_details JSONB,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    subscription_status VARCHAR(50) DEFAULT 'FREE',
    subscription_plan VARCHAR(50),
    subscription_end_date TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user if not exists (password: admin123)
INSERT INTO users (name, email, password, role, profile_completed)
SELECT 'Admin User', 'admin@verve.com', '$2a$10$rYTJgUHx0FQqXi1z6j3.7OHJ0IDqgqmk8Y3r8nX7LzFZPZo0QsL8W', 'ADMIN', true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@verve.com'
);
