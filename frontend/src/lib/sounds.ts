// Sound effects for different toast types
// Note: Sound functionality commented out for better UX - uncomment to re-enable
export const TOAST_SOUNDS = {
  success: () => {
    // try {
    //   return new Audio('/sounds/success.mp3')
    // } catch {
    //   return null
    // }
    return null
  },
  error: () => {
    // try {
    //   return new Audio('/sounds/error.mp3')
    // } catch {
    //   return null
    // }
    return null
  },
  warning: () => {
    // try {
    //   return new Audio('/sounds/warning.mp3')
    // } catch {
    //   return null
    // }
    return null
  },
  info: () => {
    // try {
    //   return new Audio('/sounds/info.mp3')
    // } catch {
    //   return null
    // }
    return null
  },
} as const;

// Function to play sound based on toast type
// Currently commented out for better user experience - uncomment to re-enable
export const playToastSound = (type: keyof typeof TOAST_SOUNDS) => {
  // Sound functionality commented out - uncomment below to re-enable
  return;
  
  // try {
  //   const sound = TOAST_SOUNDS[type]()
  //   if (!sound) {
  //     // Sound file doesn't exist, fail silently
  //     return
  //   }
  //   
  //   // Set up error handler for failed audio loading
  //   sound.addEventListener('error', () => {
  //     console.debug(`Toast sound file not found: /sounds/${type}.mp3`)
  //   }, { once: true })
  //   
  //   // Configure sound settings
  //   sound.currentTime = 0 // Reset sound to start
  //   sound.volume = 0.4 // Set volume to 40%
  //   
  //   // Set up timer to stop sound after 1 second
  //   const stopTimer = setTimeout(() => {
  //     if (!sound.paused) {
  //       sound.pause()
  //       sound.currentTime = 0
  //     }
  //   }, 1000) // Stop after 1 second
  //   
  //   // Clean up timer when sound ends naturally
  //   sound.addEventListener('ended', () => {
  //     clearTimeout(stopTimer)
  //   }, { once: true })
  //   
  //   sound.play().catch(() => {
  //     // Clean up timer if play fails
  //     clearTimeout(stopTimer)
  //     // Silently fail if sound can't be played (e.g., if user hasn't interacted with page yet)
  //     console.debug('Could not play toast sound - user interaction may be required or file not found')
  //   })
  // } catch (error) {
  //   console.debug('Error playing toast sound:', error)
  // }
} 