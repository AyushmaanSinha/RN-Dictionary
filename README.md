# 📖 Pocket Dictionary: Cinematic 3D WebGL App

A premium, highly-interactive WebGL-powered 3D pocket dictionary built with React Native (Expo) and WebGL (Three.js). The app features an editorial dark aesthetic (pure black `#000000` and peach/bronze `#FFA586` theme) and blends real-time dictionary lookups with custom animations and interactive digital sculptures.

---

## ✨ Features

### 1. Interactive 3D WebGL Studio
* **Digital Sculpture**: Procedural studio render loading an animated `bronze_horse.glb` running model.
* **Scroll-driven Orbit**: Camera follows an elliptical path wrapping around the 3D model as the user scrolls, creating a keyframe-level cinematic reveal.
* **Liquid Wave Shader**: A custom Three.js multi-frequency background wave shader transitioning from warm copper-bronze to deep sapphire-blue on scroll.
* **Spark Particles**: High-performance, floating particle systems drifting up behind the sculpture with custom colors (orange and blue sparks).
* **Lighting Rig**: Spotlights with soft shadows, rim lighting, fill lighting, and exponential fog (`THREE.FogExp2`).

### 2. Multi-lingual Dictionary Lookup
* **Live API Queries**: Queries the Free Dictionary API dynamically with support for up to 11 languages (English, Spanish, French, German, Italian, Portuguese, Arabic, Japanese, Korean, Hindi, Turkish, Russian).
* **Meanings & Definitions**: Iterates over parts of speech and displays up to 3 formatted meanings per section.
* **Audio Pronunciation**: Plays high-quality audio pronunciation using API-delivered audio streams with a clean fallback to browser SpeechSynthesis.
* **Lookup Caching**: Implements client-side in-memory caching to save API calls and ensure instant response times for repeated lookups.

### 3. Autocomplete Search Bar
* **Smart Dropdown**: Shows matches instantly from local pools of Word of the Day and Vocab lists, merged with a debounced Datamuse API lookup for extended word suggestions.
* **Key-driven Hiding**: Hides automatically on click-outside and Enter key press.
* **Visibility fix**: Implemented a CSS transition block utilizing `visibility: hidden` to guarantee that invisible slide elements do not intercept click events meant for the active search bar.

### 4. Interactive Learning Tools
* **Word of the Day (WOTD)**: Generates random WOTD selections on load with definition examples and links.
* **Trending capsules**: Dynamic, aesthetic capsule cards that search automatically when clicked.
* **Vocab Builder Flashcards**: Interactive double-sided flashcards with unique icons and smooth 3D flip animations to build vocabulary.

---

## 📁 Project Structure

```
epic-hopper/
├── App.js                   # Entry point for the Expo Native Application
├── app.json                 # Expo project metadata configuration
├── assets/
│   ├── laocoon.html         # Main WebGL page with Three.js rendering and dictionary javascript logic
│   ├── app_background.png   # Fallback / design asset
│   └── (icons/images)       # System icons and icons configuration
├── screens/
│   └── Home3DTab.js         # React Native WebView screen embedding assets/laocoon.html
├── package.json             # NPM package scripts and dependencies
└── README.md                # Project documentation
```

---

## 🚀 Running Locally

Follow these steps to run the application on your local machine:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended) and `npm` package manager.

### 2. Install Dependencies
Clone the repository and run the following command in the project root directory:
```bash
npm install
```

### 3. Run the Development Server
Start the Expo Metro Bundler server:
```bash
npm run web
```
This runs the application targeting the web browser environment, which will automatically bundle and launch the local website.

### 4. View in Browser
Open your browser and navigate to:
```
http://localhost:8081
```
*Note: If port `8081` is already in use, the terminal output will print the alternate port (e.g., `8082` or `19006`).*