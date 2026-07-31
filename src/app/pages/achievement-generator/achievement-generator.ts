import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { ImageUrlService } from '../../services/image-url.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface FrameSponsor {
  id: number;
  name: string;
  logoImage?: string;
  tier?: string;
}

interface FrameSponsorshipCategory {
  id: number;
  sponsors: FrameSponsor[];
}

export interface AchievementCard {
  id: string;
  rank: string; // e.g. "1ST", "3RD"
  title: string; // e.g. "PROJECT MANAGEMENT"
  theme: string; // Border Color (was 'gold' | 'bronze' | 'red')
  
  // Customizations
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  rankColor?: string;
  titleColor?: string;
  borderRadius?: number;
}

export interface HitRegion {
  id: string;
  type: 'logo' | 'sponsor' | 'card' | 'overall' | 'bg' | 'eventName' | 'mainTitle' | 'subtitle' | 'hero' | 'stamp' | 'hiringDept' | 'hiringBox' | 'sponsorLogo' | 'occasionTitle' | 'revealTitle' | 'techBox' | 'spotlightBox' | 'telemetryBox' | 'scheduleBox' | 'customText';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CustomText {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
}

export interface Stamp {
  id: string;
  text: string;
  active: boolean;
  x: number;
  y: number;
  size: number;
  bg: string;
  color: string;
  vectorType?: 'pirelli_soft' | 'pirelli_med' | 'pirelli_hard' | 'ev_hazard' | 'fsae_tag' | 'wreath';
}

@Component({
  selector: 'app-achievement-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievement-generator.html'
})
export class AchievementGenerator implements OnInit {
  isEmbedded = input<boolean>(false);
  @ViewChild('mainCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private seo = inject(SeoService);
  private http = inject(HttpClient);
  images = inject(ImageUrlService);

  // Sponsor Controls
  sponsors = signal<FrameSponsor[]>([]);
  loadingSponsors = signal(true);
  bannerScale = signal(100);
  titleOffsetY = signal(0);
  bannerOffsetY = signal(0);
  hiddenSponsorIds = signal<number[]>([]);
  sponsorCustomizations = signal<Record<number, {scale: number, offsetX: number, offsetY: number}>>({});
  expandedSponsorSettingsId = signal<number | null>(null);

  // State
  bgImage = signal<HTMLImageElement | null>(null);
  bgScale = signal(100);
  bgOffsetX = signal(0);
  showSponsorBackground = signal(true);
  bgOffsetY = signal(0);

  logoScale = signal(100);
  logoOffsetX = signal(0);
  logoOffsetY = signal(0);

  // Studio Features: Multi-Format, Presets, Hero Image, Stamps, and 6 Creative Modes
  canvasFormat = signal<'square' | 'story' | 'landscape' | 'portrait'>('square');
  studioMode = signal<'achievements' | 'hiring' | 'sponsor' | 'occasion' | 'reveal' | 'tech' | 'spotlight' | 'telemetry' | 'schedule' | 'comparison'>('achievements');

  // Hiring Mode Signals
  hiringDepartment = signal('MECHANICAL & AERODYNAMICS');
  hiringSubtitle = signal('FORMULA STUDENT 2026 SEASON');
  hiringDeadline = signal('DEADLINE: 30 AUGUST 2026');
  hiringRequirements = signal<string[]>([
    '• Strong background in CAD / SolidWorks / Ansys',
    '• Passion for motorsports and vehicle dynamics',
    '• Commitment to teamwork and strict deadlines',
    '• Students from Engineering & Computer Science'
  ]);
  hiringDeptOffsetX = signal(0);
  hiringDeptOffsetY = signal(0);
  hiringBoxOffsetX = signal(0);
  hiringBoxOffsetY = signal(0);

  // Sponsor Announcement Mode Signals
  sponsorModeTier = signal('OFFICIAL PLATINUM PARTNER');
  sponsorModeName = signal('ULTRA MOTORS & DYNAMICS');
  sponsorModeTagline = signal('POWERING THE NEXT GENERATION OF CHAMPIONS');
  sponsorGlowColor = signal('#d00007');
  sponsorLogoImage: HTMLImageElement | null = null;
  sponsorLogoScale = signal(100);
  sponsorLogoOffsetX = signal(0);
  sponsorLogoOffsetY = signal(0);

  // Occasion & Holidays Mode Signals
  occasionTitle = signal('عيد أضحى مبارك');
  occasionSubtitle = signal('فريق تي ريسرز يتمنى لكم ولعائلاتكم عيداً سعيداً\nكل عام وأنتم بخير ومن إنجاز إلى إنجاز');
  occasionTitleOffsetX = signal(0);
  occasionTitleOffsetY = signal(0);

  // Car Reveal & Teaser Mode Signals
  revealCarName = signal('PHOENIX 2026');
  revealSubtext = signal('THE NEXT EVOLUTION OF SPEED');
  revealTagline = signal('UNVEILING 15.09.2026 • CAIRO INTERNATIONAL CIRCUIT');
  revealFogOpacity = signal(80);
  revealTitleOffsetX = signal(0);
  revealTitleOffsetY = signal(0);

  // Tech Showcase Mode Signals
  techTitle = signal('AERODYNAMIC PACKAGE');
  techSubtitle = signal('CARBON FIBER DUAL-ELEMENT FRONT WING');
  techSpecs = signal<string[]>([
    '⚡ DOWNFORCE: +340N @ 75km/h',
    '⚡ DRAG COEFF: Reduced by 14%',
    '⚡ MATERIAL: Pre-preg Carbon Fiber',
    '⚡ WEIGHT: 2.4 kg Total Assembly'
  ]);
  techTagline = signal('ENGINEERED FOR MAXIMUM CORNERING VELOCITY');
  techBoxOffsetX = signal(0);
  techBoxOffsetY = signal(0);

  // Word Highlighting & Title Sponsor Signals
  mainTitleHighlightWord = signal('ACHIEVEMENT');
  showTopSponsor = signal(false);
  topSponsorText = signal('TITLE SPONSOR // RED BULL');

  // Driver & Engineer Spotlight Mode Signals
  spotlightName = signal('AHMED KHETAB');
  spotlightRole = signal('CHIEF AERODYNAMICIST');
  spotlightQuote = signal('We achieved 2.5G lateral acceleration in skidpad today, validating months of CFD simulations and wind tunnel testing.');
  spotlightStatLabel = signal('CFD SIMULATION HOURS');
  spotlightStatValue = signal('450+ HRS');
  spotlightBoxOffsetX = signal(0);
  spotlightBoxOffsetY = signal(0);

  // Telemetry & Performance Infographic Mode Signals
  telemetryTitle = signal('VEHICLE PERFORMANCE DATA');
  telemetrySubtitle = signal('DYNAMIC TESTING TELEMETRY • T-26 PROTOTYPE');
  telemetryMetrics = signal([
    { label: '0-100 KM/H ACCEL', value: '1.85s', progress: 95 },
    { label: 'MAX LATERAL G', value: '2.4G', progress: 88 },
    { label: 'DOWNFORCE @ 100KM/H', value: '850 N', progress: 92 },
    { label: 'TOTAL VEHICLE WEIGHT', value: '165 KG', progress: 80 }
  ]);
  telemetryBoxOffsetX = signal(0);
  telemetryBoxOffsetY = signal(0);

  // Race Weekend Timetable Mode Signals
  scheduleTitle = signal('RACE WEEKEND TIMETABLE');
  scheduleEventName = signal('FORMULA STUDENT GERMANY 2026');
  scheduleItems = signal([
    { day: 'FRIDAY', time: '09:00', event: 'Tech Inspection & Scrutineering', status: 'DONE' },
    { day: 'SATURDAY', time: '11:30', event: 'Skidpad & Acceleration Events', status: 'LIVE' },
    { day: 'SUNDAY', time: '14:00', event: 'Autocross & Endurance Race', status: 'UPCOMING' }
  ]);
  scheduleBoxOffsetX = signal(0);
  scheduleBoxOffsetY = signal(0);

  // Season Comparison Mode Signals
  compTitle = signal('SEASON COMPARISON');
  compEventLabel = signal('FORMULA STUDENT UK');
  compLastSeason = signal('FSUK 2024');
  compThisSeason = signal('FSUK 2025');
  compRows = signal([
    { event: 'PROJECT MANAGEMENT', last: '1ST', current: '1ST 🥇', improved: false },
    { event: 'BUSINESS PLAN PRESENTATION', last: '5TH', current: '3RD 🥉', improved: true },
    { event: 'DESIGN', last: '23RD', current: '5TH', improved: true },
    { event: 'COST & MANUFACTURING', last: '23RD', current: '8TH', improved: true },
    { event: 'LAP TIME SIMULATION', last: '—', current: '9TH', improved: true },
    { event: 'OVERALL', last: '20TH', current: '3RD 🏆', improved: true }
  ]);
  compBoxOffsetX = signal(0);
  compBoxOffsetY = signal(0);
  compHighlightImproved = signal(true);

  // Visual Effects & Overlays Layer Signals
  showCarbonFiber = signal(false);
  showSpeedLines = signal(false);
  showSparks = signal(false);
  showHudBrackets = signal(false);
  showWatermark = signal(false);
  watermarkText = signal('T-RACERS');

  // Multi-Style Sub-Layouts Signals
  achievementsLayout = signal<'classic' | 'podium' | 'minimal' | 'announcement'>('classic');
  hiringLayout = signal<'grid' | 'spotlight'>('grid');
  revealLayout = signal<'teaser' | 'classified'>('teaser');

  // 🌟 UNIVERSAL MASTER DESIGN CONTROLS & CANVA-STYLE FREE-FORM LAYERS
  customTexts = signal<CustomText[]>([]);
  
  universalTitleColor = signal('#ffffff');
  universalSubColor = signal('#f59e0b');
  universalBodyColor = signal('#e0f8ff');
  universalAccentColor = signal('#d00007');
  universalBorderColor = signal('#00f0ff');
  universalBoxBgColor = signal('#0f172a');
  universalBgColor = signal('#050b14');
  universalBadgeBgColor = signal('#d00007');
  universalTitleScale = signal(100);
  universalTitleOffsetX = signal(0);
  universalTitleOffsetY = signal(0);

  universalSubScale = signal(100);
  universalSubOffsetX = signal(0);
  universalSubOffsetY = signal(0);

  universalContentScale = signal(100);
  universalContentOffsetX = signal(0);
  universalContentOffsetY = signal(0);

  
  presets = [
    { name: '🔥 Red Dark Theme', theme: '#d00007', bg: '#0a0f18', fontColor: '#ffffff', subHighlight: '#d00007' },
    { name: '🏆 Gold Championship', theme: '#f59e0b', bg: '#171103', fontColor: '#fef3c7', subHighlight: '#f59e0b' },
    { name: '⚡ Clean Cyber', theme: '#00f0ff', bg: '#050b14', fontColor: '#e0f8ff', subHighlight: '#00f0ff' },
    { name: '🏁 Minimal Slate', theme: '#ffffff', bg: '#1e293b', fontColor: '#ffffff', subHighlight: '#94a3b8' }
  ];

  heroImage: HTMLImageElement | null = null;
  heroScale = signal(100);
  heroOffsetX = signal(0);
  heroOffsetY = signal(0);
  heroOpacity = signal(100);

  stamps = signal<Stamp[]>([
    { id: 'trophy', text: '🏆 1ST PLACE WINNER', active: false, x: 540, y: 200, size: 28, bg: '#d00007', color: '#ffffff', vectorType: 'wreath' },
    { id: 'egypt', text: '🇪🇬 REPRESENTING EGYPT', active: false, x: 540, y: 260, size: 24, bg: '#000000', color: '#ffffff' },
    { id: 'finalist', text: '🌟 WORLD FINALIST', active: false, x: 540, y: 320, size: 26, bg: '#f59e0b', color: '#000000' },
    { id: 'p_soft', text: '🔴 PIRELLI SOFT C5', active: false, x: 300, y: 200, size: 24, bg: '#ef4444', color: '#ffffff', vectorType: 'pirelli_soft' },
    { id: 'p_med', text: '🟡 PIRELLI MEDIUM C3', active: false, x: 300, y: 260, size: 24, bg: '#facc15', color: '#000000', vectorType: 'pirelli_med' },
    { id: 'p_hard', text: '⚪ PIRELLI HARD C1', active: false, x: 300, y: 320, size: 24, bg: '#ffffff', color: '#000000', vectorType: 'pirelli_hard' },
    { id: 'ev_warn', text: '⚡ 400V HIGH VOLTAGE', active: false, x: 780, y: 200, size: 24, bg: '#ea580c', color: '#ffffff', vectorType: 'ev_hazard' },
    { id: 'fsae_tag', text: '🏁 FSAE OFFICIAL 2026', active: false, x: 780, y: 260, size: 24, bg: '#06b6d4', color: '#ffffff', vectorType: 'fsae_tag' }
  ]);

  // Motorsport Design & Typography Supercharges
  fontPreset = signal<'racing' | 'cyber' | 'industrial' | 'minimal'>('racing');
  showSpotlightGlow = signal<boolean>(true);
  spotlightGlowColor = signal<string>('#dc2626');
  showSciFiBorders = signal<boolean>(true);
  showFooterBar = signal<boolean>(true);
  footerText = signal<string>('WWW.TRACERSMEC.COM // FSAE 2026');

  // --- Phase 6: Ultimate Studio 100% Completion Signals ---
  // 1. Template Library
  savedTemplateLibrary = signal<Array<{ id: string, name: string, date: string, mode: string, format: string, font: string, data: any }>>([]);
  newTemplateName = signal('');
  
  // 2. Magazine Layering & Subject Silhouette Glow
  heroLayering = signal<'above' | 'below'>('above');
  heroSilhouetteGlow = signal<boolean>(false);
  heroSilhouetteColor = signal<string>('#00f0ff');

  // 3. Batch Carousel Generator
  isCarouselMode = signal<boolean>(false);
  carouselSlides = signal<Array<{ title: string, subtitle: string, highlight: string }>>([
    { title: 'SLIDE 1: INTRO', subtitle: 'T-26 LIVERY LAUNCH', highlight: 'REVOLUTION' },
    { title: 'SLIDE 2: POWERTRAIN', subtitle: '400V ARCHITECTURE', highlight: '1.85S ACCEL' },
    { title: 'SLIDE 3: AERO PACKAGE', subtitle: 'CARBON FIBER WINGS', highlight: '420 KG DOWNFORCE' },
    { title: 'SLIDE 4: CHASSIS', subtitle: 'STEEL TUBULAR FRAME', highlight: 'LIGHTWEIGHT' }
  ]);
  isGeneratingCarousel = signal<boolean>(false);
  carouselProgress = signal<number>(0);

  // 4. Instant Export Suite
  clipboardStatus = signal<'idle' | 'copying' | 'copied' | 'error'>('idle');
  exportMultiplier = signal<number>(1);
  isExporting4K = signal<boolean>(false);

  // --- Phase 7: Agency-Grade Asset & Texture Supercharge Signals ---
  // 1. Smart Background Remover / Dark Backdrop Filter
  heroRemoveBackground = signal<boolean>(false);
  heroChromaTolerance = signal<number>(35);

  // 2. Built-in Motorsport Vector Assets (Stickers Drawer)
  showMotorsportDrawer = signal<boolean>(false);

  // 3. Cinematic Film Grain, Stadium Bokeh & Hexagonal Cyber Mesh
  showFilmGrain = signal<boolean>(false);
  showStadiumBokeh = signal<boolean>(false);
  showHexMesh = signal<boolean>(false);

  // 4. Brand Shield & Contrast Validator
  brandShieldActive = signal<boolean>(true);

  // Typography Customization
  eventName = signal('FORMULA STUDENT 2026');
  eventNameSize = signal(36);
  eventNameXOffset = signal(0);
  eventNameYOffset = signal(0);
  eventNameColor = signal('#ffffff');

  mainTitle = signal('HISTORIC ACHIEVEMENT');
  mainTitleSize = signal(80);
  mainTitleXOffset = signal(0);
  mainTitleYOffset = signal(0);
  mainTitleColor = signal('#ffffff');

  subtitle = signal('FIRST EGYPTIAN & ARAB TEAM\nTO REACH THE BUSINESS PLAN PRESENTATION FINALS');
  subtitleSize = signal(24);
  subtitleXOffset = signal(0);
  subtitleYOffset = signal(0);
  subtitleColor = signal('#ffffff');
  subtitleHighlightColor = signal('#d00007');

  // Global Cards Settings
  cardsGlobalYOffset = signal(0);
  cardsGlobalSpacing = signal(20);
  cardsGlobalHeight = signal(160);
  cardsGlobalRadius = signal(15);
  expandedCardSettingsId = signal<string | null>(null);

  cards = signal<AchievementCard[]>([
    { id: '1', rank: '1ST', title: 'PROJECT\nMANAGEMENT', theme: '#FFD700', rankColor: '#FFD700' },
    { id: '2', rank: '3RD', title: 'BUSINESS PLAN\nPRESENTATION', theme: '#CD7F32', rankColor: '#CD7F32' },
    { id: '3', rank: '5TH', title: 'DESIGN', theme: '#d00007', rankColor: '#d00007' },
    { id: '4', rank: '8TH', title: 'COST &\nMANUFACTURING', theme: '#d00007', rankColor: '#d00007' },
    { id: '5', rank: '9TH', title: 'LAP TIME\nSIMULATION', theme: '#d00007', rankColor: '#d00007' }
  ]);

  overallRank = signal('3RD OVERALL');
  overallSubtitle = signal('CONCEPT CLASS');
  overallTheme = signal('#d00007'); // changed to HEX string
  overallWidth = signal(0);
  overallHeight = signal(100);
  overallOffsetX = signal(0);
  overallOffsetY = signal(0);
  overallRadius = signal(15);
  overallRankColor = signal('');
  overallSubtitleColor = signal('#ffffff');
  expandedOverallSettings = signal(false);
  
  previewUrl = signal<string | null>(null);

  // Drag and Drop State
  hitRegions: HitRegion[] = [];
  isHoveringDraggable = signal(false);
  dragState = {
    active: false,
    region: null as HitRegion | null,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0
  };

  // Logos
  logoImage: HTMLImageElement | null = null;

  ngOnInit() {
    this.seo.apply({
      title: 'Achievement Generator — T-Racers MEC',
      description: 'Generate historic achievement graphics.',
      path: '/achievement-generator',
    });
    this.loadSponsors();
    this.preloadAssets();
    this.loadTemplateLibraryFromStorage();
  }

  async loadSponsors() {
    if (typeof window === 'undefined') return;
    try {
      this.loadingSponsors.set(true);
      const data = await firstValueFrom(
        this.http.get<FrameSponsorshipCategory[]>(`${environment.apiUrl}/SponsorshipCategory/Details`)
      );
      if (data) {
        const allSponsors = data.flatMap(cat => cat.sponsors || []);
        const unique = allSponsors.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        this.sponsors.set(unique);
      }
    } catch (e) {
      try {
        const data = await firstValueFrom(this.http.get<FrameSponsorshipCategory[]>('/data/sponsors.json'));
        const allSponsors = data.flatMap(cat => cat.sponsors || []);
        const unique = allSponsors.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        this.sponsors.set(unique);
      } catch (err) {
        console.error('Failed to load sponsors:', err);
      }
    } finally {
      this.loadingSponsors.set(false);
      this.drawCanvas(); // Initial draw with sponsors
    }
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    this.drawCanvas();
  }

  async preloadAssets() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      this.logoImage = await this.loadImage('/new-logo.webp');
    } catch (e) {}
    this.drawCanvas();
  }

