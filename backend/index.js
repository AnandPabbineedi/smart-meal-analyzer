import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload
const upload = multer({ dest: 'uploads/' });

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const modelText = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const modelVision = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Analyze Food API Endpoint->>>
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const imageFile = req.file;
    let result;

    if (imageFile) {
      const imageData = fs.readFileSync(imageFile.path);
      const base64Image = imageData.toString('base64');
      const prompt = `
        You are a nutrition expert. Analyze the following meal and return a response in the exact JSON format below.

        Meal: ${imageData}

        Format:
        {
          "foodName": "Food Name",
          "calories": "in kcal per serving",
          "protein": "in grams",
          "carbs": "in grams",
          "fat": "in grams",
          "healthScore": "out of 100",
          "scoreReason": "max 2 lines",
          "suggestions": ["1-liner tip", "2nd tip", "3rd tip (optional)"],
          "goalTips": {
            "weightLoss": "1-liner tip",
            "muscleGain": "1-liner tip",
            "generalHealth": "1-liner tip"
          }
        }

        Only give the JSON. No extra comments or explanations.
        `;

      const response = await modelVision.generateContent([
        { text: prompt },
        { inlineData: { mimeType: imageFile.mimetype, data: base64Image } },
      ]);

      result = response.response.text();
      fs.unlinkSync(imageFile.path); // cleanup of image uploaded
    } else if (text) {
      const prompt = `Analyze this meal: "${text}". Give nutritional info (calories, protein, carbs, fat), health score out of 100, and suggestions to improve.`;
      
      const userPrompt = `
        You are a nutrition expert. Analyze the following meal and return a response in the exact JSON format below.

        Meal: ${text}

        Format:
        {
          "foodName": "Food Name",
          "calories": "in kcal per serving",
          "protein": "in grams",
          "carbs": "in grams",
          "fat": "in grams",
          "healthScore": "out of 100",
          "scoreReason": "max 2 lines",
          "suggestions": ["1-liner tip", "2nd tip", "3rd tip (optional)"],
          "goalTips": {
            "weightLoss": "1-liner tip",
            "muscleGain": "1-liner tip",
            "generalHealth": "1-liner tip"
          }
        }

        Only give the JSON. No extra comments or explanations.
        `;


      const response = await modelText.generateContent(userPrompt);
      result = response.response.text();
    } else {
      return res.status(400).json({ error: "No image or text provided." });
    }

    console.log("full Result from AI:>> ", result);

    const extractInfo = (text) => {
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
    
        const data = JSON.parse(jsonText);
    
        return {
          food_name: data.foodName, 
          calories: data.calories || "N/A kcal",
          protein: data.protein || "N/A g",
          carbs: data.carbs || "N/A g",
          fat: data.fat || "N/A g",
          score: data.healthScore ? `${data.healthScore}/100` : "N/A",
          suggestions: data.suggestions || [],
          goalTips: data.goalTips || {},
          scoreReason: data.scoreReason || "",
        };
      } catch (err) {
        console.error("❌ JSON parsing failed:", err);
        return {
          food_name: "Unknown Meal",
          calories: "N/A kcal",
          protein: "N/A g",
          carbs: "N/A g",
          fat: "N/A g",
          score: "N/A",
          suggestions: [],
        };
      }
    };
    
    

    const parsed = extractInfo(result);

    console.log("Parsed response after refining in extractInfo function: ", parsed);
    
    res.json(parsed);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to analyze input." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
