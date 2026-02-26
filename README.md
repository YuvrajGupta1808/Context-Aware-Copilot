# Emotion Copilot

**Private Multimodal Meeting Intelligence** - Real-time emotion detection, AI transcription, and voice-enabled AI assistant for video meetings.

[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/bnSzFO4LmD4)

## 🎬 Demo

[![Watch the Demo](https://img.youtube.com/vi/bnSzFO4LmD4/maxresdefault.jpg)](https://youtu.be/bnSzFO4LmD4)

**[▶️ Watch Full Demo on YouTube](https://youtu.be/bnSzFO4LmD4)**

---

## Why Emotion Copilot?

| Feature | Zoom/Google Meet | Emotion Copilot |
|---------|------------------|-----------------|
| Data Storage | Stored on corporate servers | Zero retention - deleted after meeting |
| AI Assistant | Paid add-on | Built-in, speaks back |
| Emotion Detection | ❌ | ✅ Real-time |
| Infrastructure | Centralized | Decentralized (Akash) |
| Privacy | Trust Big Tech | Verify yourself |

*"Zoom records everything. We remember nothing."*

---

## Features

### 🎥 Video Conferencing
- WebRTC peer-to-peer calls
- Multi-participant support
- Mute/video controls

### 🎤 Live Transcription
- Real-time speech-to-text (Venice Whisper API)
- Speaker identification
- Shared across participants

### 😊 Emotion Analysis
- AI facial expression detection (Venice Vision API)
- Mood tracking: Confident, Engaged, Confused, Frustrated
- Meeting mood overview

### 📝 AI Summaries
- Auto-generated key points
- Action items extraction
- Sentiment analysis

### 🤖 Voice AI Agent
- AI assistant joins your meeting
- Responds to questions with voice
- Customizable personality
- Uses Venice Kokoro TTS

### 🔒 Privacy-First
- Zero raw audio/video storage
- Session-only data
- AES-256-GCM encrypted memory
- Decentralized on Akash Network

---

## Quick Start

### Local Development

```bash
# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` in project root:
```
VENICE_API_KEY=your-venice-api-key
```

---

## Two-Person Demo

### Person 1 (Alice)
1. Open app URL
2. Enter name: "Alice"
3. Click "Start Meeting"

### Person 2 (Bob)
1. Open same URL (different browser/device)
2. Enter name: "Bob"
3. Click "Start Meeting"

### Try Features
1. **Record** → Start transcription
2. **Add AI** → Add voice assistant
3. Ask: *"Hey Assistant, what should we discuss?"*
4. **Emotions tab** → See mood detection
5. **Summary tab** → See AI-generated summary

---

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + WebSocket
- **Video**: WebRTC (peer-to-peer)
- **AI**: Venice AI (Whisper, Vision, Kokoro TTS)
- **Infrastructure**: Akash Network (decentralized)
- **Memory**: Redis with AES-256-GCM encryption

---

## Deployment (Akash)

```bash
# Build Docker image
docker build -t your-username/emotion-copilot:v1 .
docker push your-username/emotion-copilot:v1

# Deploy on Akash Console
# Upload deploy.yaml
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/privacy-status` | Privacy dashboard |
| `GET /api/encrypted-memory` | Encrypted memory stats |
| `POST /api/transcribe` | Audio transcription |
| `POST /api/analyze-emotion` | Emotion detection |
| `POST /api/generate-summary` | Meeting summary |
| `POST /api/add-agent` | Add AI agent |
| `POST /api/tts` | Text-to-speech |

---

## Privacy Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Device                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ Camera  │───▶│ WebRTC  │───▶│ P2P     │         │
│  │ Mic     │    │ (E2E)   │    │ Stream  │         │
│  └─────────┘    └─────────┘    └─────────┘         │
└─────────────────────────────────────────────────────┘
                       │
                       ▼ (encrypted)
┌─────────────────────────────────────────────────────┐
│              Akash Network (Decentralized)           │
│  ┌─────────────┐    ┌─────────────────────┐        │
│  │ App Server  │───▶│ Redis (AES-256-GCM) │        │
│  │ (Session)   │    │ (Session Keys Only) │        │
│  └─────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────┘
                       │
                       ▼ (zero retention)
┌─────────────────────────────────────────────────────┐
│              Venice AI (Privacy-First)               │
│  • No data logging  • No model training             │
│  • Immediate discard after processing               │
└─────────────────────────────────────────────────────┘
```

---

## License

MIT

---

## Built For

**Venice Track - Private Multimodal Intelligence**  
Akash Hackathon 2024
