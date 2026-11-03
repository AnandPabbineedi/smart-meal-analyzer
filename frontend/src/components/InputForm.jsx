import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";

const InputForm = ({ onSubmit, loading }) => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [hint, setHint] = useState("");
  const fileInputRef = useRef(null);

  // Prevent default window drag/drop behavior to avoid browser opening dropped files
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);
    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    let isMounted = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isMounted) {
        setPreview(e.target.result);
      }
    };
    reader.onerror = () => {
      if (isMounted) {
        setPreview(null);
      }
    };
    reader.readAsDataURL(imageFile);
    return () => {
      isMounted = false;
    };
  }, [imageFile]);

  const pickFile = (file) => {
    if (!file) return;
    const isImage =
      (file.type && file.type.startsWith("image/")) ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|jfif|tiff?)$/i.test(file.name || "");

    if (!isImage) {
      setHint("That file isn't an image. Choose a JPG, PNG or HEIC photo.");
      return;
    }
    setHint("");
    setImageFile(file);
  };

  const clearPhoto = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !description.trim()) {
      setHint("Add a photo or describe your meal first.");
      return;
    }
    setHint("");
    const formData = new FormData();
    const photoUrl = preview; // Use the base64 preview for the result card

    if (imageFile) {
      if (imageFile.size <= 1024 * 1024) {
        // Files <= 1MB can be sent directly without compression overhead
        formData.append("image", imageFile);
      } else {
        try {
          const compressed = await imageCompression(imageFile, {
            maxSizeMB: 1.0,
            maxWidthOrHeight: 1280,
            useWebWorker: false, // Avoid worker blob creation issues
          });
          formData.append("image", compressed, imageFile.name);
        } catch (err) {
          if (imageFile.size > 5 * 1024 * 1024) {
            setHint("That photo is too large. Try one under 5 MB.");
            return;
          }
          formData.append("image", imageFile);
        }
      }
    }
    if (description.trim()) formData.append("text", description.trim());

    onSubmit(formData, photoUrl);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    let droppedFile = null;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      droppedFile = e.dataTransfer.files[0];
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      droppedFile = e.dataTransfer.items[0].getAsFile();
    }

    if (droppedFile) {
      pickFile(droppedFile);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} autoComplete="off">
      <div
        className={`drop ${dragActive ? "is-drag" : ""} ${preview && imageFile ? "has-photo" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (!preview && !e.target.closest("button")) {
            fileInputRef.current?.click();
          }
        }}
      >
        {preview && imageFile ? (
          <div className="drop-preview">
            <img src={preview} alt="Your meal" />
            <div className="drop-preview-meta">
              <span className="file-name">{imageFile?.name || ""}</span>
              <div className="drop-actions">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </button>
                <button type="button" className="text-btn" onClick={clearPhoto}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label htmlFor="meal-photo" className="drop-empty">
            <svg className="plate" viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
            <span className="drop-title">Add a photo of your meal</span>
            <span className="drop-sub">Drop it here or tap to choose</span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="meal-photo"
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <div className="or" aria-hidden="true">or</div>

      <label htmlFor="meal-desc" className="field-label">
        Describe it
      </label>
      <textarea
        id="meal-desc"
        className="textarea"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="2 idlis with sambar and coconut chutney"
        rows={3}
      />

      {hint && <p className="hint" role="alert">{hint}</p>}

      <button type="submit" className="primary" disabled={loading}>
        {loading ? "Analyzing…" : "Analyze meal"}
      </button>
    </form>
  );
};

export default InputForm;
