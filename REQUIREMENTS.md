Project Description: AI Quran Recitation Assistant
This document outlines the technical and functional specification for a web application designed to act as an AI-powered companion for Quran memorization and revision.

1. Project Overview & Vision
The "AI Quran Recitation Assistant" is a mobile-first web application that provides users with an interactive and personalized environment to practice their Quran memorization. Users can recite verses aloud, and the AI, acting as an expert Quranic teacher, will listen in real-time, provide continuations when the user falters, and offer precise feedback on pronunciation and accuracy when requested. The core mission is to create an accessible, patient, and encouraging learning tool that leverages modern AI to support students of the Quran.

2. Core Features
The application's functionality is directly derived from the user-provided prompt:

Interactive Recitation Mode: The primary interface is a real-time, voice-driven chat. The user speaks, and the AI listens.

Smart Assistance: If the user pauses for too long or forgets the next part of a verse, the AI will automatically recite the correct continuation in clear, classical Arabic to help them proceed.

On-Demand Feedback: The AI will not interrupt or correct the user mid-recitation to maintain flow. However, if the user explicitly asks, "Did I make a mistake?" or a similar question, the AI will provide an honest, precise, and constructive critique, highlighting the specific error and providing the correct form.

Clarity Check: If the user's recitation is unclear, the AI will gently ask for a repetition (e.g., "I didn't understand clearly. Could you please repeat the last part?").

Quranic Q&A: Beyond recitation, users can ask the AI questions about the Quran, and it will provide answers based on its knowledge base.

Session Initiation: Every session begins with the AI greeting the user with "Assalamu alaikum" and asking which Surah or section they wish to review, ensuring a structured and respectful start.

3. Technical Architecture
The application will be built using a modern, scalable tech stack designed for real-time interaction and responsiveness.

Frontend (Client-Side)
Framework: React with TypeScript. React's component-based architecture is ideal for building a modular UI, while TypeScript provides essential type safety for a more robust and maintainable codebase.

Styling: Tailwind CSS. We will use a utility-first approach to build a fully responsive, mobile-first design directly within the JSX components. This ensures rapid development and a consistent look and feel.

State Management: React Context or Zustand will be used for managing global state, such as the current user, session status, and language settings.

Real-Time Communication: A WebSocket client (using a library like socket.io-client) will be implemented to manage the continuous, low-latency, two-way communication of audio and text data with the backend.

Backend (Server-Side)
Framework: Node.js with Express. The backend will serve as a lightweight and efficient Backend-for-Frontend (BFF). Its primary roles are:

API Gateway: Securely manage API keys and act as a proxy for all communications with the Gemini API.

Real-Time Server: Host a WebSocket server (socket.io) to handle the real-time data flow from the client.

Session Management: Handle the logic for starting and ending recitation sessions.

API Endpoints:

POST /api/session/start: Initializes a new recitation session.

WebSocket Events:

client:audio-stream: Client sends audio chunks to the server.

server:ai-response: Server sends back AI-generated text or audio.

server:transcription: Server sends back the real-time transcription of the user's speech.

4. Solving the Speech-to-Text (STT) & Text-to-Speech (TTS) Challenge
This is a critical component. The goal is to achieve high-quality, free, and non-robotic voice interaction in both Arabic and Latin-based languages, without using the browser's native speechSynthesis API.

Speech-to-Text (STT): Capturing User Recitation
Solution: We will use the Web Speech API's SpeechRecognition interface.

Why: It's a browser-native, completely free standard. It supports continuous recognition, which is essential for listening to recitation. Crucially, it has support for a wide range of languages, including various dialects of Arabic (ar-SA, ar-EG, etc.). While its accuracy can vary by browser, it is the most viable solution that meets the "free" requirement.

Text-to-Speech (TTS): AI Recitation
The requirement for a free, high-quality, non-robotic, multilingual TTS service that isn't speechSynthesis is the biggest challenge. The most elegant solution is to leverage the AI platform you've already chosen.

Solution: Use the Gemini API's built-in TTS capabilities. The gemini-2.5-flash-preview-tts model can generate high-quality audio directly from text.

Why:

Superior Quality: The quality is far superior to the robotic voices of older APIs and is designed to be natural and expressive.

Multilingual & Multi-voice: It natively supports numerous languages, including a clear and proper Arabic for recitation and other languages for conversational parts. You can even specify voice characteristics.

Integrated Workflow: This approach simplifies the architecture immensely. The backend sends a text prompt to Gemini and can request the response as both text (for display) and audio (for playback). This eliminates the need for a separate, third-party TTS service.

Cost-Effective: While not "free" at massive scale, usage falls under the Gemini API's generous free tier, making it effectively free for development and moderate use. It's the most practical way to meet all your requirements without compromising on quality.

5. Internationalization (i18n) Structure
To ensure the app is ready for future languages, we will implement an i18n framework from the beginning.

Library: We will use react-i18next, a powerful and popular internationalization library for React.

File Structure: All UI text will be stored in JSON files, organized by language. This makes adding a new language as simple as creating a new translation file.

/public
  /locales
    /en
      translation.json
    /it
      translation.json
    /ar
      translation.json

Implementation: In the React components, all hardcoded text will be replaced with a function call.

Instead of: <h1>Start a new session</h1>

We will use: <h1>{t('startNewSession')}</h1>

The t function will automatically select the correct string from the JSON files based on the user's chosen language.