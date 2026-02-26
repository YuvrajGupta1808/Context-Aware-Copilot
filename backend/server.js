import crypto from 'crypto'
import { config } from 'dotenv'
import http from 'http'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'
import { createMeetingAgent } from './bidi-agent.js'

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

const VENICE_API_KEY = process.env.VENICE_API_KEY || ''
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1'

// Models
const VISION_MODEL = 'qwen3-vl-235b-a22b'
const THINKING_MODEL = 'claude-opus-4-6'

// Bidi Agent instance (shared across the meeting)
let meetingAgent = null
let agentParticipantId = null

// HTTP server for REST endpoints
const httpServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Transcription endpoint
  if (req.method === 'POST' && req.url === '/api/transcribe') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = Buffer.concat(chunks)
      
      // Create a new FormData to send to Venice
      const boundary = req.headers['content-type']?.split('boundary=')[1]
      if (!boundary) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Missing boundary' }))
        return
      }

      // Forward to Venice API with proper headers
      const veniceRes = await fetch(`${VENICE_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VENICE_API_KEY}`,
          'Content-Type': req.headers['content-type']
        },
        body: body
      })

      if (!veniceRes.ok) {
        const errorText = await veniceRes.text()
        console.error('Venice API error:', veniceRes.status, errorText)
        res.writeHead(veniceRes.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: errorText }))
        return
      }

      const result = await veniceRes.json()
      console.log('Transcription result:', result)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      console.error('Transcription error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Emotion analysis endpoint (vision model)
  if (req.method === 'POST' && req.url === '/api/analyze-emotion') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { imageBase64, participantName } = JSON.parse(Buffer.concat(chunks).toString())

      const veniceRes = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VENICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze the facial expression and body language of the person in this image.

Return ONLY a JSON object with these exact fields:
{
  "emotion": "one of: Confident, Engaged, Neutral, Focused, Confused, Frustrated, Happy, Concerned",
  "confidence": 0-100,
  "reason": "2-3 sentence explanation of why you detected this emotion based on facial features, eye contact, posture, etc."
}

Only return valid JSON, no markdown, no other text.`
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                }
              ]
            }
          ],
          venice_parameters: { include_venice_system_prompt: false }
        })
      })

      const result = await veniceRes.json()
      console.log('Emotion API response:', JSON.stringify(result, null, 2))
      const content = result.choices?.[0]?.message?.content || ''
      console.log('Raw content:', content)
      
      // Parse the emotion result
      let emotionData
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          emotionData = JSON.parse(jsonMatch[0])
          console.log('Parsed emotion data:', emotionData)
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message, 'Content:', content)
        emotionData = { 
          emotion: 'Neutral', 
          confidence: 50, 
          reason: content || 'Unable to analyze facial expression' 
        }
      }

      // Normalize the reason field (API might return 'description', 'reason', 'analysis', etc.)
      const reason = emotionData.reason || emotionData.description || emotionData.analysis || emotionData.explanation || 'Expression analysis complete'

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        participantName, 
        emotion: emotionData.emotion || 'Neutral',
        confidence: emotionData.confidence || 50,
        reason 
      }))
    } catch (err) {
      console.error('Emotion analysis error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Summary generation endpoint (thinking model)
  if (req.method === 'POST' && req.url === '/api/generate-summary') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { transcripts, emotions } = JSON.parse(Buffer.concat(chunks).toString())

      const transcriptText = transcripts.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n')
      const emotionText = emotions.map(e => `${e.participantName}: ${e.emotion} (${e.confidence}%)`).join('\n')

      const veniceRes = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VENICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: THINKING_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a meeting analyst. Provide concise, actionable meeting summaries.'
            },
            {
              role: 'user',
              content: `Analyze this meeting and provide a summary with key points, action items, and emotional insights.

TRANSCRIPT:
${transcriptText || 'No transcript available yet.'}

PARTICIPANT EMOTIONS:
${emotionText || 'No emotion data available.'}

Return a JSON object with:
- keyPoints: array of 3-5 main discussion points
- actionItems: array of action items with owner if mentioned
- emotionalInsights: brief analysis of meeting tone and participant engagement
- overallSentiment: one of (Positive, Neutral, Negative, Mixed)

Only return valid JSON.`
            }
          ],
          venice_parameters: { include_venice_system_prompt: false }
        })
      })

      const result = await veniceRes.json()
      const content = result.choices?.[0]?.message?.content || '{}'
      
      let summaryData
      try {
        summaryData = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
      } catch {
        summaryData = {
          keyPoints: ['Meeting in progress'],
          actionItems: [],
          emotionalInsights: 'Analyzing...',
          overallSentiment: 'Neutral'
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(summaryData))
    } catch (err) {
      console.error('Summary generation error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Add AI agent to meeting endpoint
  if (req.method === 'POST' && req.url === '/api/add-agent') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { name, voice, systemPrompt } = JSON.parse(Buffer.concat(chunks).toString())

      if (meetingAgent) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Agent already in meeting' }))
        return
      }

      meetingAgent = createMeetingAgent({
        name: name || 'AI Assistant',
        voice: voice || 'af_sky',
        systemPrompt
      })

      // Generate a participant ID for the agent
      agentParticipantId = `agent-${crypto.randomUUID()}`

      // Set up agent event handlers
      meetingAgent.on('error', (data) => {
        console.error(`[Server] Agent error: ${data.error}`)
      })

      meetingAgent.on('response', (data) => {
        // Broadcast agent's text response as a transcript
        broadcast({
          type: 'transcript',
          transcript: {
            speaker: meetingAgent.name,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAgent: true
          }
        })
      })

      meetingAgent.on('audio', (data) => {
        // Broadcast agent's audio to all participants
        const audioBase64 = Buffer.from(data.audio).toString('base64')
        console.log(`[Server] Broadcasting agent audio, size: ${audioBase64.length} chars`)
        broadcast({
          type: 'agent-audio',
          audio: audioBase64,
          text: data.text,
          agentName: meetingAgent.name
        })
      })

      meetingAgent.on('processing', (data) => {
        broadcast({
          type: 'agent-status',
          status: data.status,
          agentName: meetingAgent.name
        })
      })

      meetingAgent.start()

      // Add agent as a participant
      participants.set(agentParticipantId, {
        odId: agentParticipantId,
        name: meetingAgent.name,
        isMuted: false,
        isVideoOff: true,
        isAgent: true,
        joinedAt: Date.now()
      })

      broadcast({ type: 'participants', participants: getParticipantsList() })
      broadcast({ 
        type: 'agent-joined', 
        agent: { 
          id: agentParticipantId, 
          name: meetingAgent.name 
        } 
      })

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        success: true, 
        agentId: agentParticipantId,
        name: meetingAgent.name 
      }))
    } catch (err) {
      console.error('Add agent error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Remove AI agent from meeting
  if (req.method === 'POST' && req.url === '/api/remove-agent') {
    try {
      if (meetingAgent) {
        meetingAgent.stop()
        meetingAgent = null
      }
      if (agentParticipantId) {
        participants.delete(agentParticipantId)
        broadcast({ type: 'participants', participants: getParticipantsList() })
        broadcast({ type: 'agent-left', agentId: agentParticipantId })
        agentParticipantId = null
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (err) {
      console.error('Remove agent error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Send text to agent (for testing or manual interaction)
  if (req.method === 'POST' && req.url === '/api/agent-message') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { text, speaker } = JSON.parse(Buffer.concat(chunks).toString())

      if (!meetingAgent) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'No agent in meeting' }))
        return
      }

      const result = await meetingAgent.respondToText(text, speaker || 'User')
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        success: true, 
        response: result.text,
        hasAudio: !!result.audio
      }))
    } catch (err) {
      console.error('Agent message error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Text-to-speech endpoint (for agent voice)
  if (req.method === 'POST' && req.url === '/api/tts') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { text, voice } = JSON.parse(Buffer.concat(chunks).toString())

      const veniceRes = await fetch(`${VENICE_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VENICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-kokoro',
          input: text,
          voice: voice || 'af_sky',
          response_format: 'mp3',
          speed: 1.0
        })
      })

      if (!veniceRes.ok) {
        const errorText = await veniceRes.text()
        res.writeHead(veniceRes.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: errorText }))
        return
      }

      const audioBuffer = await veniceRes.arrayBuffer()
      res.writeHead(200, { 
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength
      })
      res.end(Buffer.from(audioBuffer))
    } catch (err) {
      console.error('TTS error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

httpServer.listen(8081, () => {
  console.log('HTTP API server running on http://localhost:8081')
})

const wss = new WebSocketServer({ port: 8080 })

const participants = new Map()
const clients = new Map()

function broadcast(data, excludeId = null) {
  const message = JSON.stringify(data)
  clients.forEach((ws, odId) => {
    if (ws.readyState === 1 && odId !== excludeId) {
      ws.send(message)
    }
  })
}

function sendTo(odId, data) {
  const ws = clients.get(odId)
  if (ws?.readyState === 1) {
    ws.send(JSON.stringify(data))
  }
}

function getParticipantsList() {
  return Array.from(participants.values())
}

wss.on('connection', (ws) => {
  let odId = null

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)

      switch (data.type) {
        case 'join':
          odId = crypto.randomUUID()
          participants.set(odId, {
            odId,
            name: data.name,
            isMuted: data.isMuted || false,
            isVideoOff: data.isVideoOff || false,
            joinedAt: Date.now()
          })
          clients.set(odId, ws)
          ws.send(JSON.stringify({ type: 'joined', odId }))
          // Notify existing participants about the new user so they can initiate WebRTC
          broadcast({ type: 'new-participant', participant: participants.get(odId) }, odId)
          broadcast({ type: 'participants', participants: getParticipantsList() })
          // Notify new user about existing participants for WebRTC connections
          ws.send(JSON.stringify({ type: 'existing-participants', participants: getParticipantsList().filter(p => p.odId !== odId) }))
          break

        case 'update':
          if (odId && participants.has(odId)) {
            const participant = participants.get(odId)
            participants.set(odId, { ...participant, ...data.updates })
            broadcast({ type: 'participants', participants: getParticipantsList() })
          }
          break

        case 'leave':
          if (odId) {
            participants.delete(odId)
            clients.delete(odId)
            broadcast({ type: 'participants', participants: getParticipantsList() })
            broadcast({ type: 'user-left', odId })
          }
          break

        // WebRTC signaling
        case 'offer':
          sendTo(data.target, { type: 'offer', offer: data.offer, from: odId })
          break

        case 'answer':
          sendTo(data.target, { type: 'answer', answer: data.answer, from: odId })
          break

        case 'ice-candidate':
          sendTo(data.target, { type: 'ice-candidate', candidate: data.candidate, from: odId })
          break

        case 'chat':
          broadcast({ type: 'chat', message: data.message }, odId)
          break

        case 'transcript':
          // Broadcast transcript to all other participants
          broadcast({ type: 'transcript', transcript: data.transcript }, odId)
          // Also feed to the AI agent if present
          if (meetingAgent?.isListening && data.transcript?.text && !data.transcript.isAgent) {
            // Agent listens to transcripts and can respond
            const participant = participants.get(odId)
            const speakerName = participant?.name || 'Unknown'
            const text = data.transcript.text.toLowerCase()
            const agentName = meetingAgent.name.toLowerCase()
            
            // Respond if: mentions agent, asks a question, or says "hey/hi" type greetings
            const shouldRespond = 
              text.includes(agentName) || 
              text.includes('assistant') || 
              text.includes(' ai ') ||
              text.includes('ai,') ||
              text.startsWith('ai ') ||
              text.endsWith('?') ||
              text.includes('hey ') ||
              text.includes('hello') ||
              text.includes('help me') ||
              text.includes('can you') ||
              text.includes('could you') ||
              text.includes('what do you think')
            
            if (shouldRespond) {
              console.log(`[Server] Agent responding to: "${data.transcript.text}"`)
              meetingAgent.respondToText(data.transcript.text, speakerName)
            }
          }
          break

        case 'agent-audio-chunk':
          // Feed audio chunk to the agent for processing
          if (meetingAgent && data.audio) {
            const audioBuffer = Buffer.from(data.audio, 'base64')
            const participant = participants.get(odId)
            meetingAgent.feedAudio(audioBuffer, participant?.name || 'Unknown')
          }
          break

        case 'ask-agent':
          // Direct message to the agent
          if (meetingAgent?.isListening && data.text) {
            const participant = participants.get(odId)
            meetingAgent.respondToText(data.text, participant?.name || 'User')
          }
          break
      }
    } catch (err) {
      console.error('Error processing message:', err)
    }
  })

  ws.on('close', () => {
    if (odId) {
      participants.delete(odId)
      clients.delete(odId)
      broadcast({ type: 'participants', participants: getParticipantsList() })
      broadcast({ type: 'user-left', odId })
    }
  })
})

console.log('WebSocket server running on ws://localhost:8080')
