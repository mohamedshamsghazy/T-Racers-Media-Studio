import { Injectable, signal, computed } from '@angular/core';

export type MoodType = 'victory' | 'defeat' | 'recruitment' | 'announcement' | 'historic' | 'teaser';

export interface MoodProfile {
  id: MoodType;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    backgroundStart: string;
    backgroundEnd: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    fontFamilyTitle: string;
    fontFamilyBody: string;
    titleTransform: 'uppercase' | 'lowercase' | 'none';
    titleWeight: string;
  };
  effects: {
    noiseIntensity: number;
    showGrid: boolean;
    vignetteIntensity: number;
    glassmorphism: boolean;
  };
}

const MOODS: Record<MoodType, MoodProfile> = {
  victory: {
    id: 'victory',
    name: 'Victory / High Energy',
    colors: {
      primary: '#00f0ff',
      secondary: '#ffffff',
      accent: '#ff0055',
      backgroundStart: '#0f172a',
      backgroundEnd: '#020617',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8'
    },
    typography: {
      fontFamilyTitle: '"Orbitron", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '900'
    },
    effects: {
      noiseIntensity: 0.15,
      showGrid: true,
      vignetteIntensity: 0.4,
      glassmorphism: true
    }
  },
  defeat: {
    id: 'defeat',
    name: 'Defeat / Dramatic',
    colors: {
      primary: '#ff4444',
      secondary: '#a3a3a3',
      accent: '#d00007',
      backgroundStart: '#1a0505',
      backgroundEnd: '#000000',
      textPrimary: '#ffffff',
      textSecondary: '#737373'
    },
    typography: {
      fontFamilyTitle: '"Inter", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '900'
    },
    effects: {
      noiseIntensity: 0.4,
      showGrid: false,
      vignetteIntensity: 0.8,
      glassmorphism: false
    }
  },
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment / Inspiring',
    colors: {
      primary: '#d00007',
      secondary: '#ffffff',
      accent: '#ff4444',
      backgroundStart: '#fafafa',
      backgroundEnd: '#e5e5e5',
      textPrimary: '#0f172a',
      textSecondary: '#475569'
    },
    typography: {
      fontFamilyTitle: '"Orbitron", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '900'
    },
    effects: {
      noiseIntensity: 0.05,
      showGrid: true,
      vignetteIntensity: 0,
      glassmorphism: false
    }
  },
  announcement: {
    id: 'announcement',
    name: 'Announcement / Clean',
    colors: {
      primary: '#ffffff',
      secondary: '#d00007',
      accent: '#00f0ff',
      backgroundStart: '#000000',
      backgroundEnd: '#111111',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3'
    },
    typography: {
      fontFamilyTitle: '"Inter", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '800'
    },
    effects: {
      noiseIntensity: 0.1,
      showGrid: true,
      vignetteIntensity: 0.2,
      glassmorphism: true
    }
  },
  historic: {
    id: 'historic',
    name: 'Historic / Premium',
    colors: {
      primary: '#ffd700',
      secondary: '#ffffff',
      accent: '#d00007',
      backgroundStart: '#300002',
      backgroundEnd: '#000000',
      textPrimary: '#ffffff',
      textSecondary: '#d4d4d4'
    },
    typography: {
      fontFamilyTitle: '"Orbitron", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '800'
    },
    effects: {
      noiseIntensity: 0.3,
      showGrid: false,
      vignetteIntensity: 0.7,
      glassmorphism: false
    }
  },
  teaser: {
    id: 'teaser',
    name: 'Teaser / Futuristic',
    colors: {
      primary: '#00f0ff',
      secondary: '#3b82f6',
      accent: '#ffffff',
      backgroundStart: '#000000',
      backgroundEnd: '#081728',
      textPrimary: '#ffffff',
      textSecondary: '#00f0ff'
    },
    typography: {
      fontFamilyTitle: '"Orbitron", sans-serif',
      fontFamilyBody: '"Inter", sans-serif',
      titleTransform: 'uppercase',
      titleWeight: '900'
    },
    effects: {
      noiseIntensity: 0.2,
      showGrid: true,
      vignetteIntensity: 0.6,
      glassmorphism: true
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class CreativeEngineService {
  // Global configuration state
  currentMoodId = signal<MoodType>('victory');
  currentMood = computed(() => MOODS[this.currentMoodId()]);
  
  // Expose all available moods for UI selection
  allMoods = Object.values(MOODS);

  setMood(mood: MoodType) {
    this.currentMoodId.set(mood);
  }
}
