// server.js
const express = require('express');
const dotenv = require('dotenv');
const paymentsRouter = require('./src/routes/payments'); // Import your router

dotenv.config(); // Load variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON requests (required for the M-Pesa Callback)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Payment Routes
app.use('/api/v1/payments', paymentsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
