import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ReceveurService } from '../../services/receveur.service';
import { forkJoin } from 'rxjs';

interface RecommendationResult {
  produits: { [key: string]: number };
  confiance: number;
}

@Component({
  selector: 'app-ia-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ia-recommendation.component.html',
  styleUrls: ['./ia-recommendation.component.scss']
})
export class IaRecommendationComponent {
  // Re-initialized component logic
  userId = 1;
  nbPersonnes = 500;
  region = 'Centre';
  trancheAge = 'Mixte';
  sexe = 'Mixte';
  resultat: RecommendationResult | null = null;
  isLoading = false;
  isValidating = false;
  showSuccess = false;
  validatingItems: Set<string> = new Set();
  validatedItems: Set<string> = new Set();

  translations: { [key: string]: string } = {
    'baguette bread': 'Pain Baguette',
    'Tabouna bread': 'Pain Tabouna',
    'Couscous, raw': 'Couscous (Graines)',
    'Spaghetti': 'Pâtes (Spaghetti)',
    'Rice, raw': 'Riz',
    'Flour, powder': 'Farine',
    'Semolina, raw': 'Semoule',
    'Whole cow\'s milk': 'Lait de vache',
    'Dry chickpeas, raw': 'Pois chiches',
    'Dry bean, raw': 'Haricots secs',
    'Lentil, raw': 'Lentilles',
    'Tomato, raw': 'Tomates fraîches',
    'Concentrated tomato': 'Tomate concentrée',
    'Onion, raw': 'Oignons',
    'Potatoes, raw': 'Pommes de terre',
    'Seed oil': 'Huile végétale',
    'Olive oil': 'Huile d\'olive',
    'Sugar': 'Sucre',
    'Chicken meat, raw': 'Viande de Poulet',
    'Lamb, raw': 'Viande d\'Agneau',
    'Beef meat, raw': 'Viande de Bœuf',
    'Egg, whole, raw': 'Œufs'
  };

  constructor(
    private http: HttpClient,
    private receveurService: ReceveurService,
    private router: Router
  ) { }

  recommander() {
    this.isLoading = true;
    this.showSuccess = false;
    const url = `http://localhost:8080/api/receveur/ia/recommend?nbPersonnes=${this.nbPersonnes}&region=${this.region}&tranchesAge=${this.trancheAge}&repartitionSexe=${this.sexe}`;

    this.http.get<RecommendationResult>(url)
      .subscribe({
        next: (data) => {
          this.resultat = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.isLoading = false;
        }
      });
  }

  validerPanier() {
    if (!this.resultat || this.isValidating) return;

    this.isValidating = true;
    const itemsToAdd = Object.entries(this.resultat.produits)
      .filter(([name]) => !this.validatedItems.has(name));

    if (itemsToAdd.length === 0) {
      this.isValidating = false;
      this.showSuccess = true;
      setTimeout(() => this.router.navigate(['/receveur/besoins']), 2000);
      return;
    }

    const requests = itemsToAdd.map(([name, qty]) => {
      return this.receveurService.createBesoin({
        stockageId: this.userId,
        typeProduit: this.translations[name] || name,
        quantiteKg: qty,
        description: `Généré par IA (Région: ${this.region}, Pers: ${this.nbPersonnes})`
      });
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.isValidating = false;
        this.showSuccess = true;
        // Mark all as validated to update individual buttons too
        itemsToAdd.forEach(([name]) => this.validatedItems.add(name));
        setTimeout(() => {
          this.router.navigate(['/receveur/besoins']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erreur lors de la validation du panier:', err);
        this.isValidating = false;
        alert('Une erreur est survenue lors de la création des besoins. Veuillez réessayer.');
      }
    });
  }

  validerProduit(name: string, qty: number) {
    if (this.validatingItems.has(name) || this.validatedItems.has(name)) return;

    this.validatingItems.add(name);
    this.receveurService.createBesoin({
      stockageId: this.userId,
      typeProduit: this.translations[name] || name,
      quantiteKg: qty,
      description: `Généré par IA (Région: ${this.region}, Pers: ${this.nbPersonnes})`
    }).subscribe({
      next: () => {
        this.validatingItems.delete(name);
        this.validatedItems.add(name);
      },
      error: (err) => {
        console.error(`Erreur lors de la validation de ${name}:`, err);
        this.validatingItems.delete(name);
        alert(`Erreur lors de l'ajout de ${this.translations[name] || name}.`);
      }
    });
  }

  getProductsByCategory(category: number) {
    if (!this.resultat) return [];
    return Object.entries(this.resultat.produits).filter(([name]) => {
      const icon = this.getProductIcon(name);
      if (category === 1) return icon === 'bi-columns-gap'; // Base
      if (category === 2) return icon === 'bi-droplet-half'; // Épicerie
      if (category === 3) return icon === 'bi-flower3'; // Légumes
      if (category === 4) return icon === 'bi-egg-fill'; // Protéines
      return false;
    });
  }

  getProductIcon(produit: string): string {
    const p = produit.toLowerCase();
    
    // 1. Bases Céréalières (Breads, grains, flour)
    if (p.includes('pain') || p.includes('bread') || p.includes('tabouna') || p.includes('baguette') ||
        p.includes('semoule') || p.includes('semolina') || 
        p.includes('couscous') || 
        p.includes('farine') || p.includes('flour') ||
        p.includes('pâte') || p.includes('pate') || p.includes('spaghetti') ||
        p.includes('riz') || p.includes('rice')) {
      return 'bi-columns-gap';
    }
    
    // 2. Épicerie Fine (Oils, Sugar, Concentrates, Pulses)
    if (p.includes('huile') || p.includes('oil') || 
        p.includes('sucre') || p.includes('sugar') || 
        p.includes('concentré') || p.includes('concentrated') ||
        p.includes('pois chiche') || p.includes('chickpeas') ||
        p.includes('haricot') || p.includes('bean') ||
        p.includes('lentille') || p.includes('lentil')) {
      return 'bi-droplet-half';
    }
    
    // 3. Maraîchage (Vegetables)
    if (p.includes('tomate') || p.includes('tomato') || 
        p.includes('oignon') || p.includes('onion') || 
        p.includes('pomme de terre') || p.includes('potato') || 
        p.includes('carotte') || p.includes('carrot') || 
        p.includes('légume') || p.includes('vegetable')) {
      return 'bi-flower3';
    }
    
    // 4. Sources de Protéines (Meat, Eggs, Milk)
    if (p.includes('viande') || p.includes('meat') || 
        p.includes('œuf') || p.includes('oeuf') || p.includes('egg') || 
        p.includes('poulet') || p.includes('chicken') || 
        p.includes('agneau') || p.includes('lamb') || 
        p.includes('bœuf') || p.includes('boeuf') || p.includes('beef') || 
        p.includes('lait') || p.includes('milk')) {
      return 'bi-egg-fill';
    }
    
    return 'bi-box-seam';
  }
}