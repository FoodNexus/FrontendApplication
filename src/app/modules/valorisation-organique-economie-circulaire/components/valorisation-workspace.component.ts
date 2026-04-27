import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-valorisation-workspace',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="workspace-card">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>

      <nav class="quick-links" aria-label="Accès rapide valorisation">
        <a routerLink="/valorisation/nutriflow/requests" class="cta secondary">NutriFlow recycleur</a>
        <a routerLink="/valorisation/nutriflow-donor" class="cta secondary">NutriFlow donateur</a>
      </nav>
    </section>
  `,
  styles: [`
    .workspace-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.4rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    }

    h2 {
      margin: 0 0 0.4rem 0;
      font-size: 1.3rem;
      color: #111827;
    }

    p {
      margin: 0;
      color: #4b5563;
      line-height: 1.45;
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 1rem;
    }

    .cta {
      display: inline-block;
      text-decoration: none;
      background: #111827;
      color: #fff;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
      font-size: 0.9rem;
    }

    .cta.secondary {
      background: #f3f4f6;
      color: #111827;
    }

    .cta.admin {
      background: #198754;
      color: #fff;
    }
  `]
})
export class ValorisationWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly description = this.route.snapshot.data['description'] as string;
}
