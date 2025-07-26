````md
# 🥗 Smart Meal Analyzer

An intelligent web app that analyzes meals from uploaded images and provides nutritional information like calories, protein, fats, carbs, and more.

---

## 🚀 Features

- 📷 Upload an image of your meal
- 🧠 Get real-time AI-based nutritional analysis
- 📱 Mobile-responsive UI using TailwindCSS
- ⚡ Fast and clean experience built with Vite + React

---

## 🛠 Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js / Express (with Google Gemini as a model)
- **Deployment:** Netlify (Frontend)

---

## 📦 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/smart-meal-analyzer.git
cd smart-meal-analyzer
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Development Server

```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🔗 Connect to Backend

Create a `.env` file in the root of your project and add:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Or use your live API backend URL:

```env
VITE_BACKEND_URL=https://your-api-url.com
```

---

## 🌍 Deploying on Netlify

1. Push your code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Create a new site from Git
4. Use these settings:

```
Build Command: npm run build
Publish Directory: dist
```

5. Add environment variable `VITE_BACKEND_URL` in Netlify settings

---

---

## 🙏 Credits

Made with 💪 by \Anand

---

## 📄 License

MIT License - free to use, modify, and distribute.

```
