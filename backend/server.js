import { WebSocketServer } from 'ws'

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
