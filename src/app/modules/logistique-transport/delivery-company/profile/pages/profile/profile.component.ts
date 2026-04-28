import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Profile</h2>
      <p>On va le brancher avec l’auth plus tard.</p>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 8px;
      }
    `
  ]
})
export class ProfileComponent {}

