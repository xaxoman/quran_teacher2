// Diagnostic script to identify AI response errors
// Run this in your browser console when the error occurs

// Function to monitor console errors
const monitorErrors = () => {
  console.log('🔍 AI Error Monitor Started - watching for errors...');
  console.log('💡 Try interacting with the AI now and any errors will be captured');
  
  // Override console.error to capture all errors
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 CAPTURED ERROR:', ...args);
    
    // Check for specific error types
    if (args.some(arg => typeof arg === 'string' && arg.includes('audio'))) {
      console.log('🔊 This appears to be an AUDIO-related error');
    }
    if (args.some(arg => typeof arg === 'string' && arg.includes('TTS'))) {
      console.log('🎙️ This appears to be a TTS-related error');
    }
    if (args.some(arg => typeof arg === 'string' && arg.includes('socket'))) {
      console.log('🔌 This appears to be a SOCKET-related error');
    }
    if (args.some(arg => typeof arg === 'string' && arg.includes('fetch'))) {
      console.log('🌐 This appears to be a NETWORK-related error');
    }
    
    // Call original function
    originalError.apply(console, args);
  };
  
  // Monitor unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.log('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
    console.log('💡 This might be the AI response error you\'re experiencing');
  });
  
  // Monitor general errors
  window.addEventListener('error', (event) => {
    console.log('🚨 GENERAL ERROR:', event.error);
    console.log('📍 Error location:', event.filename, 'line:', event.lineno);
  });
  
  console.log('✅ Error monitoring active. When you get the AI response error, check the console output above.');
};

// Start monitoring
monitorErrors();

// Helper function to check current state
const checkAppState = () => {
  console.log('📊 Current App State:');
  console.log('🔌 Socket connected:', window.socket?.connected || 'Unknown');
  console.log('🆔 Session ID exists:', !!window.sessionId);
  console.log('🎤 Speech recognition supported:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  console.log('🔊 Audio context state:', window.AudioContext ? new AudioContext().state : 'No AudioContext');
  console.log('🎵 TTS API available:', 'speechSynthesis' in window);
};

// Export for browser console
window.debugAI = {
  monitorErrors,
  checkAppState
};

console.log('🔧 Debug tools loaded. Available commands:');
console.log('  debugAI.checkAppState() - Check current application state');
console.log('  debugAI.monitorErrors() - Start error monitoring (already started)');
