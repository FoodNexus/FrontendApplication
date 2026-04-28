import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { DonorLotRecord } from '../../../valorisation-organique-economie-circulaire/angular/models/donor-lots.model';
import type { RecyclerRequest } from '../../../valorisation-organique-economie-circulaire/angular/models/recycler-operations.model';
import { DonorLotsService } from '../../../valorisation-organique-economie-circulaire/angular/services/donor-lots.service';
import { NutriflowRecyclerRequestsService } from '../../../valorisation-organique-economie-circulaire/angular/services/nutriflow-recycler-requests.service';
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
        <i class="bi bi-journal-text me-2"></i>Synthèse dossier — flux NutriFlow
      </h1>
      <p class="text-muted small mb-4">
        Agrégation des lots donateurs et des demandes recycleurs collectés dans cette session (stockage navigateur).
      </p>

      <div class="card shadow-sm mb-4 border-primary border-opacity-25">
        <div class="card-header bg-primary text-white fw-semibold">Synthèse consolidée</div>
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
                      <th>Nom / catégorie</th>
                      <th>kg</th>
                      <th>Statut liste</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let lot of lots">
                      <td>
                        <div class="small fw-semibold">{{ lot.name }}</div>
                        <div class="small text-muted">{{ lot.category }}</div>
                        <div *ngIf="lot.classificationFilieres?.length" class="small text-muted">
                          Filières : {{ lot.classificationFilieres?.join(', ') }}
                        </div>
                        <div *ngIf="lot.classificationDescription" class="small text-muted mt-1">
                          Classification : {{ lot.classificationDescription }}
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
                      <th>Produit</th>
                      <th>Qté</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of requests">
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

      <div class="card shadow-sm mt-4 border-0 bg-light">
        <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 class="h6 mb-1">Rapport d’audit</h2>
            <p class="small text-muted mb-0">
              Génère un fichier texte structuré reprenant la synthèse et le détail des lots et demandes ci-dessus.
            </p>
          </div>
          <button type="button" class="btn btn-primary" (click)="downloadReport()" [disabled]="reportBusy">
            <span *ngIf="!reportBusy"><i class="bi bi-download me-1"></i>Générer et télécharger le rapport</span>
            <span *ngIf="reportBusy" class="spinner-border spinner-border-sm" role="status"></span>
          </button>
        </div>
        <div *ngIf="reportError" class="card-footer small text-danger border-0 bg-transparent pt-0">
          {{ reportError }}
        </div>
      </div>
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
  reportBusy = false;
  reportError = '';

  constructor(
    private auth: AuthService,
    private donorLots: DonorLotsService,
    private recyclerRequests: NutriflowRecyclerRequestsService
  ) {}

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
    this.lots = [...this.donorLots.getAll()].sort((a, b) => b.id - a.id);
    this.requests = [...this.recyclerRequests.getAll()].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
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
      'Les indicateurs reflètent les données présentes dans le navigateur au moment de la consultation.'
    ];
  }

  downloadReport(): void {
    this.reportError = '';
    this.reportBusy = true;
    const done = (): void => {
      this.reportBusy = false;
    };
    try {
      const generated = new Date();
      const stamp = generated.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const lines: string[] = [];

      lines.push('RAPPORT DE SYNTHÈSE NUTRIFLOW (AUDIT)');
      lines.push('========================================');
      lines.push('');
      lines.push(`Généré le : ${generated.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`);
      lines.push('');
      lines.push('--- Synthèse ---');
      lines.push(this.narrativeLead);
      this.narrativeBullets.forEach((b) => lines.push(`  • ${b}`));
      lines.push('');

      lines.push('--- Lots publiés (donateurs) ---');
      if (this.lots.length === 0) {
        lines.push('(Aucun lot)');
      } else {
        this.lots.forEach((lot, i) => {
          lines.push(`Lot ${i + 1}`);
          lines.push(`  Désignation : ${lot.name}`);
          lines.push(`  Catégorie : ${lot.category}`);
          lines.push(`  Quantité (kg) : ${lot.quantityKg}`);
          lines.push(`  Lieu : ${lot.location}`);
          lines.push(`  Statut liste : ${lot.listingStatus}`);
          if (lot.classificationFilieres?.length) {
            lines.push(`  Filières : ${lot.classificationFilieres.join(', ')}`);
          }
          if (lot.classificationDescription) {
            lines.push(`  Classification : ${lot.classificationDescription}`);
          }
          if (lot.aiRecyclablePercent != null || lot.aiOrganicPercent != null) {
            lines.push(
              `  Estimation IA : recyclable ${lot.aiRecyclablePercent ?? '—'} %, organique ${lot.aiOrganicPercent ?? '—'} %`
            );
          }
          lines.push('');
        });
      }

      lines.push('--- Demandes recycleurs ---');
      if (this.requests.length === 0) {
        lines.push('(Aucune demande)');
      } else {
        this.requests.forEach((r, i) => {
          lines.push(`Demande ${i + 1}`);
          lines.push(`  Produit : ${r.productName}`);
          lines.push(`  Quantité (kg) : ${r.quantityKg}`);
          lines.push(`  Statut : ${r.status}`);
          lines.push(`  Date de demande : ${r.requestedAt.toLocaleString('fr-FR')}`);
          if (r.note) {
            lines.push(`  Note : ${r.note}`);
          }
          if (r.lotCode) {
            lines.push(`  Code lot : ${r.lotCode}`);
          }
          if (r.treatmentPlan) {
            lines.push(`  Plan de traitement : ${r.treatmentPlan}`);
          }
          if (r.pickupWindow) {
            lines.push(`  Fenêtre enlèvement : ${r.pickupWindow}`);
          }
          if (r.managerComment) {
            lines.push(`  Commentaire gestion : ${r.managerComment}`);
          }
          lines.push('');
        });
      }

      lines.push('--- Fin du rapport ---');

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutriflow-dossier-audit-${stamp}.txt`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      this.reportError = 'Impossible de générer le fichier. Réessayez ou vérifiez les permissions du navigateur.';
    } finally {
      done();
    }
  }
}
