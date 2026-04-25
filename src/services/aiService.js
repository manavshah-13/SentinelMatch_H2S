import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const TRIAGE_SYSTEM_PROMPT = `
You are an Emergency Dispatch Intelligence (EDI). Your sole purpose is to parse unstructured distress messages into structured JSON for a rescue coordination system.

Instructions:
1. Categorize: Assign exactly one category: [Medical, Fire, Logistics, Security, Infrastructure].
2. Prioritize: Assign an Urgency Score (1-5). 5 = Immediate life threat; 1 = Informational/Non-urgent.
3. Skill Tagging: Identify 1-3 specific skills required (e.g., First Aid, Heavy Lifting, Electrical, Navigation).
4. Summarize: Create a concise 10-word summary of the situation.
5. Output Format: You must ONLY return a valid JSON object. No prose. No markdown blocks.

JSON Schema:
{
  "category": string,
  "urgency": integer,
  "skills": [string],
  "summary": string,
  "sentiment": "Critical" | "Stable"
}
`;

const VERIFICATION_SYSTEM_PROMPT = `
You are the SentinelMatch Task Verifier. Analyze this photo of the completed task. 
Does it show that the [Original Need] has been addressed? 
Return a confidence score (0-1) and a boolean verified status.

JSON Schema:
{
  "verified": boolean,
  "confidence": number,
  "reason": string,
  "impactPoints": number (0-100)
}
`;

export const triageRequest = async (userInput, location = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const locationContext = location ? `\n[Grounding Data: Victim is at Lat ${location.lat}, Lng ${location.lng}]` : "";
    const prompt = `${TRIAGE_SYSTEM_PROMPT}\n\nUser Message: "${userInput}"${locationContext}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON response if necessary
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Triage Error:", error);
    throw error;
  }
};

export const verifyTaskCompletion = async (imageUri, originalReq) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Convert base64 image to GenerativePart
    const base64Data = imageUri.split(",")[1];
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const prompt = `${VERIFICATION_SYSTEM_PROMPT}\n\nOriginal Request Description: "${originalReq}"`;
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Verification Error:", error);
    throw error;
  }
};

export const getProximitySuggestions = async (userLocation, missions) => {
  // Simple proximity logic for now, could be enhanced with Gemini Maps grounding
  // userLocation: { lat, lng }
  // missions: Array of { location: { lat, lng }, category, summary }
  
  const calculateDistance = (l1, l2) => {
    const R = 6371; // km
    const dLat = (l2.lat - l1.lat) * Math.PI / 180;
    const dLng = (l2.lng - l1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(l1.lat * Math.PI / 180) * Math.cos(l2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return missions
    .map(m => ({ ...m, distance: calculateDistance(userLocation, m.location) }))
    .sort((a, b) => a.distance - b.distance);
};
