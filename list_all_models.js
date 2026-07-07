
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCfzEDfIjSredB9JtJ42zJR9yrgN_VEPRI";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // Cannot directly access listModels via genAI instance in all versions?
        // It's usually a static method or on an admin client.
        // BUT the REST API is simple.

        // Let's use REST to be sure we see everything.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Found models:");
            data.models.forEach(m => {
                console.log(`- ${m.name}`);
                console.log(`  Supported: ${m.supportedGenerationMethods}`);
            });
        } else {
            console.log("No models found in response:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
