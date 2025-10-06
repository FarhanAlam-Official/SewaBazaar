import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { showToast } from '@/components/ui/enhanced-toast'

export function SimpleVoiceTest() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const clearLogs = () => setLogs([])
  
  const startSimpleRecording = async () => {
    try {
      addLog('🎤 Starting simple recording test...')
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      addLog('✅ Got microphone access')
      streamRef.current = stream
      chunksRef.current = []
      
      // Create MediaRecorder with default settings
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      addLog(`📋 MediaRecorder created with default MIME type: ${mediaRecorder.mimeType}`)
      
      mediaRecorder.ondataavailable = (event) => {
        addLog(`📊 Data chunk received: ${event.data.size} bytes`)
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        addLog(`⏹️ Recording stopped, total chunks: ${chunksRef.current.length}`)
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
          addLog(`📦 Created blob: ${blob.size} bytes, type: ${blob.type}`)
          
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          addLog('✅ Audio URL created successfully')
          
          showToast.success({
            title: "Recording Complete!",
            description: `Recorded ${blob.size} bytes of audio`
          })
        } else {
          addLog('❌ No chunks received!')
          showToast.error({
            title: "Recording Failed",
            description: "No audio data was recorded"
          })
        }
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        setIsRecording(false)
      }
      
      mediaRecorder.onerror = (event) => {
        addLog(`❌ MediaRecorder error: ${event.error}`)
        setIsRecording(false)
      }
      
      // Start recording
      mediaRecorder.start(250) // Collect data every 250ms
      addLog('▶️ MediaRecorder started')
      setIsRecording(true)
      
    } catch (error) {
      addLog(`❌ Error: ${error}`)
      showToast.error({
        title: "Recording Failed",
        description: `Error: ${error}`
      })
    }
  }
  
  const stopSimpleRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      addLog('🛑 Stopping MediaRecorder...')
      mediaRecorderRef.current.stop()
    }
  }
  
  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
      addLog('▶️ Playing recorded audio')
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h3 className="text-lg font-semibold">Simple Voice Recording Test</h3>
        <p className="text-sm text-gray-600">
          Basic MediaRecorder test with minimal configuration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={startSimpleRecording} 
            disabled={isRecording}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? "Recording..." : "Start Recording"}
          </Button>
          
          <Button 
            onClick={stopSimpleRecording} 
            disabled={!isRecording}
            variant="outline"
          >
            Stop Recording
          </Button>
          
          <Button 
            onClick={playRecording} 
            disabled={!audioUrl}
            variant="outline"
          >
            Play Recording
          </Button>
          
          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
        </div>
        
        {audioUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">✅ Recording successful!</p>
            <audio controls src={audioUrl} className="w-full mt-2" />
          </div>
        )}
        
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Click "Start Recording" to begin test...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}