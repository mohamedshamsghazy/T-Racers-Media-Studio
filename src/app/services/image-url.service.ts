import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUrlService {
  private sanitizer = inject(DomSanitizer);

  resolve(image: string | null | undefined): string {
    if (!image) return '';
    if (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')) {
      return image;
    }
    // /uploads/ paths come from the new platform-server (not the legacy .NET server).
    if (image.startsWith('/uploads/')) {
      return 'https://tracers-platform-api.vercel.app' + image;
    }
    return environment.imageBaseUrl + image;
  }

  trustedUrl(image: string | null | undefined): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.resolve(image));
  }
}
