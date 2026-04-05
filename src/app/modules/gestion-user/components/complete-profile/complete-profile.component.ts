import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit {
  profileForm!: FormGroup;
  selectedRole: string = '';
  loading = false;
  errorMessage = '';

  roles = [
    { id: 'DONOR', label: 'Donneur', icon: 'bi-hand-thumbs-up', description: 'Pour ceux qui souhaitent donner de la nourriture.' },
    { id: 'RECEIVER', label: 'Receveur', icon: 'bi-heart', description: 'Pour les associations et personnes dans le besoin.' },
    { id: 'TRANSPORTER', label: 'Transporteur', icon: 'bi-truck', description: 'Pour la logistique et la livraison.' },
    { id: 'AUDITOR', label: 'Auditeur', icon: 'bi-shield-check', description: 'Pour le contrôle qualité et la conformité.' }
  ];

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.authService.fetchUserProfile().subscribe({
      next: (user) => {
        this.loading = false;
        // Si déjà complet (rôle différent de PENDING), rediriger vers dashboard
        if (user && user.role !== 'PENDING') {
          this.router.navigate(['/user/dashboard']);
          return;
        }
        this.initForm(user);
      },
      error: (err) => {
        this.loading = false;
        // Si le compte est bloqué, on force la redirection vers le dashboard pour afficher le message
        if (this.authService.isBlocked) {
          this.router.navigate(['/user/dashboard']);
          return;
        }
        this.errorMessage = 'Impossible de charger votre profil. Vérifiez que votre backend sur le port 8087 est bien lancé.';
        console.error('Error fetching profile', err);
      }
    });
  }

  initForm(user: any) {
    this.profileForm = this.fb.group({
      telephone: [user?.telephone || '', Validators.required],
      role: ['', Validators.required],
      
      // Donneur
      donorCompanyName: [''],
      taxIdNumber: [''],
      address: [''],

      // Receveur
      associationName: [''],

      // Transporteur
      transporterCompanyName: [''],
      vehicleType: [''],
      capacity: [''],

      // Auditeur
      certificationNumber: [''],
      agencyName: ['']
    });
  }

  selectRole(roleId: string) {
    this.selectedRole = roleId;
    this.profileForm.patchValue({ role: roleId });
    this.updateValidators(roleId);
  }

  updateValidators(roleId: string) {
    // Reset all conditional validators first if any were set
    // For simplicity in this demo, we'll just handle the logic in onSubmit
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.authService.updateProfile(this.authService.getCurrentUser().idUser, this.profileForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Erreur lors de la finalisation du profil.';
        console.error(err);
      }
    });
  }
}
