/**
 * Bidi Agent for Meeting Participation
 * 
 * This agent joins meetings and participates using Venice AI's audio APIs.
 * Since Venice doesn't have a true WebSocket-based bidirectional streaming API,
 * this implements a turn-based conversation flow:
 * 1. Listen to audio chunks from the meeting
 * 2. Transcribe using Whisper ASR
 * 3. Generate response using Venice LLM
 * 4. Convert to speech using Kokoro TTS
 * 5. Stream audio back to the meeting
 */

import { config } from 'dotenv'
import { EventEmitter } from 'events'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

const VENICE_API_KEY = process.env.VENICE_API_KEY || ''
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1'

// Venice Audio Models
const ASR_MODEL = 'openai/whisper-large-v3'
const TTS_MODEL = 'tts-kokoro'
const LLM_MODEL = 'llama-3.3-70b' // Fast model for conversation

// TTS Voice options from Venice
const TTS_VOICES = {
  female: ['af_sky', 'af_bella', 'af_nova', 'af_sarah', 'af_jessica'],
  male: ['am_adam', 'am_echo', 'am_michael', 'am_liam', 'am_onyx']
}

/**
 * BidiAgent - Bidirectional conversational agent using Venice APIs
 */
export class BidiAgent extends EventEmitter {
  constructor(options = {}) {
    super()
    this.name = options.name || 'AI Assistant'
    this.voice = options.voice || 'af_sky'
    this.systemPrompt = options.systemPrompt || this._defaultSystemPrompt()
    this.conversationHistory = []
    this.isListening = false
    this.audioBuffer = []
    this.silenceThreshold = options.silenceThreshold || 1500 // ms of silence before processing
    this.lastAudioTime = 0
    this.processingTimeout = null
  }

  _defaultSystemPrompt() {
    return `You are ${this.name}, a helpful AI assistant participating in a video meeting.
Keep your responses concise and conversational - aim for 1-3 sentences.
Be friendly, professional, and helpful. If asked a question, answer directly.
If you hear multiple people talking, address the most recent speaker.
You can help with:
- Answering questions
- Providing information
- Taking notes
- Summarizing discussions
- Offering suggestions

Remember: You're in a real-time meeting, so keep responses brief and natural.`
  }

  /**
   * Start the agent - begin listening for audio
   */
  async start() {
    this.isListening = true
    this.emit('started', { name: this.name })
    console.log(`[BidiAgent] ${this.name} started listening`)
    
    // Introduce itself when joining
    setTimeout(async () => {
      try {
        const intro = `Hello everyone! I'm ${this.name}. Feel free to ask me anything during the meeting.`
        this.emit('response', { text: intro })
        const audio = await this.textToSpeech(intro)
        this.emit('audio', { audio, text: intro })
      } catch (err) {
        console.error('[BidiAgent] Error during introduction:', err)
      }
    }, 1500)
  }

