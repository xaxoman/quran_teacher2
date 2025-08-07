# Troubleshooting Connection Issues

## "Connection failed. Please check your internet connection." Error

This error occurs when the frontend cannot connect to the backend server. Here are the steps to resolve it:

### 1. Check if the Server is Running

**Step 1:** Open a terminal and navigate to your project root
```bash
cd C:\Users\xhafa\Desktop\coding-workspace\quran_teacher2
```

**Step 2:** Start the server
```bash
npm run server:dev
```

You should see:
```
🚀 Server running on port 3001
📱 Ready for Quran recitation sessions
```

### 2. Check if Both Client and Server are Running

**Terminal 1 (Server):**
```bash
npm run server:dev
```

**Terminal 2 (Client):**
```bash
npm run client:dev
```

### 3. Use the Development Script (Recommended)

Instead of running client and server separately, use:
```bash
npm run dev
```

This runs both client and server concurrently.

### 4. Check Network Configuration

1. **Verify Server Port:** Make sure port 3001 is not used by another application
2. **Check Client Port:** Client should run on port 3000
3. **Test Server API:** Open browser and go to `http://localhost:3001/api/health`
   - You should see: `{"status":"healthy","timestamp":"..."}`

### 5. Environment Variables

Make sure these files exist with correct content:

**Root `.env` file:**
```
GEMINI_API_KEY="your-api-key"
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Client `.env` file:**
```
REACT_APP_SERVER_URL=http://localhost:3001
```

### 6. Common Issues and Solutions

#### Issue: "Cannot connect to server"
- **Solution:** Make sure the server is running (`npm run server:dev`)
- **Check:** Visit `http://localhost:3001/api/health` in your browser

#### Issue: CORS errors
- **Solution:** The server CORS configuration has been updated to handle this

#### Issue: "fetch is not defined"
- **Solution:** This usually means the server URL is incorrect or server is not running

### 7. Step-by-Step Testing

1. **Start the server:**
   ```bash
   npm run server:dev
   ```

2. **Test server health:**
   Open `http://localhost:3001/api/health` in browser

3. **Start the client:**
   ```bash
   npm run client:dev
   ```

4. **Test the connection:**
   - Select a Surah
   - Click "Start Recitation"
   - Check browser console (F12) for any errors

### 8. Debug Information

If the issue persists, check the browser console (F12) and look for:
- Network requests to `http://localhost:3001/api/session/start`
- Any CORS errors
- Socket connection messages

### 9. Alternative: Use Production Build

If development mode doesn't work:

```bash
npm run build
npm start
```

Then visit `http://localhost:3001`

### 10. Port Conflicts

If port 3001 is busy:
1. Change PORT in `.env` file
2. Update REACT_APP_SERVER_URL in `client/.env`
3. Restart both client and server
