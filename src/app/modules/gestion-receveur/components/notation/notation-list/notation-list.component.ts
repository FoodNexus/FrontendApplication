import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceveurService, Notation } from '../../../services/receveur.service';

@Component({
  selector: 'app-notation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notation-list.component.html',
  styleUrls: ['./notation-list.component.scss']
})
export class NotationListComponent implements OnInit {
  userId = 1;
  notations: Notation[] = [];
  filteredNotations: Notation[] = [];
  isLoading = true;
  errorMessage = '';
  filterNote: string = 'TOUS';
  searchTerm: string = '';

  constructor(private receveurService: ReceveurService) {}

  ngOnInit(): void {
    this.loadNotations();
  }

  loadNotations(): void {
    this.isLoading = true;
    this.receveurService.getNotations(this.userId).subscribe({
      next: (data) => {
        this.notations = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Impossible de charger les notations';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.notations];
    
    if (this.filterNote !== 'TOUS') {
      const noteValue = parseInt(this.filterNote);
      filtered = filtered.filter(n => n.note === noteValue);
    }
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.donId.toString().includes(term) ||
        n.commentaire?.toLowerCase().includes(term)
      );
    }
    
    this.filteredNotations = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getNoteStars(note: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= note ? '★' : '☆');
    }
    return stars;
  }

  getNoteCount(note: number): number {
    return this.notations.filter(n => n.note === note).length;
  }

  get avgScore(): number {
    if (this.notations.length === 0) return 0;
    const sum = this.notations.reduce((acc, n) => acc + n.note, 0);
    return parseFloat((sum / this.notations.length).toFixed(1));
  }

  getScoreClass(score: number): string {
    if (score >= 4) return 'good';
    if (score >= 2.5) return 'average';
    return 'poor';
  }
}
