import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="dashboard-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <p class="eyebrow">NORDIC Workspace</p>
            <h1>Team Dashboard</h1>
            <p class="subtitle">Coordination space for each module owner</p>
          </div>

          <div class="metrics">
            <article>
              <span>Total modules</span>
              <strong>6</strong>
            </article>
            <article>
              <span>Active track</span>
              <strong>Recyclables</strong>
            </article>
          </div>
        </div>

      </header>

      <main class="workspace-layout">
        <aside class="module-sidebar">
          <h2>Modules</h2>
          <p>Select a workspace</p>
          <nav class="sidebar-links" aria-label="Module navigation">
            <a
              *ngFor="let item of navItems"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              {{ item.label }}
            </a>
          </nav>
        </aside>

        <section class="content">
          <router-outlet></router-outlet>
        </section>
      </main>

      <footer class="contact-footer">
        <div class="footer-grid">
          <section>
            <h3>About Our Team</h3>
            <p>
              We collaborate across modules to build a reliable circular-economy platform
              for audit, matching, logistics, valorisation, and receiver management.
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
    .dashboard-shell {
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
    }

    .brand .subtitle {
      margin: 0.35rem 0 0 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .metrics {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .metrics article {
      border: 1px solid #d4d4d4;
      background: #fafafa;
      border-radius: 10px;
      padding: 0.45rem 0.7rem;
      min-width: 140px;
    }

    .metrics span {
      display: block;
      color: #6b7280;
      font-size: 0.75rem;
      margin-bottom: 0.2rem;
    }

    .metrics strong {
      color: #111827;
      font-size: 0.9rem;
    }

    .workspace-layout {
      width: 100%;
      margin: 0;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1rem;
    }

    .module-sidebar {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
      height: calc(100vh - 170px);
      min-height: 400px;
      position: sticky;
      top: 95px;
      display: flex;
      flex-direction: column;
    }

    .module-sidebar h2 {
      margin: 0;
      font-size: 1rem;
      color: #111827;
    }

    .module-sidebar p {
      margin: 0.35rem 0 0.8rem;
      color: #6b7280;
      font-size: 0.82rem;
    }

    .sidebar-links {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      overflow-y: auto;
      padding-right: 0.2rem;
    }

    .sidebar-links a {
      text-decoration: none;
      border: 1px solid #e5e7eb;
      background: #fcfcfc;
      border-radius: 8px;
      padding: 0.55rem 0.6rem;
      color: #111827;
      transition: all 0.2s ease;
      font-size: 0.86rem;
      line-height: 1.3;
    }

    .sidebar-links a:hover {
      border-color: #9ca3af;
      background: #f7f7f7;
    }

    .sidebar-links a.active {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .content {
      min-width: 0;
    }

    .contact-footer {
      border-top: 1px solid #d8d8d8;
      background: #ffffff;
      margin-top: 1.5rem;
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

    @media (max-width: 740px) {
      .topbar-inner {
        align-items: flex-start;
        flex-direction: column;
      }

      .workspace-layout {
        grid-template-columns: 1fr;
      }

      .module-sidebar {
        position: static;
        height: 280px;
        min-height: 280px;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  navItems = [
    { label: 'auditConformite', path: '/audit-conformite' },
    { label: 'gestionDonneur+Matching', path: '/gestion-donneur-matching' },
    { label: 'communaut-ImpactSoci-tal', path: '/communaut-impact-societal' },
    { label: 'valorisationOrganique+EconomieCirculaire', path: '/valorisation-organique-economie-circulaire' },
    { label: 'logistiqueTransport', path: '/logistique-transport' },
    { label: 'gestionReceveur', path: '/gestion-receveur' },
    { label: 'gestionReceveur/Recyclables', path: '/gestion-receveur/recyclables' }
  ];
}
