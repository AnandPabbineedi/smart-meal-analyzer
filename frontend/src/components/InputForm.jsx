// src/components/InputForm.jsx
import { useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const InputForm = ({ onSubmit }) => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageFile && !description.trim()) {
      setShowDialog(true);
      return;
    }
    const formData = new FormData();
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (description) {
      formData.append('text', description);
    } else {
      alert("Please upload an image or enter text");
      return;
    }

    onSubmit(formData);
    setDescription("");
    setImageFile(null);
    fileInputRef.current.value = null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
      fileInputRef.current.files = e.dataTransfer.files;
    }
  };

  return (
    <>
       <Card className="w-full bg-white rounded-2xl shadow-2xl transition hover:shadow-3xl overflow-hidden">
       <CardContent className="space-y-6 p-6 sm:p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col formContainer items-center w-full max-w-3xl mx-auto mt-10 rounded-2xl  p-6 sm:p-10 space-y-2"
        autoComplete="off"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-700 text-center tracking-tight mb-2">🍽️ What did you eat?</h2>

        <div className="w-5/6 justify-items-center textAreaContainer">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., Chicken salad with quinoa and veggies"
            rows={3}
            className="w-full rounded-sm p-4 border border-gray-200 text-base focus:ring-2 focus:ring-blue-400 min-h-[50px] focus:outline-none transition"
            id="meal-desc"
          />
        </div>

        <div
          className={`flex flex-col items-center justify-center border-2 rounded-lg py-6 px-4
            transition border-dashed bg-blue-50/90 relative outline-none w-5/6     min-h-[98px] mb-4
            ${dragActive ? "border-blue-400 bg-blue-100" : "border-gray-200"} dropBoxContainer
          `}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <label htmlFor="meal-photo" className="flex flex-col items-center w-full cursor-pointer">
            <span className={`text-3xl mb-1 ${dragActive ? "text-blue-600 scale-105" : "text-blue-500"}`}>📷</span>
            <span className="font-semibold text-blue-600 text-base mb-1">
              {imageFile ? (
                <>
                  <span className="text-green-600">✔ {imageFile.name}</span>
                </>
              ) : (
                <>Upload a Meal Photo</>
              )}
            </span>
            <span className="text-xs text-gray-500 mb-1">
              Drag and drop, or tap to pick an image
            </span>
            <input
              style={{ display: "none" }}
              ref={fileInputRef}
              id="meal-photo"
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded font-bold hover:bg-blue-200 transition text-sm"
            >
              Choose File
            </button>
          </label>
        </div>

        <button
          type="submit"
          className="flex bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-8 rounded-xl text-lg shadow-lg transition transform active:scale-[.98]"
        >
          Analyze Meal
        </button>
      </form>

      
       </CardContent>
       </Card>
    </>
  );
};

export default InputForm;
