import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY || '';
// We instantiate purely to check if key exists, actual calls will use a safe instance
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMissionBriefing = async (): Promise<string> => {
  if (!ai) return "OFFLINE: API Key missing. Proceed with caution.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, cool-sounding mission operation name and a 1-sentence objective for a space dodging run.",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 60,
      }
    });
    return response.text || "Mission: Survive the asteroid belt.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection lost. Manual override engaged.";
  }
};

export const generateCrashReport = async (score: number, duration: number): Promise<string> => {
  if (!ai) return "Hull critical. Life support failing.";

  try {
    const prompt = `The pilot survived for ${duration.toFixed(1)} seconds and scored ${score} points before crashing into an asteroid. Provide a post-mortem analysis or a sarcastic comment about their piloting skills.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 60,
      }
    });
    return response.text || "Critical failure. Pilot error detected.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Black box data corrupted.";
  }
};