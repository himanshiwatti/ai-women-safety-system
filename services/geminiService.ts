
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize AI only if key exists, otherwise we handle it gracefully in the UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getSafetyAdvice = async (context: string): Promise<string> => {
  if (!ai) return "AI Offline: Ensure API Key is configured.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a safety expert AI for the 'Guardian Eye' app. 
      Provide brief, actionable safety advice for this situation: ${context}.
      Keep it under 50 words. Be direct and empowering.`,
    });
    return response.text || "Stay alert and proceed with caution.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Network error. Trust your instincts and move to a safe zone.";
  }
};

export const analyzeRisk = async (factors: string[]): Promise<{ riskLevel: string; advice: string }> => {
  if (!ai) return { riskLevel: "UNKNOWN", advice: "Offline mode. Stay vigilant." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze risk based on these factors: ${factors.join(', ')}. 
      Return valid JSON only in this format: { "riskLevel": "LOW" | "MEDIUM" | "HIGH", "advice": "string" }.`,
      config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Gemini Risk Analysis Error:", error);
    return { riskLevel: "HIGH", advice: "System alert. Treat situation as high risk." };
  }
};

export const chatWithGuardian = async (history: ChatMessage[], newMessage: string): Promise<string> => {
    if (!ai) return "I am currently offline. Please dial emergency services if you are in danger.";

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are Guardian Eye AI, a helpful, calm, and supportive safety assistant. Provide concise safety tips, laws, or emotional support. If the user seems in immediate danger, tell them to press the SOS button immediately."
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "...";
    } catch (e) {
        return "Connection unstable. Stay safe.";
    }
}

export const analyzeImagePrivacy = async (imageDesc: string): Promise<{ isSafe: boolean; warning: string }> => {
    if (!ai) return { isSafe: true, warning: "AI Offline. Check manually." };

    try {
        // In a real scenario, we would send the image bytes. 
        // For this text-based demo integration, we simulate the check.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze privacy risk for an image containing: ${imageDesc}. 
            Return JSON: { "isSafe": boolean, "warning": "string" }. 
            Flag credit cards, ID documents, nudity, or home addresses as unsafe.`,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text;
        if (text) return JSON.parse(text);
        return { isSafe: true, warning: "Analysis Complete" };
    } catch (e) {
        return { isSafe: false, warning: "Could not verify safety." };
    }
}
