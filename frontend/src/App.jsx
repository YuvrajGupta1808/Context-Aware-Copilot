import { useEffect, useRef, useState } from 'react'

// Icons as simple SVG components
const MicIcon = ({ muted }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {muted ? (
      <>
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    ) : (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    )}
  </svg>
)

const VideoIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {off ? (
      <>
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </>
    )}
  </svg>
)

const ScreenShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const RecordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
)

const EndCallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const ChevronIcon = ({ direction }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {direction === 'up' ? (
      <polyline points="18 15 12 9 6 15" />
    ) : (
      <polyline points="6 9 12 15 18 9" />
    )}
  </svg>
)

// Mock transcript data
const mockTranscripts = [
  { id: 1, speaker: 'Mike Wilner', time: '10:23', text: "I'll get back to you regarding your proposal after I've discussed it internally." },
  { id: 2, speaker: 'Anna Ericson', time: '10:24', text: 'Do you think you\'ll get around to that next week?' },
  { id: 3, speaker: 'Mike Wilner', time: '10:25', text: 'Yes, I think we can manage it by Wednesday.' },
  { id: 4, speaker: 'Anna Ericson', time: '10:26', text: "Fantastic! Let's schedule our next meeting for Thursday then." },
  { id: 5, speaker: 'Jennifer Burton', time: '10:27', text: 'I can prepare the presentation slides by then.' },
]

const mockSummary = [
  'Discussion about project proposal timeline',
  'Mike will review proposal internally',
  'Target completion by Wednesday',
  'Follow-up meeting scheduled for Thursday',
  'Jennifer to prepare presentation materials',
]

const mockEmotions = [
  { speaker: 'Mike Wilner', emotion: 'Confident', confidence: 85, color: '#22c55e' },
  { speaker: 'Anna Ericson', emotion: 'Engaged', confidence: 92, color: '#3b82f6' },
  { speaker: 'Jennifer Burton', emotion: 'Neutral', confidence: 78, color: '#6b7280' },
]


// Participant thumbnail component
function ParticipantThumbnail({ name, isActive, isSpeaking }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  return (
    <div className={`relative flex flex-col items-center ${isActive ? 'ring-2 ring-green-500 rounded-lg' : ''}`}>
      <div className={`w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center ${isSpeaking ? 'ring-2 ring-green-400' : ''}`}>
        <span className="text-white text-sm font-medium">{initials}</span>
      </div>
      <span className="text-white text-xs mt-1 truncate max-w-24">{name}</span>
    </div>
  )
}

