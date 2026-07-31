import { Component, inject, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxMoveableModule, NgxMoveableComponent } from 'ngx-moveable';
import { EditorStateService, Layer } from '../../services/editor-state.service';
import { PRESETS } from './presets';
import { SMART_COMPONENTS } from './smart-components';
import { toPng } from 'html-to-image';

@Component({
  selector: 'app-creative-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMoveableModule],
  templateUrl: './creative-studio.html',
})
export class CreativeStudio implements OnInit {
  public editor = inject(EditorStateService);
  
  @ViewChild('renderTarget') renderTarget!: ElementRef<HTMLDivElement>;
  @ViewChild('moveable') moveableComponent!: NgxMoveableComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textEditorInput') textEditorInput!: ElementRef<HTMLTextAreaElement>;
  
  // Expose these for the UI
  format = signal<'story' | 'square' | 'portrait' | 'landscape'>('story');
  leftPanelTab = signal<'assets' | 'layers' | 'ai'>('assets');
  advancedMode = signal(false);
  
  exporting = signal(false);

  ngOnInit() {
    this.applyPreset('achievement');
  }

  applyPreset(name: string) {
    if (PRESETS[name]) {
      this.editor.loadPreset(PRESETS[name]);
    }
  }

  addSmartComponent(name: string) {
    const component = SMART_COMPONENTS[name];
    if (component) {
      // Add a tiny offset so they don't stack perfectly if clicking multiple times
      const offset = Math.floor(Math.random() * 20);
      component.forEach(layerConfig => {
        this.editor.addLayer({
          ...layerConfig,
          x: (layerConfig.x ?? 100) + offset,
          y: (layerConfig.y ?? 100) + offset,
        });
      });
    }
  }

  onLayerDoubleClick(layer: Layer) {
    if (layer.type === 'image') {
      this.fileInput.nativeElement.click();
    } else if (layer.type === 'text') {
      // Give Angular a tick to render the property panel if it was closed
      setTimeout(() => {
        if (this.textEditorInput) {
          this.textEditorInput.nativeElement.focus();
        }
      }, 50);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.editor.selectedLayer()) {
      const layer = this.editor.selectedLayer()!;
      if (layer.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.editor.updateLayer(layer.id, { src: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset input
    this.fileInput.nativeElement.value = '';
  }

  get targetWidth() {
    return this.format() === 'landscape' ? 1920 : 1080;
  }
  
  get targetHeight() {
    return this.format() === 'story' ? 1920 : (this.format() === 'portrait' ? 1350 : 1080);
  }
  
  get displayScale() {
    // scale to fit roughly into a 600px tall preview area
    return 600 / this.targetHeight;
  }

  // Moveable Handlers
  onDrag(e: any) {
    e.target.style.transform = e.transform;
    // We should ideally sync back to x/y but for phase 1 visual drag is enough
  }

  onResize(e: any) {
    e.target.style.width = `${e.width}px`;
    e.target.style.height = `${e.height}px`;
    e.target.style.transform = e.drag.transform;
  }
  
  onRotate(e: any) {
    e.target.style.transform = e.drag.transform;
  }
  
  async exportImage() {
    this.exporting.set(true);
    // Clear selection so bounding boxes disappear
    this.editor.clearSelection();
    
    // small timeout to let angular clear the moveable box
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(this.renderTarget.nativeElement, {
          quality: 1,
          pixelRatio: 1,
          style: {
            transform: 'scale(1)',
            position: 'static'
          }
        });
        
        const link = document.createElement('a');
        link.download = `t-racers-media-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
      } finally {
        this.exporting.set(false);
      }
    }, 100);
  }
}
