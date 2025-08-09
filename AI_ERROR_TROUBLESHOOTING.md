# AI Response Error Troubleshooting Guide

## Enhanced Error Detection

I've implemented enhanced error handling to help identify the specific issue you're experiencing. Here's what was added:

### 1. Client-Side Improvements
- **Enhanced Auto-play Error Handling**: More detailed error logging with specific error types
- **User-friendly Error Messages**: Better feedback when TTS or audio playback fails
- **Socket Error Enhancement**: Better error capture and reporting for AI responses

### 2. Server-Side Improvements  
- **Detailed Error Logging**: Full error details including stack traces
- **Debug Endpoint**: New `/api/debug/ai-response` endpoint for testing
- **Enhanced Text Processing**: Better error context for troubleshooting

### 3. Debug Tools
- **Debug Script**: `debug_ai_error.js` - Load this in browser console for real-time error monitoring
- **Error Monitor**: Captures all console errors, unhandled promises, and general errors

## How to Diagnose Your Error

### Step 1: Load Debug Tools
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Copy and paste the contents of `debug_ai_error.js` into the console
4. Press Enter to load the monitoring tools

### Step 2: Reproduce the Error
1. Try to interact with the AI (send a message or speak)
2. Watch the console for captured errors
3. Look for specific error types:
   - 🔊 AUDIO-related errors
   - 🎙️ TTS-related errors  
   - 🔌 SOCKET-related errors
   - 🌐 NETWORK-related errors

### Step 3: Check Common Error Patterns

#### Audio Playback Errors
- **"NotAllowedError"**: Browser blocking auto-play (normal, requires user interaction)
- **"AbortError"**: Audio interrupted (normal during rapid message updates) 
- **"Audio load failed"**: Invalid audio data or network issues
- **"TTS failed"**: Gemini TTS quota exceeded or API issues

#### Socket/Network Errors
- **"Session not found"**: Server session expired
- **"Failed to process text"**: AI generation failed
- **"Connection failed"**: Network connectivity issues

#### TTS/API Errors
- **Quota exceeded**: Gemini API daily limit reached (15 requests/day free tier)
- **Invalid audio format**: Audio conversion issues
- **API timeout**: Gemini service temporarily unavailable

## Quick Fixes to Try

### 1. Audio Issues
```javascript
// In browser console - reset audio context
const audioContext = new AudioContext();
audioContext.resume();
```

### 2. Session Issues
- Click "New Session" button to reset
- Refresh the page to clear any stuck state

### 3. TTS Issues  
- Use manual "Play Audio" buttons if auto-play fails
- Check TTS status: http://localhost:3001/api/tts/status

### 4. Network Issues
- Ensure server is running on port 3001
- Check if both client (3000) and server (3001) are accessible

## Testing Tools

### Debug AI Response Endpoint
Test AI generation directly:
```bash
curl -X POST http://localhost:3001/api/debug/ai-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","text":"Hello"}'
```

### Check App State
In browser console:
```javascript
debugAI.checkAppState()
```

## Expected Behavior vs. Issues

### Normal Operation:
1. User sends message → AI processes → Response with audio → Auto-play (after first message)
2. If auto-play fails → Manual play button available
3. If TTS fails → Text-only response continues working

### Problem Indicators:
- Error messages in console
- Red error notifications in UI
- Audio not playing at all (manual or auto)
- AI not responding to messages
- Socket connection failures

## Next Steps

1. **Load the debug tools** and reproduce the error
2. **Share the console output** showing the captured error details
3. **Note the specific step** where the error occurs:
   - During AI response generation?
   - During audio playback?
   - During message handling?

With enhanced error logging, we should be able to identify the exact cause of your AI response error and provide a targeted fix.
