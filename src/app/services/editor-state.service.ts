import { Injectable, signal, computed } from '@angular/core';

export type LayerType = 'text' | 'image' | 'shape' | 'group';

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  
  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  
  // Image specific
  src?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  
  // Shape/General specific
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  
  // Effects
  shadow?: string;
  blur?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn';
}

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  layers = signal<Layer[]>([]);
  selectedLayerIds = signal<string[]>([]);

  canvasSize = signal({ width: 1080, height: 1080 }); // Default Square

  selectedLayer = computed(() => {
    const ids = this.selectedLayerIds();
    if (ids.length === 1) {
      return this.layers().find(l => l.id === ids[0]);
    }
    return null;
  });

  addLayer(layer: Partial<Layer>) {
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'shape',
      name: 'New Layer',
      x: 0, y: 0,
      width: 200, height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: this.layers().length,
      locked: false,
      hidden: false,
      ...layer
    };
    this.layers.update(layers => [...layers, newLayer]);
    this.selectedLayerIds.set([newLayer.id]);
  }

  loadPreset(presetLayers: Partial<Layer>[]) {
    this.layers.set([]);
    this.selectedLayerIds.set([]);
    presetLayers.forEach(l => this.addLayer(l));
    this.selectedLayerIds.set([]); // Clear selection after loading preset
  }

  updateLayer(id: string, changes: Partial<Layer>) {
    this.layers.update(layers => 
      layers.map(l => l.id === id ? { ...l, ...changes } : l)
    );
  }

  deleteLayer(id: string) {
    this.layers.update(layers => layers.filter(l => l.id !== id));
    this.selectedLayerIds.update(ids => ids.filter(i => i !== id));
  }

  selectLayer(id: string, multi = false) {
    if (multi) {
      this.selectedLayerIds.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
    } else {
      this.selectedLayerIds.set([id]);
    }
  }

  clearSelection() {
    this.selectedLayerIds.set([]);
  }

  reorderLayer(id: string, newZIndex: number) {
    // Basic reorder logic
    const ls = [...this.layers()];
    const idx = ls.findIndex(l => l.id === id);
    if (idx > -1) {
      const [item] = ls.splice(idx, 1);
      ls.splice(newZIndex, 0, item);
      ls.forEach((l, i) => l.zIndex = i);
      this.layers.set(ls);
    }
  }
}
