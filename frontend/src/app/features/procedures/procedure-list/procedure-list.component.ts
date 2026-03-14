import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { ProcedureService } from '../../../core/services/procedure.service';
import { Procedure } from '../../../core/models/procedure.model';

@Component({
  selector: 'app-procedure-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule, NavbarComponent, SidebarComponent,
  ],
  templateUrl: './procedure-list.component.html',
})
export class ProcedureListComponent implements OnInit {
  procedures: Procedure[] = [];
  loading = true;
  filterStatus = '';
  total = 0;
  pageSize = 20;
  currentPage = 0;
  displayedColumns = ['patient', 'title', 'specialty', 'physician', 'date', 'status', 'actions'];
  statuses = ['draft', 'in-progress', 'completed', 'signed'];

  constructor(private procedureService: ProcedureService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.procedureService.getAll({
      page: this.currentPage + 1,
      limit: this.pageSize,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (res) => {
        this.procedures = res.data;
        this.total = res.pagination?.total || 0;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }
}
