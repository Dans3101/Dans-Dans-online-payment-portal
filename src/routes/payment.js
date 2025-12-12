// src/routes/payments.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getAccessToken, generatePassword } = require('../utils/mpesa');

router.post('/stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        
        // 1. Generate Security Credentials
        const accessToken = await getAccessToken();
        const { password, timestamp } = generatePassword();

        // 2. Construct the M-Pesa API Payload
        const stkPushPayload = {
            BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber, 
            PartyB: process.env.BUSINESS_SHORT_CODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.CALLBACK_URL, // Crucial: Your secure public URL
            AccountReference: 'BillPayment-' + Date.now(),
            TransactionDesc: 'Bill Payment',
        };

        // 3. Send the Request to Daraja
        const response = await axios.post(process.env.STK_PUSH_URL, stkPushPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // 4. Return initial response to user (shows success of request, NOT of payment)
        return res.status(200).json({
            message: 'STK Push initiated successfully. Please enter your PIN on your phone.',
            data: response.data,
        });

    } catch (error) {
        // Handle errors (e.g., failed to get token, invalid phone number)
        console.error('STK Push Error:', error.message);
        res.status(500).json({ error: 'Failed to process payment request.' });
    }
});
