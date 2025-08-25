// Sound effects for different toast types
export const TOAST_SOUNDS = {
  success: new Audio('/sounds/success.mp3'),
  error: new Audio('/sounds/error.mp3'),
  warning: new Audio('/sounds/warning.mp3'),
  info: new Audio('/sounds/info.mp3'),
} as const;

// Function to play sound based on toast type
export const playToastSound = (type: keyof typeof TOAST_SOUNDS) => {
  try {
    const sound = TOAST_SOUNDS[type];
    sound.currentTime = 0; // Reset sound to start
    sound.volume = 0.5; // Set volume to 50%
    sound.play().catch(() => {
      // Silently fail if sound can't be played (e.g., if user hasn't interacted with page yet)
      console.debug('Could not play toast sound - user interaction may be required');
    });
  } catch (error) {
    console.debug('Error playing toast sound:', error);
  }
}; 