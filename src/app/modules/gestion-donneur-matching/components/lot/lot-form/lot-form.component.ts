import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { LotRequest } from '../../../models/lot.model';
import { NiveauUrgence } from '../../../models/enums.model';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-lot-form',
  templateUrl: './lot-form.component.html',
  styleUrls: ['./lot-form.component.scss'],
  encapsulation: ViewEncapsulation.None  
})
export class LotFormComponent implements OnInit {

  lot: LotRequest = { donneurId: 0, niveauUrgence: NiveauUrgence.FAIBLE };
  urgences = Object.values(NiveauUrgence);
  isEditMode = false;
  lotId: number | null = null;
  errorMessage = '';
  /** Indique que l’ID a été prérempli (profil <code>/me</code> ou dernière valeur en session navigateur). */
  protected donneurIdAutoFilled = false;

  constructor(
    private lotService: LotService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.lotId = +id;
      this.lotService.getById(this.lotId).subscribe({
        next: (data) => {
          this.lot = { donneurId: data.donneurId, niveauUrgence: data.niveauUrgence };
          this.donneurIdAutoFilled = false;
          this.cdr.markForCheck();
        },
        error: () => (this.errorMessage = 'Lot non trouvé')
      });
    } else {
      this.prefillDonneurIdFromProfile();
    }
  }

  /** Sans cela, <code>donneurId</code> reste 0 : le formulaire est invalide et « Créer » reste grisé. */
  private prefillDonneurIdFromProfile(): void {
    const resolved = this.auth.getApplicationUserId();
    if (resolved != null) {
      this.lot.donneurId = resolved;
      this.donneurIdAutoFilled = true;
      this.cdr.markForCheck();
      return;
    }
    this.auth.fetchUserProfile().subscribe({
      next: () => {
        const r = this.auth.getApplicationUserId();
        if (r != null) {
          this.lot.donneurId = r;
          this.donneurIdAutoFilled = true;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage =
          'Impossible de charger le profil (ms_gestionUser sur http://localhost:8087). Connectez-vous, ou saisissez l’ID donneur attendu par la base matching.';
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    const onHttpError = (err: { status?: number; error?: { message?: string } }): void => {
      if (err.status === 0) {
        this.errorMessage = `Serveur lots injoignable (${environment.matchingApiBaseUrl}). Démarrez ms_gestionDonneur-Matching (sous-module Git, port 8082), vérifiez CORS / pare-feu, ou modifiez environment.matchingApiBaseUrl. L’ID donneur vient du profil ms_gestionUser (http://localhost:8087) : ce sont deux services distincts.`;
        return;
      }
      this.errorMessage = err.error?.message || `Erreur (${err.status ?? 'réseau'})`;
    };
    if (this.isEditMode && this.lotId) {
      this.lotService.update(this.lotId, this.lot).subscribe({
        next: () => this.router.navigate(['donneur/lots']),
        error: onHttpError
      });
    } else {
      this.lotService.create(this.lot).subscribe({
        next: () => this.router.navigate(['donneur/lots']),
        error: onHttpError
      });
    }
  }
}