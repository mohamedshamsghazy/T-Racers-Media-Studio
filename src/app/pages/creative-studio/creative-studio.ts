import { Component, inject, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxMoveableModule, NgxMoveableComponent } from 'ngx-moveable';
import { EditorStateService, Layer } from '../../services/editor-state.service';
import { PRESETS } from './presets';
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
  
  // Expose these for the UI
  format = signal<'story' | 'square' | 'portrait' | 'landscape'>('story');
  leftPanelTab = signal<'assets' | 'layers'>('assets');
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