  /**
   * Stop the agent
   */
  stop() {
    this.isListening = false
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout)
    }
    this.emit('stopped', { name: this.name })
    console.log(`[BidiAgent] ${this.name} stopped`)
  }

  /**
   * Feed audio data to the agent
   * @param {Buffer|ArrayBuffer} audioData - Raw audio data (PCM or WAV)
   * @param {string} speakerName - Name of the speaker (optional)
   */
  async feedAudio(audioData, speakerName = 'Unknown') {
    if (!this.isListening) return

    this.audioBuffer.push({ data: audioData, speaker: speakerName, time: Date.now() })
    this.lastAudioTime = Date.now()

    // Reset the processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout)
    }

    // Process after silence threshold
    this.processingTimeout = setTimeout(() => {
      this._processAudioBuffer()
    }, this.silenceThreshold)
  }

  /**
   * Process accumulated audio buffer
   */
  async _processAudioBuffer() {
    if (this.audioBuffer.length === 0) return

    const bufferedAudio = this.audioBuffer
    this.audioBuffer = []

    try {
      // Combine audio chunks
      const combinedAudio = this._combineAudioChunks(bufferedAudio)
      const speaker = bufferedAudio[bufferedAudio.length - 1].speaker

      this.emit('processing', { status: 'transcribing' })

      // Step 1: Transcribe audio
      const transcript = await this.transcribe(combinedAudio)
      if (!transcript || transcript.trim().length === 0) {
        console.log('[BidiAgent] No speech detected')
        return
      }

      console.log(`[BidiAgent] Heard from ${speaker}: "${transcript}"`)
      this.emit('transcript', { speaker, text: transcript })

      // Step 2: Generate response
      this.emit('processing', { status: 'thinking' })
      const response = await this.generateResponse(transcript, speaker)
      console.log(`[BidiAgent] Response: "${response}"`)
      this.emit('response', { text: response })

      // Step 3: Convert to speech
      this.emit('processing', { status: 'speaking' })
      const audioResponse = await this.textToSpeech(response)
      this.emit('audio', { audio: audioResponse, text: response })

    } catch (error) {
      console.error('[BidiAgent] Processing error:', error)
      this.emit('error', { error: error.message })
    }
  }

  /**
   * Combine multiple audio chunks into one
   */
  _combineAudioChunks(chunks) {
    const totalLength = chunks.reduce((sum, c) => sum + c.data.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk.data), offset)
      offset += chunk.data.byteLength
    }
    return combined.buffer
  }

  /**
   * Transcribe audio using Venice Whisper API
   * @param {ArrayBuffer} audioData - Audio data to transcribe
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioData) {
    const formData = new FormData()
    const audioBlob = new Blob([audioData], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', ASR_MODEL)
    formData.append('response_format', 'json')

    const response = await fetch(`${VENICE_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`)
    }

    const result = await response.json()
    return result.text || ''
  }

  /**
   * Generate a response using Venice LLM
   * @param {string} userMessage - The user's message
   * @param {string} speaker - Name of the speaker
   * @returns {Promise<string>} - Generated response
   */
  async generateResponse(userMessage, speaker) {
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: `[${speaker}]: ${userMessage}`
    })

    // Keep history manageable (last 10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20)
    }

    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory
        ],
        max_tokens: 150, // Keep responses short for conversation
        temperature: 0.7,
        venice_parameters: {
          include_venice_system_prompt: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`)
    }

    const result = await response.json()
    const assistantMessage = result.choices?.[0]?.message?.content || ''

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    })

    return assistantMessage
  }

  /**
   * Convert text to speech using Venice Kokoro TTS
   * @param {string} text - Text to convert to speech
   * @returns {Promise<ArrayBuffer>} - Audio data (MP3)
   */
  async textToSpeech(text) {
    const response = await fetch(`${VENICE_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: this.voice,
        response_format: 'mp3', // MP3 for browser playback
        speed: 1.0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[BidiAgent] TTS error:', response.status, errorText)
      throw new Error(`TTS request failed: ${response.status}`)
    }

    return await response.arrayBuffer()
  }

  /**
   * Directly send a text message (for testing or manual input)
   * @param {string} text - Text to respond to
   * @param {string} speaker - Speaker name
   */
  async respondToText(text, speaker = 'User') {
    if (!this.isListening) {
      console.log('[BidiAgent] Agent not listening, ignoring message')
      return null
    }

    try {
      this.emit('processing', { status: 'thinking' })
      const response = await this.generateResponse(text, speaker)
      
      if (!this.isListening) {
        console.log('[BidiAgent] Agent stopped during processing, skipping audio')
        return null
      }
      
      this.emit('response', { text: response })

      this.emit('processing', { status: 'speaking' })
      const audio = await this.textToSpeech(response)
      
      if (!this.isListening) {
        console.log('[BidiAgent] Agent stopped during TTS, skipping audio broadcast')
        return null
      }
      
      this.emit('audio', { audio, text: response })

      return { text: response, audio }
    } catch (error) {
      console.error('[BidiAgent] Error in respondToText:', error.message)
      if (this.isListening) {
        this.emit('error', { error: error.message })
      }
      return null
    }
  }
}

/**
 * Create a meeting participant agent
 */
export function createMeetingAgent(options = {}) {
  return new BidiAgent({
    name: options.name || 'Meeting Assistant',
    voice: options.voice || 'af_sky',
    systemPrompt: options.systemPrompt || `You are a helpful AI meeting assistant.
Your role is to:
- Answer questions from meeting participants
- Help clarify discussion points
- Provide relevant information when asked
- Keep track of action items mentioned
- Summarize key points when requested

Keep responses brief (1-3 sentences) and conversational.
Be professional but friendly.`,
    silenceThreshold: options.silenceThreshold || 2000
  })
}

// Export for use in server
export default BidiAgent
