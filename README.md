# 🚀 Hackathon GPT — AI Team Orchestrator & Member Co-Pilots

[![Live Demo](https://img.shields.io/badge/Live_Demo-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://hackathon-gpt-733962870607.asia-southeast1.run.app/)
[![Stack](https://img.shields.io/badge/Stack-React_%7C_TypeScript_%7C_Node.js_%7C_Gemini_AI-007ACC?style=for-the-badge)](https://hackathon-gpt-733962870607.asia-southeast1.run.app/)
[![AI Collaboration](https://img.shields.io/badge/Developed_With-AI_Assistance-8E44AD?style=for-the-badge&logo=openai&logoColor=white)](https://hackathon-gpt-733962870607.asia-southeast1.run.app/)

> **Hackathon GPT** is an autonomous full-stack AI orchestrator built to transform hackathon problem statements into complete execution strategies. Powered by Google Gemini, it generates system architecture blueprints, hour-by-hour timetables, dynamic skill matrices, and launches role-specific AI sub-chatbots for individual team co-pilots.

🌐 **Live Deployment**: [https://hackathon-gpt-733962870607.asia-southeast1.run.app/](https://hackathon-gpt-733962870607.asia-southeast1.run.app/)

---

## 🤖 AI Assistance & Development Disclosure

> **Development Note**: This project was developed with extensive assistance and collaboration from AI models (including Google Gemini and Google AI Studio). AI tools were utilized to assist with code scaffolding, backend routing setup, component structuring, prompt engineering, local configuration debugging, and documentation generation.

---

## 🌟 Key Features

- 🤖 **AI Squad Orchestration**: Analyzes problem statements to generate long-form architecture reports, technical execution rules, and granular timelines (12h, 24h, 36h, 48h).
- 🎛️ **Team Shutter GUI Matrix**: Customize squad size (2 to 6 members) and dynamically assign skill sets per role (React, Express, Python, FastAPI, Tailwind CSS, etc.).
- ⚡ **Role-Specific Member Co-Pilots**: Launch sub-chatbots tailored for specific team roles:
  - **Alex (Lead)**: UI/UX, React, Frontend Architecture
  - **Blake (Backend)**: API Routing, Node.js, Express, Databases
  - **Charlie (AI/ML)**: Model Integration, Gemini API, RAG Pipelines
- 💻 **Cyberpunk Dark IDE Interface**: Purpose-built high-contrast UI theme designed for high-intensity hackathon workflows.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Backend**: Node.js, Express (`server.ts`), `tsx`
- **AI Engine**: `@google/genai` (Google Gemini 2.5 Flash API)
- **Deployment**: Google Cloud Run (Containerized Service)

---

## 📂 Project Structure

```text
HackathonGPT/
├── assets/             # Static assets & styles
├── src/                # React frontend application
│   ├── components/     # UI components & sub-chatbot modals
│   ├── App.tsx         # Main IDE layout & state
│   └── main.tsx        # React root entry point
├── .env.example        # Environment variables template
├── .gitignore          # Git exclusion rules
├── index.html          # Application entry HTML
├── package.json        # Project dependencies & scripts
├── server.ts           # Express backend server & Gemini API Gateway
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
