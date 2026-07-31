import { Layer } from '../../services/editor-state.service';

export const SMART_COMPONENTS: Record<string, Partial<Layer>[]> = {
  // Typography
  headline: [
    { type: 'text', name: 'Headline', text: 'T-RACERS', fontSize: 120, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', textAlign: 'center', width: 900, height: 140, letterSpacing: 4 }
  ],
  subheadline: [
    { type: 'text', name: 'Subheadline', text: 'FORMULA STUDENT TEAM', fontSize: 40, fontFamily: 'Inter', fontWeight: '700', color: '#dc2626', textAlign: 'center', width: 900, height: 60, letterSpacing: 8 }
  ],
  quote: [
    { type: 'text', name: 'Quote', text: '"Pushing the limits of engineering excellence on and off the track."', fontSize: 32, fontFamily: 'Inter', fontWeight: '400', color: '#aaaaaa', textAlign: 'center', width: 800, height: 120, textTransform: 'none' }
  ],
  numberCounter: [
    { type: 'text', name: 'Number', text: '01', fontSize: 200, fontFamily: 'Inter', fontWeight: '900', color: '#dc2626', textAlign: 'center', width: 300, height: 200 }
  ],

  // Motorsport
  achievementCard: [
    { type: 'shape', name: 'Card BG', width: 900, height: 250, backgroundColor: '#0f172a', borderRadius: 24, opacity: 0.9, shadow: '0 20px 40px rgba(0,0,0,0.5)', blur: 20 },
    { type: 'text', name: 'Card Title', text: '1ST PLACE OVERALL', fontSize: 48, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', x: 40, y: 40, width: 800, height: 60, textAlign: 'left' },
    { type: 'text', name: 'Card Subtitle', text: 'FS UK 2025 - SILVERSTONE', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', color: '#0ea5e9', x: 40, y: 110, width: 800, height: 40, textAlign: 'left' }
  ],
  raceWeekend: [
    { type: 'shape', name: 'Weekend BG', width: 900, height: 150, backgroundColor: '#dc2626', borderRadius: 16 },
    { type: 'text', name: 'Track', text: 'SILVERSTONE CIRCUIT', fontSize: 40, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', x: 30, y: 30, width: 800, height: 50, textAlign: 'left' },
    { type: 'text', name: 'Date', text: 'JULY 15-20, 2026', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', color: '#ffcdcf', x: 30, y: 80, width: 800, height: 40, textAlign: 'left' }
  ],
  heroBanner: [
    { type: 'shape', name: 'Banner Strip', width: 1080, height: 120, backgroundColor: '#dc2626', rotation: -5 },
    { type: 'text', name: 'Banner Text', text: 'BREAKING NEWS', fontSize: 80, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', textAlign: 'center', width: 1080, height: 100, rotation: -5 }
  ],

  // Media
  background: [
    { type: 'image', name: 'Background Image', width: 1080, height: 1920, src: 'https://images.unsplash.com/photo-1541447237128-f4cac6138fbe?q=80&w=2000&auto=format&fit=crop', objectFit: 'cover', locked: true, zIndex: 0 }
  ],
  car: [
    { type: 'image', name: 'Car Image', width: 800, height: 400, src: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1000&auto=format&fit=crop', objectFit: 'contain' }
  ],
  logo: [
    { type: 'image', name: 'Logo', width: 200, height: 200, src: 'https://ui-avatars.com/api/?name=TR&background=dc2626&color=fff&rounded=true&size=200', objectFit: 'contain' }
  ],

  // Effects
  glow: [
    { type: 'shape', name: 'Red Glow', width: 600, height: 600, backgroundColor: '#dc2626', borderRadius: 300, blur: 150, blendMode: 'screen', opacity: 0.5 }
  ],
  noise: [
    { type: 'shape', name: 'Noise Overlay', width: 1080, height: 1920, backgroundColor: '#000000', opacity: 0.05, blendMode: 'overlay', locked: true }
  ],
  glassCard: [
    { type: 'shape', name: 'Glass Card', width: 800, height: 400, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 32, blur: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }
  ]
};
