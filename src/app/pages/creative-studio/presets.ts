import { Layer } from '../../services/editor-state.service';

export const PRESETS: Record<string, Partial<Layer>[]> = {
  empty: [],
  achievement: [
    {
      type: 'shape', name: 'Background',
      x: 0, y: 0, width: 1080, height: 1920,
      backgroundColor: '#0f172a', locked: true
    },
    {
      type: 'text', name: 'Headline',
      text: 'ACHIEVEMENT\nUNLOCKED',
      x: 80, y: 300, width: 900, height: 300,
      color: '#ffffff', fontSize: 100, fontFamily: 'Inter', fontWeight: '900', textAlign: 'left'
    },
    {
      type: 'text', name: 'Subtext',
      text: 'ENGINEERING EXCELLENCE',
      x: 80, y: 220, width: 900, height: 60,
      color: '#dc2626', fontSize: 40, fontFamily: 'Inter', fontWeight: '700', textAlign: 'left'
    }
  ],
  victory: [
    {
      type: 'shape', name: 'Background',
      x: 0, y: 0, width: 1080, height: 1920,
      backgroundColor: '#06090e', locked: true
    },
    {
      type: 'text', name: 'Subtitle',
      text: 'MATCH RESULT',
      x: 90, y: 700, width: 900, height: 60,
      color: '#0ea5e9', fontSize: 40, fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', letterSpacing: 8
    },
    {
      type: 'text', name: 'Headline',
      text: 'VICTORY SECURED',
      x: 90, y: 800, width: 900, height: 200,
      color: '#ffffff', fontSize: 110, fontFamily: 'Inter', fontWeight: '900', textAlign: 'center'
    }
  ]
};
