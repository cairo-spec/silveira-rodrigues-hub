// Sound URLs from free public libraries (freesound.org, etc.)
// Using base64 audio for reliable playback without external dependencies

type GoNoGoStatus = "Go" | "No_Go" | "Review_Required" | "Solicitada" | "Rejeitada" | "Participando" | "Vencida" | "Perdida" | "Confirmada" | "Em_Execucao";

// AudioContext singleton for playing sounds
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Generate different tones for each status
const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Play multiple notes in sequence for melodies
const playMelody = (notes: { freq: number; duration: number; delay: number }[], type: OscillatorType = 'sine', volume: number = 0.3): void => {
  notes.forEach(note => {
    setTimeout(() => {
      createTone(note.freq, note.duration, type, volume);
    }, note.delay * 1000);
  });
};

// Sound effects for each parecer status
export const playParecerSound = (status: GoNoGoStatus): void => {
  switch (status) {
    case 'Go':
      // Triumphant ascending melody - major chord arpeggio
      playMelody([
        { freq: 523.25, duration: 0.15, delay: 0 },     // C5
        { freq: 659.25, duration: 0.15, delay: 0.1 },   // E5
        { freq: 783.99, duration: 0.3, delay: 0.2 },    // G5
      ], 'sine', 0.25);
      break;
      
    case 'No_Go':
      // Descending minor tone - indicates negative
      playMelody([
        { freq: 440, duration: 0.2, delay: 0 },         // A4
        { freq: 349.23, duration: 0.3, delay: 0.15 },   // F4
      ], 'triangle', 0.2);
      break;
      
    case 'Review_Required':
      // Alert beeps - needs attention
      playMelody([
        { freq: 880, duration: 0.1, delay: 0 },         // A5
        { freq: 880, duration: 0.1, delay: 0.15 },      // A5
        { freq: 880, duration: 0.1, delay: 0.3 },       // A5
      ], 'square', 0.15);
      break;
      
    case 'Solicitada':
      // Soft notification - request received
      playMelody([
        { freq: 587.33, duration: 0.15, delay: 0 },     // D5
        { freq: 698.46, duration: 0.2, delay: 0.12 },   // F5
      ], 'sine', 0.2);
      break;
      
    case 'Rejeitada':
      // Low descending tone - rejection
      playMelody([
        { freq: 293.66, duration: 0.2, delay: 0 },      // D4
        { freq: 220, duration: 0.35, delay: 0.15 },     // A3
      ], 'sawtooth', 0.15);
      break;
      
    case 'Participando':
      // Energetic rising tone - active participation
      playMelody([
        { freq: 392, duration: 0.1, delay: 0 },         // G4
        { freq: 493.88, duration: 0.1, delay: 0.08 },   // B4
        { freq: 587.33, duration: 0.15, delay: 0.16 },  // D5
      ], 'sine', 0.22);
      break;
      
    case 'Vencida':
      // Victory fanfare - celebration!
      playMelody([
        { freq: 523.25, duration: 0.12, delay: 0 },     // C5
        { freq: 659.25, duration: 0.12, delay: 0.1 },   // E5
        { freq: 783.99, duration: 0.12, delay: 0.2 },   // G5
        { freq: 1046.5, duration: 0.4, delay: 0.3 },    // C6
      ], 'sine', 0.28);
      break;
      
    case 'Perdida':
      // Somber low tones - loss
      playMelody([
        { freq: 261.63, duration: 0.25, delay: 0 },     // C4
        { freq: 196, duration: 0.4, delay: 0.2 },       // G3
      ], 'triangle', 0.18);
      break;
      
    case 'Confirmada':
      // Confirmation chime - double beep
      playMelody([
        { freq: 698.46, duration: 0.12, delay: 0 },     // F5
        { freq: 880, duration: 0.2, delay: 0.1 },       // A5
      ], 'sine', 0.22);
      break;
      
    case 'Em_Execucao':
      // Working/progress tone - steady beat
      playMelody([
        { freq: 440, duration: 0.08, delay: 0 },        // A4
        { freq: 523.25, duration: 0.08, delay: 0.1 },   // C5
        { freq: 659.25, duration: 0.15, delay: 0.2 },   // E5
      ], 'sine', 0.2);
      break;
      
    default:
      // Default notification sound
      createTone(600, 0.15, 'sine', 0.2);
  }
};

// Get a friendly description of the sound for each status
export const getParecerSoundDescription = (status: GoNoGoStatus): string => {
  const descriptions: Record<GoNoGoStatus, string> = {
    'Go': 'Melodia ascendente triunfante',
    'No_Go': 'Tom descendente menor',
    'Review_Required': 'Bipes de alerta',
    'Solicitada': 'Notificação suave',
    'Rejeitada': 'Tom baixo descendente',
    'Participando': 'Tom energético ascendente',
    'Vencida': 'Fanfarra de vitória',
    'Perdida': 'Tons sombrios',
    'Confirmada': 'Sino de confirmação',
    'Em_Execucao': 'Ritmo de progresso',
  };
  return descriptions[status] || 'Som padrão';
};
