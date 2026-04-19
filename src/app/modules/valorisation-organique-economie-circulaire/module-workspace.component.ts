import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-module-workspace',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="workspace-card">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>

      <a
        *ngIf="title === 'Gestion Receveur'"
        routerLink="/gestion-receveur/recyclables"
        class="cta"
      >
        Ouvrir le CRUD Recyclables
      </a>
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

    .cta {
      display: inline-block;
      margin-top: 1rem;
      text-decoration: none;
      background: #111827;
      color: #fff;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
    }
  `]
})
export class ModuleWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly description = this.route.snapshot.data['description'] as string;
}
