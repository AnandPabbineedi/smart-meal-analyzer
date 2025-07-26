// src/components/ResultCard.jsx

import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Lightbulb, Target, Brain } from "lucide-react";

const ResultCard = ({ result }) => {
  if (!result) return null;

  const {
    food_name,
    calories,
    protein,
    carbs,
    fat,
    score,
    suggestions,
    goalTips,
    image_url,
    scoreReason,
  } = result;

  return (
    <Card className="w-full bg-white rounded-2xl shadow-md">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          🍱 Meal Analysis
        </h2>

        {image_url && (
          <img
            src={image_url}
            alt="Meal"
            className="w-full h-64 object-cover rounded-2xl shadow-md border"
          />
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-base text-gray-700">
          <p><span className="font-semibold text-gray-900">Food:</span> {food_name || "N/A"}</p>
          <p><span className="font-semibold text-gray-900">Calories:</span> {calories || "N/A"}</p>
          <p><span className="font-semibold text-gray-900">Protein:</span> {protein || "N/A"}</p>
          <p><span className="font-semibold text-gray-900">Carbs:</span> {carbs || "N/A"}</p>
          <p><span className="font-semibold text-gray-900">Fat:</span> {fat || "N/A"}</p>
        </div>

        {score && (
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-5 text-blue-900 font-bold flex items-center justify-between">
            <span className="flex items-center gap-2"><Brain className="w-5 h-5" /> Health Score</span>
            <span className="text-3xl font-extrabold">{score}</span>
          </div>
        )}

        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-5 text-green-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <BadgeCheck className="w-5 h-5" />
              Suggestions
            </div>
            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
              {suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {goalTips && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-5 text-yellow-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Target className="w-5 h-5" />
              Goal-Based Tips
            </div>
            {goalTips.weightLoss && (
              <p><strong>Weight Loss:</strong> {goalTips.weightLoss}</p>
            )}
            {goalTips.muscleGain && (
              <p><strong>Muscle Gain:</strong> {goalTips.muscleGain}</p>
            )}
            {goalTips.generalHealth && (
              <p><strong>General Health:</strong> {goalTips.generalHealth}</p>
            )}
          </div>
        )}

        {scoreReason && (
          <div className="text-gray-500 text-sm italic mt-2">
            Reason: {scoreReason}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;
