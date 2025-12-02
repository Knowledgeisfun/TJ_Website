require('dotenv').config(); // Load API keys from .env file
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // IMPORT EMAILER
const { GoogleGenerativeAI } = require("@google/generative-ai"); // IMPORT GEMINI AI

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---

// 1. Configure Gemini AI
// UPDATED: Using 'gemini-2.0-flash' based on your diagnostic test
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

// 2. Configure Gmail Transporter
// Note: You must use an "App Password" for Gmail, not your login password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
});

// --- API ROUTES ---

// 1. SMART Contact Form (Saves to File + Sends Email)
app.post('/api/contact', async (req, res) => {
    const { fullName, email, serviceType, message } = req.body;
    
    const newInquiry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        fullName,
        email,
        serviceType,
        message
    };

    // A. Send Email Notification
    const mailOptions = {
        from: process.env.EMAIL_USER,
        // MODIFIED: Send to multiple people by separating with a comma
        // Replace 'partner@example.com' with the actual second email address
        to: `${process.env.EMAIL_USER}, productionstj50@gmail.com`, 
        subject: `New Lead: ${fullName} (${serviceType})`,
        text: `You have a new inquiry!\n\nName: ${fullName}\nEmail: ${email}\nService: ${serviceType}\nMessage: ${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('--- EMAIL SENT SUCCESSFULLY ---');
    } catch (error) {
        console.error('Error sending email:', error);
    }

    // B. Save to File (Backup)
    const filePath = path.join(__dirname, 'inquiries.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        let inquiries = [];
        if (!err && data) {
            try { inquiries = JSON.parse(data); } catch (e) {}
        }
        inquiries.push(newInquiry);
        fs.writeFile(filePath, JSON.stringify(inquiries, null, 2), (err) => {
            if (err) res.status(500).json({ success: false, message: 'Server Error' });
            else res.status(200).json({ success: true, message: 'Inquiry received! We will contact you soon.' });
        });
    });
});

// 2. SMART Chatbot (Powered by Gemini)
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message || "";
    console.log(`User asked: ${userMessage}`);

    try {
        // Updated Persona based on your Instagram Profile
        const prompt = `
            You are the friendly and professional AI assistant for "TJ Productions", a creative agency owned by Tomin James (@tomin_james_).
            
            Key Details:
            - Locations: Bangalore and Wayanad.
            - Expertise: Jewellery and Lifestyle Photography, Cinematic Videography, Animation.
            - Brand Vibe: "Movie" aesthetic, high-end, expert quality.
            
            User asked: "${userMessage}"
            
            Answer the user briefly, professionally, and creatively as TJ Productions.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const botReply = response.text();

        res.json({ reply: botReply });

    } catch (error) {
        console.error("Gemini Error:", error);
        // Fallback if AI fails
        res.json({ reply: "I'm having trouble connecting to my creative brain right now. Please DM us on Instagram @tj_productions__ or email us directly!" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});