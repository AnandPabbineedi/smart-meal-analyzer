import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";

const InputForm = ({ onSubmit, loading }) => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [hint, setHint] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setHint("That file isn't an image. Choose a JPG, PNG or HEIC photo.");
      return;
    }
    setHint("");
    setImageFile(file);
  };

  const clearPhoto = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !description.trim()) {
      setHint("Add a photo or describe your meal first.");
      return;
    }
    setHint("");
    const formData = new FormData();
    let photoUrl = null;

    if (imageFile) {
      try {
        const compressed = await imageCompression(imageFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        formData.append("image", compressed);
        photoUrl = URL.createObjectURL(compressed);
      } catch (err) {
        // Some formats (like iPhone HEIC) can't be compressed in the browser; send the original if it's small enough
        if (imageFile.size > 5 * 1024 * 1024) {
          setHint("That photo is too large. Try one under 5 MB.");
          return;
        }
        formData.append("image", imageFile);
        photoUrl = null;
      }
    }
    if (description.trim()) formData.append("text", description.trim());

    onSubmit(formData, photoUrl);
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover" || e.type === "dragenter");
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <form className="form" onSubmit={handleSubmit} autoComplete="off">
      <div
        className={`drop ${dragActive ? "is-drag" : ""} ${preview ? "has-photo" : ""}`}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
      >
        {preview ? (
          <div className="drop-preview">
            <img src={preview} alt="Your meal" />
            <div className="drop-preview-meta">
              <span className="file-name">{imageFile.name}</span>
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
