require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get the key from .env
const apiKey = process.env.GEMINI_API_KEY;

async function debugModels() {
    console.log("--- 🔍 DIAGNOSTIC MODE: Checking API Key & Models ---");

    if (!apiKey) {
        console.error("❌ Error: GEMINI_API_KEY is missing from .env file.");
        return;
    }

    console.log("1. API Key found. Attempting to list all available models for this key...");

    try {
        // We use a direct fetch to ask Google "What models are allowed for this key?"
        // This avoids any library confusion.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("\n❌ API Error:", data.error.message);
            return;
        }

        if (!data.models) {
            console.error("\n❌ No models found. This is unusual.");
            return;
        }

        console.log("\n✅ SUCCESS! Here are the models your key can access:");
        console.log("---------------------------------------------------");
        
        // Filter for "generateContent" models (the ones we need for chatbots)
        const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        if (chatModels.length === 0) {
            console.warn("⚠️ No Chat/Text models found. You might only have vision/embedding access?");
        }

        chatModels.forEach(m => {
            // Clean up the name (remove 'models/' prefix if preferred, but keeping it is safer)
            console.log(`Model Name: ${m.name}`);
            console.log(`   -> Description: ${m.description.substring(0, 60)}...`);
            console.log(`   -> Use in server.js: const model = genAI.getGenerativeModel({ model: "${m.name.replace('models/', '')}" });`);
            console.log("");
        });

        console.log("---------------------------------------------------");
        console.log("👉 ACTION: Copy one of the names above (like 'gemini-1.5-flash-001')");
        console.log("   and paste it into your server.js file at line 21.");

    } catch (error) {
        console.error("\n❌ Network/System Error:", error.message);
    }
}

debugModels();