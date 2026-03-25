import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { LanguageService } from '../../core/services/language.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatChipsModule,
    TranslateModule,
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="app-sidebar"
        [fixedInViewport]="true"
        [class.collapsed]="isCollapsed() && !isMobile()"
      >
        <div class="sidebar-header">
          <div class="header-top">
            <img
              [src]="companyLogoUrl()"
              alt="AFI Logo"
              class="logo-img"
              (error)="companyLogoUrl.set('/assets/logo-afi.png')"
            />
            <button
              mat-icon-button
              (click)="toggleSidebar()"
              class="collapse-btn"
              *ngIf="!isMobile()"
              [title]="isCollapsed() ? ('nav.expand' | translate) : ('nav.collapse' | translate)"
            >
              <mat-icon style="top: -8px;left: -7px;">{{
                isCollapsed() ? 'chevron_right' : 'chevron_left'
              }}</mat-icon>
            </button>
          </div>
          <div class="sub-text" *ngIf="!isCollapsed()">{{ 'app.title' | translate }}</div>
          <div class="sub-text" *ngIf="!isCollapsed()">{{ 'app.subtitle' | translate }}</div>
          <div class="sub-text" *ngIf="!isCollapsed()" style="color: #cfd3d7ff ;">
            {{ 'app.demoVersion' | translate }}
          </div>
        </div>

        <mat-nav-list class="nav-list" [class.collapsed-list]="isCollapsed() && !isMobile()">
          <a
            mat-list-item
            routerLink="/dashboard"
            routerLinkActive="active-link"
            *ngIf="canSeeDashboard()"
            [title]="isCollapsed() ? ('nav.dashboard' | translate) : ''"
          >
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.dashboard' | translate }}</span>
          </a>

          <a
            mat-list-item
            routerLink="/documents"
            routerLinkActive="active-link"
            [title]="isCollapsed() ? ('nav.documents' | translate) : ''"
          >
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.documents' | translate }}</span>
            <span matListItemMeta class="nav-badge" *ngIf="pendingCount() > 0">{{
              pendingCount()
            }}</span>
          </a>

          <a
            mat-list-item
            routerLink="/documents/upload"
            routerLinkActive="active-link"
            *ngIf="isAdmin()"
            [title]="isCollapsed() ? ('nav.upload' | translate) : ''"
          >
            <mat-icon matListItemIcon>cloud_upload</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.upload' | translate }}</span>
          </a>

          <a
            mat-list-item
            routerLink="/signatures"
            routerLinkActive="active-link"
            [title]="isCollapsed() ? ('nav.signatures' | translate) : ''"
          >
            <mat-icon matListItemIcon>gesture</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.signatures' | translate }}</span>
          </a>

          <a
            mat-list-item
            routerLink="/users"
            routerLinkActive="active-link"
            *ngIf="isAdmin()"
            [title]="isCollapsed() ? ('nav.users' | translate) : ''"
          >
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.users' | translate }}</span>
          </a>

          <a
            mat-list-item
            routerLink="/settings"
            routerLinkActive="active-link"
            *ngIf="isAdmin()"
            [title]="isCollapsed() ? ('nav.settings' | translate) : ''"
          >
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed()">{{ 'nav.settings' | translate }}</span>
          </a>
        </mat-nav-list>

        <div class="sidebar-footer" *ngIf="!isCollapsed()">
          <div class="version">{{ 'version' | translate }} 1.1.0-beta</div>
          <div class="company">2026 © comlar</div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content
        class="app-content"
        style="{{ isMobile() ? '' : isCollapsed() ? 'margin-left: 70px' : 'margin-left:260px' }}"
      >
        <mat-toolbar class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" class="mobile-only">
            <mat-icon>menu</mat-icon>
          </button>

          <span class="spacer"></span>

          <div class="user-profile">
            <div class="user-info">
              <span class="user-name">{{ currentUser()?.name }}</span>
              <mat-chip-set>
                <mat-chip class="role-chip">{{ currentUser()?.role }}</mat-chip>
              </mat-chip-set>
            </div>

            <button mat-icon-button [matMenuTriggerFor]="notifMenu">
              <mat-icon
                [matBadge]="notificationCount()"
                matBadgeColor="warn"
                [matBadgeHidden]="notificationCount() === 0"
                >notifications</mat-icon
              >
            </button>
            <mat-menu #notifMenu="matMenu" class="notification-menu">
              <div class="menu-header">{{ 'notifications.title' | translate }}</div>
              <div *ngIf="notifications().length === 0" class="empty-notif">
                {{ 'notifications.noNew' | translate }}
              </div>
              <button mat-menu-item *ngFor="let n of notifications()">
                <mat-icon [color]="n.type === 'error' ? 'warn' : 'primary'">info</mat-icon>
                <span>{{ n.message }}</span>
              </button>
            </mat-menu>

            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item disabled *ngIf="isMobile()" class="user-menu-header">
                <div class="user-menu-info">
                  <div class="user-name">{{ currentUser()?.name }}</div>
                  <div class="role-chip">{{ currentUser()?.role }}</div>
                </div>
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>{{ 'auth.logout' | translate }}</span>
              </button>
            </mat-menu>

            <button
            mat-icon-button
            (click)="toggleLanguage()"
            class="lang-toggle"
            [title]="currentLanguage() === 'es' ? 'Switch to English' : 'Cambiar a Español'"
          >
            <span class="lang-flag">{{ currentLanguage() === 'es' ? '🇪🇸' : '🇺🇸' }}</span>
          </button>
          
          </div>
        </mat-toolbar>

        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .layout-container {
        height: 100vh;
        background: var(--bg-color);
      }
      .app-sidebar {
        width: 260px;
        background: #ffffff;
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        overflow-x: hidden;
      }
      .app-sidebar.collapsed {
        width: 72px;
      }
      .sidebar-header {
        padding: 32px 24px;
        background: linear-gradient(135deg, rgba(255, 122, 41, 0.05), transparent);
        transition: padding 0.25s ease;
      }
      .collapsed .sidebar-header {
        padding: 32px 12px 16px;
        text-align: center;
      }
      .header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
        min-height: 48px;
      }
      .collapsed .header-top {
        flex-direction: column;
        gap: 12px;
      }
      .collapse-btn {
        width: 32px !important;
        height: 32px !important;
        line-height: 32px !important;
        background: rgba(0, 0, 0, 0.03);
        color: var(--text-muted);
      }
      .collapse-btn:hover {
        background: rgba(255, 122, 41, 0.1);
        color: var(--primary-color);
      }
      .logo-img {
        height: 40px;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        transition: all 0.25s ease;
      }
      .collapsed .logo-img {
        height: 32px;
      }
      .sub-text {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-muted);
      }
      .nav-list {
        flex: 1;
        padding-top: 16px;
        transition: all 0.25s ease;
      }
      .nav-list a {
        margin: 2px 12px;
        border-radius: 12px;
        height: 44px;
        color: var(--text-muted);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
      }
      .collapsed-list a {
        margin: 2px 8px;
        padding: 0 !important;
        justify-content: center;
      }
      .collapsed-list mat-icon {
        margin: 0 !important;
      }
      .nav-list a:hover {
        background: rgba(0, 0, 0, 0.02);
        color: var(--text-color);
      }
      .active-link {
        background: rgba(255, 122, 41, 0.08) !important;
        color: var(--primary-color) !important;
        font-weight: 600;
      }
      .active-link mat-icon {
        color: var(--primary-color);
      }
      .nav-badge {
        background: orange;
        color: white !important;
        font-size: 10px;
        padding: 0px 7px;
        border-radius: 10px;
        font-weight: 800;
        margin-left: auto;
        // box-shadow: 0 2px 4px rgba(225, 33, 33, 0.42);
      }
      .sidebar-footer {
        padding: 20px 24px;
        border-top: 1px solid var(--border-color);
        font-size: 10px;
        color: var(--text-muted);
        opacity: 0.8;
      }
      .app-toolbar {
        background: rgba(248, 250, 252, 0.8);
        border-bottom: 1px solid var(--border-color);
        backdrop-filter: blur(12px);
        color: var(--text-color);
      }
      .spacer {
        flex: 1;
      }
      .lang-toggle {
        width: 40px !important;
        height: 40px !important;
        line-height: 20px !important;
        margin-right: 8px;
      }
      .lang-flag {
        font-size: 20px;       
      }
      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-right: 8px;
      }
      .user-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-color);
      }
      .role-chip {
        font-size: 9px !important;
        min-height: 18px !important;
        height: 18px !important;
        background: #d97706; //var(--accent-color) !important;
        color: white !important;
        font-weight: 600 !important;
      }

      .user-menu-header {
        pointer-events: none;
        opacity: 1;
      }
      .user-menu-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .user-menu-header .user-name {
        font-weight: 800;
      }
      .user-menu-header .role-chip {
        font-size: 10px !important;
        height: auto !important;
        padding: 2px 8px !important;
      }
      .page-container {
        padding: 32px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .notification-menu {
        width: 320px;
        border-radius: 16px;
      }
      .menu-header {
        padding: 16px;
        font-size: 13px;
        font-weight: 800;
        border-bottom: 1px solid var(--border-color);
        color: var(--accent-color);
      }
      .empty-notif {
        padding: 32px;
        text-align: center;
        font-size: 13px;
        color: var(--text-muted);
      }

      @media (max-width: 768px) {
        .app-sidebar {
          width: 280px;
        }
        .mobile-only {
          display: block !important;
        }
        .user-info {
          display: none;
        }
        .page-container {
          padding: 12px;
        }
        .app-toolbar {
          padding: 0 8px;
          height: 56px;
        }
        .sidebar-header {
          padding: 24px 16px;
        }
        .nav-list a {
          margin: 2px 8px;
        }
        .logo-img {
          height: 32px;
        }
      }
      .mobile-only {
        display: none;
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private languageService = inject(LanguageService);
  private router = inject(Router);

  isMobile = signal(false);
  isCollapsed = signal(false);
  companyLogoUrl = signal<string>('/assets/logo-afi.png');

  currentLanguage = this.languageService.currentLanguage;

  ngOnInit() {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkScreenSize());
    }
    this.settingsService.getSettings().subscribe((s) => {
      if (s?.companyLogoUrl) {
        this.companyLogoUrl.set(s.companyLogoUrl);
      }
    });
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', () => this.checkScreenSize());
    }
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth <= 768);
    }
  }

  currentUser = this.authService.currentUser;
  notifications = this.notificationService.notifications;
  notificationCount = computed(() => this.notifications().filter((n) => !n.read).length);
  pendingCount = this.notificationService.pendingDocsCount;

  isAdmin = this.authService.isAdmin;
  isSigner = this.authService.isSigner;
  isAuditor = this.authService.isAuditor;

  canSeeDashboard(): boolean {
    return this.isAdmin() || this.isAuditor();
  }

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  logout() {
    this.authService.logout();
  }
}
