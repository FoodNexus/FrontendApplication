import { Component } from '@angular/core';
import { RecyclerRequestsComponent } from '../recycler-requests.component';

@Component({
  selector: 'app-recycler-front-layout',
  standalone: true,
  imports: [RecyclerRequestsComponent],
  template: `
    <div class="front-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <p class="eyebrow">NORDIC Front Office</p>
            <h1>Recycler Workspace</h1>
            <p class="subtitle">Request, track, and complete recyclable collection tasks</p>
          </div>
        </div>
      </header>

      <main class="content">
        <app-recycler-requests></app-recycler-requests>
      </main>

      <footer class="contact-footer">
        <div class="footer-grid">
          <section>
            <h3>About Our Team</h3>
            <p>
              We collaborate across modules to build a reliable circular-economy platform
              for receiver workflows and recycling operations.
            </p>
          </section>

          <section>
            <h3>Contact</h3>
            <p>Email: greenloop.team&#64;project.local</p>
            <p>Phone: +216 00 000 000</p>
            <p>Location: Tunis, Tunisia</p>
          </section>

          <section>
            <h3>Social</h3>
            <div class="social-links">
              <a href="#" aria-label="Twitter">Twitter</a>
              <a href="#" aria-label="Facebook">Facebook</a>
              <a href="#" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </section>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .front-shell {
      min-height: 100vh;
      background: #f5f5f0;
    }

    .topbar {
      border-bottom: 1px solid #d8d8d8;
      background: #ffffff;
      padding: 1.1rem 1.5rem 1rem;
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .topbar-inner {
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.85rem;
      flex-wrap: wrap;
    }

    .eyebrow {
      margin: 0 0 0.25rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
    }

    .brand h1 {
      margin: 0;
      font-size: 1.4rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #111827;
    }

    .subtitle {
      margin: 0.35rem 0 0 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .content {
      width: 100%;
      margin: 0;
      padding: 1.5rem;
    }

    .contact-footer {
      border-top: 1px solid #d8d8d8;
      background: #ffffff;
      margin-top: 0.6rem;
      padding: 1.4rem 1.5rem 1.8rem;
    }

    .footer-grid {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .footer-grid h3 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #111827;
    }

    .footer-grid p {
      margin: 0.25rem 0;
      color: #4b5563;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .social-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .social-links a {
      text-decoration: none;
      font-size: 0.85rem;
      color: #111827;
      border: 1px solid #d4d4d4;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      background: #fafafa;
    }

    .social-links a:hover {
      background: #f0f0f0;
    }
  `]
})
export class RecyclerFrontLayoutComponent {}
