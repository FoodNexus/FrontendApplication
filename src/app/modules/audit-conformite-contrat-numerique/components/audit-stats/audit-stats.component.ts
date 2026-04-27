import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { AuthService } from '../../../gestion-user/services/auth.service';
import { InspectionCaseService } from '../../services/inspection-case.service';
import { RecyclingProductsService } from '../../services/recycling-products.service';
import { AuditStatisticsService } from '../../services/audit-statistics.service';
import { InspectionCase } from '../../models/inspection-case.model';
import { RecyclingProducts } from '../../models/recycling-products.model';
import { FilterCountPipe } from './filter-count.pipe';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

Chart.register(...registerables);

@Component({
  selector: 'app-audit-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, FilterCountPipe, NotificationBellComponent],
  templateUrl: './audit-stats.component.html',
  styleUrls: ['./audit-stats.component.scss']
})
export class AuditStatsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('verdictChart')     verdictChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')      statusChartRef!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('destinationChart') destinationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart')     monthlyChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('weightByDestChart') weightByDestRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('recyclingTrendChart') recyclingTrendRef!: ElementRef<HTMLCanvasElement>;

  auditorId!: number;
  auditorName = '';
  isLoading = true;
  hasError = false;

  /* ── KPI Cards ──────────────────────────────────────────────── */
  totalInspections  = 0;
  totalWeightKg     = 0;
  resolutionRate    = 0;
  recyclingRate     = 0;
  avgWeightPerLog   = 0;
  casesWithRecycling = 0;

  /* ── Raw data ───────────────────────────────────────────────── */
  inspections: InspectionCase[]    = [];
  recycling:   RecyclingProducts[] = [];

  private charts: Chart[] = [];
  private chartsRendered = false;

  constructor(
    private authService:      AuthService,
    private insCaseService:   InspectionCaseService,
    private recyclingService: RecyclingProductsService,
    private statsService:     AuditStatisticsService,
    private router:           Router
  ) {}

  ngOnInit(): void {
    this.authService.fetchUserProfile().subscribe({
      next: (user) => {
        this.auditorId   = user.idUser;
        this.auditorName = `${user.prenom} ${user.nom}`;
        this.loadData();
      },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }

  ngAfterViewInit(): void {
    /* Charts rendered after data arrives — see loadData() */
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/user/home']);
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      inspections: this.insCaseService.getByAuditor(this.auditorId),
      recycling:   this.recyclingService.getAll()
    }).subscribe({
      next: ({ inspections, recycling }) => {
        this.inspections = inspections || [];
        this.recycling   = recycling   || [];
        this.computeKPIs();
        this.isLoading = false;
        setTimeout(() => this.renderAllCharts(), 150);
      },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }

  /* ────────────────────────────────────────────────────────────── */
  /*  KPI Computation                                              */
  /* ────────────────────────────────────────────────────────────── */
  computeKPIs(): void {
    this.totalInspections = this.inspections.length;
    this.totalWeightKg    = this.recycling.reduce((s, r) => s + (r.weight ?? 0), 0);

    const resolved = this.inspections.filter(i => i.resolutionStatus === 'RESOLU').length;
    this.resolutionRate   = this.totalInspections > 0
      ? Math.round((resolved / this.totalInspections) * 100) : 0;

    const recycled = this.inspections.filter(i => i.sanitaryVerdict === 'DESTRUCTION_RECYCLAGE').length;
    this.recyclingRate    = this.totalInspections > 0
      ? Math.round((recycled / this.totalInspections) * 100) : 0;

    this.avgWeightPerLog  = this.recycling.length > 0
      ? Math.round(this.totalWeightKg / this.recycling.length) : 0;

    /* cases that have at least one recycling log */
    const caseIdsWithRecycling = new Set(
      this.recycling.map(r => r.inspectionCase?.caseId).filter(Boolean)
    );
    this.casesWithRecycling = caseIdsWithRecycling.size;
  }

  /* ────────────────────────────────────────────────────────────── */
  /*  Chart Rendering                                              */
  /* ────────────────────────────────────────────────────────────── */
  renderAllCharts(): void {
    if (this.chartsRendered) return;
    this.chartsRendered = true;
    this.renderVerdictChart();
    this.renderStatusChart();
    this.renderDestinationWeightChart();
    this.renderMonthlyInspectionsChart();
    this.renderWeightByDestChart();
    this.renderRecyclingTrendChart();
  }

  /** Chart 1 – Doughnut: Verdict distribution */
  renderVerdictChart(): void {
    const propre    = this.inspections.filter(i => i.sanitaryVerdict === 'PROPRE_A_LA_CONSOMMATION').length;
    const recyclage = this.inspections.filter(i => i.sanitaryVerdict === 'DESTRUCTION_RECYCLAGE').length;
    const chart = new Chart(this.verdictChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Propre à la Consommation', 'Destruction / Recyclage'],
        datasets: [{
          data: [propre, recyclage],
          backgroundColor: ['#10b981', '#3b82f6'],
          borderColor: ['#065f46', '#1e40af'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#374151', font: { size: 12 }, padding: 16 } }
        }
      }
    });
    this.charts.push(chart);
  }

  /** Chart 2 – Pie: Resolution status */
  renderStatusChart(): void {
    const enCours = this.inspections.filter(i => i.resolutionStatus === 'EN_COURS').length;
    const resolu  = this.inspections.filter(i => i.resolutionStatus === 'RESOLU').length;
    const ferme   = this.inspections.filter(i => i.resolutionStatus === 'FERME').length;
    const chart = new Chart(this.statusChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: ['En Cours', 'Résolu', 'Fermé'],
        datasets: [{
          data: [enCours, resolu, ferme],
          backgroundColor: ['#f59e0b', '#10b981', '#6b7280'],
          borderColor:     ['#78350f', '#065f46', '#374151'],
          borderWidth: 2, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#374151', font: { size: 12 }, padding: 16 } } }
      }
    });
    this.charts.push(chart);
  }

  /** Chart 3 – Horizontal Bar: Total weight by destination */
  renderDestinationWeightChart(): void {
    const compost = this.recycling.filter(r => r.destination === 'COMPOST')
      .reduce((s, r) => s + (r.weight ?? 0), 0);
    const agri    = this.recycling.filter(r => r.destination === 'AGRICULTEUR')
      .reduce((s, r) => s + (r.weight ?? 0), 0);
    const chart = new Chart(this.destinationChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Compostage', 'Agriculteur'],
        datasets: [{
          label: 'Poids total (kg)',
          data: [compost, agri],
          backgroundColor: ['rgba(16,185,129,0.75)', 'rgba(59,130,246,0.75)'],
          borderColor:     ['#10b981', '#3b82f6'],
          borderWidth: 2, borderRadius: 10
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
          y: { ticks: { color: '#6b7280' }, grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  /** Chart 4 – Line: Monthly inspection trend */
  renderMonthlyInspectionsChart(): void {
    const monthMap: Record<string, number> = {};
    this.inspections.forEach(i => {
      if (i.creationDate) {
        const d   = new Date(i.creationDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
      }
    });

    const sortedKeys = Object.keys(monthMap).sort();
    const labels = sortedKeys.length
      ? sortedKeys.map(k => {
          const [y, m] = k.split('-');
          return new Date(+y, +m - 1).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        })
      : ['Aucune donnée'];
    const values = sortedKeys.length ? sortedKeys.map(k => monthMap[k]) : [0];

    const chart = new Chart(this.monthlyChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Inspections / mois',
          data: values,
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#10b981', pointRadius: 5, pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#374151' } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#6b7280', stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { ticks: { color: '#6b7280' }, grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  /** Chart 5 – Bar: Average weight per destination */
  renderWeightByDestChart(): void {
    const compostLogs = this.recycling.filter(r => r.destination === 'COMPOST');
    const agriLogs    = this.recycling.filter(r => r.destination === 'AGRICULTEUR');
    const avg = (arr: RecyclingProducts[]) =>
      arr.length ? Math.round(arr.reduce((s, r) => s + (r.weight ?? 0), 0) / arr.length) : 0;

    const chart = new Chart(this.weightByDestRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Compostage', 'Agriculteur'],
        datasets: [{
          label: 'Poids moyen (kg)',
          data: [avg(compostLogs), avg(agriLogs)],
          backgroundColor: ['rgba(251,191,36,0.75)', 'rgba(167,139,250,0.75)'],
          borderColor:     ['#f59e0b', '#7c3aed'],
          borderWidth: 2, borderRadius: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#374151' } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { ticks: { color: '#6b7280' }, grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  /** Chart 6 – Area line: Monthly recycling weight trend */
  renderRecyclingTrendChart(): void {
    const monthMap: Record<string, number> = {};
    this.recycling.forEach(r => {
      if (r.transferDate) {
        const d   = new Date(r.transferDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + (r.weight ?? 0);
      }
    });

    const sortedKeys = Object.keys(monthMap).sort();
    const labels = sortedKeys.length
      ? sortedKeys.map(k => {
          const [y, m] = k.split('-');
          return new Date(+y, +m - 1).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        })
      : ['Aucune donnée'];
    const values = sortedKeys.length ? sortedKeys.map(k => monthMap[k]) : [0];

    const chart = new Chart(this.recyclingTrendRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Volume recyclé (kg)',
          data: values,
          borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#3b82f6', pointRadius: 5, pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#374151' } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { ticks: { color: '#6b7280' }, grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
}
