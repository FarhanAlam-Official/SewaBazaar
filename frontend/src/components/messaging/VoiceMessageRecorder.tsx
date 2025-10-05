"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Mic, Square, Play, Pause, Send, X, MicOff, RotateCcw, 
  Clock, Waves, Volume2, Trash2, CheckCircle
} from "lucide-react"

interface VoiceMessageRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>
  onCancel: () => void
  isVisible: boolean
  maxDuration?: number
  autoStart?: boolean
}

export function VoiceMessageRecorder({ onSend, onCancel, isVisible, maxDuration = 120, autoStart = false }: VoiceMessageRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'preview' | 'playing'>('idle')
  const [busy, setBusy] = useState(false)
  const [duration, setDuration] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [waveformBars, setWaveformBars] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Initialize waveform bars
  useEffect(() => {
    setWaveformBars(Array.from({ length: 20 }, () => Math.random() * 0.5 + 0.1))
  }, [])

  const cleanup = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null }
    setAudioLevel(0)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  useEffect(() => {
    if (!isVisible) {
      if (url) URL.revokeObjectURL(url)
      setState('idle'); setBusy(false); setDuration(0); setBlob(null); setUrl(null); setIsPlaying(false)
      setErrorMessage("")
      cleanup()
      return
    }
    // AutoStart can be blocked by browsers without user gesture; prefer manual tap
    if (autoStart && state === 'idle') start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, autoStart])

  const startAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVisualization = () => {
        if (analyserRef.current && state === 'recording') {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          setAudioLevel(average / 255)
          
          // Update waveform bars with audio data
          const newBars = Array.from({ length: 20 }, (_, i) => {
            const index = Math.floor((i / 20) * bufferLength)
            return (dataArray[index] || 0) / 255
          })
          setWaveformBars(newBars)
          
          animationRef.current = requestAnimationFrame(updateVisualization)
        }
      }
      updateVisualization()
    } catch (error) {
      console.warn('Audio visualization not supported:', error)
    }
  }

  const start = async () => {
    if (busy || state === 'recording') return
    setBusy(true)
    try {
      setErrorMessage("")
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Recording not supported in this browser')
      }
      if (!window.isSecureContext) {
        throw new Error('Recording requires a secure context (https or localhost)')
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } 
        })
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      streamRef.current = stream
      chunksRef.current = []

      // Start audio visualization
      startAudioVisualization(stream)

      const supported = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg']
      let mime: string | undefined
      for (const t of supported) { if ((window as any).MediaRecorder?.isTypeSupported?.(t)) { mime = t; break } }
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        const total = chunksRef.current.reduce((s, c) => s + c.size, 0)
        if (total === 0) { setState('idle'); setBusy(false); return }
        const final = new Blob(chunksRef.current, { type: mr.mimeType || mime || 'audio/webm' })
        const objectUrl = URL.createObjectURL(final)
        setBlob(final); setUrl(objectUrl); setState('preview'); setBusy(false)
        cleanup()
      }
      mr.start(100)
      setState('recording')
      setDuration(0)
      if (tickRef.current) clearInterval(tickRef.current)
      tickRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 1
          if (next >= maxDuration) stop()
          return next
        })
      }, 1000)
    } catch {
      setBusy(false)
      setState('idle')
      setErrorMessage('Microphone access denied or unavailable. Please allow permissions and try again.')
    }
  }

  const stop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.requestData() } catch {}
      mediaRecorderRef.current.stop()
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  const togglePlay = async () => {
    if (!url || !audioRef.current) return
    
    try {
      if (isPlaying) { 
        audioRef.current.pause()
        setIsPlaying(false)
        setState('preview')
      } else { 
        await audioRef.current.play()
        setIsPlaying(true)
        setState('playing')
      }
    } catch (error) {
      console.warn('Failed to toggle playback:', error)
      setIsPlaying(false)
      setState('preview')
    }
  }

  const send = async () => {
    if (!blob) return
    setBusy(true)
    try { await onSend(blob, duration); onCancel() } finally { setBusy(false) }
  }

  const rerecord = () => {
    if (url) URL.revokeObjectURL(url)
    setBlob(null); setUrl(null); setDuration(0); setIsPlaying(false); setState('idle')
  }

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 20, height: 0 }} 
          animate={{ opacity: 1, y: 0, height: 'auto' }} 
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden"
        >
          {/* Background with gradient and glassmorphism */}
          <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20 backdrop-blur-xl border-t border-indigo-200/50 dark:border-indigo-800/30">
            
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-pulse" />
              {state === 'recording' && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            <div className="relative p-6 space-y-6">
              {/* Header */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    state === 'recording' 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                      : state === 'preview' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {state === 'recording' ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                        <Mic className="w-5 h-5" />
                      </motion.div>
                    ) : state === 'preview' ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {state === 'recording' ? 'Recording Voice Message' 
                       : state === 'preview' ? 'Voice Message Preview' 
                       : state === 'playing' ? 'Playing Preview' 
                       : 'Voice Message Recorder'}
                    </h3>
                    {duration > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{fmt(duration)} / {fmt(maxDuration)}</span>
                        {state === 'recording' && (
                          <motion.span 
                            className="w-2 h-2 bg-red-500 rounded-full"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={onCancel} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Waveform Visualization */}
              <motion.div 
                className="flex items-center justify-center h-16 gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {state === 'recording' ? (
                  // Real-time waveform during recording
                  waveformBars.map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-gradient-to-t from-red-500 to-red-400 rounded-full shadow-sm"
                      animate={{
                        height: `${Math.max(4, height * 48 + audioLevel * 16)}px`,
                        opacity: 0.7 + height * 0.3
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))
                ) : state === 'preview' || state === 'playing' ? (
                  // Static waveform for preview
                  Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-full shadow-sm"
                      style={{ height: `${Math.random() * 32 + 8}px` }}
                    />
                  ))
                ) : (
                  // Idle state - subtle animation
                  Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full"
                      animate={{ 
                        height: [8, 16, 8],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))
                )}
              </motion.div>

              {/* Controls */}
              <motion.div 
                className="flex items-center justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {state === 'idle' && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={start} 
                      disabled={busy}
                      className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? (
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <Mic className="w-7 h-7" />
                      )}
                    </Button>
                  </motion.div>
                )}

                {state === 'recording' && (
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Button 
                      onClick={stop} 
                      disabled={duration < 1}
                      className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-lg disabled:opacity-50"
                    >
                      <Square className="w-7 h-7" />
                    </Button>
                  </motion.div>
                )}

                {state === 'preview' && (
                  <motion.div 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Button 
                      onClick={togglePlay} 
                      variant="outline"
                      className="h-12 w-12 rounded-full border-2 border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                    
                    <Button 
                      onClick={rerecord} 
                      variant="outline"
                      className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Re-record
                    </Button>
                    
                    <Button 
                      onClick={send} 
                      disabled={busy}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25"
                    >
                      {busy ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {/* Progress Bar */}
              {duration > 0 && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className={`h-full rounded-full shadow-sm ${
                        state === 'recording' 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30'
                      }`}
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min((duration / maxDuration) * 100, 100)}%` }} 
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    {/* Pulse effect for recording */}
                    {state === 'recording' && (
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                        animate={{ 
                          width: [`${Math.min((duration / maxDuration) * 100, 100)}%`, '0%'],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{fmt(duration)}</span>
                    <span>{fmt(maxDuration)}</span>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg"
                  >
                    <MicOff className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hidden audio element */}
            {url && (
              <audio 
                ref={audioRef} 
                src={url} 
                onPlay={() => {
                  setIsPlaying(true)
                  setState('playing')
                }}
                onPause={() => {
                  setIsPlaying(false)
                  setState('preview')
                }}
                onEnded={() => { 
                  setIsPlaying(false) 
                  setState('preview') 
                }} 
                preload="metadata" 
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


