# AI Quran Recitation Assistant

A mobile-first web application that provides users with an interactive and personalized environment to practice their Quran memorization. Users can recite verses aloud, and the AI, acting as an expert Quranic teacher, will listen in real-time, provide continuations when the user falters, and offer precise feedback on pronunciation and accuracy when requested.

## Features

- **Interactive Recitation Mode**: Real-time, voice-driven chat where the user speaks and the AI listens
- **Smart Assistance**: AI automatically provides continuation when user pauses or forgets the next part
- **On-Demand Feedback**: Honest, precise, and constructive critique when explicitly requested
- **Clarity Check**: AI gently asks for repetition if recitation is unclear
- **Multilingual Support**: English, Arabic, and Italian interface
- **Quranic Q&A**: Ask questions about the Quran and receive knowledgeable answers

## Tech Stack

### Backend
- **Node.js** with **Express** framework
- **Socket.IO** for real-time communication
- **TypeScript** for type safety
- **Google Gemini AI** for natural language processing and TTS
- **UUID** for session management

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** for responsive styling
- **Zustand** for state management
- **react-i18next** for internationalization
- **Socket.IO Client** for real-time communication
- **Web Speech API** for speech recognition

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- Modern web browser with microphone access

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xaxoman/quran_teacher2.git
   cd quran_teacher2
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   npm run client:install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

5. **Get your Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

## Development

Start the development servers (both backend and frontend):

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Individual Commands

Start only the backend:
```bash
npm run server:dev
```

Start only the frontend:
```bash
npm run client:dev
```

## Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Usage

1. **Select Language**: Choose your preferred interface language (English, Arabic, or Italian)

2. **Choose Surah**: Select from popular surahs or enter a custom surah/section

3. **Start Recitation**: 
   - Click the microphone button to start voice input
   - Or type your recitation in the text field
   - The AI will listen and respond appropriately

4. **Get Feedback**: 
   - Ask "Did I make a mistake?" or similar questions
   - Click the "Request Feedback" button
   - The AI will provide constructive criticism

5. **Continuation Help**: 
   - If you pause or forget, the AI will automatically provide the next part
   - Continue reciting from where the AI left off

## API Endpoints

- `POST /api/session/start` - Start a new recitation session
- `GET /api/health` - Health check endpoint

## WebSocket Events

### Client → Server
- `join-session` - Join a recitation session
- `audio-stream` - Send audio data for processing
- `text-input` - Send text input for processing
- `request-feedback` - Request feedback on recitation

### Server → Client
- `ai-response` - AI response to user input
- `feedback-response` - Feedback on recitation
- `transcription` - Transcribed text from audio
- `error` - Error messages

## Browser Compatibility

- Chrome/Edge 25+
- Firefox 44+
- Safari 14.1+
- Mobile browsers with Web Speech API support

## Supported Languages

### Interface Languages
- English (en)
- Arabic (ar) 
- Italian (it)

### Speech Recognition Languages
- Arabic (ar-SA)
- English (en-US)
- Italian (it-IT)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini AI for natural language processing
- The Quran for providing the content and inspiration
- The open-source community for the amazing tools and libraries

## Support

If you encounter any issues or have questions, please:
1. Check the [GitHub Issues](https://github.com/xaxoman/quran_teacher2/issues)
2. Create a new issue with detailed information
3. Contact the development team

---

**May this tool help you in your journey of memorizing and understanding the Holy Quran. Barakallahu feek!** 🤲
