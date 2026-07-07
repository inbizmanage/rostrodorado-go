
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCe1FWHh9mji0Z6KHruqAduTcd9u_Suv-g";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // For listing models we might not strictly need getGenerativeModel, 
        // but the SDK structure usually exposes a model manager or similar?
        // Actually in the node SDK, it is not directly off genAI. 
        // Wait, the error message 'Call ListModels' suggests looking at documentation or using curl.
        // The SDK might not have a simple listModels helper directly on the instance in all versions.
        // Let's rely on a known model that usually works if list fails: 'gemini-1.5-flash'
        // But let's try to query a standard model to verify the key works at all.

        // Actually, checking documentation (mental model): genAI.getGenerativeModel is the factory.
        // There isn't always a listModels method in the high-level client for the browser/node unified SDK.
        // Use REST API via fetch for listing models.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Verified Gemini Models:");
            data.models
                .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
                .forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
