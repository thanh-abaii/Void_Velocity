# Void Velocity

**Void Velocity** is a high-intensity space survival game built with React, TypeScript, and the HTML5 Canvas API. Pilot your custom shuttle through a dense, procedurally generated asteroid field, manage your shield integrity, and blast your way through the cosmos.

The game features deep integration with **Google Gemini**:
1.  **Gemini 2.5 Flash**: Generates unique mission briefings and sarcastic crash reports.
2.  **Gemini 2.5 Flash Image (Nano Banana)**: Generates realistic game assets (ships and asteroids) on the fly!

![Void Velocity Screenshot](https://via.placeholder.com/800x450?text=Void+Velocity+Gameplay)

## 🚀 Features

- **Generative AI Graphics:** 
  - Use the **Nano Banana** model to generate high-fidelity 4K textures for your starship and the asteroid field.
  - Includes automatic background removal to seamlessly blend AI assets into the game engine.
- **Star Wars Inspired Fleet:**
  - **X-VANGUARD:** Balanced fighter with S-foils in attack position.
  - **A-VELOCITY:** High-speed interceptor with a wedge design.
  - **Y-FORTRESS:** Heavy bomber chassis with reinforced plating.
- **Deep Survival Mechanics:**
  - **Weapon Degradation:** Guns overheat and downgrade levels after sustained fire. You must hunt for Weapon Crates to maintain max firepower.
  - **Shield Decay:** Life support drains energy over time. Keep moving to find Shield Cells or risk entering "Critical State" (1 HP).
- **Diverse Hazards:**
  - **Carbon:** Standard rocky asteroids.
  - **Metallic:** High HP, armored, highly reflective.
  - **Magma:** High damage, glowing volcanic rock.
  - **Ice:** Fast moving, fragile, translucent.
- **Level Progression:**
  - Advance through 5 distinct sectors with increasing speed and density.
  - Hyperspace warp transitions.
- **Combat System:**
  - Tri-level weapon upgrades (Single -> Dual -> Spread).
  - Proximity warning system.
- **Immersive Audio:** Synthesized sound effects using Web Audio API (Thrusters, Explosions, Warp Jumps).

## 🎮 Controls

- **Mouse / Touch:** Move the cursor or drag your finger to steer the ship.
- **Shooting:** The ship fires automatically. 
- **Strategy:** Don't just dodge! You must collect power-ups to prevent your weapon from downgrading and your shield from failing.

## 📋 Change Log

### v1.4.0 - The "Nano Banana" & Fleet Update (Latest)
- **Generative World Assets:** Added integration with `gemini-2.5-flash-image` to generate realistic sprites for the player ship and 4 distinct asteroid types directly in the browser.
- **New Fleet Classes:** Renamed and redesigned ships to **X-VANGUARD**, **A-VELOCITY**, and **Y-FORTRESS** with Star Wars-inspired vector graphics and AI prompts.
- **Advanced Survival Mechanics:**
  - **Shield Decay:** Shields now slowly drain over time due to "Life Support costs". Stops at 1HP (Critical).
  - **Weapon Jamming:** Weapons now downgrade a level after 80 shots if not refreshed via power-ups.
- **Asteroid Diversity:** Introduced Magma (Fire), Ice (Frost), and Metallic (Iron) asteroid variants with unique stats (Speed, HP, Damage) and visual effects.
- **Balance Adjustments:** Increased weapon drop rates to compensate for degradation mechanics.

### v1.3.0 - Level & Progression
- **Level System:** Implemented a 5-stage level progression based on Data Fragments.
- **Visuals:** Added "Hyperspace Jump" transition screen and warp speed starfield effects.
- **Difficulty Scaling:** Asteroid velocity increases by 30% per level.

### v1.2.0 - Visuals & Persistence
- **High Scores:** Added persistent leaderboard using LocalStorage.
- **Visuals:** Upgraded rendering with 3D gradients and proximity danger glow.

### v1.1.0 - Combat & Physics
- **Health System:** Replaced "one-hit death" with a Shield Integrity bar.
- **Weaponry:** Implemented projectile system and weapon upgrades.

### v1.0.0 - Initial Release
- Core game loop with Gemini AI text generation.

## 🛠️ Technologies Used

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Rendering:** HTML5 Canvas API (Custom Sprite Processing)
- **Audio:** Web Audio API (Oscillators & Noise Buffers)
- **AI:** Google GenAI SDK (`@google/genai`)
  - `gemini-2.5-flash` (Text)
  - `gemini-2.5-flash-image` (Image Generation)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/void-velocity.git
   cd void-velocity
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Key:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📄 License

This project is open-source and available under the MIT License.