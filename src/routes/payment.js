9// src/routes/payments.js
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
// src/routes/payments.js (continued)

router.post('/callback', (req, res) => {
    const callbackData = req.body.Body.stkCallback;
    
    // Log the full data for debugging
    console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));

    // 1. Check the Result Code
    const resultCode = callbackData.ResultCode;

    if (resultCode === 0) { // Success
        
        const metadata = callbackData.CallbackMetadata.Item;
        
        // Extract the key transaction details
        const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
        
        // 2. Update Database (YOUR CRITICAL STEP)
        // You would use the receiptNumber/CheckoutRequestID to find the pending 
        // transaction in your database and update its status to 'COMPLETED'.
        console.log(`SUCCESS: Transaction ${receiptNumber} for ${amount} from ${phoneNumber} completed.`);
        
    } else { // Failure (e.g., user cancelled, insufficient funds, wrong PIN)
        const resultDesc = callbackData.ResultDesc;
        console.log(`FAILED: ${resultDesc}`);

        // 3. Update Database (Update status to 'FAILED')
    }

    // IMPORTANT: Send a 200 OK response back to M-Pesa immediately
    // If you don't, M-Pesa might keep retrying the callback.
    res.status(200).send('Callback received successfully.');
});

module.exports = router;