  loadImage(src: string, cors: boolean = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') return reject('SSR');
      const img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.bgImage.set(img);
          this.drawCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateBg(type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.bgScale.set(val);
    else if (type === 'x') this.bgOffsetX.set(val);
    else if (type === 'y') this.bgOffsetY.set(val);
    this.drawCanvas();
  }

  updateLogo(type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.logoScale.set(val);
    else if (type === 'x') this.logoOffsetX.set(val);
    else if (type === 'y') this.logoOffsetY.set(val);
    this.drawCanvas();
  }

  onHeroImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.heroImage = img;
          this.drawCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateHero(type: 'scale' | 'x' | 'y' | 'opacity', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.heroScale.set(val);
    else if (type === 'x') this.heroOffsetX.set(val);
    else if (type === 'y') this.heroOffsetY.set(val);
    else if (type === 'opacity') this.heroOpacity.set(val);
    this.drawCanvas();
  }

  applyPreset(preset: any) {
    this.overallTheme.set(preset.theme);
    this.overallRankColor.set(preset.theme);
    this.overallSubtitleColor.set(preset.fontColor);
    this.eventNameColor.set(preset.fontColor);
    this.mainTitleColor.set(preset.fontColor);
    this.subtitleColor.set(preset.fontColor);
    this.subtitleHighlightColor.set(preset.subHighlight);
    this.cards.update(cards => cards.map(c => ({
      ...c,
      theme: preset.theme,
      rankColor: preset.theme,
      titleColor: preset.fontColor
    })));
    this.drawCanvas();
  }

  saveCustomPreset() {
    const custom = {
      theme: this.overallTheme(),
      fontColor: this.mainTitleColor(),
      subHighlight: this.subtitleHighlightColor()
    };
    localStorage.setItem('tracers_custom_preset', JSON.stringify(custom));
    alert('✅ Custom Preset Saved to your browser!');
  }

  loadCustomPreset() {
    const saved = localStorage.getItem('tracers_custom_preset');
    if (saved) {
      const p = JSON.parse(saved);
      this.applyPreset({ theme: p.theme, fontColor: p.fontColor, subHighlight: p.subHighlight });
    } else {
      alert('⚠️ No custom preset saved yet.');
    }
  }

  // --- Phase 6 Methods: Template Library & Export Suite ---
  loadTemplateLibraryFromStorage() {
    if (typeof window === 'undefined' || !localStorage) return;
    try {
      const saved = localStorage.getItem('tracers_template_library');
      if (saved) {
        this.savedTemplateLibrary.set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load template library:', e);
    }
  }

  saveToTemplateLibrary() {
    if (typeof window === 'undefined' || !localStorage) return;
    const name = this.newTemplateName().trim() || `Template ${this.savedTemplateLibrary().length + 1}`;
    const newEntry = {
      id: 'tmpl-' + Date.now(),
      name,
      date: new Date().toLocaleDateString(),
      mode: this.studioMode(),
      format: this.canvasFormat(),
      font: this.fontPreset(),
      data: {
        studioMode: this.studioMode(),
        canvasFormat: this.canvasFormat(),
        fontPreset: this.fontPreset(),
        showSpotlightGlow: this.showSpotlightGlow(),
        spotlightGlowColor: this.spotlightGlowColor(),
        showSciFiBorders: this.showSciFiBorders(),
        showFooterBar: this.showFooterBar(),
        footerText: this.footerText(),
        heroLayering: this.heroLayering(),
        heroSilhouetteGlow: this.heroSilhouetteGlow(),
        heroSilhouetteColor: this.heroSilhouetteColor(),
        eventName: this.eventName(),
        mainTitle: this.mainTitle(),
        subtitle: this.subtitle(),
        eventNameColor: this.eventNameColor(),
        mainTitleColor: this.mainTitleColor(),
        subtitleColor: this.subtitleColor(),
        subtitleHighlightColor: this.subtitleHighlightColor()
      }
    };
    const updated = [newEntry, ...this.savedTemplateLibrary()];
    this.savedTemplateLibrary.set(updated);
    localStorage.setItem('tracers_template_library', JSON.stringify(updated));
    this.newTemplateName.set('');
    alert(`✅ "${name}" saved to Team Template Library!`);
  }

  loadFromTemplateLibrary(tmpl: any) {
    if (!tmpl || !tmpl.data) return;
    const d = tmpl.data;
    if (d.studioMode) this.studioMode.set(d.studioMode);
    if (d.canvasFormat) this.canvasFormat.set(d.canvasFormat);
    if (d.fontPreset) this.fontPreset.set(d.fontPreset);
    if (d.showSpotlightGlow !== undefined) this.showSpotlightGlow.set(d.showSpotlightGlow);
    if (d.spotlightGlowColor) this.spotlightGlowColor.set(d.spotlightGlowColor);
    if (d.showSciFiBorders !== undefined) this.showSciFiBorders.set(d.showSciFiBorders);
    if (d.showFooterBar !== undefined) this.showFooterBar.set(d.showFooterBar);
    if (d.footerText) this.footerText.set(d.footerText);
    if (d.heroLayering) this.heroLayering.set(d.heroLayering);
    if (d.heroSilhouetteGlow !== undefined) this.heroSilhouetteGlow.set(d.heroSilhouetteGlow);
    if (d.heroSilhouetteColor) this.heroSilhouetteColor.set(d.heroSilhouetteColor);
    if (d.eventName) this.eventName.set(d.eventName);
    if (d.mainTitle) this.mainTitle.set(d.mainTitle);
    if (d.subtitle) this.subtitle.set(d.subtitle);
    if (d.eventNameColor) this.eventNameColor.set(d.eventNameColor);
    if (d.mainTitleColor) this.mainTitleColor.set(d.mainTitleColor);
    if (d.subtitleColor) this.subtitleColor.set(d.subtitleColor);
    if (d.subtitleHighlightColor) this.subtitleHighlightColor.set(d.subtitleHighlightColor);
    
    this.drawCanvas();
    alert(`⚡ Loaded template: "${tmpl.name}"!`);
  }

  deleteFromTemplateLibrary(id: string) {
    if (typeof window === 'undefined' || !localStorage) return;
    const updated = this.savedTemplateLibrary().filter(t => t.id !== id);
    this.savedTemplateLibrary.set(updated);
    localStorage.setItem('tracers_template_library', JSON.stringify(updated));
  }

  async copyToClipboard() {
    if (typeof window === 'undefined' || !navigator.clipboard) return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    try {
      this.clipboardStatus.set('copying');
      canvas.toBlob(async (blob) => {
        if (!blob) {
          this.clipboardStatus.set('error');
          return;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.clipboardStatus.set('copied');
        setTimeout(() => this.clipboardStatus.set('idle'), 3000);
      }, 'image/png');
    } catch (e) {
      console.error('Copy to clipboard failed:', e);
      this.clipboardStatus.set('error');
      setTimeout(() => this.clipboardStatus.set('idle'), 3000);
    }
  }

  exportWebP() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/webp', 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `T-Racers_Studio_${this.studioMode()}_${Date.now()}.webp`;
    a.click();
  }

  async export4K() {
    if (this.isExporting4K()) return;
    this.isExporting4K.set(true);
    this.exportMultiplier.set(2.5); // 2.5x scale for Ultra-HD (e.g. 4800x2700 for landscape)
    await this.drawCanvas();
    
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `T-Racers_4K_UltraHD_${this.studioMode()}_${Date.now()}.png`;
      a.click();
    }
    
    this.exportMultiplier.set(1);
    await this.drawCanvas();
    this.isExporting4K.set(false);
  }

  async runBatchCarousel() {
    if (this.isGeneratingCarousel()) return;
    this.isGeneratingCarousel.set(true);
    const slides = this.carouselSlides();
    const origTitle = this.mainTitle();
    const origSub = this.subtitle();
    const origHighlight = this.mainTitleHighlightWord();
    
    for (let i = 0; i < slides.length; i++) {
      this.carouselProgress.set(i + 1);
      this.mainTitle.set(slides[i].title);
      this.subtitle.set(slides[i].subtitle);
      this.mainTitleHighlightWord.set(slides[i].highlight);
      await this.drawCanvas();
      await new Promise(r => setTimeout(r, 600)); // Wait for rendering
      
      const canvas = this.canvasRef?.nativeElement;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `T-Racers_Carousel_Slide_${i + 1}_${Date.now()}.png`;
        a.click();
      }
      await new Promise(r => setTimeout(r, 400));
    }
    
    // Restore originals
    this.mainTitle.set(origTitle);
    this.subtitle.set(origSub);
    this.mainTitleHighlightWord.set(origHighlight);
    await this.drawCanvas();
    this.isGeneratingCarousel.set(false);
    this.carouselProgress.set(0);
    alert('🎉 Batch Carousel generation complete! All slides downloaded.');
  }

