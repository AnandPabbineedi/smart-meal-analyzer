// gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function Gemini(description, base64Image) {
  // const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


  const parts = [];
  if (description) parts.push({ text: `This is what I ate: ${description}` });
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg", // adjust if PNG
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

  const result = await model.generateContent({
    contents: [{ role: "user", parts: prompt }],
  });

  const text = result.response.text();
  const match = text.match(/```json\n(.*?)```/s);
  if (match) {
    return JSON.parse(match[1]);
  } else {
    return { recipe: "Could not parse response", nutrition: {} };
  }
}