// Right panel tab content
function TranscriptPanel({ transcripts }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {transcripts.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">
              {item.speaker.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">{item.speaker}</span>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SummaryPanel({ summary }) {
  return (
    <div className="p-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Meeting Summary</h4>
        <ul className="space-y-2">
          {summary.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-blue-500 flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EmotionsPanel({ emotions }) {
  return (
    <div className="p-4 space-y-4">
      {emotions.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 text-sm">{item.speaker}</span>
            <span className="text-sm" style={{ color: item.color }}>{item.emotion}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${item.confidence}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1 block">{item.confidence}% confidence</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [activeTab, setActiveTab] = useState('transcript')
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [meetingTime, setMeetingTime] = useState(0)
  const [userName, setUserName] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Timer for meeting duration
  useEffect(() => {
    let interval
    if (isInMeeting) {
      interval = setInterval(() => {
        setMeetingTime(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isInMeeting])

  // Camera handling
  useEffect(() => {
    if (isInMeeting && !isVideoOff) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isInMeeting, isVideoOff])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.log('Camera access denied or not available')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const joinMeeting = () => {
    setIsInMeeting(true)
    setMeetingTime(0)
  }

  const leaveMeeting = () => {
    setIsInMeeting(false)
    stopCamera()
    setMeetingTime(0)
  }

  const tabs = [
    { id: 'transcript', label: 'Transcript' },
    { id: 'summary', label: 'Summary' },
    { id: 'emotions', label: 'Emotions' },
  ]


  // Pre-meeting join screen
  if (!isInMeeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center gap-16">
        {/* Left side - App info */}
        <div className="-mt-[10%]">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Emotion Copilot</h1>
            </div>
            
            <p className="text-xl text-gray-600 mb-8">
              Real-time emotional intelligence for your meetings. Understand the room, improve communication, and build stronger connections.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Live Transcription</h3>
                  <p className="text-gray-500 text-sm">Automatic speech-to-text with speaker identification</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Emotion Analysis</h3>
                  <p className="text-gray-500 text-sm">Detect sentiment and emotional cues in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="4" y1="12" x2="14" y2="12"/>
                    <line x1="4" y1="18" x2="18" y2="18"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Summaries</h3>
                  <p className="text-gray-500 text-sm">AI-generated meeting highlights and action items</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Privacy First</h3>
                  <p className="text-gray-500 text-sm">All processing happens locally, no data stored</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Join section */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px]">
            {/* Preview area with illustration */}
            <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-6 overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Meeting illustration */}
                <div className="flex items-end gap-3 mb-4">
                  <div className="w-14 h-18 bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="w-7 h-7 bg-slate-600 rounded-full" />
                  </div>
                  <div className="w-18 h-22 bg-blue-600/30 rounded-lg flex items-center justify-center border-2 border-blue-500 px-4 py-5">
                    <div className="w-9 h-9 bg-blue-500/50 rounded-full" />
                  </div>
                  <div className="w-14 h-18 bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="w-7 h-7 bg-slate-600 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-sm">Ready to connect</span>
                </div>
              </div>
            </div>
            
            {/* Name input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MicIcon muted={isMuted} />
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <VideoIcon off={isVideoOff} />
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Ready to join?</h2>
              <p className="text-gray-500 text-sm mb-5">Camera and microphone are configured</p>
              
              <button
                onClick={joinMeeting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main meeting view
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="h-12 bg-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-white text-sm font-medium">Emotion Copilot</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{formatTime(meetingTime)}</span>
        </div>
      </div>

      {/* Participant thumbnails */}
      <div className="h-24 bg-gray-800/50 flex items-center justify-center gap-4 px-4">
        <ParticipantThumbnail name="Jennifer Burton" isActive={false} isSpeaking={false} />
        <ParticipantThumbnail name="Mike Wilner" isActive={false} isSpeaking={true} />
        <ParticipantThumbnail name="Anna Ericson" isActive={true} isSpeaking={false} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-3xl text-white font-medium">You</span>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 rounded text-white text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Recording</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 bg-white flex flex-col">
          {/* Panel header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Meeting Insights</h3>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'transcript' && <TranscriptPanel transcripts={mockTranscripts} />}
            {activeTab === 'summary' && <SummaryPanel summary={mockSummary} />}
            {activeTab === 'emotions' && <EmotionsPanel emotions={mockEmotions} />}
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="h-16 bg-gray-800 flex items-center justify-center gap-2 px-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-colors ${
            isMuted ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <MicIcon muted={isMuted} />
          <span className="text-xs mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-colors ${
            isVideoOff ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <VideoIcon off={isVideoOff} />
          <span className="text-xs mt-1">{isVideoOff ? 'Start' : 'Stop'}</span>
        </button>

        <button className="flex flex-col items-center justify-center w-16 h-12 rounded text-gray-300 hover:bg-gray-700 transition-colors">
          <ScreenShareIcon />
          <span className="text-xs mt-1">Share</span>
        </button>

        <button className="flex flex-col items-center justify-center w-16 h-12 rounded text-gray-300 hover:bg-gray-700 transition-colors">
          <UsersIcon />
          <span className="text-xs mt-1">Participants</span>
        </button>

        <button className="flex flex-col items-center justify-center w-16 h-12 rounded text-gray-300 hover:bg-gray-700 transition-colors">
          <ChatIcon />
          <span className="text-xs mt-1">Chat</span>
        </button>

        <button className="flex flex-col items-center justify-center w-16 h-12 rounded text-gray-300 hover:bg-gray-700 transition-colors">
          <RecordIcon />
          <span className="text-xs mt-1">Record</span>
        </button>

        <button
          onClick={leaveMeeting}
          className="flex items-center justify-center px-6 h-10 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors ml-4"
        >
          End
        </button>
      </div>
    </div>
  )
}
