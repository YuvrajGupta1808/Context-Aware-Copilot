import { useCallback, useEffect, useRef, useState } from 'react'

const WS_URL = 'ws://localhost:8080'
const API_URL = 'http://localhost:8081'
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

const MicIcon = ({ muted }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {muted ? (
      <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
    ) : (
      <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
    )}
  </svg>
)

const VideoIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {off ? (
      <><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></>
    ) : (
      <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>
    )}
  </svg>
)

const ScreenShareIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>)
const UsersIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)
const ChatIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>)
const RecordIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>)

function ParticipantVideo({ participant, stream, isYou, isLarge }) {
  const videoRef = useRef(null)
  const initials = participant.name.split(' ').map(n => n[0]).join('').toUpperCase()

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (isLarge) {
    return (
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        {stream && !participant.isVideoOff ? (
          <video ref={videoRef} autoPlay playsInline muted={isYou} className="max-w-full max-h-full object-contain" style={{ maxHeight: 'calc(100vh - 200px)' }} />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-3xl text-white font-medium">{initials}</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-gray-800/80 rounded text-white text-sm">{participant.name}{isYou ? ' (You)' : ''}</div>
        {participant.isMuted && <div className="absolute bottom-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"><MicIcon muted={true} /></div>}
      </div>
    )
  }

  return (
    <div className={`relative flex flex-col items-center ${isYou ? 'ring-2 ring-green-500 rounded-lg p-1' : ''}`}>
      <div className="w-32 h-24 bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
        {stream && !participant.isVideoOff ? (
          <video ref={videoRef} autoPlay playsInline muted={isYou} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-lg font-medium">{initials}</span>
        )}
        {participant.isMuted && <div className="absolute bottom-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="1" y1="1" x2="23" y2="23" /></svg></div>}
      </div>
      <span className="text-white text-xs mt-1 truncate max-w-32">{isYou ? `${participant.name} (You)` : participant.name}</span>
    </div>
  )
}

function TranscriptPanel({ transcripts }) {
  if (!transcripts.length) return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No transcripts yet</div>
  return (
    <div className="flex flex-col gap-3 p-4">
      {transcripts.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-300">{item.speaker.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><span className="font-medium text-gray-200 text-sm">{item.speaker}</span><span className="text-xs text-gray-500">{item.time}</span></div>
            <p className="text-sm text-gray-400 mt-1">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SummaryPanel({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2 text-gray-400 text-sm">Generating summary...</span>
      </div>
    )
  }

  if (!summary) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Summary will appear after transcription</div>
  }

  const sentimentColors = {
    Positive: 'text-green-400',
    Negative: 'text-red-400',
    Mixed: 'text-yellow-400',
    Neutral: 'text-gray-400'
  }

  // Helper to render item (handles both string and object formats)
  const renderItem = (item) => {
    if (typeof item === 'string') return item
    if (typeof item === 'object' && item !== null) {
      // Handle various object formats the AI might return
      return item.text || item.item || item.description || item.action || item.task || JSON.stringify(item)
    }
    return String(item)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-200">Key Points</h4>
          <span className={`text-sm ${sentimentColors[summary.overallSentiment] || 'text-gray-400'}`}>
            {summary.overallSentiment}
          </span>
        </div>
        <ul className="space-y-2">
          {summary.keyPoints?.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-400">
              <span className="text-blue-400">•</span>{renderItem(item)}
            </li>
          ))}
        </ul>
      </div>

      {summary.actionItems?.length > 0 && (
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-800/50">
          <h4 className="font-medium text-gray-200 mb-3">Action Items</h4>
          <ul className="space-y-2">
            {summary.actionItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-400">
                <span className="text-green-400">✓</span>{renderItem(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.emotionalInsights && (
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-800/50">
          <h4 className="font-medium text-gray-200 mb-2">Emotional Insights</h4>
          <p className="text-sm text-gray-400">{typeof summary.emotionalInsights === 'string' ? summary.emotionalInsights : JSON.stringify(summary.emotionalInsights)}</p>
        </div>
      )}
    </div>
  )
}

function EmotionsPanel({ emotions, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        <span className="ml-2 text-gray-400 text-sm">Analyzing emotions...</span>
      </div>
    )
  }

  if (!emotions.length) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Click this tab to analyze emotions</div>
  }

  const emotionColors = {
    Confident: '#22c55e',
    Engaged: '#3b82f6',
    Neutral: '#6b7280',
    Focused: '#8b5cf6',
    Confused: '#f59e0b',
    Frustrated: '#ef4444',
    Happy: '#10b981',
    Concerned: '#f97316'
  }

  // Calculate overall meeting mood
  const moodCounts = emotions.reduce((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1
    return acc
  }, {})
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral'
  const avgConfidence = Math.round(emotions.reduce((sum, e) => sum + (e.confidence || 0), 0) / emotions.length)

  return (
    <div className="p-4 space-y-4">
      {/* Reason/Summary Section */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <h4 className="font-medium text-gray-200 text-sm mb-2">Meeting Mood</h4>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${emotionColors[dominantMood]}20` }}
          >
            <span className="text-lg">
              {dominantMood === 'Happy' || dominantMood === 'Engaged' ? '😊' : 
               dominantMood === 'Confident' ? '💪' :
               dominantMood === 'Focused' ? '🎯' :
               dominantMood === 'Confused' ? '🤔' :
               dominantMood === 'Frustrated' ? '😤' :
               dominantMood === 'Concerned' ? '😟' : '😐'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: emotionColors[dominantMood] }}>{dominantMood}</p>
            <p className="text-xs text-gray-500">{avgConfidence}% avg confidence • {emotions.length} participant{emotions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Individual Participants */}
      {emotions.map((e, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-200 text-sm">{e.participantName}</span>
            <span className="text-sm" style={{ color: emotionColors[e.emotion] || '#6b7280' }}>
              {e.emotion}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ width: `${e.confidence}%`, backgroundColor: emotionColors[e.emotion] || '#6b7280' }} 
            />
          </div>
          <span className="text-xs text-gray-500 mt-1 block">{e.confidence}% confidence</span>
          <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-400">
            <span className="text-gray-500">Reason: </span>{e.reason || e.description || 'Analyzing facial expression and body language'}
          </div>
        </div>
      ))}
    </div>
  )
}

function ParticipantsPanel({ participants, odId }) {
  return (
    <div className="p-4 space-y-2">
      <div className="text-sm text-gray-400 mb-3">In this meeting ({participants.length})</div>
      {participants.map((p) => (
        <div key={p.odId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-300">{p.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <span className="text-gray-200 text-sm">{p.name}{p.odId === odId ? ' (You)' : ''}</span>
          </div>
          <div className="flex gap-2">
            {p.isMuted && <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><MicIcon muted={true} /></div>}
            {p.isVideoOff && <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><VideoIcon off={true} /></div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatPanel({ messages, onSend, userName }) {
  const [message, setMessage] = useState('')
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">No messages yet</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-300">{msg.sender.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-200">{msg.sender}</span><span className="text-xs text-gray-500">{msg.time}</span></div>
                <p className="text-sm text-gray-400">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && message.trim()) {
                onSend(message)
                setMessage('')
              }
            }}
          />
          <button
            onClick={() => { if (message.trim()) { onSend(message); setMessage('') } }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >Send</button>
        </div>
      </div>
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
  const [odId, setOdId] = useState(null)
  const [participants, setParticipants] = useState([])
  const [transcripts, setTranscripts] = useState([])
  const [remoteStreams, setRemoteStreams] = useState({})
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [rightPanel, setRightPanel] = useState('insights') // 'insights', 'participants', 'chat'
  const [chatMessages, setChatMessages] = useState([])
  const [panelWidth, setPanelWidth] = useState(288) // 288px = w-72
  const [emotions, setEmotions] = useState([])
  const [summary, setSummary] = useState(null)
  const [isAnalyzingEmotions, setIsAnalyzingEmotions] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const isResizing = useRef(false)
  
  const localStreamRef = useRef(null)
  const wsRef = useRef(null)
  const peerConnectionsRef = useRef({})
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const emotionIntervalRef = useRef(null)
  const videoCanvasRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const isRecordingRef = useRef(false)

  const createPeerConnection = useCallback((targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate, target: targetId }))
      }
    }
    pc.ontrack = (e) => setRemoteStreams(prev => ({ ...prev, [targetId]: e.streams[0] }))
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current))
    }
    peerConnectionsRef.current[targetId] = pc
    return pc
  }, [])

  const handleOffer = useCallback(async (offer, fromId) => {
    const pc = createPeerConnection(fromId)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    wsRef.current?.send(JSON.stringify({ type: 'answer', answer, target: fromId }))
  }, [createPeerConnection])

  const handleAnswer = useCallback(async (answer, fromId) => {
    const pc = peerConnectionsRef.current[fromId]
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }, [])

  const handleIceCandidate = useCallback(async (candidate, fromId) => {
    const pc = peerConnectionsRef.current[fromId]
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }, [])

  const connectToParticipant = useCallback(async (targetId) => {
    const pc = createPeerConnection(targetId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    wsRef.current?.send(JSON.stringify({ type: 'offer', offer, target: targetId }))
  }, [createPeerConnection])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'joined') setOdId(data.odId)
      if (data.type === 'participants') setParticipants(data.participants)
      if (data.type === 'existing-participants') data.participants.forEach(p => connectToParticipant(p.odId))
      if (data.type === 'offer') handleOffer(data.offer, data.from)
      if (data.type === 'answer') handleAnswer(data.answer, data.from)
      if (data.type === 'ice-candidate') handleIceCandidate(data.candidate, data.from)
      if (data.type === 'chat') setChatMessages(prev => [...prev, data.message])
      if (data.type === 'user-left') {
        if (peerConnectionsRef.current[data.odId]) {
          peerConnectionsRef.current[data.odId].close()
          delete peerConnectionsRef.current[data.odId]
        }
        setRemoteStreams(prev => { const n = { ...prev }; delete n[data.odId]; return n })
      }
    }
  }, [connectToParticipant, handleOffer, handleAnswer, handleIceCandidate])

  useEffect(() => {
    let interval
    if (isInMeeting) interval = setInterval(() => setMeetingTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isInMeeting])

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && odId) {
      wsRef.current.send(JSON.stringify({ type: 'update', updates: { isMuted, isVideoOff } }))
    }
    // Actually mute/unmute audio track
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted
      })
    }
  }, [isMuted, odId])

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && odId) {
      wsRef.current.send(JSON.stringify({ type: 'update', updates: { isMuted, isVideoOff } }))
    }
    // Actually enable/disable video track
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff
      })
    }
  }, [isVideoOff, odId])

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      return stream
    } catch { return null }
  }

  const stopMedia = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    localStreamRef.current = null
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close())
    peerConnectionsRef.current = {}
    setRemoteStreams({})
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const joinMeeting = async () => {
    if (!userName.trim()) return alert('Please enter your name')
    await startMedia()
    connectWebSocket()
    const check = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        clearInterval(check)
        wsRef.current.send(JSON.stringify({ type: 'join', name: userName.trim(), isMuted, isVideoOff }))
        setIsInMeeting(true)
        setMeetingTime(0)
      }
    }, 100)
    setTimeout(() => clearInterval(check), 5000)
  }

  const leaveMeeting = () => {
    stopRecording()
    stopEmotionAnalysis()
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    wsRef.current?.send(JSON.stringify({ type: 'leave' }))
    wsRef.current?.close()
    stopMedia()
    setIsInMeeting(false)
    setMeetingTime(0)
    setParticipants([])
    setOdId(null)
    setSelectedParticipant(null)
    setTranscripts([])
    setEmotions([])
    setSummary(null)
  }

  const tabs = [{ id: 'transcript', label: 'Transcript' }, { id: 'summary', label: 'Summary' }, { id: 'emotions', label: 'Emotions' }]
  const otherParticipants = participants.filter(p => p.odId !== odId)
  const displayParticipant = selectedParticipant ? participants.find(p => p.odId === selectedParticipant) : (otherParticipants[0] || participants.find(p => p.odId === odId))

  const sendChatMessage = (text) => {
    const message = { sender: userName, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setChatMessages(prev => [...prev, message])
    wsRef.current?.send(JSON.stringify({ type: 'chat', message }))
  }

  const handleMouseDown = (e) => {
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!isResizing.current) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 200 && newWidth <= 500) {
      setPanelWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Transcribe audio using Venice API
  const transcribeAudio = async (audioBlob) => {
    try {
      console.log('Transcribing audio blob:', audioBlob.size, 'bytes')
      
      // Convert webm to wav using AudioContext
      const wavBlob = await convertToWav(audioBlob)
      console.log('Converted to WAV:', wavBlob.size, 'bytes')
      
      const formData = new FormData()
      formData.append('file', wavBlob, 'audio.wav')
      formData.append('model', 'openai/whisper-large-v3')
      formData.append('response_format', 'json')

      const res = await fetch(`${API_URL}/api/transcribe`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      console.log('Transcription response:', result)
      if (result.text && result.text.trim()) {
        const newTranscript = {
          speaker: userName,
          text: result.text.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setTranscripts(prev => [...prev, newTranscript])
      }
    } catch (err) {
      console.error('Transcription error:', err)
    }
  }

  // Convert audio blob to WAV format
  const convertToWav = async (blob) => {
    const audioContext = new AudioContext()
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // Create WAV file
    const numChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16
    
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    
    const samples = audioBuffer.length
    const dataSize = samples * blockAlign
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)
    
    // Write audio data
    const channelData = []
    for (let i = 0; i < numChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i))
    }
    
    let offset = 44
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' })
  }

  // Analyze emotion from video frame using Venice Vision API
  const analyzeEmotion = async (participantName, videoElement) => {
    if (!videoElement || !videoCanvasRef.current) return null

    try {
      const canvas = videoCanvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = 320
      canvas.height = 240
      ctx.drawImage(videoElement, 0, 0, 320, 240)
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]

      const res = await fetch(`${API_URL}/api/analyze-emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, participantName })
      })

      return await res.json()
    } catch (err) {
      console.error('Emotion analysis error:', err)
      return null
    }
  }

  // Generate meeting summary using Venice Thinking API
  const generateSummary = async () => {
    if (transcripts.length === 0) return

    setIsGeneratingSummary(true)
    try {
      const res = await fetch(`${API_URL}/api/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcripts, emotions })
      })

      const result = await res.json()
      setSummary(result)
    } catch (err) {
      console.error('Summary generation error:', err)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // Start audio recording for transcription
  const startRecording = () => {
    if (!localStreamRef.current) {
      console.log('No local stream available')
      return
    }

    const audioTracks = localStreamRef.current.getAudioTracks()
    if (audioTracks.length === 0) {
      console.log('No audio tracks available')
      return
    }

    console.log('Starting recording...')
    const audioStream = new MediaStream(audioTracks)
    
    // Check supported mime types
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'
    
    console.log('Using mime type:', mimeType)
    const mediaRecorder = new MediaRecorder(audioStream, { mimeType })
    
    mediaRecorder.ondataavailable = (e) => {
      console.log('Audio data available:', e.data.size, 'bytes')
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      console.log('Recorder stopped, chunks:', audioChunksRef.current.length)
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        audioChunksRef.current = []
        await transcribeAudio(audioBlob)
      }
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // Collect data every second
    setIsRecording(true)
    isRecordingRef.current = true

    // Stop and transcribe every 10 seconds
    recordingIntervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'recording' && isRecordingRef.current) {
        console.log('Stopping recorder for transcription...')
        mediaRecorderRef.current.stop()
        setTimeout(() => {
          if (isRecordingRef.current && localStreamRef.current) {
            console.log('Restarting recorder...')
            mediaRecorderRef.current?.start(1000)
          }
        }, 500)
      }
    }, 10000)
  }

  const stopRecording = () => {
    console.log('Stopping recording...')
    isRecordingRef.current = false
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  // Periodic emotion analysis
  const startEmotionAnalysis = () => {
    emotionIntervalRef.current = setInterval(async () => {
      setIsAnalyzingEmotions(true)
      const videoElements = document.querySelectorAll('video')
      const newEmotions = []

      for (const participant of participants) {
        // Find video element for this participant
        const videoEl = Array.from(videoElements).find(v => v.srcObject)
        if (videoEl && !participant.isVideoOff) {
          const emotion = await analyzeEmotion(participant.name, videoEl)
          if (emotion) newEmotions.push(emotion)
        }
      }

      if (newEmotions.length > 0) {
        setEmotions(newEmotions)
      }
      setIsAnalyzingEmotions(false)
    }, 30000) // Analyze every 30 seconds
  }

  const stopEmotionAnalysis = () => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current)
      emotionIntervalRef.current = null
    }
  }


  if (!isInMeeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center gap-16">
        <div className="-mt-[10%]">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Emotion Copilot</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">Real-time emotional intelligence for your meetings.</p>
            <div className="space-y-4">
              <div className="flex items-start gap-4"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div><h3 className="font-semibold text-gray-900">Live Transcription</h3><p className="text-gray-500 text-sm">Automatic speech-to-text</p></div></div>
              <div className="flex items-start gap-4"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg></div><div><h3 className="font-semibold text-gray-900">Emotion Analysis</h3><p className="text-gray-500 text-sm">Real-time sentiment detection</p></div></div>
              <div className="flex items-start gap-4"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg></div><div><h3 className="font-semibold text-gray-900">Smart Summaries</h3><p className="text-gray-500 text-sm">AI-generated highlights</p></div></div>
              <div className="flex items-start gap-4"><div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div><h3 className="font-semibold text-gray-900">Privacy First</h3><p className="text-gray-500 text-sm">Local processing only</p></div></div>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px]">
            <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-6 flex flex-col items-center justify-center">
              <div className="flex items-end gap-3 mb-4">
                <div className="w-14 h-16 bg-slate-700 rounded-lg flex items-center justify-center"><div className="w-7 h-7 bg-slate-600 rounded-full" /></div>
                <div className="w-16 h-20 bg-blue-600/30 rounded-lg flex items-center justify-center border-2 border-blue-500"><div className="w-9 h-9 bg-blue-500/50 rounded-full" /></div>
                <div className="w-14 h-16 bg-slate-700 rounded-lg flex items-center justify-center"><div className="w-7 h-7 bg-slate-600 rounded-full" /></div>
              </div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-slate-400 text-sm">Ready to connect</span></div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" onKeyDown={(e) => e.key === 'Enter' && joinMeeting()} />
            </div>
            <div className="flex items-center justify-center gap-4 mb-5">
              <button onClick={() => setIsMuted(!isMuted)} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><MicIcon muted={isMuted} /></button>
              <button onClick={() => setIsVideoOff(!isVideoOff)} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><VideoIcon off={isVideoOff} /></button>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Ready to join?</h2>
              <p className="text-gray-500 text-sm mb-5">Camera and microphone configured</p>
              <button onClick={joinMeeting} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Start Meeting</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Hidden canvas for video frame capture */}
      <canvas ref={videoCanvasRef} style={{ display: 'none' }} />
      <div className="h-12 bg-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4"><span className="text-white text-sm font-medium">Emotion Copilot</span><span className="text-gray-400 text-sm">|</span><span className="text-gray-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span></div>
        <span className="text-gray-400 text-sm">{formatTime(meetingTime)}</span>
      </div>
      <div className="min-h-28 bg-gray-800/50 flex items-center justify-center gap-4 px-4 py-3 flex-wrap">
        {participants.map((p) => (
          <div key={p.odId} onClick={() => setSelectedParticipant(p.odId === selectedParticipant ? null : p.odId)} className={`cursor-pointer transition-all ${selectedParticipant === p.odId ? 'ring-2 ring-blue-500 rounded-lg scale-105' : 'hover:scale-105'}`}>
            <ParticipantVideo participant={p} stream={p.odId === odId ? localStreamRef.current : remoteStreams[p.odId]} isYou={p.odId === odId} isLarge={false} />
          </div>
        ))}
        {!participants.length && <span className="text-gray-500 text-sm">Waiting for participants...</span>}
      </div>
      <div className="flex-1 flex">
        {displayParticipant && <ParticipantVideo participant={displayParticipant} stream={displayParticipant.odId === odId ? localStreamRef.current : remoteStreams[displayParticipant.odId]} isYou={displayParticipant.odId === odId} isLarge={true} />}
        <div className="relative flex" style={{ width: panelWidth }}>
          {/* Resize handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
          />
          <div className="flex-1 bg-gray-850 border-l border-gray-700 flex flex-col" style={{ backgroundColor: '#1e2530' }}>
            {rightPanel === 'insights' && (
              <>
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-semibold text-gray-200 text-sm mb-2">Meeting Insights</h3>
                  <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                    {tabs.map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => {
                          setActiveTab(tab.id)
                          // Auto-trigger analysis on tab click
                          if (tab.id === 'emotions' && !isAnalyzingEmotions && participants.length > 0) {
                            (async () => {
                              setIsAnalyzingEmotions(true)
                              const videoElements = document.querySelectorAll('video')
                              const newEmotions = []
                              for (const participant of participants) {
                                const videoEl = Array.from(videoElements).find(v => v.srcObject && !participant.isVideoOff)
                                if (videoEl) {
                                  const emotion = await analyzeEmotion(participant.name, videoEl)
                                  if (emotion) newEmotions.push(emotion)
                                }
                              }
                              if (newEmotions.length > 0) setEmotions(newEmotions)
                              setIsAnalyzingEmotions(false)
                            })()
                          }
                          if (tab.id === 'summary' && !isGeneratingSummary && transcripts.length > 0) {
                            generateSummary()
                          }
                        }} 
                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'transcript' && <TranscriptPanel transcripts={transcripts} />}
                  {activeTab === 'summary' && <SummaryPanel summary={summary} isLoading={isGeneratingSummary} />}
                  {activeTab === 'emotions' && <EmotionsPanel emotions={emotions} isLoading={isAnalyzingEmotions} />}
                </div>
              </>
            )}
            {rightPanel === 'participants' && (
              <>
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-semibold text-gray-200 text-sm">Participants ({participants.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ParticipantsPanel participants={participants} odId={odId} />
                </div>
              </>
            )}
            {rightPanel === 'chat' && (
              <>
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-semibold text-gray-200 text-sm">Chat</h3>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChatPanel messages={chatMessages} onSend={sendChatMessage} userName={userName} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-16 bg-gray-800 flex items-center justify-center px-7">
        <div className="flex items-center gap-1 bg-gray-700/50 rounded-xl p-1.5">
          <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <MicIcon muted={isMuted} />
            <span className="text-[10px] mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button onClick={() => setIsVideoOff(!isVideoOff)} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <VideoIcon off={isVideoOff} />
            <span className="text-[10px] mt-1">{isVideoOff ? 'Start' : 'Stop'}</span>
          </button>
          <div className="w-px h-8 bg-gray-600 mx-1"></div>
          <button onClick={() => setRightPanel('insights')} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${rightPanel === 'insights' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <ScreenShareIcon />
            <span className="text-[10px] mt-1">Insights</span>
          </button>
          <button onClick={() => setRightPanel('participants')} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${rightPanel === 'participants' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <UsersIcon />
            <span className="text-[10px] mt-1">Participants</span>
          </button>
          <button onClick={() => setRightPanel('chat')} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${rightPanel === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <ChatIcon />
            <span className="text-[10px] mt-1">Chat</span>
          </button>
          <button onClick={() => isRecording ? stopRecording() : startRecording()} className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
            <RecordIcon />
            <span className="text-[10px] mt-1">{isRecording ? 'Stop' : 'Record'}</span>
          </button>
        </div>
        <button onClick={leaveMeeting} className="ml-8 px-6 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-all">End</button>
      </div>
    </div>
  )
}
