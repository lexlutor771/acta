import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentsState } from '../../documents.state';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    TranslateModule,
  ],
  template: `
    <div class="dashboard-root">
      <header class="dashboard-header">
        <h1>{{ 'dashboard.title' | translate }}</h1>
        <p>{{ 'dashboard.subtitle' | translate }} {{ today | date: 'mediumDate' }}</p>
      </header>

      <div class="metrics-grid">
        <mat-card class="metric-card primary">
          <mat-card-header>
            <mat-icon mat-card-avatar>description</mat-icon>
            <mat-card-title>{{ totalDocs() }}</mat-card-title>
            <mat-card-subtitle>{{ 'dashboard.totalDocuments' | translate }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="metric-card warning">
          <mat-card-header>
            <mat-icon mat-card-avatar>pending_actions</mat-icon>
            <mat-card-title>{{ pendingDocs() }}</mat-card-title>
            <mat-card-subtitle>{{ 'dashboard.pendingSignatures' | translate }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="metric-card success">
          <mat-card-header>
            <mat-icon mat-card-avatar>workspace_premium</mat-icon>
            <mat-card-title>{{ completedDocs() }}</mat-card-title>
            <mat-card-subtitle>{{ 'dashboard.completedDocuments' | translate }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="metric-card accent">
          <mat-card-header>
            <mat-icon mat-card-avatar>groups</mat-icon>
            <mat-card-title>{{ activeUsers() }}</mat-card-title>
            <mat-card-subtitle>{{ 'dashboard.activeUsers' | translate }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>
      </div>

      <div class="dashboard-sections">
        <section class="activity-section glass-panel">
          <div class="section-header">
            <h3>{{ 'dashboard.recentActivity' | translate }}</h3>
            <button
              mat-button
              color="primary"
              (click)="toggleActivity()"
              *ngIf="recentActivity().length > 5"
            >
              {{ showAllActivity() ? ('dashboard.less' | translate) : ('dashboard.seeAll' | translate) }}
            </button>
          </div>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of displayedActivity()">
              <div class="activity-icon" [ngClass]="getActivityClass(activity.action)">
                <mat-icon>{{ getActivityIcon(activity.action) }}</mat-icon>
              </div>
              <div class="activity-content">
                <p>
                  <strong>{{ activity.userName }}</strong> {{ activity.detail }}
                </p>
                <span>{{ activity.timestamp | date: 'short' }}</span>
              </div>
            </div>
            <div *ngIf="recentActivity().length === 0" class="empty-state">
              {{ 'dashboard.noActivity' | translate }}
            </div>
          </div>
        </section>

        <aside class="quick-actions">
          <h3>{{ 'dashboard.quickActions' | translate }}</h3>
          <div class="actions-grid">
            <button
              mat-flat-button
              color="primary"
              routerLink="/documents/upload"
              *ngIf="isAdmin()"
            >
              <mat-icon>add</mat-icon> {{ 'documents.uploadMinute' | translate }}
            </button>
            <button mat-flat-button color="accent" routerLink="/documents">
              <mat-icon>list</mat-icon> {{ 'dashboard.viewAll' | translate }}
            </button>
            <button mat-flat-button class="outline-btn" routerLink="/users" *ngIf="isAdmin()">
              <mat-icon>person_add</mat-icon> {{ 'nav.users' | translate }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-root {
        display: flex;
        flex-direction: column;
        gap: 40px;
      }
      .dashboard-header h1 {
        font-size: 36px;
        font-weight: 900;
        margin-bottom: 4px;
        color: var(--accent-color);
      }
      .dashboard-header p {
        color: var(--text-muted);
        font-size: 15px;
        font-weight: 500;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
      }
      .metric-card {
        padding: 24px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none !important;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -1px rgba(0, 0, 0, 0.02) !important;
      }
      .metric-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05) !important;
      }
      .metric-card mat-card-title {
        font-size: 36px !important;
        font-weight: 900 !important;
        margin-bottom: 2px;
        color: var(--accent-color);
      }
      .metric-card mat-card-subtitle {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        color: var(--text-muted);
      }
      .metric-card mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      .primary mat-icon {
        color: var(--primary-color);
      }
      .warning mat-icon {
        color: #f59e0b;
      }
      .success mat-icon {
        color: #10b981;
      }
      .accent mat-icon {
        color: var(--secondary-color);
      }

      .dashboard-sections {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 32px;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }
      .section-header h3 {
        font-size: 20px;
        font-weight: 800;
        color: var(--accent-color);
        margin: 0;
      }
      .activity-section {
        padding: 40px;
      }
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .activity-item {
        display: flex;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }
      .activity-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.04);
      }
      .activity-icon.green-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      .activity-icon.blue-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      .activity-icon.orange-icon {
        background: rgba(255, 122, 41, 0.1);
        color: var(--primary-color);
      }
      .activity-content p {
        font-size: 14px;
        margin: 0 0 4px;
        color: var(--text-color);
      }
      .activity-content span {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
      }

      .quick-actions h3 {
        font-size: 18px;
        font-weight: 800;
        color: var(--accent-color);
        margin-bottom: 24px;
      }
      .actions-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .actions-grid button {
        height: 56px;
        justify-content: flex-start;
        border-radius: 16px !important;
        font-weight: 700 !important;
        font-size: 13px !important;
      }
      .outline-btn {
        border: 1px solid var(--border-color) !important;
        background: white !important;
        color: var(--text-color) !important;
      }

      @media (max-width: 1100px) {
        .dashboard-sections {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  private state = inject(DocumentsState);
  private auth = inject(AuthService);
  private userService = inject(UserService);

  today = new Date();
  totalDocs = computed(() => this.state.list().length);
  pendingDocs = computed(
    () =>
      this.state.list().filter((d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length,
  );
  completedDocs = this.state.completedCount;
  recentActivity = this.state.recentActivity;

  showAllActivity = signal(false);
  displayedActivity = computed(() => {
    return this.showAllActivity() ? this.recentActivity() : this.recentActivity().slice(0, 5);
  });

  isAdmin = this.auth.isAdmin;
  activeUsers = signal(0);

  toggleActivity() {
    this.showAllActivity.set(!this.showAllActivity());
  }

  ngOnInit() {
    this.state.loadDocuments();
    this.userService.getUsers().subscribe((users) => {
      this.activeUsers.set(users.filter((u) => u.isActive).length);
    });
  }

  getActivityIcon(action: string): string {
    switch (action) {
      case 'SIGNED':
        return 'draw';
      case 'CREATED':
        return 'add_circle';
      case 'COMMENTED':
        return 'chat';
      default:
        return 'info';
    }
  }

  getActivityClass(action: string): string {
    switch (action) {
      case 'SIGNED':
        return 'green-icon';
      case 'CREATED':
        return 'blue-icon';
      case 'COMMENTED':
        return 'orange-icon';
      default:
        return '';
    }
  }
}