  resetPositions() {
    this.logoOffsetX.set(0); this.logoOffsetY.set(0);
    this.bgOffsetX.set(0); this.bgOffsetY.set(0);
    this.heroOffsetX.set(0); this.heroOffsetY.set(0);
    this.eventNameXOffset.set(0); this.eventNameYOffset.set(0);
    this.mainTitleXOffset.set(0); this.mainTitleYOffset.set(0);
    this.subtitleXOffset.set(0); this.subtitleYOffset.set(0);
    this.overallOffsetX.set(0); this.overallOffsetY.set(0);
    this.cardsGlobalYOffset.set(0);
    this.cards.update(cards => cards.map(c => ({ ...c, offsetX: 0, offsetY: 0 })));
    this.sponsorCustomizations.update(s => {
      const copy: any = {};
      Object.keys(s).forEach(k => { copy[Number(k)] = { ...s[Number(k)], offsetX: 0, offsetY: 0 }; });
      return copy;
    });
    this.stamps.update(list => list.map(st => ({ ...st, x: 540, y: 260 })));
    this.hiringDeptOffsetX.set(0); this.hiringDeptOffsetY.set(0);
    this.hiringBoxOffsetX.set(0); this.hiringBoxOffsetY.set(0);
    this.sponsorLogoOffsetX.set(0); this.sponsorLogoOffsetY.set(0);
    this.occasionTitleOffsetX.set(0); this.occasionTitleOffsetY.set(0);
    this.revealTitleOffsetX.set(0); this.revealTitleOffsetY.set(0);
    this.techBoxOffsetX.set(0); this.techBoxOffsetY.set(0);
    this.spotlightBoxOffsetX.set(0); this.spotlightBoxOffsetY.set(0);
    this.telemetryBoxOffsetX.set(0); this.telemetryBoxOffsetY.set(0);
    this.scheduleBoxOffsetX.set(0); this.scheduleBoxOffsetY.set(0);
    this.drawCanvas();
  }

  onSponsorLogoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.sponsorLogoImage = img;
          this.drawCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateRequirement(idx: number, val: string) {
    const arr = [...this.hiringRequirements()];
    arr[idx] = val;
    this.hiringRequirements.set(arr);
    this.drawCanvas();
  }
  addRequirement() {
    this.hiringRequirements.set([...this.hiringRequirements(), '• New Requirement']);
    this.drawCanvas();
  }
  removeRequirement(idx: number) {
    this.hiringRequirements.set(this.hiringRequirements().filter((_, i) => i !== idx));
    this.drawCanvas();
  }

  updateTechSpec(idx: number, val: string) {
    const arr = [...this.techSpecs()];
    arr[idx] = val;
    this.techSpecs.set(arr);
    this.drawCanvas();
  }
  addTechSpec() {
    this.techSpecs.set([...this.techSpecs(), '⚡ NEW SPECIFICATION']);
    this.drawCanvas();
  }
  removeTechSpec(idx: number) {
    this.techSpecs.set(this.techSpecs().filter((_, i) => i !== idx));
    this.drawCanvas();
  }


  toggleStamp(id: string) {
    this.stamps.update(list => list.map(s => s.id === id ? { ...s, active: !s.active } : s));
    this.drawCanvas();
  }

  updateStamp(id: string, prop: 'text' | 'size' | 'bg' | 'color', val: any) {
    this.stamps.update(list => list.map(s => {
      if (s.id === id) {
        if (prop === 'size') return { ...s, size: Number(val) };
        return { ...s, [prop]: val };
      }
      return s;
    }));
    this.drawCanvas();
  }

  toggleSponsor(id: number) {
    const hidden = this.hiddenSponsorIds();
    if (hidden.includes(id)) {
      this.hiddenSponsorIds.set(hidden.filter(hId => hId !== id));
    } else {
      this.hiddenSponsorIds.set([...hidden, id]);
    }
    this.drawCanvas();
  }

  removeSponsor(id: number) {
    this.sponsors.set(this.sponsors().filter(s => s.id !== id));
    this.drawCanvas();
  }

