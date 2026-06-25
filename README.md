# 📖 Pocket Dictionary: Next.js 3D WebGL WebApp

A premium, highly-interactive WebGL-powered 3D pocket dictionary built with **Next.js (App Router)**, **TypeScript**, **Three.js**, and **Vanilla CSS**. 

The application utilizes an editorial dark aesthetic (pure black `#000000` background and peach/bronze `#FFA586` theme) and blends live dictionary lookups with animated digital sculptures.

---

## ✨ Features

### 1. 3D WebGL Studio Render (Three.js)
* **Digital Sculpture**: Loads an animated running `bronze_horse.glb` model directly in React.
* **Continuous Floating Float/Rotation Physics**: The model features an automatic slow rotation over time (`time * yRotationSpeed`) and floats vertically on a sine wave, keeping the 3D canvas active and immersive.
* **Scroll-driven Camera Orbit**: Camera follows an elliptical path orbiting the 3D model as the user scrolls, creating a keyframe-level cinematic transition.
* **Liquid Wave Background**: A custom Three.js multi-frequency background wave shader transitioning dynamically from warm copper-bronze to deep sapphire-blue on scroll.
* **Glowing Letter Sparks**: High-performance particle systems drifting behind the horse featuring actual dictionary letter glyphs (`A`, `C`, `E`, `H`, `M`, `R`, `S`, `T`, `W`, `Z`) with custom glowing peach/orange and sapphire/blue shadows.
* **Lighting Rig**: Soft SpotLight shadows, rim lights, fill lights, and exponential fog (`THREE.FogExp2`).

### 2. Multilingual Dictionary Lookup
* **Live API Queries**: Integrates with the Free Dictionary API, supporting up to 12 languages (English, Spanish, French, German, Italian, Portuguese, Arabic, Japanese, Korean, Hindi, Turkish, Russian).
* **Meanings & Definitions**: Iterates over parts of speech and displays detailed definition blocks.
* **Audio Pronunciation**: Plays high-quality audio pronunciation using API-delivered streams with fallback to browser SpeechSynthesis.
* **In-Memory Cache**: Caches lookup results locally in-memory for instant retrieval.

### 3. Autocomplete Search Bar
* **Instant Dropdown**: Matches inputs against local pools of Word of the Day and Vocab lists, merged with a debounced Datamuse API lookup.
* **Visibility Transitions**: Slide visibility toggling (`visibility: hidden` to `visibility: visible`) prevents pointer events from overlapping on slide transitions.

### 4. Interactive Learning Tools
* **Regional Preloader**: Cycles through Indian regional greetings on launch, leading to a cinematic text scale-and-glow transition of the brand logo into the navbar.
* **Word of the Day**: Selects a randomized word on load with dynamic matching header imagery.
* **Trending Capsules**: Randomly shuffles trending words into click-to-lookup capsules.
* **Vocab Builder Flashcards**: Interactive 3D flip card utilizing CSS `perspective` and `transform-style: preserve-3d` for smooth flip actions, with cards locked directly on top of each other using absolute positioning.
* **Scroll Progress Indicator**: Clean vertical progress bar positioned on the right-most grid line indicating active slides.

---

## 🛠️ Project Structure

```
RN-Dictionary/
├── public/                 # Static assets folder
│   └── assets/             # Images, splash and background assets (fully cleaned)
├── src/
│   ├── app/
│   │   ├── globals.css     # Premium Vanilla CSS styles & animations
│   │   ├── layout.tsx      # Root html wrapper & Script loader
│   │   └── page.tsx        # Main application page & search logic
│   ├── components/
│   │   ├── Preloader.tsx   # Indian regional greetings preloader
│   │   └── ThreeCanvas.tsx # WebGL Three.js canvas component (Client component)
│   ├── constants/
│   │   └── words.ts        # Central type-safe database for dictionary words
│   └── types/
│       └── custom.d.ts     # Typescript custom element declarations for <ion-icon>
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configurations
└── package.json            # Script runs & dependencies
```

---

## 🚀 Local Execution Setup

To run the Next.js web application locally on your machine, follow these steps:

### 1. Install Dependencies
Initialize and download package files using `npm`:
```bash
npm install
```

### 2. Run Development Server
Start the Next.js Dev Server (runs with Turbopack for instant compilations):
```bash
npm run dev
```

The application will be served at [http://localhost:3000](http://localhost:3000).

### 3. Build for Production
To check production bundles or compile build assets:
```bash
npm run build
```
To run the production build locally:
```bash
npm run start
```
