
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeEntry = async (content: string): Promise<AIInsight | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following journal entry and provide empathetic insights. Content: "${content}"`,
      config: {
        systemInstruction: "You are an empathetic, insightful journal assistant. Your goal is to help users reflect on their day. Extract themes, estimate mood, and provide a gentle suggestion for growth or mindfulness.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moodSummary: { type: Type.STRING, description: "A brief summary of the user's emotional state." },
            keyThemes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Main topics or feelings identified in the text."
            },
            suggestions: { type: Type.STRING, description: "A mindful reflection prompt or encouraging tip." },
            sentimentScore: { type: Type.NUMBER, description: "A score from 1 (very negative) to 10 (very positive)." }
          },
          required: ["moodSummary", "keyThemes", "suggestions", "sentimentScore"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const result = JSON.parse(text);
      if (!result.moodSummary) return null; // Basic validation
      return result as AIInsight;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e);
      return null;
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};
