import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, NavbarComponent, SidebarComponent],
  templateUrl: './analytics-dashboard.component.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  loading = true;
  stats: any = {};
  procedureStats: any = {};
  qualityMetrics: any = {};
  completionRates: any = {};

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    forkJoin({
      dash: this.analyticsService.getDashboard(),
      procs: this.analyticsService.getProcedureStats(),
      quality: this.analyticsService.getQualityMetrics(),
      completion: this.analyticsService.getCompletionRates(),
    }).subscribe({
      next: ({ dash, procs, quality, completion }) => {
        this.stats = dash?.stats || {};
        this.procedureStats = procs || {};
        this.qualityMetrics = quality || {};
        this.completionRates = completion || {};
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
