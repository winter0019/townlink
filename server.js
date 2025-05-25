// server/server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const db = require('./db'); // SQLite connection (using sqlite3 package)

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
    // IMPORTANT: Make sure this list includes the EXACT origin your frontend is running on.
    // For Live Server, it's often 5500, but can be a random port like 49770.
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:49770'],
    credentials: true // Important if you were using cookies/sessions, good practice for consistency
}));
app.use(express.json());

// ===== ROUTES =====

// 1. Get All Businesses (Publicly accessible, all are considered approved now)
app.get('/api/businesses', (req, res) => {
    // With no authentication and auto-approval, all businesses are listed
    db.all("SELECT * FROM businesses ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching businesses:', err.message);
            return res.status(500).json({ message: 'Error fetching businesses.' });
        }
        res.json(rows);
    });
});

// 2. Get Single Business by ID (Publicly accessible)
app.get('/api/businesses/:id', (req, res) => {
    db.get("SELECT * FROM businesses WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            console.error('Error fetching business by ID:', err.message);
            return res.status(500).json({ message: 'Error fetching business.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Business not found.' });
        }
        res.json(row);
    });
});

// 3. Add a New Business (No authentication required, now auto-approved)
app.post('/api/businesses', (req, res) => {
    console.log('>>> POST /api/businesses route hit (no auth)');
    console.log('Request body:', req.body);

    const { name, category, location, description, phone, email, website, hours, image, latitude, longitude } = req.body;

    if (!name || !category || !location || !description) {
        console.error('SERVER-SIDE: Missing required fields for new business (Name, Category, Location, Description).');
        return res.status(400).json({ message: 'Required business fields are missing.' });
    }

    // Set created_at to current timestamp (SQLite friendly)
    const created_at = new Date().toISOString(); // ISO format for easy storage

    db.run(
        `INSERT INTO businesses (name, category, location, description, phone, email, website, hours, image, latitude, longitude, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Removed 'approved' column here, as it's implied true if added
        [name, category, location, description, phone, email, website, hours, image, latitude, longitude, created_at],
        function (err) {
            if (err) {
                console.error('SERVER-SIDE ERROR ADDING BUSINESS (Database query failed):', err.message);
                return res.status(500).json({ message: 'Error adding business on the server.' });
            }
            res.status(201).json({ message: 'Business added successfully and is now live!', businessId: this.lastID });
        }
    );
});

// 4. Delete a Business (Admin Key required in body for simplicity)
//    NOTE: This is a placeholder for admin deletion. In a real app,
//    you'd have a dedicated admin panel with proper login.
const ADMIN_KEY = process.env.ADMIN_KEY || 'supersecretadminkey'; // Use env var for security

app.delete('/api/businesses/:id', (req, res) => {
    const { id } = req.params;
    const { adminKey } = req.body; // Expect admin key in body

    if (adminKey !== ADMIN_KEY) {
        console.warn('Unauthorized delete attempt with invalid admin key.');
        return res.status(403).json({ message: 'Unauthorized: Invalid admin key for deletion.' });
    }

    db.run("DELETE FROM businesses WHERE id = ?", [id], function (err) {
        if (err) {
            console.error('Error deleting business:', err.message);
            return res.status(500).json({ message: 'Error deleting business.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Business not found.' });
        }
        res.json({ message: 'Business deleted successfully!' });
    });
});


// 5. Get Reviews for a Business (Publicly accessible)
app.get('/api/reviews/:businessId', (req, res) => {
    db.all("SELECT * FROM reviews WHERE business_id = ? ORDER BY created_at DESC", [req.params.businessId], (err, rows) => {
        if (err) {
            console.error('Error fetching reviews:', err.message);
            return res.status(500).json({ message: 'Error fetching reviews.' });
        }
        res.json(rows);
    });
});

// 6. Add a New Review (No authentication required)
app.post('/api/reviews', (req, res) => {
    const { businessId, reviewerName, text, rating } = req.body;
    // Use ISO string for created_at to be consistent and sortable
    const created_at = new Date().toISOString();

    if (!businessId || !reviewerName || !text || !rating) {
        return res.status(400).json({ message: 'All review fields are required.' });
    }

    db.run(
        `INSERT INTO reviews (business_id, reviewer_name, text, rating, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [businessId, reviewerName, text, rating, created_at],
        function (err) {
            if (err) {
                console.error('Error adding review:', err.message);
                return res.status(500).json({ message: 'Error adding review.' });
            }

            // Recalculate average rating for the business
            db.all("SELECT rating FROM reviews WHERE business_id = ?", [businessId], (err, reviews) => {
                if (!err && reviews.length > 0) {
                    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                    const averageRating = totalRating / reviews.length;
                    db.run("UPDATE businesses SET rating = ? WHERE id = ?", [averageRating, businessId], (updateErr) => {
                        if (updateErr) console.error('Error updating business rating:', updateErr.message);
                    });
                }
            });

            res.status(201).json({ message: 'Review added successfully!', reviewId: this.lastID });
        }
    );
});


// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📡 API accessible at http://localhost:${PORT}/api/...`);
    console.log(`Admin Key in use: ${ADMIN_KEY}`);

    // --- TEMPORARY DATABASE CONNECTION TEST ---
    // (This block can be removed once you confirm connection and schema)
    db.get('SELECT 1 + 1 AS solution', (err, row) => {
        if (err) {
            console.error('*** DATABASE CONNECTION FAILED! ***', err.message);
            console.error('Please ensure your SQLite database file exists and is accessible.');
        } else {
            console.log('*** DATABASE CONNECTION SUCCESSFUL! *** Solution:', row.solution);
        }
    });
    // --- END TEMPORARY DATABASE CONNECTION TEST ---
});