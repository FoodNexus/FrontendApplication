import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecyclablesCrudComponent } from '../../../valorisation-organique-economie-circulaire/recyclables-crud.component';
import { DashboardLayoutComponent } from '../../../valorisation-organique-economie-circulaire/dashboard-layout.component';

@Component({
  selector: 'app-admin-recyclables-products',
  standalone: true,
  imports: [RouterLink, RecyclablesCrudComponent, DashboardLayoutComponent, NgFor],
  template: `
    <div class="admin-recyclables-page">
      <div class="ambient-layer" aria-hidden="true"></div>
      <div class="orb orb-a" aria-hidden="true"></div>
      <div class="orb orb-b" aria-hidden="true"></div>

      <div class="row g-3 gx-lg-4 align-items-start justify-content-center px-2 px-md-3">
        <aside class="col-lg-2 d-none d-lg-flex flex-column gap-3 side-rail left-rail">
          <div class="rail-video-wrap">
            <video
              class="rail-video"
              autoplay
              muted
              loop
              playsinline
              poster="https://images.unsplash.com/photo-1532996122764-b3b103b2bec8?auto=format&fit=crop&w=600&q=80"
            >
              <source
                src="https://videos.pexels.com/video-files/2499611/2499611-hd_1280_720_25fps.mp4"
                type="video/mp4"
              />
            </video>
            <div class="rail-video-caption">
              <i class="bi bi-play-circle me-1"></i>
              Flux valorisation
            </div>
          </div>
          <div class="glass-card tilt-slow">
            <div class="glass-icon"><i class="bi bi-recycle"></i></div>
            <strong>Économie circulaire</strong>
            <p class="mb-0 small glass-sub">
              Chaque lot alimente les statistiques temps réel du module NutriFlow.
            </p>
          </div>
          <div class="pulse-ring">
            <span class="pulse-dot"></span>
            <span>Données synchronisées (local)</span>
          </div>
        </aside>

        <div class="col-12 col-lg-8 main-stack">
          <nav
            class="navbar navbar-light rounded-4 shadow-sm p-3 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 top-nav"
          >
            <span class="navbar-brand mb-0 h4 text-success fw-semibold">
              <i class="bi bi-shield-lock me-2"></i>NutriFlow — Produits recyclables (admin)
            </span>
            <a routerLink="/user/dashboard" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-arrow-left"></i> Retour au dashboard
            </a>
          </nav>

          <app-recyclables-crud />

          <div class="card border-0 shadow-lg mt-4 stats-card-outer">
            <div
              class="card-header text-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 stats-card-head"
            >
              <span
                ><i class="bi bi-graph-up-arrow me-2"></i>Valorisation organique — Statistiques
                recycleurs</span
              >
              <a routerLink="/user/admin/recycler-products/stats" class="btn btn-sm btn-outline-light">
                Vue pleine page
              </a>
            </div>
            <div class="card-body p-0">
              <p class="text-muted small px-3 pt-3 mb-0">
                Aperçu basé sur le catalogue local des lots recyclables (même source que l’espace
                recycleur).
              </p>
              <app-dashboard-layout [statsOnly]="true"></app-dashboard-layout>
            </div>
          </div>
        </div>

        <aside class="col-lg-2 d-none d-lg-flex flex-column gap-3 side-rail right-rail">
          <div class="mosaic-grid">
            <div
              *ngFor="let tile of mosaicTiles"
              class="mosaic-tile float-alt"
              [style.animation-delay.s]="tile.delay"
            >
              <img [src]="tile.src" [alt]="tile.alt" loading="lazy" />
              <span>{{ tile.alt }}</span>
            </div>
          </div>
          <div class="tip-stack">
            <div *ngFor="let tip of ecoTips" class="tip-chip">
              <i [class]="'bi ' + tip.icon"></i>
              {{ tip.text }}
            </div>
          </div>
          <div class="shimmer-banner">
            <i class="bi bi-lightning-charge-fill me-2"></i>
            Réduire le gaspillage, maximiser la matière
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .admin-recyclables-page {
        position: relative;
        padding-bottom: 2.5rem;
        overflow-x: hidden;
      }

      .ambient-layer {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: linear-gradient(
          125deg,
          #ecfdf5 0%,
          #d1fae5 18%,
          #f0fdf4 40%,
          #e0f2fe 65%,
          #ecfccb 100%
        );
        background-size: 200% 200%;
        animation: gradient-shift 18s ease infinite;
      }

      @keyframes gradient-shift {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      .orb {
        position: fixed;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.45;
        z-index: 0;
        pointer-events: none;
      }

      .orb-a {
        width: 340px;
        height: 340px;
        background: radial-gradient(circle, #34d399 0%, transparent 70%);
        top: 10%;
        left: -5%;
        animation: float-orb 14s ease-in-out infinite;
      }

      .orb-b {
        width: 280px;
        height: 280px;
        background: radial-gradient(circle, #38bdf8 0%, transparent 70%);
        bottom: 5%;
        right: -3%;
        animation: float-orb 18s ease-in-out infinite reverse;
      }

      @keyframes float-orb {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(24px, -18px) scale(1.05);
        }
      }

      .row {
        position: relative;
        z-index: 1;
      }

      .side-rail {
        position: sticky;
        top: 1rem;
      }

      .rail-video-wrap {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(16, 185, 129, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      .rail-video {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }

      .rail-video-caption {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 0.5rem 0.65rem;
        font-size: 0.75rem;
        color: #fff;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
      }

      .glass-card {
        padding: 1rem;
        border-radius: 16px;
        background: linear-gradient(145deg, rgba(6, 78, 59, 0.92), rgba(4, 120, 87, 0.88));
        color: #ecfdf5;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px rgba(6, 95, 70, 0.35);
      }

      .glass-icon {
        font-size: 1.75rem;
        margin-bottom: 0.35rem;
        opacity: 0.95;
      }

      .glass-sub {
        color: rgba(236, 253, 245, 0.82);
      }

      .tilt-slow {
        animation: tilt 8s ease-in-out infinite;
      }

      @keyframes tilt {
        0%,
        100% {
          transform: perspective(400px) rotateY(0deg);
        }
        50% {
          transform: perspective(400px) rotateY(-4deg);
        }
      }

      .pulse-ring {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        color: #047857;
        font-weight: 600;
      }

      .pulse-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse 2s ease infinite;
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
        }
        70% {
          box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      .main-stack {
        max-width: 960px;
      }

      .top-nav {
        background: rgba(255, 255, 255, 0.92) !important;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.8);
      }

      .stats-card-outer {
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      .stats-card-head {
        background: linear-gradient(90deg, #475569, #334155) !important;
      }

      .mosaic-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }

      .mosaic-tile {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 1;
        box-shadow: 0 8px 24px rgba(15, 118, 110, 0.2);
      }

      .mosaic-tile img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }

      .mosaic-tile:hover img {
        transform: scale(1.08);
      }

      .mosaic-tile span {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 0.35rem 0.4rem;
        font-size: 0.65rem;
        line-height: 1.2;
        color: #fff;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      }

      .float-alt {
        animation: float-tile 5s ease-in-out infinite;
      }

      @keyframes float-tile {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }

      .tip-stack {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .tip-chip {
        font-size: 0.72rem;
        padding: 0.45rem 0.55rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(16, 185, 129, 0.25);
        color: #065f46;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
      }

      .tip-chip i {
        margin-right: 0.35rem;
        color: #059669;
      }

      .shimmer-banner {
        font-size: 0.72rem;
        font-weight: 600;
        text-align: center;
        padding: 0.65rem 0.5rem;
        border-radius: 12px;
        color: #fff;
        background: linear-gradient(
          90deg,
          #059669,
          #10b981,
          #34d399,
          #10b981,
          #059669
        );
        background-size: 200% auto;
        animation: shimmer 4s linear infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 0% center;
        }
        100% {
          background-position: 200% center;
        }
      }
    `
  ]
})
export class AdminRecyclablesProductsComponent {
  readonly mosaicTiles = [
    {
      src: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80',
      alt: 'Tri plastique',
      delay: 0
    },
    {
      src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c799?auto=format&fit=crop&w=400&q=80',
      alt: 'Déchets verts',
      delay: 0.3
    },
    {
      src: 'https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&w=400&q=80',
      alt: 'Verre',
      delay: 0.6
    },
    {
      src: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
      alt: 'Carton',
      delay: 0.9
    }
  ];

  readonly ecoTips = [
    { icon: 'bi-leaf', text: 'Sécher les emballages avant compactage.' },
    { icon: 'bi-droplet', text: 'Séparer les flux humides / secs.' },
    { icon: 'bi-truck', text: 'Optimiser les enlèvements par tournées.' }
  ];
}
