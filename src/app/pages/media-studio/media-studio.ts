import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CreativeStudio } from '../creative-studio/creative-studio';
import { FrameGenerator } from '../frame-generator/frame-generator';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-media-studio',
  standalone: true,
  imports: [CommonModule, CreativeStudio, FrameGenerator],
  templateUrl: './media-studio.html'
})
export class MediaStudio implements OnInit {
  activeTool = signal<'suite' | 'frame'>('suite');
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.apply({
      title: 'T-Racers Media Studio | All-in-One Creator Hub',
      description: 'Create world-class social media posts, stories, carousels, quotes, and transparent livery frames in one unified workspace.'
    });

    // If loaded via /frame-generator route or query param, select frame tab
    if (this.router.url.includes('frame') || this.route.snapshot.queryParams['tool'] === 'frame') {
      this.activeTool.set('frame');
    }
  }

  switchTool(tool: 'suite' | 'frame') {
    this.activeTool.set(tool);
    // Update URL in-place without reloading page or navigating away so sharing works seamlessly
    const targetUrl = tool === 'suite' ? '/achievement-generator' : '/frame-generator';
    this.router.navigateByUrl(targetUrl, { replaceUrl: true });
  }
}
