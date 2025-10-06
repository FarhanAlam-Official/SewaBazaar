"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, Pause, Mic, Download, Volume2, VolumeX, SkipBack, SkipForward,
  Clock, Waves, MoreVertical
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface VoiceMessagePlayerProps {
  audioUrl: string
  duration?: number
  isOwn?: boolean
  timestamp?: string
  onError?: (error: string) => void
}

export function VoiceMessagePlayer({ audioUrl, duration = 0, isOwn = false, timestamp, onError }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(isFinite(duration) && duration > 0 ? duration : 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(false)
  const [waveform, setWaveform] = useState<number[]>([])
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate waveform pattern for visual appeal
  // Generate waveform pattern for visual appeal
  useEffect(() => {
    const generateWaveform = () => {
      const bars = 40
      return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2)
    }
    setWaveform(generateWaveform())
  }, [])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => { 
      const audioDur = audio.duration
      if (isFinite(audioDur) && audioDur > 0) {
        setAudioDuration(audioDur)
      } else if (isFinite(duration) && duration > 0) {
        // Fallback to prop duration if audio metadata fails
        setAudioDuration(duration)
      }
      setIsLoading(false) 
    }
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = (e: Event) => { setIsLoading(false); onError?.("Failed to load voice message") }
    const handleEnded = () => { 
      setIsPlaying(false) 
      setCurrentTime(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
    const handleTimeUpdate = () => {
      const time = audio.currentTime
      if (isFinite(time) && time >= 0) {
        setCurrentTime(time)
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [audioUrl, onError, duration])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    
    // Mark that user has interacted
    setHasUserInteracted(true)
    
    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
      } else {
        // Ensure audio is loaded before playing
        if (audio.readyState < 2) {
          setIsLoading(true)
          await new Promise((resolve) => {
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay)
              setIsLoading(false)
              resolve(void 0)
            }
            audio.addEventListener('canplay', onCanPlay)
            audio.load() // Force reload if needed
          })
        }
        
        await audio.play()
        setIsPlaying(true)
        
        // Clear any existing interval first
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        
        // Create new interval for smooth progress updates
        progressIntervalRef.current = setInterval(() => {
          if (audio && !audio.paused && !audio.ended) {
            const time = audio.currentTime
            if (isFinite(time) && time >= 0) {
              setCurrentTime(time)
            }
            
            // Update duration if not set and available
            if (audio.duration && isFinite(audio.duration) && audioDuration === 0) {
              setAudioDuration(audio.duration)
            }
          }
        }, 50) // Update more frequently for smoother progress
      }
    } catch (error) {
      console.error('Playback error:', error)
      setIsPlaying(false)
      setIsLoading(false)
      onError?.("Failed to play voice message")
    }
  }

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !audioDuration) return
    
    // Validate input values
    if (!value || value.length === 0 || !isFinite(value[0]) || !isFinite(audioDuration)) {
      return
    }
    
    const newTime = (value[0] / 100) * audioDuration
    
    // Ensure the calculated time is valid and finite
    if (!isFinite(newTime) || newTime < 0) {
      return
    }
    
    // Clamp the time to valid range
    const clampedTime = Math.max(0, Math.min(newTime, audioDuration))
    
    try {
      audio.currentTime = clampedTime
      setCurrentTime(clampedTime)
    } catch (error) {
      console.warn('Failed to set audio currentTime:', error)
      onError?.('Failed to seek audio position')
    }
  }

  const seekBy = (deltaSeconds: number) => {
    const audio = audioRef.current
    if (!audio || !audioDuration) return
    
    // Validate input and current state
    if (!isFinite(deltaSeconds) || !isFinite(audio.currentTime) || !isFinite(audioDuration)) {
      return
    }
    
    const newTime = Math.max(0, Math.min(audio.currentTime + deltaSeconds, audioDuration))
    
    // Ensure the calculated time is valid
    if (!isFinite(newTime)) {
      return
    }
    
    try {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    } catch (error) {
      console.warn('Failed to seek audio:', error)
      onError?.('Failed to seek audio position')
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const newVolume = value[0] / 100
    setVolume(newVolume)
    audio.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) { audio.volume = volume; setIsMuted(false) } else { audio.volume = 0; setIsMuted(true) }
  }

  const changePlaybackRate = () => {
    const audio = audioRef.current
    if (!audio) return
    const rates = [0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
    audio.playbackRate = nextRate
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
      return '0:00'
    }
    const totalSeconds = Math.floor(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const downloadAudio = () => {
    // Generate a proper filename
    let dateStr = 'unknown-date'
    if (timestamp) {
      try {
        const date = new Date(timestamp)
        dateStr = date.toISOString().slice(0, 19).replace(/[T:]/g, '-')
      } catch {
        dateStr = Date.now().toString()
      }
    }
    
    // Determine file extension from audio URL
    let extension = 'webm' // default
    if (audioUrl.includes('.wav')) extension = 'wav'
    else if (audioUrl.includes('.mp3')) extension = 'mp3'
    else if (audioUrl.includes('.m4a')) extension = 'm4a'
    else if (audioUrl.includes('.ogg')) extension = 'ogg'
    
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `SewaBazaar-Voice-${dateStr}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const progressPercentage = useMemo(() => {
    if (!audioDuration || !isFinite(audioDuration) || !isFinite(currentTime) || audioDuration <= 0) {
      return 0
    }
    return Math.max(0, Math.min(100, (currentTime / audioDuration) * 100))
  }, [currentTime, audioDuration])

  return (
    <motion.div 
      className={`
        relative group max-w-md rounded-2xl overflow-hidden backdrop-blur-sm
        ${isOwn 
          ? 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 text-white shadow-lg shadow-blue-500/25' 
          : 'bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 text-gray-800 dark:text-gray-200 shadow-lg shadow-black/10 border border-white/20 dark:border-gray-700/50'
        }
      `}
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      onHoverStart={() => setShowControls(true)}
      onHoverEnd={() => setShowControls(false)}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />
      
      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-blue-500/10'}`}>
              <Mic className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                Voice Message
              </p>
              <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'} flex items-center gap-1`}>
                <Clock className="w-3 h-3" />
                {formatTime(audioDuration)}
              </p>
            </div>
          </div>
          
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center gap-4">
          <motion.button 
            onClick={togglePlayback} 
            disabled={isLoading}
            className={`
              relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200
              ${isOwn 
                ? 'bg-white text-blue-600 hover:bg-gray-50 shadow-white/25' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
            `}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
          >
            {isLoading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>

          <div className="flex-1">
            {/* Animated Waveform */}
            <div className="flex items-center justify-center h-8 gap-0.5">
              {waveform.map((height, index) => (
                <motion.div
                  key={index}
                  className={`
                    w-1 rounded-full transition-all duration-200
                    ${isOwn ? 'bg-white/60' : 'bg-blue-500/60'}
                    ${isPlaying && isFinite(progressPercentage) && index <= (progressPercentage / 100) * waveform.length 
                      ? (isOwn ? 'bg-white' : 'bg-blue-600') 
                      : ''
                    }
                  `}
                  animate={{
                    height: isPlaying 
                      ? `${height * 24 + (Math.sin(currentTime * 10 + index) * 4)}px`
                      : `${height * 16}px`,
                    opacity: isPlaying && isFinite(progressPercentage) && index <= (progressPercentage / 100) * waveform.length ? 1 : 0.6
                  }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              ))}
            </div>
            
            {/* Progress Slider */}
            <div className="mt-2">
              <Slider 
                value={[isFinite(progressPercentage) ? progressPercentage : 0]} 
                onValueChange={handleProgressChange}
                className="w-full"
                disabled={isLoading || !audioDuration || !isFinite(audioDuration)}
              />
              <div className={`flex justify-between mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`flex items-center justify-between p-3 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-gray-100/50 dark:bg-gray-800/50'}`}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekBy(-5)}
                    className={`h-8 w-8 p-0 ${isOwn ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Skip back 5s"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekBy(10)}
                    className={`h-8 w-8 p-0 ${isOwn ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Skip forward 10s"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className={`h-8 w-8 p-0 ${isOwn ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  
                  <div className="w-16">
                    <Slider 
                      value={[isMuted ? 0 : volume * 100]} 
                      onValueChange={handleVolumeChange}
                      max={100} 
                      step={1}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={changePlaybackRate}
                    className={`h-8 px-2 text-xs ${isOwn ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {playbackRate}x
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadAudio}
                    className={`h-8 w-8 p-0 ${isOwn ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata" 
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
        }}
      />
    </motion.div>
  )
}


