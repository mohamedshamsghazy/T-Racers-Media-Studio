import { Layer } from '../../services/editor-state.service';

export const PRESETS: Record<string, Partial<Layer>[]> = {
  empty: [],
  achievement: [
    { type: 'shape', name: 'Background', x: 0, y: 0, width: 1080, height: 1920, backgroundColor: '#06090e', locked: true },
    { type: 'image', name: 'Background Image', x: 0, y: 0, width: 1080, height: 1920, src: 'https://images.unsplash.com/photo-1541447237128-f4cac6138fbe?q=80&w=2000&auto=format&fit=crop', objectFit: 'cover', opacity: 0.3, locked: true },
    { type: 'shape', name: 'Red Glow', x: -200, y: 600, width: 1400, height: 800, backgroundColor: '#dc2626', borderRadius: 700, blur: 200, blendMode: 'screen', opacity: 0.6, locked: true },
    { type: 'text', name: 'Headline', text: 'ACHIEVEMENT\nUNLOCKED', x: 90, y: 250, width: 900, height: 300, color: '#ffffff', fontSize: 110, fontFamily: 'Inter', fontWeight: '900', textAlign: 'left', letterSpacing: 2 },
    { type: 'text', name: 'Subtext', text: 'ENGINEERING EXCELLENCE', x: 90, y: 190, width: 900, height: 60, color: '#dc2626', fontSize: 40, fontFamily: 'Inter', fontWeight: '700', textAlign: 'left', letterSpacing: 8 },
    { type: 'shape', name: 'Card BG', x: 90, y: 1400, width: 900, height: 250, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, blur: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    { type: 'text', name: 'Card Title', text: 'TOP 10 FINISH', fontSize: 48, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', x: 130, y: 1450, width: 800, height: 60, textAlign: 'left' },
    { type: 'text', name: 'Card Subtitle', text: 'FORMULA STUDENT UK', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', color: '#aaaaaa', x: 130, y: 1520, width: 800, height: 40, textAlign: 'left' }
  ],
  victory: [
    { type: 'shape', name: 'Background', x: 0, y: 0, width: 1080, height: 1920, backgroundColor: '#0f172a', locked: true },
    { type: 'image', name: 'Car', x: 140, y: 300, width: 800, height: 400, src: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1000&auto=format&fit=crop', objectFit: 'contain' },
    { type: 'text', name: 'Subtitle', text: 'FINAL RESULTS', x: 90, y: 850, width: 900, height: 60, color: '#0ea5e9', fontSize: 40, fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', letterSpacing: 12 },
    { type: 'text', name: 'Headline', text: 'VICTORY SECURED', x: 90, y: 920, width: 900, height: 200, color: '#ffffff', fontSize: 110, fontFamily: 'Inter', fontWeight: '900', textAlign: 'center' },
    { type: 'text', name: 'Quote', text: '"The perfect race weekend for the team."', fontSize: 32, fontFamily: 'Inter', fontWeight: '400', color: '#aaaaaa', textAlign: 'center', width: 800, height: 120, x: 140, y: 1600 }
  ],
  journey: [
    { type: 'shape', name: 'Background', x: 0, y: 0, width: 1080, height: 1920, backgroundColor: '#000000', locked: true },
    { type: 'shape', name: 'Noise Overlay', width: 1080, height: 1920, backgroundColor: '#000000', opacity: 0.1, blendMode: 'overlay', locked: true, x: 0, y: 0 },
    { type: 'text', name: 'Year', text: '2025', fontSize: 240, fontFamily: 'Inter', fontWeight: '900', color: 'rgba(255,255,255,0.05)', textAlign: 'center', width: 1080, height: 300, x: 0, y: 800 },
    { type: 'text', name: 'Title', text: 'THE SETBACK', fontSize: 80, fontFamily: 'Inter', fontWeight: '900', color: '#ffffff', textAlign: 'center', width: 1080, height: 100, x: 0, y: 950 },
    { type: 'text', name: 'Body', text: 'Every visa application rejected. But the journey was far from over.', fontSize: 36, fontFamily: 'Inter', fontWeight: '400', color: '#aaaaaa', textAlign: 'center', width: 800, height: 150, x: 140, y: 1100 }
  ]
};
