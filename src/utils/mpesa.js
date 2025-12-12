// src/utils/mpesa.js
const axios = require('axios');

// Helper function to format the timestamp: YYYYMMDDHHmmss
const generateTimestamp = () => {
    // ... (logic from search results)
    const now = new Date();
    // ... (format into required string)
    return `${now.getFullYear()}...`; 
};

// 1. Function to get the Access Token
exports.getAccessToken = async () => {
    const auth = Buffer.from(
        `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
    ).toString('base64');

    const url = process.env.TOKEN_URL; // M-Pesa Token URL

    const response = await axios.get(url, {
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });
    return response.data.access_token;
};

// 2. Function to generate the STK Push Password
exports.generatePassword = () => {
    const timestamp = generateTimestamp();
    const passwordString = 
        `${process.env.BUSINESS_SHORT_CODE}${process.env.PASS_KEY}${timestamp}`;
    
    // Base64 encode the string
    const password = Buffer.from(passwordString).toString('base64');
    
    return { password, timestamp };
};
