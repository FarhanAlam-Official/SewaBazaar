// Sound effects for different toast types
// Note: These sounds are optional and will fail gracefully if files don't exist
export const TOAST_SOUNDS = {
  success: () => {
    try {
      return new Audio('/sounds/success.mp3')
    } catch {
      return null
    }
  },
  error: () => {
    try {
      return new Audio('/sounds/error.mp3')
    } catch {
      return null
    }
  },
  warning: () => {
    try {
      return new Audio('/sounds/warning.mp3')
    } catch {
      return null
    }
  },
  info: () => {
    try {
      return new Audio('/sounds/info.mp3')
    } catch {
      return null
    }
  },
} as const;

// Function to play sound based on toast type
export const playToastSound = (type: keyof typeof TOAST_SOUNDS) => {
  try {
    const sound = TOAST_SOUNDS[type]()
    if (!sound) {
      // Sound file doesn't exist, fail silently
      return
    }
    
    // Set up error handler for failed audio loading
    sound.addEventListener('error', () => {
      console.debug(`Toast sound file not found: /sounds/${type}.mp3`)
    }, { once: true })
    
    sound.currentTime = 0 // Reset sound to start
    sound.volume = 0.5 // Set volume to 50%
    sound.play().catch(() => {
      // Silently fail if sound can't be played (e.g., if user hasn't interacted with page yet)
      console.debug('Could not play toast sound - user interaction may be required or file not found')
    })
  } catch (error) {
    console.debug('Error playing toast sound:', error)
  }
} 