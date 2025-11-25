
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

export const generateShipDesign = async (color: string, shape: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    let description = "";
    // Map shapes to Star Wars archetypes
    if (shape === 'X-VANGUARD') {
      description = "Star Wars X-Wing starfighter style, with S-foils locked in attack position (x-shape wings), 4 engine thrusters";
    } else if (shape === 'A-VELOCITY') {
      description = "Star Wars A-Wing interceptor style, sleek sharp wedge shape, dual rear engines, aerodynamic";
    } else if (shape === 'Y-FORTRESS') {
      description = "Star Wars Y-Wing bomber style, distinct wishbone shape, heavy mechanical plating, long engine nacelles";
    } else {
      description = "futuristic spaceship";
    }

    const prompt = `A top-down view of a single ${description}, main color: ${color}. Highly detailed mechanical texture, realistic cinematic lighting, 4k, completely isolated on a pure solid black background. The ship must point upwards.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", 
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const generateAsteroidAsset = async (type: string, description: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    const prompt = `A single, highly detailed ${description} floating in space. Realistic texture, cinematic lighting, completely isolated on a pure solid black background. No other objects.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", 
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Gemini Asteroid Gen Error (${type}):`, error);
    return null;
  }
};
