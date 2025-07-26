import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultCard from "./components/ResultCard";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/analyze`, {
        method: "POST",
        body: formData, // Sending FormData directly
      });

      const data = await response.json();
      console.log("Result:>>  ", data);
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-3xl bg-gradient-to-br from-white to-gray-100 px-4 sm:px-6 py-10 flex flex-col items-center">
  <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-indigo-600 mb-10 tracking-tight">
    🥗 Smart Meal Analyzer
  </h1>

  <div className="w-full max-w-2xl">
    <InputForm onSubmit={handleSubmit} />
  </div>

  {loading && (
    <div className="mt-8 text-center text-gray-500 font-medium animate-pulse">
      Analyzing your meal...
    </div>
  )}

  {result && (
    <div className="w-full max-w-2xl mt-8">
      <ResultCard result={result} />
    </div>
  )}
</div>

  );
}

export default App;
