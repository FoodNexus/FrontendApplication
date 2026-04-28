import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-valorisation-workspace',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './valorisation-workspace.component.html',
  styleUrls: ['./valorisation-workspace.component.scss']
})
export class ValorisationWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly description = this.route.snapshot.data['description'] as string;
}