  addCustomSponsor(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      const newSponsor: FrameSponsor = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        logoImage: base64
      };
      this.sponsors.set([...this.sponsors(), newSponsor]);
      this.drawCanvas();
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // reset input
  }

  updateSponsorCustomization(id: number, type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    const current = this.sponsorCustomizations();
    const sponsorConfig = current[id] || { scale: 100, offsetX: 0, offsetY: 0 };
    
    if (type === 'scale') sponsorConfig.scale = val;
    else if (type === 'x') sponsorConfig.offsetX = val;
    else if (type === 'y') sponsorConfig.offsetY = val;
    
    this.sponsorCustomizations.set({
      ...current,
      [id]: sponsorConfig
    });
    
    this.drawCanvas();
  }

  updateBanner(type: 'scale' | 'y' | 'titleY', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.bannerScale.set(val);
    else if (type === 'y') this.bannerOffsetY.set(val);
    else if (type === 'titleY') this.titleOffsetY.set(val);
    this.drawCanvas();
  }
  
  updateCardCustomization(id: string, field: 'width' | 'height' | 'x' | 'y' | 'radius', event: any) {
    const val = Number(event.target.value);
    this.cards.update(cards => cards.map(c => {
      if (c.id === id) {
        if (field === 'width') return { ...c, width: val };
        if (field === 'height') return { ...c, height: val };
        if (field === 'x') return { ...c, offsetX: val };
        if (field === 'y') return { ...c, offsetY: val };
        if (field === 'radius') return { ...c, borderRadius: val };
      }
      return c;
    }));
    this.drawCanvas();
  }

  addCard() {
    this.cards.update(cards => [
      ...cards, 
      { id: Date.now().toString(), rank: 'NEW', title: 'TITLE', theme: '#ffffff', rankColor: '#ffffff' }
    ]);
    this.drawCanvas();
  }
  
  removeCard(id: string) {
    this.cards.set(this.cards().filter(c => c.id !== id));
    this.drawCanvas();
  }

  updateCard(id: string, field: keyof AchievementCard, value: string) {
    const updated = this.cards().map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    this.cards.set(updated);
    this.drawCanvas();
  }

  updateTelemetryMetric(index: number, field: string, value: string | number) {
    this.telemetryMetrics.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    this.drawCanvas();
  }

  updateScheduleItem(index: number, field: string, value: string) {
    this.scheduleItems.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    this.drawCanvas();
  }

  async drawCanvas() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous hit regions
    this.hitRegions = [];

    // Use variable dimensions based on aspect ratio
    const fmt = this.canvasFormat();
    const mult = this.exportMultiplier();
    const w = fmt === 'landscape' ? 1920 : 1080;
    const h = fmt === 'story' ? 1920 : (fmt === 'portrait' ? 1350 : 1080);
    canvas.width = w * mult;
    canvas.height = h * mult;

    ctx.save();
    if (mult !== 1) {
      ctx.scale(mult, mult);
    }

    // 1. Draw Background
    ctx.fillStyle = '#0a0f18'; // Fallback dark color
    ctx.fillRect(0, 0, w, h);

    const bg = this.bgImage();
    if (bg) {
      // Cover logic
      const imgRatio = bg.width / bg.height;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = bg.width * (h / bg.height);
      } else {
        drawW = w;
        drawH = bg.height * (w / bg.width);
      }
      
      const scale = this.bgScale() / 100;
      drawW *= scale;
      drawH *= scale;
      
      const dx = (w - drawW)/2 + this.bgOffsetX();
      const dy = (h - drawH)/2 + this.bgOffsetY();
      
      ctx.drawImage(bg, dx, dy, drawW, drawH);
      this.hitRegions.push({ id: 'bg', type: 'bg', x: dx, y: dy, w: drawW, h: drawH });
    }

    // 2. Draw Bottom Dark Gradient for readability
    const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawSpotlightGlowOverlay(ctx, w, h);

    if (this.showCarbonFiber()) this.drawCarbonFiberOverlay(ctx, w, h);
    if (this.showHexMesh()) this.drawHexMeshOverlay(ctx, w, h);
    if (this.showStadiumBokeh()) this.drawStadiumBokehOverlay(ctx, w, h);
    if (this.showSpeedLines()) this.drawSpeedLinesOverlay(ctx, w, h);
    if (this.showWatermark()) this.drawWatermarkOverlay(ctx, w, h);

    // 2.5 Draw Hero / Car Image Layer (if below typography)
    if (this.heroLayering() === 'below') {
      this.drawHeroImageLayer(ctx, w, h);
    }

    // 3. Draw Logo (Top Center)
    if (this.logoImage) {
      const baseW = 160;
      const lw = baseW * (this.logoScale() / 100);
      const lh = lw * (this.logoImage.height / this.logoImage.width);
      const lx = (w / 2 - lw / 2) + this.logoOffsetX();
      const ly = 50 + this.logoOffsetY();
      ctx.drawImage(this.logoImage, lx, ly, lw, lh);
      this.hitRegions.push({ id: 'logo', type: 'logo', x: lx, y: ly, w: lw, h: lh });
    }

    const mode = this.studioMode();
    if (mode === 'hiring') {
      this.drawHiringMode(ctx, w, h);
    } else if (mode === 'sponsor') {
      this.drawSponsorMode(ctx, w, h);
    } else if (mode === 'occasion') {
      this.drawOccasionMode(ctx, w, h);
    } else if (mode === 'reveal') {
      this.drawRevealMode(ctx, w, h);
    } else if (mode === 'tech') {
      this.drawTechMode(ctx, w, h);
    } else if (mode === 'spotlight') {
      this.drawSpotlightMode(ctx, w, h);
    } else if (mode === 'telemetry') {
      this.drawTelemetryMode(ctx, w, h);
    } else if (mode === 'schedule') {
      this.drawScheduleMode(ctx, w, h);
    } else if (mode === 'comparison') {
      this.drawComparisonMode(ctx, w, h);
    } else if (this.achievementsLayout() === 'podium') {
      this.drawAchievementsPodium(ctx, w, h);
    } else if (this.achievementsLayout() === 'minimal') {
      this.drawAchievementsMinimal(ctx, w, h);
    } else if (this.achievementsLayout() === 'announcement') {
      this.drawAchievementsAnnouncement(ctx, w, h);
    } else {
      // 4. Draw Typography (Event Name, Main Title, Subtitle)
      ctx.textAlign = 'center';
      
      // Event Name
      ctx.font = `800 ${this.eventNameSize()}px ${this.getFontFamily('body')}`;
      ctx.fillStyle = this.eventNameColor();
      const eventX = w / 2 + Number(this.eventNameXOffset());
      const eventY = 180 + Number(this.eventNameYOffset());
      ctx.fillText(this.eventName().toUpperCase(), eventX, eventY);
      const em = ctx.measureText(this.eventName().toUpperCase());
      this.hitRegions.push({ id: 'eventName', type: 'eventName', x: eventX - em.width/2, y: eventY - this.eventNameSize(), w: em.width, h: this.eventNameSize() + 10 });

      // Main Title
      ctx.font = `900 ${this.mainTitleSize()}px ${this.getFontFamily('title')}`;
      const titleX = w / 2 + Number(this.mainTitleXOffset());
      const titleY = 260 + Number(this.mainTitleYOffset());
      const fullTitle = (this.mainTitle() || '').toUpperCase();
      const highlight = (this.mainTitleHighlightWord() || '').toUpperCase().trim();

      if (highlight && fullTitle.includes(highlight)) {
        const words = fullTitle.split(' ');
        const totalW = ctx.measureText(fullTitle).width;
        let curX = titleX - totalW / 2;
        ctx.textAlign = 'left';
        for (const word of words) {
          if (word === highlight || word.includes(highlight)) {
            ctx.fillStyle = this.subtitleHighlightColor() || '#f59e0b';
            ctx.shadowColor = this.subtitleHighlightColor() || '#f59e0b';
            ctx.shadowBlur = 15;
          } else {
            ctx.fillStyle = this.mainTitleColor();
            ctx.shadowBlur = 0;
          }
          ctx.fillText(word, curX, titleY);
          curX += ctx.measureText(word + ' ').width;
        }
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
      } else {
        ctx.fillStyle = this.mainTitleColor();
        ctx.fillText(fullTitle, titleX, titleY);
      }
      const tm = ctx.measureText(fullTitle);
      this.hitRegions.push({ id: 'mainTitle', type: 'mainTitle', x: titleX - tm.width/2, y: titleY - this.mainTitleSize(), w: tm.width, h: this.mainTitleSize() + 10 });

      // Subtitle
      ctx.font = `600 ${this.subtitleSize()}px ${this.getFontFamily('body')}`;
      ctx.fillStyle = this.subtitleColor();
      const subX = w / 2 + Number(this.subtitleXOffset());
      const subY = 330 + Number(this.subtitleYOffset());
      const subLines = this.subtitle().split('\n');
      subLines.forEach((sLine, idx) => {
        ctx.fillText(sLine.toUpperCase(), subX, subY + (idx * (this.subtitleSize() + 8)));
      });
      const sm = ctx.measureText(subLines[0] || '');
      this.hitRegions.push({ id: 'subtitle', type: 'subtitle', x: subX - sm.width/2, y: subY - this.subtitleSize(), w: sm.width, h: (subLines.length * (this.subtitleSize() + 8)) + 10 });

      // 5. Draw Cards
      const cardsList = this.cards();
      const totalCards = cardsList.length;
      if (totalCards > 0) {
        const spacing = Number(this.cardsGlobalSpacing());
        const totalSpacing = spacing * (totalCards - 1);
        const availableW = Math.min(w * 0.9, 1400);
        const cardW = (availableW - totalSpacing) / totalCards;
        const cardH = Number(this.cardsGlobalHeight());
        const startX = (w - availableW) / 2;
        const baseCy = (h * 0.55) + Number(this.cardsGlobalYOffset());

        cardsList.forEach((card, idx) => {
          const cx = startX + idx * (cardW + spacing) + (Number(card.offsetX) || 0);
          const cy = baseCy + (Number(card.offsetY) || 0);

          this.drawSciFiCardFrame(ctx, cx, cy, cardW, cardH, Number(this.cardsGlobalRadius()) || 15, card.theme || '#ffffff');

          this.hitRegions.push({ id: card.id, type: 'card', x: cx, y: cy, w: cardW, h: cardH });

          ctx.textAlign = 'center';
          ctx.font = `900 44px ${this.getFontFamily('title')}`;
          ctx.fillStyle = card.rankColor || card.theme || '#ffffff';
          ctx.fillText(card.rank, cx + cardW/2, cy + 60);

          ctx.font = `600 15px ${this.getFontFamily('body')}`;
          ctx.fillStyle = card.titleColor || '#ffffff';
          const tLines = (card.title || '').split('\n');
          tLines.forEach((tLine, i) => {
            ctx.fillText(tLine.toUpperCase(), cx + cardW/2, cy + 95 + (i * 20));
          });
        });
      }

      // 6. Overall Result
      if (this.overallRank()) {
        const baseOvY = h * 0.84;
        const defaultOvW = w * 0.8;
        const ovW = Number(this.overallWidth()) || defaultOvW;
        const ovH = Number(this.overallHeight());
        const ovX = (w - ovW) / 2 + Number(this.overallOffsetX());
        const ovY = baseOvY + Number(this.overallOffsetY());
        const themeColor = this.overallTheme() || '#ffffff';
        
        this.drawSciFiCardFrame(ctx, ovX, ovY, ovW, ovH, Number(this.overallRadius()) || 15, themeColor);
        
        this.hitRegions.push({ id: 'overall', type: 'overall', x: ovX, y: ovY, w: ovW, h: ovH });

        ctx.fillStyle = this.overallRankColor() || themeColor;
        ctx.font = `900 65px ${this.getFontFamily('title')}`;
        ctx.fillText(this.overallRank(), ovX + ovW/2, ovY + 70);
        
        const lineLen = ovW * 0.2;
        ctx.beginPath();
        ctx.moveTo(ovX + 40, ovY + 80);
        ctx.lineTo(ovX + lineLen + 40, ovY + 80);
        ctx.moveTo(ovX + ovW - 40, ovY + 80);
        ctx.lineTo(ovX + ovW - lineLen - 40, ovY + 80);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.stroke();

        if (this.overallSubtitle()) {
          ctx.fillStyle = this.overallSubtitleColor();
          ctx.font = '600 20px "Inter", sans-serif';
          ctx.fillText(this.overallSubtitle().toUpperCase(), ovX + ovW/2, ovY + 110);
        }
      }
    }

    // 6.5 Draw Stamps & Badges Layer
    const activeStamps = this.stamps().filter(s => s.active);
    activeStamps.forEach(stamp => {
      ctx.save();
      if (stamp.vectorType) {
        this.drawSpecialVectorBadge(ctx, stamp);
      } else {
        ctx.font = `800 ${stamp.size}px "Inter", sans-serif`;
        const metrics = ctx.measureText(stamp.text);
        const padX = stamp.size * 0.8;
        const padY = stamp.size * 0.5;
        const pillW = metrics.width + (padX * 2);
        const pillH = stamp.size + (padY * 2);
        const px = stamp.x - (pillW / 2);
        const py = stamp.y - (pillH / 2);

        ctx.fillStyle = stamp.bg;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(px, py, pillW, pillH, pillH / 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = stamp.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stamp.text, stamp.x, stamp.y);
        this.hitRegions.push({ id: stamp.id, type: 'stamp', x: px, y: py, w: pillW, h: pillH });
      }
      ctx.restore();
    });

    // 7. Sleek Sponsor Banner
    const sponsorsToDraw = this.sponsors().filter(s => !this.hiddenSponsorIds().includes(s.id));
    
    if (sponsorsToDraw.length > 0) {
      const margin = 20;
      const bannerScaleRatio = this.bannerScale() / 100;
      const footerOffset = this.showFooterBar() ? 46 : 0;
      const bannerHeight = 150 * bannerScaleRatio;
      
      // Base banner Y for the background and title (placed cleanly above footer bar)
      const baseBannerY = h - margin - footerOffset - bannerHeight + Number(this.titleOffsetY());
      const bannerWidth = w - (margin * 2) - 30;
      const bannerX = margin + 15;

      // Gradient Background and Title
      if (this.showSponsorBackground()) {
        const grad = ctx.createLinearGradient(0, baseBannerY, 0, baseBannerY + bannerHeight);
        grad.addColorStop(0, 'rgba(5, 11, 20, 0.0)');
        grad.addColorStop(0.35, 'rgba(10, 15, 24, 0.92)');
        grad.addColorStop(1, 'rgba(5, 11, 20, 0.98)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(bannerX, baseBannerY, bannerWidth, bannerHeight);

        // Text "OFFICIAL PARTNERS & SPONSORS" (sleeker and more compact)
        ctx.font = `700 ${13 * bannerScaleRatio}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.textAlign = 'center';
        // @ts-ignore
        ctx.letterSpacing = `${8 * bannerScaleRatio}px`;
        ctx.fillText('OFFICIAL PARTNERS & SPONSORS', w / 2, baseBannerY + (28 * bannerScaleRatio));

        // Bright Red glowing dot accent
        ctx.fillStyle = '#d00007';
        ctx.shadowColor = '#d00007';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(w / 2, baseBannerY + (42 * bannerScaleRatio), 2.5 * bannerScaleRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }

      // Draw Sponsors
      const loadedImages: {img: HTMLImageElement, sponsor: FrameSponsor}[] = [];
      for (const sp of sponsorsToDraw) {
        if (!sp.logoImage) continue;
        const finalUrl = this.images.resolve(sp.logoImage);
        try {
          const img = await this.loadImage(finalUrl, true);
          loadedImages.push({img, sponsor: sp});
        } catch (e) { }
      }

      if (loadedImages.length > 0) {
        const maxPerRow = 5;
        const rows: {img: HTMLImageElement, sponsor: FrameSponsor}[][] = [];
        for (let i = 0; i < loadedImages.length; i += maxPerRow) {
          rows.push(loadedImages.slice(i, i + maxPerRow));
        }

        const targetHeight = 38 * bannerScaleRatio;
        const logoSpacingX = 45 * bannerScaleRatio;
        const logoSpacingY = 22 * bannerScaleRatio;
        
        // Apply the offset ONLY to the logos
        const initialLogosY = baseBannerY + (56 * bannerScaleRatio);
        let startY = initialLogosY + Number(this.bannerOffsetY());

        rows.forEach(row => {
          const scaledRow = row.map(item => {
             const custom = this.sponsorCustomizations()[item.sponsor.id] || { scale: 100, offsetX: 0, offsetY: 0 };
             const customScale = custom.scale / 100;
             const r = targetHeight / item.img.height;
             let baseW = item.img.width * r;
             let baseH = targetHeight;
             const maxBaseWidth = 160 * bannerScaleRatio;
             if (baseW > maxBaseWidth) {
               const shrink = maxBaseWidth / baseW;
               baseW = maxBaseWidth;
               baseH = baseH * shrink;
             }
             return { ...item, baseW, baseH, custom, customScale };
          });

          const totalBaseWidth = scaledRow.reduce((sum, item) => sum + item.baseW, 0) + (logoSpacingX * (scaledRow.length - 1));
          let startX = (w - totalBaseWidth) / 2;

          scaledRow.forEach(item => {
            const drawW = item.baseW * item.customScale;
            const drawH = item.baseH * item.customScale;
            const cx = startX + (item.baseW / 2);
            const cy = startY + (targetHeight / 2);
            const finalX = cx - (drawW / 2) + (item.custom.offsetX * bannerScaleRatio);
            const finalY = cy - (drawH / 2) + (item.custom.offsetY * bannerScaleRatio);
            
            ctx.drawImage(item.img, finalX, finalY, drawW, drawH);
            this.hitRegions.push({ id: item.sponsor.id.toString(), type: 'sponsor', x: finalX, y: finalY, w: drawW, h: drawH });
            startX += item.baseW + logoSpacingX;
          });
          
          startY += targetHeight + logoSpacingY;
        });
      }
    }

    // Top Title Sponsor Placement
    if (this.showTopSponsor()) {
      ctx.save();
      ctx.font = '800 16px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(20, 25, 35, 0.85)';
      ctx.strokeStyle = '#d00007';
      ctx.lineWidth = 1.5;
      const tText = (this.topSponsorText() || '').toUpperCase();
      const tm = ctx.measureText(tText);
      const pillW = tm.width + 36;
      const pillH = 38;
      const px = w - pillW - 30;
      const py = 30;

      ctx.beginPath();
      ctx.roundRect(px, py, pillW, pillH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tText, px + pillW/2, py + pillH/2);
      ctx.restore();
    }

    if (this.showHudBrackets()) this.drawHudBracketsOverlay(ctx, w, h);
    if (this.showSparks()) this.drawSparksOverlay(ctx, w, h);

    // 🌟 Draw Canva-Style Free-Form Custom Texts Layer
    for (const t of this.customTexts()) {
      const fontSize = 48 * (t.scale / 100);
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const cx = w / 2 + t.x;
      const cy = h / 2 + t.y;

      ctx.lineWidth = Math.max(2, fontSize * 0.06);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeText(t.text, cx, cy);
      ctx.fillText(t.text, cx, cy);

      const metrics = ctx.measureText(t.text);
      this.hitRegions.push({
        id: t.id,
        type: 'customText' as any,
        x: cx - metrics.width / 2,
        y: cy - fontSize / 2,
        w: metrics.width,
        h: fontSize
      });
    }

    // Draw Hero / Car Image Layer (if above typography)
    if (this.heroLayering() === 'above') {
      this.drawHeroImageLayer(ctx, w, h);
    }

    this.drawFooterAndQrOverlay(ctx, w, h);
    if (this.showFilmGrain()) this.drawFilmGrainOverlay(ctx, w, h);

    ctx.restore(); // Restore scale multiplier if exportMultiplier was used
    this.previewUrl.set(canvas.toDataURL('image/png'));
  }

  getFilteredHeroCanvas(): HTMLCanvasElement | HTMLImageElement {
    if (!this.heroImage || !this.heroRemoveBackground()) return this.heroImage!;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.heroImage.width;
    offCanvas.height = this.heroImage.height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return this.heroImage;
    offCtx.drawImage(this.heroImage, 0, 0);
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;
    const tol = (this.heroChromaTolerance() / 100) * 255;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < tol) {
        const alphaFactor = Math.max(0, Math.min(1, (lum - (tol * 0.5)) / (tol * 0.5)));
        data[i + 3] = Math.round(data[i + 3] * alphaFactor);
      }
    }
    offCtx.putImageData(imgData, 0, 0);
    return offCanvas;
  }

  drawHeroImageLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.heroImage) return;
    ctx.save();
    ctx.globalAlpha = this.heroOpacity() / 100;
    const baseW = 600;
    const hw = baseW * (this.heroScale() / 100);
    const hh = hw * (this.heroImage.height / this.heroImage.width);
    const hx = (w / 2 - hw / 2) + this.heroOffsetX();
    const hy = (h / 2 - hh / 2) + this.heroOffsetY();

    const renderImg = this.getFilteredHeroCanvas();

    if (this.heroSilhouetteGlow()) {
      ctx.save();
      ctx.shadowColor = this.heroSilhouetteColor() || '#00f0ff';
      ctx.shadowBlur = 45;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(renderImg, hx, hy, hw, hh);
      ctx.drawImage(renderImg, hx, hy, hw, hh); // Double draw for intense neon glow
      ctx.restore();
    }

    ctx.drawImage(renderImg, hx, hy, hw, hh);
    ctx.restore();
    this.hitRegions.push({ id: 'hero', type: 'hero', x: hx, y: hy, w: hw, h: hh });
  }

  drawHiringMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.hiringLayout() === 'spotlight') {
      // Spotlight Split Layout
      if (!this.bgImage()) {
        const splitGrad = ctx.createLinearGradient(0, 0, w, 0);
        splitGrad.addColorStop(0, `${this.universalAccentColor()}26`);
        splitGrad.addColorStop(0.4, this.universalBoxBgColor());
        splitGrad.addColorStop(1, this.universalBgColor());
        ctx.fillStyle = splitGrad;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.strokeStyle = this.universalAccentColor();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w * 0.4, 100); ctx.lineTo(w * 0.4, h - 100); ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '900 55px "Inter", sans-serif';
      ctx.fillStyle = this.universalTitleColor();
      ctx.shadowColor = `${this.universalBorderColor()}cc`;
      ctx.shadowBlur = 15;
      const deptText = this.hiringDepartment().toUpperCase();
      const deptX = w * 0.45 + Number(this.hiringDeptOffsetX());
      const deptY = h * 0.28 + Number(this.hiringDeptOffsetY());
      ctx.fillText(deptText, deptX, deptY);
      ctx.shadowBlur = 0;
      const deptM = ctx.measureText(deptText);
      this.hitRegions.push({ id: 'hiringDept', type: 'hiringDept', x: deptX, y: deptY - 55, w: deptM.width, h: 55 });

      ctx.font = '700 22px "Inter", sans-serif';
      ctx.fillStyle = this.universalSubColor();
      ctx.fillText(this.hiringSubtitle().toUpperCase() + ' • ' + this.hiringDeadline().toUpperCase(), deptX, deptY + 40);

      const reqs = this.hiringRequirements();
      const boxW = Math.min(w * 0.5, 550);
      const lineH = 45;
      const boxH = reqs.length * lineH + 50;
      const boxX = deptX + Number(this.hiringBoxOffsetX());
      const boxY = deptY + 70 + Number(this.hiringBoxOffsetY());

      ctx.fillStyle = this.universalBoxBgColor();
      ctx.strokeStyle = this.universalBorderColor();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 16); ctx.fill(); ctx.stroke();
      this.hitRegions.push({ id: 'hiringBox', type: 'hiringBox', x: boxX, y: boxY, w: boxW, h: boxH });

      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      reqs.forEach((req, idx) => {
        ctx.fillText(req, boxX + 25, boxY + 40 + idx * lineH);
      });

      ctx.textAlign = 'center';
      ctx.font = '800 24px "Inter", sans-serif';
      const badgeW = 480;
      const badgeH = 55;
      const bx = boxX + boxW / 2 - badgeW / 2;
      const by = boxY + boxH + 30;
      ctx.fillStyle = this.universalBadgeBgColor();
      ctx.beginPath(); ctx.roundRect(bx, by, badgeW, badgeH, 27); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⚡ APPLY NOW AT T-RACERS.COM', bx + badgeW / 2, by + 35);
      return;
    }

    if (!this.bgImage()) {
      ctx.strokeStyle = `${this.universalBorderColor()}14`;
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }

    ctx.textAlign = 'center';
    ctx.font = '800 32px "Inter", sans-serif';
    ctx.fillStyle = this.universalBorderColor();
    ctx.shadowColor = this.universalBorderColor();
    ctx.shadowBlur = 10;
    // @ts-ignore
    ctx.letterSpacing = '6px';
    ctx.fillText('WE ARE HIRING • JOIN THE TEAM', w / 2, h * 0.22);
    ctx.shadowBlur = 0;

    ctx.font = '900 70px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalAccentColor()}cc`;
    ctx.shadowBlur = 20;
    const deptText = this.hiringDepartment().toUpperCase();
    const deptX = w / 2 + Number(this.hiringDeptOffsetX());
    const deptY = h * 0.33 + Number(this.hiringDeptOffsetY());
    ctx.fillText(deptText, deptX, deptY);
    ctx.shadowBlur = 0;
    const deptM = ctx.measureText(deptText);
    this.hitRegions.push({ id: 'hiringDept', type: 'hiringDept', x: deptX - deptM.width/2, y: deptY - 70, w: deptM.width, h: 70 });

    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    ctx.fillText(this.hiringSubtitle().toUpperCase() + ' • ' + this.hiringDeadline().toUpperCase(), w / 2, h * 0.40);

    const reqs = this.hiringRequirements();
    const boxW = Math.min(w * 0.75, 800);
    const lineH = 45;
    const boxH = reqs.length * lineH + 60;
    const boxX = (w - boxW) / 2 + Number(this.hiringBoxOffsetX());
    const boxY = h * 0.46 + Number(this.hiringBoxOffsetY());

    ctx.fillStyle = this.universalBoxBgColor();
    ctx.strokeStyle = this.universalAccentColor();
    ctx.lineWidth = 3;
    ctx.shadowColor = `${this.universalAccentColor()}80`;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.hitRegions.push({ id: 'hiringBox', type: 'hiringBox', x: boxX, y: boxY, w: boxW, h: boxH });

    ctx.textAlign = 'left';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    reqs.forEach((req, idx) => {
      ctx.fillText(req, boxX + 40, boxY + 45 + idx * lineH);
    });

    ctx.textAlign = 'center';
    ctx.font = '800 24px "Inter", sans-serif';
    const badgeW = 550;
    const badgeH = 55;
    const bx = w / 2 - badgeW / 2;
    const by = h * 0.85;
    ctx.fillStyle = this.universalBadgeBgColor();
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚡ VISIT T-RACERS.COM TO APPLY NOW', w / 2, by + 35);
  }

  drawSponsorMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createRadialGradient(w/2, h*0.48, 50, w/2, h*0.48, w*0.5);
    grad.addColorStop(0, `${this.sponsorGlowColor() || this.universalAccentColor()}44`);
    grad.addColorStop(0.5, `${this.sponsorGlowColor() || this.universalAccentColor()}11`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '800 28px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    // @ts-ignore
    ctx.letterSpacing = '8px';
    ctx.fillText(this.sponsorModeTier().toUpperCase(), w / 2, h * 0.25);

    const logoImg = this.sponsorLogoImage;
    if (logoImg) {
      const baseW = 450;
      const lw = baseW * (this.sponsorLogoScale() / 100);
      const lh = lw * (logoImg.height / logoImg.width);
      const lx = (w / 2 - lw / 2) + Number(this.sponsorLogoOffsetX());
      const ly = (h * 0.45 - lh / 2) + Number(this.sponsorLogoOffsetY());

      ctx.save();
      ctx.shadowColor = this.sponsorGlowColor() || this.universalAccentColor();
      ctx.shadowBlur = 30;
      ctx.drawImage(logoImg, lx, ly, lw, lh);
      ctx.restore();

      this.hitRegions.push({ id: 'sponsorLogo', type: 'sponsorLogo', x: lx, y: ly, w: lw, h: lh });
    } else {
      const pw = 400; const ph = 200;
      const px = w/2 - pw/2 + Number(this.sponsorLogoOffsetX());
      const py = h*0.45 - ph/2 + Number(this.sponsorLogoOffsetY());
      ctx.strokeStyle = this.universalBorderColor();
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      ctx.fillText('UPLOAD SPONSOR LOGO IN SIDEBAR', w/2, h*0.45);
      this.hitRegions.push({ id: 'sponsorLogo', type: 'sponsorLogo', x: px, y: py, w: pw, h: ph });
    }

    ctx.font = '900 55px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    // @ts-ignore
    ctx.letterSpacing = '2px';
    ctx.fillText(this.sponsorModeName().toUpperCase(), w / 2, h * 0.72);

    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    // @ts-ignore
    ctx.letterSpacing = '4px';
    ctx.fillText(this.sponsorModeTagline().toUpperCase(), w / 2, h * 0.77);
  }

  drawOccasionMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const margin = 40;
    ctx.strokeStyle = this.universalAccentColor();
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, w - margin*2, h - margin*2);
    ctx.strokeStyle = `${this.universalAccentColor()}66`;
    ctx.lineWidth = 1;
    ctx.strokeRect(margin + 10, margin + 10, w - (margin+10)*2, h - (margin+10)*2);

    ctx.textAlign = 'center';
    ctx.font = '900 80px "Inter", "Amiri", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalAccentColor()}99`;
    ctx.shadowBlur = 25;
    const titleText = this.occasionTitle();
    const tx = w / 2 + Number(this.occasionTitleOffsetX());
    const ty = h * 0.45 + Number(this.occasionTitleOffsetY());
    ctx.fillText(titleText, tx, ty);
    ctx.shadowBlur = 0;
    const tm = ctx.measureText(titleText);
    this.hitRegions.push({ id: 'occasionTitle', type: 'occasionTitle', x: tx - tm.width/2, y: ty - 80, w: tm.width, h: 90 });

    ctx.font = '600 32px "Inter", "Amiri", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    const lines = this.occasionSubtitle().split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, w / 2, h * 0.58 + idx * 45);
    });
  }

  drawRevealMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.revealLayout() === 'classified') {
      // Top Secret Classified Layout
      ctx.save();
      ctx.strokeStyle = `${this.universalAccentColor()}66`;
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, w - 60, h - 60);
      ctx.strokeStyle = `${this.universalBorderColor()}33`;
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, w - 80, h - 80);

      ctx.save();
      ctx.translate(w * 0.78, h * 0.18);
      ctx.rotate(-10 * (Math.PI / 180));
      ctx.fillStyle = this.universalBadgeBgColor();
      ctx.font = '900 24px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.beginPath(); ctx.roundRect(-140, -25, 280, 50, 6); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TOP SECRET // FSAE 26', 0, 8);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.font = '700 22px "Inter", sans-serif';
      ctx.fillStyle = this.universalSubColor();
      // @ts-ignore
      ctx.letterSpacing = '8px';
      ctx.fillText(this.revealSubtext().toUpperCase(), w / 2, h * 0.35);

      ctx.font = '900 110px "Inter", sans-serif';
      ctx.fillStyle = this.universalTitleColor();
      ctx.shadowColor = `${this.universalBorderColor()}99`;
      ctx.shadowBlur = 25;
      const carName = this.revealCarName().toUpperCase();
      const cx = w / 2 + Number(this.revealTitleOffsetX());
      const cy = h * 0.60 + Number(this.revealTitleOffsetY());
      ctx.fillText(carName, cx, cy);
      ctx.shadowBlur = 0;
      const cm = ctx.measureText(carName);
      this.hitRegions.push({ id: 'revealTitle', type: 'revealTitle', x: cx - cm.width/2, y: cy - 110, w: cm.width, h: 110 });

      ctx.font = '800 26px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      ctx.fillText(this.revealTagline().toUpperCase(), w / 2, h * 0.76);
      ctx.restore();
      return;
    }

    const grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, `rgba(0,0,0,${this.revealFogOpacity()/100})`);
    grad.addColorStop(1, this.universalBgColor());
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillStyle = this.universalAccentColor();
    // @ts-ignore
    ctx.letterSpacing = '10px';
    ctx.fillText(this.revealSubtext().toUpperCase(), w / 2, h * 0.28);

    ctx.font = 'italic 900 100px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = this.universalAccentColor();
    ctx.shadowBlur = 35;
    // @ts-ignore
    ctx.letterSpacing = '4px';
    const carName = this.revealCarName().toUpperCase();
    const cx = w / 2 + Number(this.revealTitleOffsetX());
    const cy = h * 0.65 + Number(this.revealTitleOffsetY());
    ctx.fillText(carName, cx, cy);
    ctx.shadowBlur = 0;
    const cm = ctx.measureText(carName);
    this.hitRegions.push({ id: 'revealTitle', type: 'revealTitle', x: cx - cm.width/2, y: cy - 100, w: cm.width, h: 100 });

    ctx.font = '800 28px "Inter", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    // @ts-ignore
    ctx.letterSpacing = '6px';
    ctx.fillText(this.revealTagline().toUpperCase(), w / 2, h * 0.74);
  }

  drawTechMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.textAlign = 'center';
    ctx.font = '900 65px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalBorderColor()}80`;
    ctx.shadowBlur = 20;
    ctx.fillText(this.techTitle().toUpperCase(), w / 2, h * 0.25);
    ctx.shadowBlur = 0;

    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    // @ts-ignore
    ctx.letterSpacing = '4px';
    ctx.fillText(this.techSubtitle().toUpperCase(), w / 2, h * 0.32);

    const specs = this.techSpecs();
    const cols = 2;
    const rows = Math.ceil(specs.length / cols);
    const boxW = 400; const boxH = 90; const gapX = 30; const gapY = 25;
    const totalGridW = cols * boxW + (cols - 1) * gapX;
    const totalGridH = rows * boxH + (rows - 1) * gapY;
    const startX = (w - totalGridW) / 2 + Number(this.techBoxOffsetX());
    const startY = h * 0.45 + Number(this.techBoxOffsetY());

    specs.forEach((spec, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const bx = startX + c * (boxW + gapX);
      const by = startY + r * (boxH + gapY);

      ctx.fillStyle = this.universalBoxBgColor();
      ctx.strokeStyle = idx === 0 ? this.universalBorderColor() : `${this.universalBorderColor()}66`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 18px "Inter", sans-serif';
      ctx.fillStyle = idx === 0 ? this.universalBorderColor() : this.universalBodyColor();
      ctx.textAlign = 'center';
      // @ts-ignore
      ctx.letterSpacing = '1px';
      ctx.fillText(spec, bx + boxW / 2, by + boxH / 2 + 6);
    });

    this.hitRegions.push({ id: 'techBox', type: 'techBox', x: startX, y: startY, w: totalGridW, h: totalGridH });

    ctx.textAlign = 'center';
    ctx.font = '800 24px "Inter", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    // @ts-ignore
    ctx.letterSpacing = '5px';
    ctx.fillText(this.techTagline().toUpperCase(), w / 2, h * 0.82);
  }

  drawSpotlightMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    if (!this.bgImage()) {
      const grad = ctx.createRadialGradient(w/2, h*0.5, 50, w/2, h*0.5, w*0.6);
      grad.addColorStop(0, `${this.universalAccentColor()}40`);
      grad.addColorStop(0.6, this.universalBoxBgColor());
      grad.addColorStop(1, this.universalBgColor());
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    const boxX = w * 0.12 + Number(this.spotlightBoxOffsetX());
    const boxY = h * 0.12 + Number(this.spotlightBoxOffsetY());
    const boxW = w * 0.76;
    const boxH = h * 0.35;

    // Giant Quotation Mark Behind
    ctx.textAlign = 'center';
    ctx.font = '900 160px "Inter", sans-serif';
    ctx.fillStyle = `${this.universalAccentColor()}2e`;
    ctx.fillText('“', w / 2, boxY + 110);

    // Quote Box
    ctx.fillStyle = this.universalBoxBgColor();
    ctx.strokeStyle = this.universalAccentColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    // Quote Text
    ctx.font = 'italic 700 25px "Inter", sans-serif';
    ctx.fillStyle = this.universalBodyColor();
    ctx.textAlign = 'center';
    const qLines = (this.spotlightQuote() || '').split('\n');
    qLines.forEach((qLine, idx) => {
      ctx.fillText(`"${qLine}"`, w / 2, boxY + 70 + (idx * 36));
    });

    this.hitRegions.push({ id: 'spotlightBox', type: 'spotlightBox', x: boxX, y: boxY, w: boxW, h: boxH });

    // Name & Role Badge below quote (spacious and elevated)
    const nameY = boxY + boxH + 45;
    ctx.font = '900 40px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalAccentColor()}cc`;
    ctx.shadowBlur = 15;
    ctx.fillText((this.spotlightName() || '').toUpperCase(), w / 2, nameY);
    ctx.shadowBlur = 0;

    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    // @ts-ignore
    ctx.letterSpacing = '4px';
    ctx.fillText((this.spotlightRole() || '').toUpperCase(), w / 2, nameY + 30);

    // Stat Pill Badge (cleanly separated from sponsor banner)
    if (this.spotlightStatValue()) {
      const statX = w / 2;
      const statY = nameY + 80;
      const pillW = 240; const pillH = 60;
      ctx.fillStyle = `${this.universalBorderColor()}1f`;
      ctx.strokeStyle = this.universalBorderColor();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(statX - pillW/2, statY - pillH/2, pillW, pillH, 30);
      ctx.fill(); ctx.stroke();

      ctx.font = '900 24px "Inter", sans-serif';
      ctx.fillStyle = this.universalTitleColor();
      // @ts-ignore
      ctx.letterSpacing = '0px';
      ctx.fillText((this.spotlightStatValue() || '').toUpperCase(), statX, statY - 2);

      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      ctx.fillText((this.spotlightStatLabel() || '').toUpperCase(), statX, statY + 16);
    }
    ctx.restore();
  }

  drawTelemetryMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    if (!this.bgImage()) {
      ctx.fillStyle = this.universalBgColor();
      ctx.fillRect(0, 0, w, h);
      // Sci-fi grid lines
      ctx.strokeStyle = `${this.universalBorderColor()}12`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    ctx.textAlign = 'center';
    ctx.font = '900 52px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalBorderColor()}80`;
    ctx.shadowBlur = 20;
    ctx.fillText((this.telemetryTitle() || '').toUpperCase(), w / 2, h * 0.18);
    ctx.shadowBlur = 0;

    ctx.font = '600 20px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    // @ts-ignore
    ctx.letterSpacing = '3px';
    ctx.fillText((this.telemetrySubtitle() || '').toUpperCase(), w / 2, h * 0.24);

    const metrics = this.telemetryMetrics();
    const cols = 2;
    const rows = Math.ceil(metrics.length / cols);
    const boxW = 430; const boxH = 130; const gapX = 30; const gapY = 30;
    const totalGridW = cols * boxW + (cols - 1) * gapX;
    const totalGridH = rows * boxH + (rows - 1) * gapY;
    const startX = (w - totalGridW) / 2 + Number(this.telemetryBoxOffsetX());
    const startY = h * 0.32 + Number(this.telemetryBoxOffsetY());

    metrics.forEach((m, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const bx = startX + c * (boxW + gapX);
      const by = startY + r * (boxH + gapY);

      // Card Background
      ctx.fillStyle = this.universalBoxBgColor();
      ctx.strokeStyle = this.universalBorderColor();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 16);
      ctx.fill(); ctx.stroke();

      // Metric Label
      ctx.textAlign = 'left';
      ctx.font = '700 15px "Inter", sans-serif';
      ctx.fillStyle = this.universalSubColor();
      // @ts-ignore
      ctx.letterSpacing = '1px';
      ctx.fillText((m.label || '').toUpperCase(), bx + 25, by + 35);

      // Big Number Readout
      ctx.font = '900 42px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      ctx.shadowColor = `${this.universalBorderColor()}80`;
      ctx.shadowBlur = 10;
      ctx.fillText(m.value || '', bx + 25, by + 82);
      ctx.shadowBlur = 0;

      // Progress Meter Bar
      const barW = boxW - 50;
      const barH = 8;
      const barX = bx + 25;
      const barY = by + 100;
      ctx.fillStyle = `${this.universalBorderColor()}33`;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();

      const prog = Math.min(100, Math.max(0, Number(m.progress) || 50));
      const fillW = barW * (prog / 100);
      const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      barGrad.addColorStop(0, this.universalBorderColor());
      barGrad.addColorStop(1, this.universalAccentColor());
      ctx.fillStyle = barGrad;
      ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH, 4); ctx.fill();
    });

    this.hitRegions.push({ id: 'telemetryBox', type: 'telemetryBox', x: startX, y: startY, w: totalGridW, h: totalGridH });
    ctx.restore();
  }

  drawScheduleMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    if (!this.bgImage()) {
      const schedGrad = ctx.createLinearGradient(0, 0, 0, h);
      schedGrad.addColorStop(0, this.universalBoxBgColor());
      schedGrad.addColorStop(1, this.universalBgColor());
      ctx.fillStyle = schedGrad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.textAlign = 'center';
    ctx.font = '900 55px "Inter", sans-serif';
    ctx.fillStyle = this.universalTitleColor();
    ctx.shadowColor = `${this.universalAccentColor()}80`;
    ctx.shadowBlur = 25;
    ctx.fillText((this.scheduleTitle() || '').toUpperCase(), w / 2, h * 0.18);
    ctx.shadowBlur = 0;

    ctx.font = '700 22px "Inter", sans-serif';
    ctx.fillStyle = this.universalSubColor();
    // @ts-ignore
    ctx.letterSpacing = '4px';
    ctx.fillText((this.scheduleEventName() || '').toUpperCase(), w / 2, h * 0.24);

    const items = this.scheduleItems();
    const rowW = w * 0.82;
    const rowH = 85;
    const gapY = 20;
    const startX = (w - rowW) / 2 + Number(this.scheduleBoxOffsetX());
    const startY = h * 0.32 + Number(this.scheduleBoxOffsetY());

    items.forEach((item, idx) => {
      const ry = startY + idx * (rowH + gapY);

      // Row Background
      ctx.fillStyle = item.status === 'LIVE' ? `${this.universalAccentColor()}26` : this.universalBoxBgColor();
      ctx.strokeStyle = item.status === 'LIVE' ? this.universalAccentColor() : `${this.universalBorderColor()}66`;
      ctx.lineWidth = item.status === 'LIVE' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(startX, ry, rowW, rowH, 14);
      ctx.fill(); ctx.stroke();

      // Day Pill
      const pillW = 140; const pillH = 45;
      ctx.fillStyle = item.status === 'LIVE' ? this.universalAccentColor() : `${this.universalBorderColor()}33`;
      ctx.beginPath(); ctx.roundRect(startX + 20, ry + (rowH - pillH)/2, pillW, pillH, 8); ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = '800 16px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      // @ts-ignore
      ctx.letterSpacing = '1px';
      ctx.fillText((item.day || '').toUpperCase(), startX + 20 + pillW/2, ry + rowH/2 + 5);

      // Time & Event Name
      ctx.textAlign = 'left';
      ctx.font = '800 24px "Inter", sans-serif';
      ctx.fillStyle = this.universalSubColor();
      ctx.fillText(item.time || '', startX + 185, ry + rowH/2 + 8);

      ctx.font = '700 22px "Inter", sans-serif';
      ctx.fillStyle = this.universalBodyColor();
      ctx.fillText(item.event || '', startX + 285, ry + rowH/2 + 7);

      // Status Badge on Right
      const statW = 130; const statH = 38;
      const statX = startX + rowW - statW - 25;
      const statY = ry + (rowH - statH)/2;
      let statBg = `${this.universalBorderColor()}33`; let statText = '⏰ UPCOMING'; let statColor = this.universalSubColor();
      if (item.status === 'LIVE') { statBg = this.universalAccentColor(); statText = '🔴 LIVE NOW'; statColor = '#ffffff'; }
      if (item.status === 'DONE') { statBg = '#059669'; statText = '✓ COMPLETED'; statColor = '#ffffff'; }

      ctx.fillStyle = statBg;
      ctx.beginPath(); ctx.roundRect(statX, statY, statW, statH, 20); ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '800 13px "Inter", sans-serif';
      ctx.fillStyle = statColor;
      ctx.fillText(statText, statX + statW/2, statY + statH/2 + 4);
    });

    this.hitRegions.push({ id: 'scheduleBox', type: 'scheduleBox', x: startX, y: startY, w: rowW, h: items.length * (rowH + gapY) });
    ctx.restore();
  }

  // --- Multi-Style Sub-Layouts Methods ---

  drawAchievementsPodium(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const podGrad = ctx.createRadialGradient(w/2, h*0.5, 50, w/2, h*0.5, w*0.45);
    podGrad.addColorStop(0, `${this.universalAccentColor()}40`);
    podGrad.addColorStop(0.6, `${this.universalAccentColor()}0d`);
    podGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = podGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = `${this.universalAccentColor()}66`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w/2, h*0.48, 280, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '900 85px "Inter", sans-serif';
    ctx.fillStyle = this.universalAccentColor();
    ctx.shadowColor = `${this.universalAccentColor()}cc`;
    ctx.shadowBlur = 30;
    ctx.fillText('🏆 1ST PLACE CHAMPIONS', w/2, h*0.35);
    ctx.shadowBlur = 0;

    ctx.font = `900 ${this.mainTitleSize()}px "Inter", sans-serif`;
    ctx.fillStyle = this.universalTitleColor();
    ctx.fillText(this.mainTitle().toUpperCase(), w/2, h*0.48);

    ctx.font = `600 ${this.subtitleSize()}px "Inter", sans-serif`;
    ctx.fillStyle = this.universalSubColor();
    ctx.fillText(this.subtitle().toUpperCase(), w/2, h*0.57);

    ctx.fillStyle = this.universalBadgeBgColor();
    ctx.beginPath(); ctx.roundRect(w/2 - 260, h*0.7 - 28, 520, 56, 28); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Inter", sans-serif';
    ctx.fillText('⚡ OFFICIAL FORMULA STUDENT VICTORY', w/2, h*0.7 + 8);
    ctx.restore();
  }

  drawAchievementsMinimal(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = this.universalAccentColor();
    ctx.fillRect(0, 0, 24, h);

    ctx.textAlign = 'left';
    ctx.font = `800 ${this.eventNameSize()}px "Inter", sans-serif`;
    ctx.fillStyle = this.universalSubColor();
    ctx.fillText(this.eventName().toUpperCase(), 70, 160);

    ctx.font = `900 ${this.mainTitleSize()}px "Inter", sans-serif`;
    ctx.fillStyle = this.universalTitleColor();
    ctx.fillText(this.mainTitle().toUpperCase(), 70, 250);

    ctx.font = `600 ${this.subtitleSize()}px "Inter", sans-serif`;
    ctx.fillStyle = this.universalBodyColor();
    ctx.fillText(this.subtitle().toUpperCase(), 70, 320);

    // Minimal Cards Stack
    const cards = this.cards();
    const startY = 400;
    const rowH = 65;
    cards.slice(0, 5).forEach((c, idx) => {
      const ry = startY + idx * (rowH + 15);
      ctx.fillStyle = this.universalBoxBgColor();
      ctx.strokeStyle = this.universalBorderColor();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(70, ry, w - 140, rowH, 8); ctx.fill(); ctx.stroke();
      
      ctx.font = '800 24px "Inter", sans-serif';
      ctx.fillStyle = this.universalAccentColor();
      ctx.fillText(c.rank, 100, ry + 40);

      ctx.font = '700 22px "Inter", sans-serif';
      ctx.fillStyle = this.universalTitleColor();
      ctx.fillText(c.title.toUpperCase(), 200, ry + 40);

      ctx.textAlign = 'right';
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillStyle = this.universalSubColor();
      ctx.fillText('★ OFFICIAL WINNER', w - 100, ry + 40);
      ctx.textAlign = 'left';
    });
    ctx.restore();
  }

  // --- Visual Effects & Overlays Methods ---

  drawCarbonFiberOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    const step = 20;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSpeedLinesOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(208, 0, 7, 0.18)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 15; i++) {
      const y = (h / 15) * i;
      const len = 150 + (i % 3) * 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(len, y + len * 0.3);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    for (let i = 0; i < 15; i++) {
      const y = (h / 15) * i;
      const len = 180 + (i % 4) * 80;
      ctx.beginPath();
      ctx.moveTo(w, y);
      ctx.lineTo(w - len, y + len * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawHexMeshOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1.5;
    const size = 35;
    const hStep = size * Math.sqrt(3);
    const vStep = size * 1.5;
    for (let row = 0; row < h / vStep + 1; row++) {
      for (let col = 0; col < w / hStep + 1; col++) {
        const cx = col * hStep + ((row % 2) * (hStep / 2));
        const cy = row * vStep;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const px = cx + size * Math.cos(angle);
          const py = cy + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawStadiumBokehOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const bokehs = [
      { x: w * 0.15, y: h * 0.15, r: 280, color: 'rgba(225, 6, 0, 0.22)' },
      { x: w * 0.85, y: h * 0.2, r: 320, color: 'rgba(0, 240, 255, 0.18)' },
      { x: w * 0.5, y: h * 0.85, r: 360, color: 'rgba(245, 158, 11, 0.15)' },
      { x: w * 0.3, y: h * 0.6, r: 220, color: 'rgba(255, 255, 255, 0.08)' }
    ];
    bokehs.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawFilmGrainOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    const step = 6;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 > 0.52) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  drawSpecialVectorBadge(ctx: CanvasRenderingContext2D, stamp: Stamp) {
    ctx.font = `900 ${stamp.size}px "Orbitron", "Racing Sans One", sans-serif`;
    const metrics = ctx.measureText(stamp.text);
    const padX = stamp.size * 1.2;
    const padY = stamp.size * 0.6;
    const pillW = metrics.width + (padX * 2) + 20;
    const pillH = stamp.size + (padY * 2);
    const px = stamp.x - (pillW / 2);
    const py = stamp.y - (pillH / 2);

    ctx.shadowColor = stamp.bg;
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(10, 15, 24, 0.92)';
    ctx.strokeStyle = stamp.bg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = stamp.bg;
    ctx.beginPath();
    ctx.roundRect(px, py, stamp.size * 1.5, pillH, [8, 0, 0, 8]);
    ctx.fill();

    ctx.fillStyle = stamp.color === '#ffffff' && stamp.bg === '#ffffff' ? '#000000' : '#ffffff';
    ctx.font = `900 ${stamp.size * 0.8}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let sym = '★';
    if (stamp.vectorType === 'pirelli_soft') sym = 'S';
    if (stamp.vectorType === 'pirelli_med') sym = 'M';
    if (stamp.vectorType === 'pirelli_hard') sym = 'H';
    if (stamp.vectorType === 'ev_hazard') sym = '⚡';
    if (stamp.vectorType === 'fsae_tag') sym = '🏁';
    if (stamp.vectorType === 'wreath') sym = '👑';
    ctx.fillText(sym, px + (stamp.size * 1.5) / 2, stamp.y);

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${stamp.size * 0.85}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(stamp.text, stamp.x + (stamp.size * 0.7), stamp.y);

    this.hitRegions.push({ id: stamp.id, type: 'stamp', x: px, y: py, w: pillW, h: pillH });
  }

  syncFactoryBrandKit() {
    this.fontPreset.set('racing');
    this.heroSilhouetteColor.set('#00f0ff');
    this.spotlightGlowColor.set('#e10600');
    this.brandShieldActive.set(true);
    this.drawCanvas();
  }

  brandContrastWarning(): boolean {
    return this.brandShieldActive() && this.heroOpacity() < 40;
  }

  drawSparksOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const sparkColors = ['#f59e0b', '#fef3c7', '#d00007', '#ffffff'];
    for (let i = 0; i < 45; i++) {
      const sx = (Math.sin(i * 99) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 33) * 0.5 + 0.5) * h;
      const sr = (i % 4) + 1.5;
      ctx.fillStyle = sparkColors[i % sparkColors.length];
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawHudBracketsOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 10;
    const m = 40;
    const len = 50;

    // Top-Left Corner
    ctx.beginPath(); ctx.moveTo(m + len, m); ctx.lineTo(m, m); ctx.lineTo(m, m + len); ctx.stroke();
    // Top-Right Corner
    ctx.beginPath(); ctx.moveTo(w - m - len, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + len); ctx.stroke();
    // Bottom-Left Corner
    ctx.beginPath(); ctx.moveTo(m + len, h - m); ctx.lineTo(m, h - m); ctx.lineTo(m, h - m - len); ctx.stroke();
    // Bottom-Right Corner
    ctx.beginPath(); ctx.moveTo(w - m - len, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - len); ctx.stroke();

    // Crosshairs
    const drawCross = (cx: number, cy: number) => {
      ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
    };
    drawCross(w * 0.15, h * 0.2);
    drawCross(w * 0.85, h * 0.2);

    ctx.font = '700 14px "Inter", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText('SYS // ACTIVE • TR-2026', m + 10, h - m - 15);
    ctx.restore();
  }

  drawWatermarkOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-15 * (Math.PI / 180));
    ctx.textAlign = 'center';
    ctx.font = '900 130px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    // @ts-ignore
    ctx.letterSpacing = '12px';
    const txt = this.watermarkText().toUpperCase();
    ctx.fillText(txt, 0, 0);
    ctx.strokeText(txt, 0, 0);
    ctx.restore();
  }

  downloadImage() {
    const url = this.previewUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement-${Date.now()}.png`;
    a.click();
  }

  // --- Mouse Interaction Handlers ---

  private getMouseCoords(event: MouseEvent): { x: number, y: number } | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  onMouseDown(event: MouseEvent) {
    const coords = this.getMouseCoords(event);
    if (!coords) return;

    // Search hit regions in reverse (topmost first)
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const region = this.hitRegions[i];
      if (
        coords.x >= region.x &&
        coords.x <= region.x + region.w &&
        coords.y >= region.y &&
        coords.y <= region.y + region.h
      ) {
        // Found a hit
        let initX = 0;
        let initY = 0;

        // Get initial offset based on type
        if (region.type === 'logo') {
          initX = this.logoOffsetX();
          initY = this.logoOffsetY();
        } else if (region.type === 'bg') {
          initX = this.bgOffsetX();
          initY = this.bgOffsetY();
        } else if (region.type === 'overall') {
          initX = this.overallOffsetX();
          initY = this.overallOffsetY();
        } else if (region.type === 'eventName') {
          initX = this.eventNameXOffset();
          initY = this.eventNameYOffset();
        } else if (region.type === 'mainTitle') {
          initX = this.mainTitleXOffset();
          initY = this.mainTitleYOffset();
        } else if (region.type === 'subtitle') {
          initX = this.subtitleXOffset();
          initY = this.subtitleYOffset();
        } else if (region.type === 'card') {
          const card = this.cards().find(c => c.id === region.id);
          initX = card?.offsetX || 0;
          initY = card?.offsetY || 0;
        } else if (region.type === 'sponsor') {
          const id = Number(region.id);
          const custom = this.sponsorCustomizations()[id] || { offsetX: 0, offsetY: 0 };
          initX = custom.offsetX;
          initY = custom.offsetY;
        } else if (region.type === 'hero') {
          initX = this.heroOffsetX();
          initY = this.heroOffsetY();
        } else if (region.type === 'stamp') {
          const stamp = this.stamps().find(s => s.id === region.id);
          initX = stamp?.x || 540;
          initY = stamp?.y || 260;
        } else if (region.type === 'hiringDept') {
          initX = this.hiringDeptOffsetX();
          initY = this.hiringDeptOffsetY();
        } else if (region.type === 'hiringBox') {
          initX = this.hiringBoxOffsetX();
          initY = this.hiringBoxOffsetY();
        } else if (region.type === 'sponsorLogo') {
          initX = this.sponsorLogoOffsetX();
          initY = this.sponsorLogoOffsetY();
        } else if (region.type === 'occasionTitle') {
          initX = this.occasionTitleOffsetX();
          initY = this.occasionTitleOffsetY();
        } else if (region.type === 'revealTitle') {
          initX = this.revealTitleOffsetX();
          initY = this.revealTitleOffsetY();
        } else if (region.type === 'techBox') {
          initX = this.techBoxOffsetX();
          initY = this.techBoxOffsetY();
        } else if (region.type === 'spotlightBox') {
          initX = this.spotlightBoxOffsetX();
          initY = this.spotlightBoxOffsetY();
        } else if (region.type === 'telemetryBox') {
          initX = this.telemetryBoxOffsetX();
          initY = this.telemetryBoxOffsetY();
        } else if (region.type === 'scheduleBox') {
          initX = this.scheduleBoxOffsetX();
          initY = this.scheduleBoxOffsetY();
        } else if (region.type === 'customText' as any) {
          const ct = this.customTexts().find(t => t.id === region.id);
          initX = ct?.x || 0;
          initY = ct?.y || 0;
        }

        this.dragState = {
          active: true,
          region,
          startX: coords.x,
          startY: coords.y,
          initialOffsetX: initX,
          initialOffsetY: initY
        };
        break; // Only drag the topmost
      }
    }
  }

  onMouseMove(event: MouseEvent) {
    const coords = this.getMouseCoords(event);
    if (!coords) return;

    // Handle hover state for cursor
    let isHovering = false;
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const region = this.hitRegions[i];
      if (
        coords.x >= region.x &&
        coords.x <= region.x + region.w &&
        coords.y >= region.y &&
        coords.y <= region.y + region.h
      ) {
        isHovering = true;
        break;
      }
    }
    this.isHoveringDraggable.set(isHovering);

    // Handle drag
    if (!this.dragState.active || !this.dragState.region) return;

    const deltaX = coords.x - this.dragState.startX;
    const deltaY = coords.y - this.dragState.startY;
    const newOffsetX = this.dragState.initialOffsetX + deltaX;
    const newOffsetY = this.dragState.initialOffsetY + deltaY;

    const region = this.dragState.region;

    if (region.type === 'logo') {
      this.logoOffsetX.set(newOffsetX);
      this.logoOffsetY.set(newOffsetY);
    } else if (region.type === 'bg') {
      this.bgOffsetX.set(newOffsetX);
      this.bgOffsetY.set(newOffsetY);
    } else if (region.type === 'overall') {
      this.overallOffsetX.set(newOffsetX);
      this.overallOffsetY.set(newOffsetY);
    } else if (region.type === 'eventName') {
      this.eventNameXOffset.set(newOffsetX);
      this.eventNameYOffset.set(newOffsetY);
    } else if (region.type === 'mainTitle') {
      this.mainTitleXOffset.set(newOffsetX);
      this.mainTitleYOffset.set(newOffsetY);
    } else if (region.type === 'subtitle') {
      this.subtitleXOffset.set(newOffsetX);
      this.subtitleYOffset.set(newOffsetY);
    } else if (region.type === 'card') {
      this.cards.update(cards => cards.map(c => 
        c.id === region.id ? { ...c, offsetX: newOffsetX, offsetY: newOffsetY } : c
      ));
    } else if (region.type === 'sponsor') {
      const id = Number(region.id);
      const current = this.sponsorCustomizations();
      const config = current[id] || { scale: 100, offsetX: 0, offsetY: 0 };
      this.sponsorCustomizations.set({
        ...current,
        [id]: { ...config, offsetX: newOffsetX, offsetY: newOffsetY }
      });
    } else if (region.type === 'hero') {
      this.heroOffsetX.set(newOffsetX);
      this.heroOffsetY.set(newOffsetY);
    } else if (region.type === 'stamp') {
      this.stamps.update(list => list.map(s => 
        s.id === region.id ? { ...s, x: newOffsetX, y: newOffsetY } : s
      ));
    } else if (region.type === 'hiringDept') {
      this.hiringDeptOffsetX.set(newOffsetX);
      this.hiringDeptOffsetY.set(newOffsetY);
    } else if (region.type === 'hiringBox') {
      this.hiringBoxOffsetX.set(newOffsetX);
      this.hiringBoxOffsetY.set(newOffsetY);
    } else if (region.type === 'sponsorLogo') {
      this.sponsorLogoOffsetX.set(newOffsetX);
      this.sponsorLogoOffsetY.set(newOffsetY);
    } else if (region.type === 'occasionTitle') {
      this.occasionTitleOffsetX.set(newOffsetX);
      this.occasionTitleOffsetY.set(newOffsetY);
    } else if (region.type === 'revealTitle') {
      this.revealTitleOffsetX.set(newOffsetX);
      this.revealTitleOffsetY.set(newOffsetY);
    } else if (region.type === 'techBox') {
      this.techBoxOffsetX.set(newOffsetX);
      this.techBoxOffsetY.set(newOffsetY);
    } else if (region.type === 'spotlightBox') {
      this.spotlightBoxOffsetX.set(newOffsetX);
      this.spotlightBoxOffsetY.set(newOffsetY);
    } else if (region.type === 'telemetryBox') {
      this.telemetryBoxOffsetX.set(newOffsetX);
      this.telemetryBoxOffsetY.set(newOffsetY);
    } else if (region.type === 'scheduleBox') {
      this.scheduleBoxOffsetX.set(newOffsetX);
      this.scheduleBoxOffsetY.set(newOffsetY);
    } else if (region.type === 'customText' as any) {
      this.customTexts.update(list => list.map(t =>
        t.id === region.id ? { ...t, x: newOffsetX, y: newOffsetY } : t
      ));
    }

    this.drawCanvas();
  }

  onMouseUp() {
    this.dragState.active = false;
    this.dragState.region = null;
  }

  onMouseLeave() {
    this.dragState.active = false;
    this.dragState.region = null;
    this.isHoveringDraggable.set(false);
  }

  getFontFamily(type: 'title' | 'body' = 'title'): string {
    const preset = this.fontPreset();
    if (preset === 'racing') {
      return type === 'title' ? '"Racing Sans One", "Orbitron", sans-serif' : '"Orbitron", "Inter", sans-serif';
    } if (preset === 'cyber') {
      return type === 'title' ? '"Russo One", "Orbitron", monospace' : '"Orbitron", monospace';
    } if (preset === 'industrial') {
      return type === 'title' ? '"Montserrat", "Russo One", sans-serif' : '"Montserrat", sans-serif';
    }
    return '"Inter", "Montserrat", sans-serif';
  }

  drawSpotlightGlowOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.showSpotlightGlow()) return;
    ctx.save();
    const cx = w / 2;
    const cy = h * 0.45;
    const radius = Math.max(w, h) * 0.55;
    const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    glowGrad.addColorStop(0, this.spotlightGlowColor() + '40'); // 25% opacity
    glowGrad.addColorStop(0.5, this.spotlightGlowColor() + '15'); // 8% opacity
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawFooterAndQrOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 1. Official Angled Geometric Footer Bar
    if (this.showFooterBar()) {
      ctx.save();
      const footerH = 46;
      const fy = h - footerH;
      ctx.fillStyle = 'rgba(10, 15, 24, 0.95)';
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Top red accent border on footer
      ctx.fillStyle = '#d00007';
      ctx.fillRect(0, fy, w, 2.5);

      ctx.font = '800 15px "Orbitron", "Racing Sans One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText((this.footerText() || '').toUpperCase(), 30, fy + footerH / 2);

      // Angled speed stripes on the right of footer
      ctx.fillStyle = '#d00007';
      ctx.beginPath();
      ctx.moveTo(w - 180, fy);
      ctx.lineTo(w - 160, fy + footerH);
      ctx.lineTo(w - 140, fy + footerH);
      ctx.lineTo(w - 160, fy);
      ctx.fill();

      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(w - 130, fy);
      ctx.lineTo(w - 110, fy + footerH);
      ctx.lineTo(w - 90, fy + footerH);
      ctx.lineTo(w - 110, fy);
      ctx.fill();
      ctx.restore();
    }
  }

  drawSciFiCardFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, borderColor: string) {
    ctx.save();
    ctx.fillStyle = this.universalBoxBgColor() || 'rgba(15, 23, 42, 0.9)';
    ctx.shadowColor = borderColor || this.universalBorderColor();
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    if (this.showSciFiBorders()) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      const bLen = Math.min(24, Math.min(w, h) * 0.25);

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x + radius + bLen, y);
      ctx.lineTo(x + radius, y);
      ctx.arcTo(x, y, x, y + radius, radius);
      ctx.lineTo(x, y + radius + bLen);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + w - radius - bLen, y);
      ctx.lineTo(x + w - radius, y);
      ctx.arcTo(x + w, y, x + w, y + radius, radius);
      ctx.lineTo(x + w, y + radius + bLen);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + w - radius - bLen, y + h);
      ctx.lineTo(x + w - radius, y + h);
      ctx.arcTo(x + w, y + h, x + w, y + h - radius, radius);
      ctx.lineTo(x + w, y + h - radius - bLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x + radius + bLen, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.arcTo(x, y + h, x, y + h - radius, radius);
      ctx.lineTo(x, y + h - radius - bLen);
      ctx.stroke();

      // Subtle cyan/accent dots
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(x + w/2 - 15, y, 30, 2);
      ctx.fillRect(x + w/2 - 15, y + h - 2, 30, 2);
    } else {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  addCustomText(inputEl: HTMLInputElement) {
    const text = inputEl.value.trim();
    if (!text) return;
    const newText: CustomText = {
      id: Date.now().toString(),
      text,
      x: 0,
      y: 0,
      scale: 100,
      color: '#ffffff'
    };
    this.customTexts.set([...this.customTexts(), newText]);
    inputEl.value = '';
    this.drawCanvas();
  }

  removeCustomText(id: string) {
    this.customTexts.set(this.customTexts().filter(t => t.id !== id));
    this.drawCanvas();
  }

  updateCustomTextControl(id: string, type: 'scale' | 'x' | 'y' | 'color' | 'text', event: any) {
    const val = event.target.value;
    const texts = this.customTexts().map(t => {
      if (t.id === id) {
        if (type === 'color') t.color = val;
        else if (type === 'scale') t.scale = Number(val);
        else if (type === 'x') t.x = Number(val);
        else if (type === 'y') t.y = Number(val);
        else if (type === 'text') t.text = val;
      }
      return t;
    });
    this.customTexts.set(texts);
    this.drawCanvas();
  }

  applyQuickColorPalette(title: string, sub: string, body: string, accent: string, border: string, boxBg: string, bg: string, badge: string) {
    this.universalTitleColor.set(title);
    this.universalSubColor.set(sub);
    this.universalBodyColor.set(body);
    this.universalAccentColor.set(accent);
    this.universalBorderColor.set(border);
    this.universalBoxBgColor.set(boxBg);
    this.universalBgColor.set(bg);
    this.universalBadgeBgColor.set(badge);
    this.drawCanvas();
  }

  resetUniversalControls() {
    this.universalTitleColor.set('#ffffff');
    this.universalSubColor.set('#f59e0b');
    this.universalBodyColor.set('#e0f8ff');
    this.universalAccentColor.set('#d00007');
    this.universalBorderColor.set('#00f0ff');
    this.universalBoxBgColor.set('#0f172a');
    this.universalBgColor.set('#050b14');
    this.universalBadgeBgColor.set('#d00007');
    this.universalTitleScale.set(100);
    this.universalTitleOffsetX.set(0);
    this.universalTitleOffsetY.set(0);
    this.universalSubScale.set(100);
    this.universalSubOffsetX.set(0);
    this.universalSubOffsetY.set(0);
    this.universalContentScale.set(100);
    this.universalContentOffsetX.set(0);
    this.universalContentOffsetY.set(0);
    this.drawCanvas();
  }

  addCompRow() {
    this.compRows.set([...this.compRows(), { event: 'NEW EVENT', last: '—', current: '—', improved: false }]);
    this.drawCanvas();
  }

  updateCompRow(idx: number, field: 'event' | 'last' | 'current' | 'improved', value: any) {
    const rows = this.compRows().map((r, i) => {
      if (i === idx) return { ...r, [field]: field === 'improved' ? Boolean(value) : value };
      return r;
    });
    this.compRows.set(rows);
    this.drawCanvas();
  }

  removeCompRow(idx: number) {
    this.compRows.set(this.compRows().filter((_, i) => i !== idx));
    this.drawCanvas();
  }

  drawComparisonMode(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    const accent = this.universalAccentColor();
    const border = this.universalBorderColor();
    const titleCol = this.universalTitleColor();
    const bodyCol = this.universalBodyColor();

    // ─── 1. DARK GRADIENT OVERLAY ───
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.4)');
    overlay.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    overlay.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    // ─── 2. CHECKERED SIDE ACCENTS ───
    const checkerSize = Math.round(w * 0.038);
    const checkerCols = 3;
    const checkerRows = Math.ceil(h / checkerSize);

    const drawCheckers = (startX: number) => {
      for (let row = 0; row < checkerRows; row++) {
        for (let col = 0; col < checkerCols; col++) {
          const isEven = (row + col) % 2 === 0;
          ctx.fillStyle = isEven ? `${accent}cc` : `${accent}22`;
          ctx.fillRect(startX + col * checkerSize, row * checkerSize, checkerSize, checkerSize);
        }
      }
    };

    ctx.save();
    ctx.globalAlpha = 0.7;
    drawCheckers(0);
    drawCheckers(w - checkerCols * checkerSize);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ─── 3. SUBTITLE / TAG LINE ───
    const tagY = h * 0.18;
    const tagText = (this.compTitle() || 'SEASON COMPARISON').toUpperCase();
    const tagFontSz = Math.round(w * 0.026);
    ctx.textAlign = 'center';
    ctx.font = `700 ${tagFontSz}px "Inter", sans-serif`;
    ctx.fillStyle = `${titleCol}cc`;
    // @ts-ignore
    ctx.letterSpacing = '6px';
    ctx.fillText(tagText, w / 2, tagY);
    // @ts-ignore
    ctx.letterSpacing = '0px';

    // ─── EXTRACT HERO ROW (OVERALL) AND BADGE ROWS ───
    const allRows = this.compRows();
    let heroRow = allRows.find(r => r.event.toUpperCase() === 'OVERALL');
    let badgeRows = allRows.filter(r => r.event.toUpperCase() !== 'OVERALL');
    
    // If no overall found, use the last row as hero
    if (!heroRow && allRows.length > 0) {
      heroRow = allRows[allRows.length - 1];
      badgeRows = allRows.slice(0, allRows.length - 1);
    }

    // ─── 4. GIANT HERO COMPARISON ───
    let divY = h * 0.44;
    
    if (heroRow) {
      const heroVal = heroRow.current.replace(/[^a-zA-Z0-9\s]/g, '').trim(); // Remove emojis for the huge text
      const rankSz = Math.round(w * 0.25);
      ctx.font = `900 ${rankSz}px "Orbitron", "Inter", sans-serif`;
      ctx.textAlign = 'center';

      // Text shadow
      ctx.shadowColor = accent;
      ctx.shadowBlur = 60;
      ctx.fillStyle = accent;
      ctx.fillText(heroVal, w / 2 + 5, h * 0.42 + 5);
      
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 20;
      ctx.fillStyle = titleCol;
      ctx.fillText(heroVal, w / 2, h * 0.42);
      ctx.shadowBlur = 0;

      // "OVERALL" LABEL
      const overallSz = Math.round(w * 0.075);
      ctx.font = `900 ${overallSz}px "Orbitron", "Inter", sans-serif`;
      ctx.fillStyle = titleCol;
      ctx.shadowColor = `${accent}88`;
      ctx.shadowBlur = 30;
      ctx.fillText(heroRow.event.toUpperCase(), w / 2, h * 0.42 + overallSz * 1.1);
      ctx.shadowBlur = 0;

      // "LAST SEASON: X" PILL
      const prevText = `${this.compLastSeason() || 'LAST SEASON'}: ${heroRow.last}`;
      const pillSz = Math.round(w * 0.018);
      ctx.font = `700 ${pillSz}px "Inter", sans-serif`;
      const pW = ctx.measureText(prevText).width + 60;
      const pH = pillSz * 2.2;
      const pY = h * 0.42 + overallSz * 1.5;
      
      ctx.fillStyle = `${accent}33`;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect((w - pW)/2, pY, pW, pH, pH/2); ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(prevText, w / 2, pY + pH * 0.68);

      divY = pY + pH + h * 0.05;
    }

    // ─── 5. HORIZONTAL DIVIDER ───
    const divW = w * 0.6;
    const divX = (w - divW) / 2;
    const divGrad = ctx.createLinearGradient(divX, 0, divX + divW, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, `${border}cc`);
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(divX, divY, divW, 2);

    // ─── 6. COMPARISON BADGES (CIRCLES AT BOTTOM) ───
    const badgeCount = Math.min(badgeRows.length, 5);

    if (badgeCount > 0) {
      const badgeZoneTop = divY + h * 0.04;
      const badgeZoneH = h * 0.92 - badgeZoneTop;
      const badgeDiam = Math.min(Math.round(w * 0.14), Math.round(badgeZoneH * 0.5));
      const badgeGap = (w * 0.88 - badgeDiam * badgeCount) / Math.max(badgeCount - 1, 1);
      const badgeStartX = w * 0.06 + badgeDiam / 2;

      badgeRows.slice(0, badgeCount).forEach((row, i) => {
        const bx = badgeStartX + i * (badgeDiam + badgeGap);
        const by = badgeZoneTop + badgeDiam / 2;

        const isImproved = row.improved && this.compHighlightImproved();

        // Outer ring
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isImproved ? `${accent}aa` : `${border}55`;
        ctx.lineWidth = isImproved ? 3 : 1.5;
        if (isImproved) {
          ctx.shadowColor = accent;
          ctx.shadowBlur = 15;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Badge circle fill
        const badgeBg = ctx.createRadialGradient(bx - badgeDiam * 0.15, by - badgeDiam * 0.15, 0, bx, by, badgeDiam / 2);
        badgeBg.addColorStop(0, isImproved ? `${accent}ff` : `${border}22`);
        badgeBg.addColorStop(1, isImproved ? `${accent}99` : `${border}05`);
        ctx.fillStyle = badgeBg;
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2, 0, Math.PI * 2);
        ctx.fill();

        // Badge border
        ctx.strokeStyle = isImproved ? titleCol : `${border}88`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Rank text (current)
        const rankFontSz = Math.round(badgeDiam * 0.35);
        const cleanCurrent = row.current.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        ctx.textAlign = 'center';
        ctx.font = `900 ${rankFontSz}px "Orbitron", "Inter", sans-serif`;
        ctx.fillStyle = isImproved ? '#ffffff' : `${titleCol}dd`;
        if (isImproved) {
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 8;
        }
        ctx.fillText(cleanCurrent, bx, by + rankFontSz * 0.36);
        ctx.shadowBlur = 0;

        // "Was: X" pill intersecting bottom of circle
        const wasText = `WAS ${row.last}`;
        const wasSz = Math.round(badgeDiam * 0.14);
        ctx.font = `700 ${wasSz}px "Inter", sans-serif`;
        const wasW = ctx.measureText(wasText).width + 24;
        const wasH = wasSz * 2.2;
        const wasY = by + badgeDiam / 2 - wasH / 2;
        
        ctx.fillStyle = '#0a0f18';
        ctx.strokeStyle = isImproved ? accent : `${border}66`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx - wasW/2, wasY, wasW, wasH, wasH/2); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = isImproved ? accent : `${bodyCol}99`;
        ctx.fillText(wasText, bx, wasY + wasH * 0.68);

        // Event label below badge
        const evFontSz = Math.round(w * 0.016);
        const evText = (row.event || '').toUpperCase();
        ctx.font = `700 ${evFontSz}px "Inter", sans-serif`;
        ctx.fillStyle = `${titleCol}cc`;
        
        const words = evText.split(' ');
        const maxW = badgeDiam + badgeGap * 0.8;
        const lines: string[] = [];
        let curLine = '';
        for (const word of words) {
          const test = curLine ? curLine + ' ' + word : word;
          if (ctx.measureText(test).width > maxW && curLine) {
            lines.push(curLine);
            curLine = word;
          } else {
            curLine = test;
          }
        }
        if (curLine) lines.push(curLine);

        const lineH = evFontSz * 1.3;
        const textBlockTop = wasY + wasH + evFontSz * 1.2;
        lines.slice(0, 2).forEach((ln, li) => {
          ctx.fillText(ln, bx, textBlockTop + li * lineH);
        });
      });
    }

    // ─── 7. FOOTER ───
    const footTextY = h * 0.965;
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(w * 0.02)}px "Inter", sans-serif`;
    ctx.fillStyle = `${bodyCol}66`;
    // @ts-ignore
    ctx.letterSpacing = '5px';
    ctx.fillText((this.compEventLabel() || 'FORMULA STUDENT').toUpperCase(), w / 2, footTextY);
    // @ts-ignore
    ctx.letterSpacing = '0px';

    ctx.restore();
  }

  drawAchievementsAnnouncement(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    const accent = this.universalAccentColor();
    const border = this.universalBorderColor();
    const titleCol = this.universalTitleColor();
    const subCol = this.universalSubColor();
    const bodyCol = this.universalBodyColor();

    // ─── 1. DARK GRADIENT OVERLAY (always, even over photo) ───
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.35)');
    overlay.addColorStop(0.4, 'rgba(0,0,0,0.15)');
    overlay.addColorStop(0.68, 'rgba(0,0,0,0.6)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    // ─── 2. CHECKERED SIDE ACCENTS ───
    const checkerSize = Math.round(w * 0.038);
    const checkerCols = 3;
    const checkerRows = Math.ceil(h / checkerSize);

    const drawCheckers = (startX: number) => {
      for (let row = 0; row < checkerRows; row++) {
        for (let col = 0; col < checkerCols; col++) {
          const isEven = (row + col) % 2 === 0;
          ctx.fillStyle = isEven ? `${accent}cc` : `${accent}22`;
          ctx.fillRect(startX + col * checkerSize, row * checkerSize, checkerSize, checkerSize);
        }
      }
    };

    // Left checkers
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawCheckers(0);
    // Right checkers
    drawCheckers(w - checkerCols * checkerSize);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ─── 3. SUBTITLE / TAG LINE ───
    const tagY = h * 0.20;
    const tagText = (this.eventName() || 'OUR PROUD ACHIEVEMENTS').toUpperCase();
    const tagFontSz = Math.round(w * 0.026);
    ctx.textAlign = 'center';
    ctx.font = `700 ${tagFontSz}px "Inter", sans-serif`;
    ctx.fillStyle = `${titleCol}cc`;
    // @ts-ignore
    ctx.letterSpacing = '6px';
    ctx.fillText(tagText, w / 2, tagY);
    // @ts-ignore
    ctx.letterSpacing = '0px';

    // ─── 4. GIANT RANK NUMBER (HERO ELEMENT) ───
    const rankText = (this.mainTitle() || '3RD').toUpperCase();
    const rankSz = Math.round(w * 0.28);
    ctx.font = `900 ${rankSz}px "Orbitron", "Inter", sans-serif`;
    ctx.textAlign = 'center';

    // Text shadow layers for depth
    ctx.shadowColor = accent;
    ctx.shadowBlur = 60;
    ctx.fillStyle = accent;
    ctx.fillText(rankText, w / 2 + 5, h * 0.44 + 5);

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.fillStyle = titleCol;
    ctx.fillText(rankText, w / 2, h * 0.44);
    ctx.shadowBlur = 0;

    // ─── 5. "OVERALL" LABEL BELOW RANK ───
    const overallText = (this.mainTitleHighlightWord() || 'OVERALL').toUpperCase();
    const overallSz = Math.round(w * 0.085);
    ctx.font = `900 ${overallSz}px "Orbitron", "Inter", sans-serif`;
    ctx.fillStyle = titleCol;
    ctx.shadowColor = `${accent}88`;
    ctx.shadowBlur = 30;
    ctx.fillText(overallText, w / 2, h * 0.44 + overallSz * 1.1);
    ctx.shadowBlur = 0;

    // ─── 6. HORIZONTAL DIVIDER ───
    const divY = h * 0.44 + overallSz * 1.6;
    const divW = w * 0.5;
    const divX = (w - divW) / 2;
    const divGrad = ctx.createLinearGradient(divX, 0, divX + divW, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, `${border}cc`);
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(divX, divY, divW, 2);

    // ─── 7. EVENT RESULT BADGES (CIRCLES AT BOTTOM) ───
    const cards = this.cards();
    const validCards = cards.filter(c => c.rank && c.title);
    const badgeCount = Math.min(validCards.length, 6);

    if (badgeCount > 0) {
      const badgeZoneTop = divY + h * 0.045;
      const badgeZoneH = h * 0.93 - badgeZoneTop;
      const badgeDiam = Math.min(Math.round(w * 0.135), Math.round(badgeZoneH * 0.55));
      const badgeGap = (w * 0.88 - badgeDiam * badgeCount) / Math.max(badgeCount - 1, 1);
      const badgeStartX = w * 0.06 + badgeDiam / 2;

      validCards.slice(0, badgeCount).forEach((card, i) => {
        const bx = badgeStartX + i * (badgeDiam + badgeGap);
        const by = badgeZoneTop + badgeDiam / 2;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = `${accent}88`;
        ctx.lineWidth = 2;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Badge circle fill
        const badgeBg = ctx.createRadialGradient(bx - badgeDiam * 0.12, by - badgeDiam * 0.12, 0, bx, by, badgeDiam / 2);
        badgeBg.addColorStop(0, `${accent}ee`);
        badgeBg.addColorStop(1, `${accent}99`);
        ctx.fillStyle = badgeBg;
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2, 0, Math.PI * 2);
        ctx.fill();

        // Badge border
        ctx.strokeStyle = titleCol;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, badgeDiam / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Rank text inside badge
        const rankFontSz = Math.round(badgeDiam * 0.4);
        ctx.textAlign = 'center';
        ctx.font = `900 ${rankFontSz}px "Orbitron", "Inter", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.fillText((card.rank || '').toUpperCase(), bx, by + rankFontSz * 0.36);
        ctx.shadowBlur = 0;

        // Event label below badge
        const evFontSz = Math.round(w * 0.018);
        const evText = (card.title || '').toUpperCase();
        ctx.font = `700 ${evFontSz}px "Inter", sans-serif`;
        ctx.fillStyle = `${titleCol}dd`;
        // @ts-ignore
        ctx.letterSpacing = '1px';

        // Word wrap event label (2 lines max)
        const words = evText.split(' ');
        const maxW = badgeDiam + badgeGap * 0.6;
        const lines: string[] = [];
        let curLine = '';
        for (const word of words) {
          const test = curLine ? curLine + ' ' + word : word;
          if (ctx.measureText(test).width > maxW && curLine) {
            lines.push(curLine);
            curLine = word;
          } else {
            curLine = test;
          }
        }
        if (curLine) lines.push(curLine);

        const lineH = evFontSz * 1.3;
        const textBlockTop = by + badgeDiam / 2 + evFontSz * 0.8;
        lines.slice(0, 2).forEach((ln, li) => {
          ctx.fillText(ln, bx, textBlockTop + li * lineH);
        });
        // @ts-ignore
        ctx.letterSpacing = '0px';
      });
    }

    // ─── 8. OPTIONAL SUBTITLE (event label e.g. "IN CONCEPT CLASS") ───
    if (this.eventName()) {
      const footTextY = h * 0.965;
      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(w * 0.022)}px "Inter", sans-serif`;
      ctx.fillStyle = `${bodyCol}88`;
      // @ts-ignore
      ctx.letterSpacing = '5px';
      ctx.fillText(this.subtitle()?.toUpperCase() || '', w / 2, footTextY);
      // @ts-ignore
      ctx.letterSpacing = '0px';
    }

    ctx.restore();
  }
}
