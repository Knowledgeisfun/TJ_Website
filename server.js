require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- FIREBASE SETUP ---
const admin = require('firebase-admin');

// We construct the credentials object from .env variables
// This prevents having to upload the actual JSON key file
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // precise fix for newline characters in private key string
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- DEBUGGING LOG ---
console.log("\n========================================");
console.log("   🚀 SERVER STARTED: CONNECTED TO FIREBASE, MEMORY CLEANED");
console.log("========================================\n");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. The Brain (Persona)
const SYSTEM_INSTRUCTION = `
    ROLE: AI Business Manager for "TJ Productions" (Tomin James).
    
    KNOWLEDGE BASE:
    - Locations: Bangalore & Wayanad.
    - Owner: Tomin James (@tomin_james_).
    - Services: Jewellery Photography, Lifestyle, Cinematic Wedding Films, 3D Product Animation.
    - Contact: productionstj50@gmail.com
    
    BEHAVIOR:
    - Tone: Professional, warm, creative.
    - Memory: You MUST remember the user's name and details from previous messages in this conversation.
    - Pricing: Never give fixed prices. Ask for details to give a custom quote.
    
    AUTO-FILL PROTOCOL (CRITICAL):
    1. Gather the user's **Name**, **Service**, and **Project Details**.
    2. Once you have these, ask: "Shall I draft an inquiry for you?"
    3. If they agree, simply say "I have drafted the inquiry below for you." and then output the hidden data.
    
    * JSON Rules:
      - Format: ^^^JSON{"fullName": "User Name", "serviceType": "Videography", "message": "The draft message text"}^^^
      - "serviceType" must be one of: "Jewellery Photography", "Lifestyle Shoot", "Videography", "Animation".
      - "message" should be the draft text.
      - SILENCE RULE: NEVER mention "JSON" or "hidden data".
`;

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
}); 

// 2. User Session Storage
// This Map stores history based on a unique Session ID, not IP.
const userSessions = new Map();

// --- EMAIL DEBUGGING & SETUP ---
const activeHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const activePort = process.env.SMTP_PORT || 2525;
const activeUser = process.env.EMAIL_USER || 'Not Set';

console.log("\n========================================");
console.log(`   🚀 EMAIL SYSTEM CONFIGURATION`);
console.log(`   -----------------------------`);
console.log(`   ► HOST: ${activeHost}`);
console.log(`   ► PORT: ${activePort}`);
console.log(`   ► USER: ${activeUser}`);
console.log("========================================\n");

const transporter = nodemailer.createTransport({
    host: activeHost,
    port: activePort,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    // FIX: Force IPv4 to prevent timeouts on Render/AWS
    family: 4, 
    connectionTimeout: 10000 
});

// Verify email connection on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ CONNECTION TEST FAILED:");
        console.error(error);
        if (activeHost.includes('gmail')) {
            console.error("⚠️  CRITICAL: You are still trying to connect to GMAIL. Render blocks this.");
            console.error("👉 ACTION: Go to Render Dashboard -> Environment -> Delete SMTP_HOST if it exists, or set it to 'smtp-relay.brevo.com'");
        }
    } else {
        console.log("✅ Email Server is Ready (" + activeHost + ")");
    }
});

// --- API ROUTES ---

app.get('/ping', (req, res) => {
    res.send('TJ Productions Server is Online (Firebase Active)!');
});

// 1. Contact Form (Saves to Firebase Firestore)
app.post('/api/contact', async (req, res) => {
    const { fullName, email, serviceType, message } = req.body;
    
    const newInquiry = {
        fullName,
        email,
        serviceType,
        message,
        date: new Date().toISOString(), // Use ISO string for database
        timestamp: admin.firestore.FieldValue.serverTimestamp() // Database server time
    };

    try {
        // A. Save to Firebase
        // We create a collection called 'inquiries' and add the new document
        await db.collection('inquiries').add(newInquiry);
        console.log('--- SAVED TO FIREBASE ---');

        // B. Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${process.env.EMAIL_USER}, productionstj50@gmail.com`, 
            subject: `New Lead: ${fullName} (${serviceType})`,
            text: `You have a new inquiry!\n\nName: ${fullName}\nEmail: ${email}\nService: ${serviceType}\nMessage: ${message}`
        };

        // Send email asynchronously
        transporter.sendMail(mailOptions).catch(err => console.error("Email Error:", err));

        res.status(200).json({ success: true, message: 'Inquiry received and safely stored!' });

    } catch (error) {
        console.error('Firebase/Server Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 2. Chatbot Route (Now using Unique Session IDs)
app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body; // Extract session ID sent by frontend
    const userMessage = message || "";
    
    // Use the Session ID if available, otherwise fall back to IP (for safety)
    const distinctId = sessionId || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    console.log(`User (${distinctId}): ${userMessage}`);

    try {
        // 1. Retrieve or Initialize History for THIS specific session
        if (!userSessions.has(distinctId)) {
            userSessions.set(distinctId, []);
        }
        let history = userSessions.get(distinctId);

        // 2. Start Chat with User's specific history
        const chatSession = model.startChat({
            history: history,
        });

        const result = await chatSession.sendMessage(userMessage);
        const response = await result.response;
        const botReply = response.text();

        // 3. Update User's History
        history.push({ role: "user", parts: [{ text: userMessage }] });
        history.push({ role: "model", parts: [{ text: botReply }] });
        
        // Save back to the map
        userSessions.set(distinctId, history);

        res.json({ reply: botReply });

    } catch (error) {
        console.error("Gemini Error:", error);
        // If error, maybe clear just that user's session
        userSessions.delete(distinctId);
        res.json({ reply: "I had a momentary glitch. Please tell me that last part again?" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});