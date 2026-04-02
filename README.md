# Flashly ⚡

Flashly is the ultimate free flashcard and study notes application tailored specifically for Singapore's rigorous educational systems, including GCE O-Level, A-Level, IB Diploma, and IP Programme students. Master your exams using a state-of-the-art Spaced Repetition System (SRS), collaborate via community decks, and accelerate learning with a personal AI coach.

![Flashly App](./Assets/deck-graphic-light.svg)

## 🌟 Key Features

- **Spaced Repetition System (SRS):** Optimized algorithm that predicts exactly when you're about to forget a concept and surfaces it for review at the perfect moment to maximize memory retention.
- **AI Coach & Analytics:** Your personal tutor. Flashly AI analyzes your study habits, offering actionable insights and daily game plans. Advanced analytics track your mastery using heatmaps, memory maturity distributions, and subject radars.
- **Community Decks (15k+ Free Decks):** Access high-quality flashcard decks crafted by top students in Singapore. Whether you're taking Pure Chemistry, A-Maths, or Economics, someone has already mastered it.
- **Notes Marketplace:** Access and share high-quality PDF study notes and exam papers seamlessly integrated with an AI Summarizer.
- **Collaborative Groups:** Learn together. Build shared decks and compete on private leaderboards with classmates.
- **Global Leaderboard & XP:** Compete in leagues (from Bronze to Legend) and earn XP through consistent studying and maintaining streaks.

## 🛠️ Tech Stack

This project is built using a modern yet lightweight frontend approach, avoiding heavy framework overhead to prioritize speed and custom aesthetics.

- **Frontend:** Vanilla HTML, CSS, JavaScript (Custom SPA routing and state management)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime Subscriptions, Edge Functions)
- **Visualizations:** [D3.js](https://d3js.org/) & [Chart.js](https://www.chartjs.org/)
- **Document Viewing:** [PDF.js](https://mozilla.github.io/pdf.js/)
- **Math Rendering:** [KaTeX](https://katex.org/)

## 🚀 Local Development

Since the app relies on Vanilla web technologies and simple static file serving, getting the project up and running locally is incredibly easy.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/flashly-edu/flashly.git
   cd flashly
   ```

2. **Start a local development server:**
   Using Python:
   ```bash
   python3 -m http.server 8000
   ```
   Or using Node's `http-server` (or any other static server):
   ```bash
   npx http-server -p 8000
   ```

3. **Open the app:**
   Navigate to `http://localhost:8000` in your web browser.

> **Note:** User-generated content fetched from the backend must be sanitized using the existing `escapeHtml()` function before being injected into the DOM to prevent XSS vulnerabilities.

## 🎨 Design & Styling Guidelines

Flashly aims for a distinctive, production-grade frontend interface. The design diverges from generic "AI" aesthetics, striving for bold visual impact and polished functional details. Please refer to `flashly-design.md` for our core principles.

### Key Aesthetic Principles

- **Typography:**
  - **Sora:** Primary display font used for all major headings, tab labels, and primary buttons to inject character.
  - **Inter:** Refined body font used for body text, metadata, and secondary information for high legibility.
- **Components & Spacing:**
  - *Cards:* Generous border-radius (`1.5rem` to `2rem`), subtle borders (`1px solid var(--border)`), and soft, layered shadows.
  - *Tabs:* Segmented controls instead of simple underlines—using pill-like containers with sliding backgrounds.
  - *Buttons:* High-contrast designs. Primary buttons should be dark/vibrant with clear hover states that elevate (`transform: translateY(-2px)`) and add depth (`box-shadow`).
- **Gradients & Backgrounds:**
  - Subtle radial gradients in the background of main views to create depth (e.g., `radial-gradient(circle at top right, var(--primary-light) 0%, transparent 40%)`). Avoid generic solid colors.
- **Motion & Micro-interactions:**
  - Every interactive element should react. Use the `cubic-bezier(0.4, 0, 0.2, 1)` easing curve for all transitions so the interface feels "snappy" yet fluidly smooth. Prioritize CSS-only animations and avoid scattering disjointed micro-interactions.

## 🤝 Contributing

We welcome contributions! When contributing:
1. Ensure your UI modifications adhere strictly to the `flashly-design.md` guidelines.
2. Verify all new features and bug fixes across different views.
3. Test locally using a static server to ensure the vanilla SPA routing behaves as expected.
4. Keep the global `state` object clean and use designated handler functions (e.g., `switchView`, `updateNav`).

## 📄 License

(See LICENSE.txt or appropriate licensing file)
