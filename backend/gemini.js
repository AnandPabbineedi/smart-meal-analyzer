// gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithDynamicFallback } from "./modelManager.js";

const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default async function Gemini(description, base64Image) {
  const parts = [];
  if (description) parts.push({ text: `This is what I ate: ${description}` });
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image,
      },
    });
  }

  const prompt = [
    ...parts,
    {
      text: `Based on this, give a short healthy recipe and estimate the nutrition in a friendly tone. Return it in JSON format like this:
{
  "recipe": "text",
  "nutrition": {
    "calories": "x kcal",
    "protein": "x g",
    "carbs": "x g",
    "fat": "x g"
  }
}`,
    },
  ];

  const { text } = await generateContentWithDynamicFallback({
    genAI,
    apiKey,
    parts: [{ role: "user", parts: prompt }],
    preferredModel: process.env.GEMINI_MODEL || "gemini-1.5-flash-8b",
  });

  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      // fall through
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return { recipe: "Could not parse response", nutrition: {} };
  }
}
