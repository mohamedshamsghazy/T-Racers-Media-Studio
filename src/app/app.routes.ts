import { Routes } from '@angular/router';
import { MediaStudio } from './pages/media-studio/media-studio';

export const routes: Routes = [
  { path: '', redirectTo: 'achievement-generator', pathMatch: 'full' },
  { path: 'achievement-generator', component: MediaStudio, title: '9-in-1 Media Suite | T-Racers Studio' },
  { path: 'frame-generator', component: MediaStudio, title: 'Livery & Frame Studio | T-Racers Studio' },
  { path: 'media-studio', component: MediaStudio, title: 'T-Racers Media Studio' },
  { path: '**', redirectTo: 'achievement-generator' }
];
