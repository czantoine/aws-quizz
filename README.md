# AWS Quiz - Interactive Quiz Platform

A real-time, interactive quiz application built with Node.js and Socket.io. Host and players connect through QR codes to participate in live quiz sessions with real-time scoring, reactions, and celebration animations.

## Features

- 🎯 **Real-time Quiz Sessions** - Host-controlled quiz with live player updates
- 📱 **QR Code Connection** - Players join via QR code scan
- 🎬 **Live Display Screen** - Dedicated display for quiz content and results
- 👍 **Player Reactions** - Cats, thumbs up, thumbs down emojis during gameplay
- 🔥 **Fire Streaks** - Celebrate consecutive correct answers
- 🎉 **Celebration Animations** - GIFs for correct and incorrect answers
- ⏱️ **Timed Questions** - 60-second countdown per question

## Project Structure

```
aws-quizz/
├── server.js              # Express server with Socket.io setup
├── public/
│   ├── index.html         # Main landing page
│   ├── host.html          # Host control interface
│   ├── host.js            # Host logic and controls
│   ├── display.html       # Display screen for quiz content
│   ├── display.js         # Display logic and rendering
│   ├── player.js          # Player interface logic
│   ├── runtime-config.js  # Runtime configuration
│   └── styles.css         # Global styling
├── package.json           # Dependencies and scripts
├── netlify.toml           # Netlify deployment configuration
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aws-quizz
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage

### Host Interface

1. Navigate to `/host` on your machine
2. Configure quiz questions
3. Generate a QR code for players to join
4. Control the quiz flow (start, next question, show answers)

### Display Screen

1. Open `/display` on a projector or shared screen
2. Shows current question and player responses in real-time
3. Displays celebration GIFs for correct/incorrect answers
4. Shows player scores and fire streaks

### Players

1. Scan the QR code with their mobile device
2. Enter their name
3. Answer questions as they appear
4. Send reactions during the quiz
5. View their score and ranking

## Dependencies

- **express** - Web framework
- **socket.io** - Real-time bidirectional communication
- **qrcode** - QR code generation

## Configuration

### Server Configuration

Key constants in `server.js`:

- `DEFAULT_PORT` - Server port (default: 3000)
- `QUESTION_DURATION_SECONDS` - Time per question (default: 60)
- `REACTION_COOLDOWN_MS` - Cooldown between reactions (default: 600ms)
- `FIRE_STREAK_MIN` - Minimum streak for fire emoji (default: 2)
- `FIRE_STREAK_SUPER` - Super streak threshold (default: 3)

### Socket.io URL Configuration

Update the backend URL in `public/runtime-config.js`:

```javascript
window.APP_CONFIG = {
  SOCKET_URL: "https://your-backend-url.onrender.com"  // Update with your Render backend URL
};
```

## Architecture

This project uses a **separated architecture**:

- **Frontend** (Static): Deployed on **Netlify** at https://aws-quizz.netlify.app
  - HTML, CSS, JavaScript files
  - Communicates with backend via Socket.io
  
- **Backend** (Node.js Server): Deployed on **Render** at https://aws-quizz.onrender.com
  - Express server with Socket.io
  - Handles real-time quiz logic
  - Manages player connections and quiz state

## Deployment

### Backend (Render)

1. Push your code to GitHub
2. Connect your repository to Render.com
3. Create a new Web Service:
   - Select your GitHub repository
   - Build command: `npm install`
   - Start command: `node server.js`
   - Set `PORT` environment variable to `3000` (or let Render auto-assign)
4. Deploy and get your backend URL (e.g., `https://aws-quizz.onrender.com`)

### Frontend (Netlify)

1. Update `public/runtime-config.js` with your Render backend URL
2. Push to GitHub
3. Connect your repository to Netlify.com
4. Deploy settings:
   - Build command: (leave empty - static files only)
   - Publish directory: `public`
5. The `netlify.toml` file handles routing for the single-page application

### Local Development

To test the full stack locally:

1. Start the backend server:
```bash
npm run dev
```

2. In `public/runtime-config.js`, set:
```javascript
window.APP_CONFIG = {
  SOCKET_URL: "http://localhost:3000"
};
```

3. Serve the frontend (using any local server):
```bash
# Example with Python
python -m http.server 8000 --directory public
```

## Technologies

- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **QR Codes**: qrcode library

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
