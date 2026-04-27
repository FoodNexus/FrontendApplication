import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { loadAllDonorLots, DonorLotRecord } from '../../../valorisation-organique-economie-circulaire/storage/donor-lots.storage';
import {
  loadRecyclerRequests,
  RecyclerRequest
} from '../../../valorisation-organique-economie-circulaire/storage/recycler-operations.storage';
import { AuthService } from '../../../gestion-user/services/auth.service';

/**
 * Synthèse « dossier » NutriFlow pour auditeurs : lots publiés + demandes (stockage local).
 * Cible : même structure que la classification (ai-model/schema) une fois branchée au backend.
 */
@Component({
  selector: 'app-nutriflow-dossier-summary',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  template: `
    <div class="container py-4 nutri-summary">
      <nav aria-label="Fil d’Ariane" class="small text-muted mb-3">
        <a routerLink="/audit/inspection-cases" class="text-decoration-none">Audit</a>
        <span class="mx-1">/</span>
        <span>Synthèse NutriFlow</span>
      </nav>

      <h1 class="h4 text-primary mb-2">
        <i class="bi bi-journal-text me-2"></i>Synthèse dossier — flux NutriFlow (démo locale)
      </h1>
      <p class="text-muted small mb-4">
        Agrégation des lots donateurs et des demandes recycleurs présents dans le navigateur. En production, cette vue
        consommera les mêmes champs que la classification validée et l’historique des statuts.
      </p>

      <div class="card shadow-sm mb-4 border-primary border-opacity-25">
        <div class="card-header bg-primary text-white fw-semibold">Résumé automatique (démo)</div>
        <div class="card-body">
          <p class="mb-2">{{ narrativeLead }}</p>
          <ul class="mb-0 small">
            <li *ngFor="let line of narrativeBullets">{{ line }}</li>
          </ul>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Lots publiés (donateurs)</div>
            <div class="card-body p-0">
              <div *ngIf="lots.length === 0" class="p-3 text-muted small">Aucun lot en stockage local.</div>
              <div class="table-responsive" *ngIf="lots.length > 0">
                <table class="table table-sm mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nom / catégorie</th>
                      <th>kg</th>
                      <th>Statut liste</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let lot of lots">
                      <td>{{ lot.id }}</td>
                      <td>
                        <div class="small fw-semibold">{{ lot.name }}</div>
                        <div class="small text-muted">{{ lot.category }}</div>
                        <div *ngIf="lot.classificationFilieres?.length" class="small text-muted">
                          Filières : {{ lot.classificationFilieres?.join(', ') }}
                        </div>
                      </td>
                      <td>{{ lot.quantityKg }}</td>
                      <td>{{ lot.listingStatus }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Demandes recycleurs</div>
            <div class="card-body p-0">
              <div *ngIf="requests.length === 0" class="p-3 text-muted small">Aucune demande en stockage local.</div>
              <div class="table-responsive" *ngIf="requests.length > 0">
                <table class="table table-sm mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Produit</th>
                      <th>Qté</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of requests">
                      <td>{{ r.id }}</td>
                      <td class="small">{{ r.productName }}</td>
                      <td>{{ r.quantityKg }}</td>
                      <td><span class="badge bg-secondary">{{ r.status }}</span></td>
                      <td class="small text-nowrap">{{ r.requestedAt | date : 'short' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="small text-muted mt-4 mb-0">
        <i class="bi bi-info-circle me-1"></i>
        Export PDF / lien dossier d’inspection : à brancher sur le backend et le schéma
        <code>ai-model/schema/classification-output.schema.json</code>.
      </p>
    </div>
  `,
  styles: [
    `
      .nutri-summary {
        max-width: 1200px;
      }
    `
  ]
})
export class NutriflowDossierSummaryComponent implements OnInit {
  lots: DonorLotRecord[] = [];
  requests: RecyclerRequest[] = [];
  narrativeLead = '';
  narrativeBullets: string[] = [];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    if (!this.auth.getCurrentUser()) {
      this.auth.fetchUserProfile().subscribe({
        next: () => this.load(),
        error: () => this.load()
      });
      return;
    }
    this.load();
  }

  private load(): void {
    this.lots = [...loadAllDonorLots()].sort((a, b) => b.id - a.id);
    this.requests = [...loadRecyclerRequests()].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    this.buildNarrative();
  }

  private buildNarrative(): void {
    const listed = this.lots.filter((l) => l.listingStatus === 'listed' && l.quantityKg > 0);
    const withClassif = this.lots.filter((l) => (l.classificationFilieres?.length ?? 0) > 0 || l.classificationDescription);
    const pendingDonor = this.requests.filter((r) => r.status === 'awaiting_donor').length;
    const verified = this.requests.filter((r) => r.status === 'verified' || r.status === 'done').length;

    this.narrativeLead = `Vue consolidée : ${this.lots.length} lot(s) enregistré(s) localement dont ${listed.length} encore listé(s) avec stock, ${this.requests.length} demande(s) recycleur.`;

    this.narrativeBullets = [
      `${withClassif.length} lot(s) portent des métadonnées de classification (filières / description assistant).`,
      `${pendingDonor} demande(s) en attente d’accord donateur.`,
      `${verified} demande(s) terminée(s) ou vérifiée(s) (aperçu statuts locaux).`,
      'Les écarts entre suggestion IA et données validées seront journalisés côté serveur dans la version cible.'
    ];
  }
}
