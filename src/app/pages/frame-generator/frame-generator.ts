import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageUrlService } from '../../services/image-url.service';
import { SeoService } from '../../services/seo.service';

interface FrameSponsor {
  id: number;
  name?: string;
  logoImage: string;
}
interface FrameSponsorshipCategory {
  id: number;
  sponsors: FrameSponsor[];
}

export interface UploadedObject {
  id: string;
  img: HTMLImageElement;
  src: string;
  x: number;
  y: number;
  scale: number;
}

export interface CustomText {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
}

@Component({
  selector: 'app-frame-generator',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './frame-generator.html'
})
export class FrameGenerator implements OnInit {
  isEmbedded = input<boolean>(false);
  @ViewChild('mainCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private http = inject(HttpClient);
  images = inject(ImageUrlService);
  private seo = inject(SeoService);

  format = signal<'square' | 'portrait'>('square');
  loadingSponsors = signal(true);
  sponsors = signal<FrameSponsor[]>([]);
  previewUrl = signal<string | null>(null);
  userBackgroundImage = signal<HTMLImageElement | null>(null);
  
  bgScaleX = signal(100);
  bgScaleY = signal(100);
  bgOffsetX = signal(0);
  bgOffsetY = signal(0);

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private lastDist = 0;
  
  private imgRect = { x: 0, y: 0, w: 0, h: 0 };
  private activeHandle: 'tl'|'tr'|'bl'|'br' | null = null;
  private initialRect = { x: 0, y: 0, w: 0, h: 0 };
  private initialScaleX = 100;
  private initialScaleY = 100;
  private initialOffsetX = 0;
  private initialOffsetY = 0;
  
  private hideHandles = false;

  // Sponsor Controls
  bannerOffsetY = signal(0);
  bannerScale = signal(100);
  hiddenSponsorIds = signal<number[]>([]);
  sponsorCustomizations = signal<Record<number, {scale: number, offsetX: number, offsetY: number}>>({});
  expandedSponsorSettingsId = signal<number | null>(null);

  // Sponsor dragging state
  activeSponsorDragId: number | null = null;
  renderedSponsorRects: Record<number, {x: number, y: number, w: number, h: number}> = {};

  // Uploaded Objects State
  uploadedObjects = signal<UploadedObject[]>([]);
  activeObjectDragId: string | null = null;
  renderedObjectRects: Record<string, {x: number, y: number, w: number, h: number}> = {};

  // Custom Text State
  customTexts = signal<CustomText[]>([]);
  activeTextDragId: string | null = null;
  renderedTextRects: Record<string, {x: number, y: number, w: number, h: number}> = {};

  // Logo State
  logoScale = signal(100);
  logoOffsetX = signal(0);
  logoOffsetY = signal(0);
  activeLogoDrag = false;
  renderedLogoRect = {x: 0, y: 0, w: 0, h: 0};

  // Frame State
  showFrameBorder = signal(true);
  framePadding = signal(20);

  // Background Filters
  bgFilterDarken = signal(0);
  bgFilterRedTint = signal(0);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Social Frame Generator — T-Racers MEC',
      description: 'Generate transparent brand frames for social media.',
      path: '/frame-generator',
    });
    this.fetchSponsors();
  }

  setFormat(f: 'square' | 'portrait') {
    this.format.set(f);
    setTimeout(() => this.drawFrame(), 50);
  }

  private fetchSponsors() {
    this.http.get<FrameSponsorshipCategory[]>(`${environment.apiUrl}/SponsorshipCategory/Details`)
      .pipe(catchError(() => this.http.get<FrameSponsorshipCategory[]>('/data/sponsors.json')))
      .subscribe({
        next: (data) => {
          const allSponsors = data.flatMap(cat => cat.sponsors || []);
          // Deduplicate if any
          const unique = allSponsors.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          this.sponsors.set(unique);
          this.loadingSponsors.set(false);
          this.drawFrame();
        },
        error: () => {
          this.loadingSponsors.set(false);
          this.drawFrame();
        }
      });
  }

  onImageUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const img = await this.loadImage(dataUrl);
        this.userBackgroundImage.set(img);
        this.drawFrame();
      } catch (err) {
        console.error('Failed to load user image', err);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    event.target.value = '';
  }

  onObjectUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const img = await this.loadImage(dataUrl);
        const newObj: UploadedObject = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          img,
          src: dataUrl,
          x: 0, // Will be centered in drawFrame
          y: 0,
          scale: 100
        };
        this.uploadedObjects.set([...this.uploadedObjects(), newObj]);
        this.drawFrame();
      } catch (err) {
        console.error('Failed to load object image', err);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeObject(id: string) {
    this.uploadedObjects.set(this.uploadedObjects().filter(obj => obj.id !== id));
    this.drawFrame();
  }

  moveObjectUp(id: string) {
    const objs = [...this.uploadedObjects()];
    const index = objs.findIndex(o => o.id === id);
    if (index < objs.length - 1) {
      // Swap with next
      [objs[index], objs[index + 1]] = [objs[index + 1], objs[index]];
      this.uploadedObjects.set(objs);
      this.drawFrame();
    }
  }

  moveObjectDown(id: string) {
    const objs = [...this.uploadedObjects()];
    const index = objs.findIndex(o => o.id === id);
    if (index > 0) {
      // Swap with previous
      [objs[index], objs[index - 1]] = [objs[index - 1], objs[index]];
      this.uploadedObjects.set(objs);
      this.drawFrame();
    }
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
    this.drawFrame();
  }

  removeText(id: string) {
    this.customTexts.set(this.customTexts().filter(t => t.id !== id));
    this.drawFrame();
  }

  updateTextControl(id: string, type: 'scale' | 'x' | 'y' | 'color', event: any) {
    const texts = this.customTexts().map(t => {
      if (t.id === id) {
        if (type === 'color') t.color = event.target.value;
        else if (type === 'scale') t.scale = Number(event.target.value);
        else if (type === 'x') t.x = Number(event.target.value);
        else if (type === 'y') t.y = Number(event.target.value);
      }
      return t;
    });
    this.customTexts.set(texts);
    this.drawFrame();
  }

  updateObjectControl(id: string, type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    const objects = this.uploadedObjects().map(obj => {
      if (obj.id === id) {
        if (type === 'scale') obj.scale = val;
        else if (type === 'x') obj.x = val;
        else if (type === 'y') obj.y = val;
      }
      return obj;
    });
    this.uploadedObjects.set(objects);
    this.drawFrame();
  }

  updateControl(type: 'scaleX' | 'scaleY' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    if (type === 'scaleX') this.bgScaleX.set(val);
    else if (type === 'scaleY') this.bgScaleY.set(val);
    else if (type === 'x') this.bgOffsetX.set(val);
    else if (type === 'y') this.bgOffsetY.set(val);
    this.drawFrame();
  }

  updateBannerControl(type: 'scale' | 'y', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.bannerScale.set(val);
    else if (type === 'y') this.bannerOffsetY.set(val);
    this.drawFrame();
  }

  toggleSponsor(id: number) {
    const hidden = this.hiddenSponsorIds();
    if (hidden.includes(id)) {
      this.hiddenSponsorIds.set(hidden.filter(sid => sid !== id));
    } else {
      this.hiddenSponsorIds.set([...hidden, id]);
    }
    this.drawFrame();
  }

  toggleAllSponsors() {
    const allIds = this.sponsors().map(s => s.id);
    if (this.hiddenSponsorIds().length === allIds.length) {
      // All are hidden -> show all
      this.hiddenSponsorIds.set([]);
    } else {
      // Not all are hidden -> hide all
      this.hiddenSponsorIds.set(allIds);
    }
    this.drawFrame();
  }

  toggleSponsorSettings(id: number) {
    if (this.expandedSponsorSettingsId() === id) {
      this.expandedSponsorSettingsId.set(null);
    } else {
      this.expandedSponsorSettingsId.set(id);
    }
  }

  updateLogoControl(type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    if (type === 'scale') this.logoScale.set(val);
    else if (type === 'x') this.logoOffsetX.set(val);
    else if (type === 'y') this.logoOffsetY.set(val);
    this.drawFrame();
  }

  updateFrameControl(type: 'padding' | 'show', event: any) {
    if (type === 'show') {
      this.showFrameBorder.set(event.target.checked);
    } else if (type === 'padding') {
      this.framePadding.set(Number(event.target.value));
    }
    this.drawFrame();
  }

  updateBackgroundFilter(type: 'darken' | 'red', event: any) {
    if (type === 'darken') {
      this.bgFilterDarken.set(Number(event.target.value));
    } else if (type === 'red') {
      this.bgFilterRedTint.set(Number(event.target.value));
    }
    this.drawFrame();
  }

  resetDefaults() {
    this.bgScaleX.set(100);
    this.bgScaleY.set(100);
    this.bgOffsetX.set(0);
    this.bgOffsetY.set(0);
    this.bgFilterDarken.set(0);
    this.bgFilterRedTint.set(0);
    
    this.bannerOffsetY.set(0);
    this.bannerScale.set(100);
    this.hiddenSponsorIds.set([]);
    this.sponsorCustomizations.set({});
    
    this.uploadedObjects.set([]);
    this.customTexts.set([]);
    
    this.logoScale.set(100);
    this.logoOffsetX.set(0);
    this.logoOffsetY.set(0);
    
    this.showFrameBorder.set(true);
    this.framePadding.set(20);
    
    this.drawFrame();
  }

  updateSponsorCustomization(id: number, type: 'scale' | 'x' | 'y', event: any) {
    const val = Number(event.target.value);
    const current = this.sponsorCustomizations();
    const sponsorConfig = current[id] || { scale: 100, offsetX: 0, offsetY: 0 };
    
    if (type === 'scale') sponsorConfig.scale = val;
    else if (type === 'x') sponsorConfig.offsetX = val;
    else if (type === 'y') sponsorConfig.offsetY = val;

    this.sponsorCustomizations.set({ ...current, [id]: sponsorConfig });
    this.drawFrame();
  }

  moveSponsorUp(index: number) {
    if (index === 0) return;
    const current = [...this.sponsors()];
    const temp = current[index - 1];
    current[index - 1] = current[index];
    current[index] = temp;
    this.sponsors.set(current);
    this.drawFrame();
  }

  moveSponsorDown(index: number) {
    const current = [...this.sponsors()];
    if (index === current.length - 1) return;
    const temp = current[index + 1];
    current[index + 1] = current[index];
    current[index] = temp;
    this.sponsors.set(current);
    this.drawFrame();
  }

  clearBackgroundImage() {
    this.userBackgroundImage.set(null);
    this.bgScaleX.set(100);
    this.bgScaleY.set(100);
    this.bgOffsetX.set(0);
    this.bgOffsetY.set(0);
    this.drawFrame();
  }

  private getCanvasPos(e: any): {x: number, y: number} {
    let clientX = 0, clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const imgEl = e.target as HTMLImageElement;
    const rect = imgEl.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: 0, y: 0 };
    
    const canvasW = 1080;
    const ratio = canvasW / rect.width;
    
    return {
       x: (clientX - rect.left) * ratio,
       y: (clientY - rect.top) * ratio
    };
  }

  onPointerDown(e: any) {
    this.isDragging = true;
    
    const cPos = this.getCanvasPos(e);

    // Hit test Custom Text
    const texts = this.customTexts();
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      const rect = this.renderedTextRects[t.id];
      if (rect && cPos.x >= rect.x && cPos.x <= rect.x + rect.w && cPos.y >= rect.y && cPos.y <= rect.y + rect.h) {
        this.activeTextDragId = t.id;
        return;
      }
    }

    // Hit test Logo
    if (this.renderedLogoRect.w > 0) {
      const rect = this.renderedLogoRect;
      if (cPos.x >= rect.x && cPos.x <= (rect.x + rect.w) &&
          cPos.y >= rect.y && cPos.y <= (rect.y + rect.h)) {
        this.activeLogoDrag = true;
        this.lastX = cPos.x;
        this.lastY = cPos.y;
        return;
      }
    }

    // 0. Hit test uploaded objects (they are drawn on top of the background, below sponsors)
    // We check them in reverse order so the top-most is dragged first
    const objectIds = Object.keys(this.renderedObjectRects).reverse();
    const hitObjectId = objectIds.find(id => {
      const rect = this.renderedObjectRects[id];
      return cPos.x >= rect.x && cPos.x <= (rect.x + rect.w) &&
             cPos.y >= rect.y && cPos.y <= (rect.y + rect.h);
    });

    if (hitObjectId) {
      this.activeObjectDragId = hitObjectId;
      this.lastX = cPos.x;
      this.lastY = cPos.y;
      return; // Stop processing further so we don't drag the background
    }

    // 1. Hit test sponsors
    const hitSponsorId = Object.keys(this.renderedSponsorRects).find(idStr => {
      const rect = this.renderedSponsorRects[Number(idStr)];
      return cPos.x >= rect.x && cPos.x <= (rect.x + rect.w) &&
             cPos.y >= rect.y && cPos.y <= (rect.y + rect.h);
    });

    if (hitSponsorId) {
      this.activeSponsorDragId = Number(hitSponsorId);
      this.lastX = cPos.x;
      this.lastY = cPos.y;
      return; // Stop processing further so we don't drag the background
    }

    // 2. Hit test handles for background
    if (this.userBackgroundImage()) {
      const hitThreshold = 80; // Large touch target
      const rect = this.imgRect;
      
      if (Math.hypot(cPos.x - rect.x, cPos.y - rect.y) < hitThreshold) {
        this.activeHandle = 'tl';
      } else if (Math.hypot(cPos.x - (rect.x + rect.w), cPos.y - rect.y) < hitThreshold) {
        this.activeHandle = 'tr';
      } else if (Math.hypot(cPos.x - rect.x, cPos.y - (rect.y + rect.h)) < hitThreshold) {
        this.activeHandle = 'bl';
      } else if (Math.hypot(cPos.x - (rect.x + rect.w), cPos.y - (rect.y + rect.h)) < hitThreshold) {
        this.activeHandle = 'br';
      } else {
        this.activeHandle = null;
      }
    } else {
      this.activeHandle = null;
    }

    if (this.activeHandle) {
      this.initialRect = { ...this.imgRect };
      this.initialScaleX = this.bgScaleX();
      this.initialScaleY = this.bgScaleY();
      this.initialOffsetX = this.bgOffsetX();
      this.initialOffsetY = this.bgOffsetY();
    } else {
      // standard pan or pinch
      if (e.touches && e.touches.length === 2) {
        this.lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else {
        this.lastX = cPos.x;
        this.lastY = cPos.y;
      }
    }
  }

  onPointerMove(e: any) {
    if (!this.isDragging) return;
    if (e.cancelable !== false) {
      e.preventDefault(); // prevent scrolling while panning on mobile
    }

    const cPos = this.getCanvasPos(e);
    const dx = cPos.x - this.lastX;
    const dy = cPos.y - this.lastY;

    // Handle logo dragging
    if (this.activeLogoDrag) {
      this.logoOffsetX.set(this.logoOffsetX() + dx);
      this.logoOffsetY.set(this.logoOffsetY() + dy);
      
      this.lastX = cPos.x;
      this.lastY = cPos.y;
      
      requestAnimationFrame(() => this.drawFrame());
      return;
    }

    // 1. Handle uploaded object dragging
    if (this.activeObjectDragId) {
      const objects = this.uploadedObjects();
      const obj = objects.find(o => o.id === this.activeObjectDragId);
      if (obj) {
        obj.x += dx;
        obj.y += dy;
        this.drawFrame();
        return;
      }
    }

    // 1.5 Handle Text Dragging
    if (this.activeTextDragId) {
      const texts = this.customTexts();
      const t = texts.find(t => t.id === this.activeTextDragId);
      if (t) {
        t.x += dx;
        t.y += dy;
        this.drawFrame();
        return;
      }
    }

    // 2. Handle sponsor dragging
    if (this.activeSponsorDragId !== null) {
      const current = this.sponsorCustomizations();
      const sponsorConfig = current[this.activeSponsorDragId] || { scale: 100, offsetX: 0, offsetY: 0 };
      
      const bannerScaleRatio = this.bannerScale() / 100;

      sponsorConfig.offsetX += dx / bannerScaleRatio;
      sponsorConfig.offsetY += dy / bannerScaleRatio;

      this.sponsorCustomizations.set({ ...current, [this.activeSponsorDragId]: sponsorConfig });
      
      this.lastX = cPos.x;
      this.lastY = cPos.y;
      
      requestAnimationFrame(() => this.drawFrame());
      return;
    }

    // 2. Handle background scaling
    if (this.activeHandle) {
      let scaleRatioX = 1;
      let scaleRatioY = 1;
      let anchorX = 0, anchorY = 0;
      let anchorTypeX: 'left'|'right' = 'left';
      let anchorTypeY: 'top'|'bottom' = 'top';
      const ir = this.initialRect;

      if (this.activeHandle === 'br') {
        anchorX = ir.x; anchorY = ir.y;
        anchorTypeX = 'left'; anchorTypeY = 'top';
        scaleRatioX = (cPos.x - anchorX)/ir.w;
        scaleRatioY = (cPos.y - anchorY)/ir.h;
      } else if (this.activeHandle === 'tl') {
        anchorX = ir.x + ir.w; anchorY = ir.y + ir.h;
        anchorTypeX = 'right'; anchorTypeY = 'bottom';
        scaleRatioX = (anchorX - cPos.x)/ir.w;
        scaleRatioY = (anchorY - cPos.y)/ir.h;
      } else if (this.activeHandle === 'tr') {
        anchorX = ir.x; anchorY = ir.y + ir.h;
        anchorTypeX = 'left'; anchorTypeY = 'bottom';
        scaleRatioX = (cPos.x - anchorX)/ir.w;
        scaleRatioY = (anchorY - cPos.y)/ir.h;
      } else if (this.activeHandle === 'bl') {
        anchorX = ir.x + ir.w; anchorY = ir.y;
        anchorTypeX = 'right'; anchorTypeY = 'top';
        scaleRatioX = (anchorX - cPos.x)/ir.w;
        scaleRatioY = (cPos.y - anchorY)/ir.h;
      }

      if (scaleRatioX < 0.05) scaleRatioX = 0.05;
      if (scaleRatioY < 0.05) scaleRatioY = 0.05;
      
      this.bgScaleX.set(this.initialScaleX * scaleRatioX);
      this.bgScaleY.set(this.initialScaleY * scaleRatioY);

      const newDrawW = ir.w * scaleRatioX;
      const newDrawH = ir.h * scaleRatioY;
      const canvasW = 1080;
      const canvasH = this.format() === 'square' ? 1080 : 1920;

      const targetDrawX = anchorTypeX === 'left' ? anchorX : anchorX - newDrawW;
      const targetDrawY = anchorTypeY === 'top' ? anchorY : anchorY - newDrawH;

      this.bgOffsetX.set(targetDrawX - (canvasW - newDrawW) / 2);
      this.bgOffsetY.set(targetDrawY - (canvasH - newDrawH) / 2);

      requestAnimationFrame(() => this.drawFrame());
      return;
    }

    if (e.touches && e.touches.length === 2) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - this.lastDist;
      
      let newScaleX = this.bgScaleX() + (delta * 0.5);
      let newScaleY = this.bgScaleY() + (delta * 0.5);
      if (newScaleX < 10) newScaleX = 10;
      if (newScaleY < 10) newScaleY = 10;
      
      this.bgScaleX.set(newScaleX);
      this.bgScaleY.set(newScaleY);
      this.lastDist = dist;
      requestAnimationFrame(() => this.drawFrame());
    } else {
      // Pan
      this.bgOffsetX.set(this.bgOffsetX() + dx);
      this.bgOffsetY.set(this.bgOffsetY() + dy);
      
      this.lastX = cPos.x;
      this.lastY = cPos.y;
      
      requestAnimationFrame(() => this.drawFrame());
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.activeHandle = null;
    this.activeSponsorDragId = null;
    this.activeObjectDragId = null;
    this.activeTextDragId = null;
    this.activeLogoDrag = false;
    this.activeHandle = null;
  }

  onWheel(e: any) {
    if (!this.userBackgroundImage()) return;
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.1;
    let newScaleX = this.bgScaleX() + zoomFactor;
    let newScaleY = this.bgScaleY() + zoomFactor;
    if (newScaleX < 10) newScaleX = 10;
    if (newScaleY < 10) newScaleY = 10;
    
    this.bgScaleX.set(newScaleX);
    this.bgScaleY.set(newScaleY);
    requestAnimationFrame(() => this.drawFrame());
  }

  async drawFrame() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = this.format() === 'square' ? 1080 : 1920;
    canvas.width = w;
    canvas.height = h;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, w, h);

    // 1.5 Draw User Background Image (if any)
    const userImg = this.userBackgroundImage();
    if (userImg) {
      // Draw image using object-fit: cover logic
      const imgRatio = userImg.width / userImg.height;
      const canvasRatio = w / h;
      
      let baseW = w;
      let baseH = h;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas, scale by height
        baseH = h;
        baseW = userImg.width * (h / userImg.height);
      } else {
        // Image is taller than canvas, scale by width
        baseW = w;
        baseH = userImg.height * (w / userImg.width);
      }

      // Apply zoom
      const scaleX = this.bgScaleX() / 100;
      const scaleY = this.bgScaleY() / 100;
      const drawW = baseW * scaleX;
      const drawH = baseH * scaleY;

      // Apply offset (center by default, plus user offset)
      const drawX = (w - drawW) / 2 + Number(this.bgOffsetX());
      const drawY = (h - drawH) / 2 + Number(this.bgOffsetY());

      ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
      
      // Apply Photo Filters
      const darken = this.bgFilterDarken() / 100;
      if (darken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${darken})`;
        ctx.fillRect(drawX, drawY, drawW, drawH);
      }
      
      const redTint = this.bgFilterRedTint() / 100;
      if (redTint > 0) {
        ctx.fillStyle = `rgba(208, 0, 7, ${redTint * 0.7})`; // 0.7 max intensity so it's not fully opaque red
        ctx.fillRect(drawX, drawY, drawW, drawH);
      }

      this.imgRect = { x: drawX, y: drawY, w: drawW, h: drawH };

      if (!this.hideHandles) {
        // Draw dashed bounding box
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 15]);
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.setLineDash([]); 
        
        // Draw corner handles
        const handleSize = 20;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d00007';
        ctx.lineWidth = 5;
        
        const drawHandle = (hx: number, hy: number) => {
          ctx.beginPath();
          ctx.arc(hx, hy, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        };
        
        drawHandle(drawX, drawY); // Top Left
        drawHandle(drawX + drawW, drawY); // Top Right
        drawHandle(drawX, drawY + drawH); // Bottom Left
        drawHandle(drawX + drawW, drawY + drawH); // Bottom Right
      }
    }

    // 1.8 Draw Uploaded Objects
    this.renderedObjectRects = {}; // Clear old rects
    for (const obj of this.uploadedObjects()) {
      const scaleRatio = obj.scale / 100;
      
      // Let's cap max size so huge images don't break everything initially
      const maxW = w;
      let drawW = obj.img.width;
      let drawH = obj.img.height;
      if (drawW > maxW) {
        const shrink = maxW / drawW;
        drawW = maxW;
        drawH = drawH * shrink;
      }
      
      drawW = drawW * scaleRatio;
      drawH = drawH * scaleRatio;

      // Base center is canvas center plus offset
      const cx = w / 2 + obj.x;
      const cy = h / 2 + obj.y;

      const drawX = cx - drawW / 2;
      const drawY = cy - drawH / 2;

      ctx.drawImage(obj.img, drawX, drawY, drawW, drawH);
      
      this.renderedObjectRects[obj.id] = {
        x: drawX,
        y: drawY,
        w: drawW,
        h: drawH
      };
    }



    // 1.9 Draw Custom Texts
    this.renderedTextRects = {};
    for (const t of this.customTexts()) {
      const fontSize = 48 * (t.scale / 100);
      ctx.font = `800 ${fontSize}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const cx = w / 2 + t.x;
      const cy = h / 2 + t.y;

      // Draw stroke/shadow for readability
      ctx.lineWidth = Math.max(2, fontSize * 0.05);
      ctx.strokeStyle = '#000000';
      ctx.strokeText(t.text, cx, cy);
      ctx.fillText(t.text, cx, cy);

      // Measure text for hit testing
      const metrics = ctx.measureText(t.text);
      const textW = metrics.width;
      const textH = fontSize; // Approximate

      this.renderedTextRects[t.id] = {
        x: cx - textW / 2,
        y: cy - textH / 2,
        w: textW,
        h: textH
      };
    }

    // 2. Cyberpunk / Tech HUD Border
    const margin = this.framePadding();
    
    if (this.showFrameBorder()) {
      // Clean minimalist inner border
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.strokeRect(margin, margin, w - margin*2, h - margin*2);

      // Modern Racing Corner Accents
      const drawCorner = (cx: number, cy: number, flipX: number, flipY: number) => {
        ctx.strokeStyle = '#d00007'; // T-Racers Red
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        // Start horizontally
        ctx.moveTo(cx + 40 * flipX, cy);
        ctx.lineTo(cx, cy);
        // Down vertically
        ctx.lineTo(cx, cy + 40 * flipY);
        ctx.stroke();
      };

      drawCorner(margin, margin, 1, 1); // TL
      drawCorner(w - margin, margin, -1, 1); // TR
      drawCorner(margin, h - margin, 1, -1); // BL
      drawCorner(w - margin, h - margin, -1, -1); // BR
    }

    // 4. Logo Placement
    try {
      const logo = await this.loadImage('/new-logo.webp');
      const baseScale = this.logoScale() / 100;
      const logoWidth = 200 * baseScale;
      const logoHeight = logoWidth * (logo.height / logo.width);
      
      // Base anchor is top center
      const cx = w/2 + this.logoOffsetX();
      const cy = margin + logoHeight/2 + 20 + this.logoOffsetY();

      const lx = cx - logoWidth/2;
      const ly = cy - logoHeight/2;

      ctx.shadowColor = 'transparent';

      // Draw the logo itself
      ctx.drawImage(logo, lx, ly, logoWidth, logoHeight);

      // Save hit rect for dragging (using the logo bounds directly)
      this.renderedLogoRect = {
        x: lx,
        y: ly,
        w: logoWidth,
        h: logoHeight
      };
    } catch (e) {
      console.warn('Could not load logo');
    }

    // 5. Sleek Sponsor Banner (Full width at bottom inner border)
    this.renderedSponsorRects = {}; // Clear old rects
    const sponsorsToDraw = this.sponsors().filter(s => !this.hiddenSponsorIds().includes(s.id));
    
    if (sponsorsToDraw.length > 0) {
      const bannerScaleRatio = this.bannerScale() / 100;
      const bannerHeight = 240 * bannerScaleRatio;
      const bannerY = h - margin - 15 - bannerHeight + Number(this.bannerOffsetY());
      const bannerWidth = w - (margin * 2) - 30;
      const bannerX = margin + 15;

      // Gradient Background for Banner (Fade from transparent to solid dark)
      const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
      grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.9)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 1.0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

      // Tech lines in banner background
      ctx.strokeStyle = 'rgba(208, 0, 7, 0.05)';
      ctx.lineWidth = 1;
      for (let i = bannerX; i < bannerX + bannerWidth; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, bannerY);
        ctx.lineTo(i - 40, bannerY + bannerHeight);
        ctx.stroke();
      }

      // Text "OFFICIAL PARTNERS & SPONSORS"
      ctx.font = `600 ${16 * bannerScaleRatio}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.letterSpacing = `${10 * bannerScaleRatio}px`;
      ctx.fillText('OFFICIAL PARTNERS & SPONSORS', w / 2, bannerY + (40 * bannerScaleRatio));

      // Bright Red glowing dot accent
      ctx.fillStyle = '#d00007';
      ctx.shadowColor = '#d00007';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(w / 2, bannerY + (55 * bannerScaleRatio), 3 * bannerScaleRatio, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // 6. Draw Sponsors
      const loadedImages: {img: HTMLImageElement, sponsor: FrameSponsor}[] = [];
      for (const sp of sponsorsToDraw) {
        if (!sp.logoImage) continue;
        const finalUrl = this.images.resolve(sp.logoImage);
        try {
          const img = await this.loadImage(finalUrl, true);
          loadedImages.push({img, sponsor: sp});
        } catch (e) {
           // Ignore
        }
      }

      if (loadedImages.length > 0) {
        // Group into Rows
        const maxPerRow = 5;
        const rows: {img: HTMLImageElement, sponsor: FrameSponsor}[][] = [];
        for (let i = 0; i < loadedImages.length; i += maxPerRow) {
          rows.push(loadedImages.slice(i, i + maxPerRow));
        }

        const targetHeight = 45 * bannerScaleRatio;
        const logoSpacingX = 50 * bannerScaleRatio;
        const logoSpacingY = 30 * bannerScaleRatio;
        
        // Vertically center rows in the bottom part of the banner
        const totalRowsHeight = (rows.length * targetHeight) + ((rows.length - 1) * logoSpacingY);
        let startY = bannerY + (90 * bannerScaleRatio);

        rows.forEach(row => {
          // Calculate row dimensions based on standard scale (100%) so layout is stable
          const scaledRow = row.map(item => {
             const custom = this.sponsorCustomizations()[item.sponsor.id] || { scale: 100, offsetX: 0, offsetY: 0 };
             const customScale = custom.scale / 100;
             
             const r = targetHeight / item.img.height;
             let baseW = item.img.width * r;
             let baseH = targetHeight;
             
             // Cap extreme widths (like Altium)
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

            // Find the center of the base bounding box for this item
            const cx = startX + (item.baseW / 2);
            const cy = startY + (targetHeight / 2);

            // Apply custom offsets from the center point
            const finalX = cx - (drawW / 2) + (item.custom.offsetX * bannerScaleRatio);
            const finalY = cy - (drawH / 2) + (item.custom.offsetY * bannerScaleRatio);
            
            ctx.drawImage(item.img, finalX, finalY, drawW, drawH);
            
            // Save rect for hit testing
            this.renderedSponsorRects[item.sponsor.id] = {
              x: finalX,
              y: finalY,
              w: drawW,
              h: drawH
            };

            startX += item.baseW + logoSpacingX;
          });
          
          startY += targetHeight + logoSpacingY;
        });
      }
    }

    // 7. Update Preview
    this.previewUrl.set(canvas.toDataURL('image/png'));
  }

  private loadImage(src: string, cors = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  async downloadFrame() {
    this.hideHandles = true;
    await this.drawFrame();

    const url = this.previewUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracers-frame-${this.format()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.hideHandles = false;
    this.drawFrame();
  }
}
