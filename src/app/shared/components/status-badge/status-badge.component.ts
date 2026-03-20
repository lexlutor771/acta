import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { DocumentStatus, SignerStatus } from '../../../core/models/document.model';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule, MatChipsModule],
    template: `
    <span class="status-badge" [ngClass]="badgeClass">
      {{ label }}
    </span>
  `,
    styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid transparent;
    }
    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-pending { 
      background: #fffbeb; color: #d97706; border-color: #fde68a;
    }
    .status-pending::before { background: #d97706; }

    .status-in-progress { 
      background: #eff6ff; color: #2563eb; border-color: #bfdbfe;
    }
    .status-in-progress::before { background: #2563eb; }

    .status-completed { 
      background: #f0fdf4; color: #16a34a; border-color: #bbf7d0;
    }
    .status-completed::before { background: #16a34a; box-shadow: 0 0 6px rgba(22, 163, 74, 0.4); }
    
    .status-printed { 
      background: #fdf2ff; color: #a21caf; border-color: #f5d0fe;
    }
    .status-printed::before { background: #a21caf; }

    .status-rejected { 
      background: #fef2f2; color: #dc2626; border-color: #fecaca;
    }
    .status-rejected::before { background: #dc2626; }

    .status-draft::before { background: #4b5563; }

    .status-deleted { 
      background: #f1f5f9; color: #475569; border-color: #cbd5e1;
    }
    .status-deleted::before { background: #475569; }
  `]
})
export class StatusBadgeComponent {
    @Input() set status(value: DocumentStatus | SignerStatus | string) {
        this._status = value;
        this.updateBadge();
    }

    private _status = '';
    label = '';
    badgeClass = '';

    private updateBadge() {
        this.label = this._status.replace('_', ' ');

        switch (this._status) {
            case DocumentStatus.PENDING:
            case SignerStatus.PENDING:
                this.badgeClass = 'status-pending';
                break;
            case DocumentStatus.IN_PROGRESS:
                this.badgeClass = 'status-in-progress';
                break;
            case DocumentStatus.COMPLETED:
            case SignerStatus.SIGNED:
                this.badgeClass = 'status-completed';
                break;
            case DocumentStatus.PRINTED:
                this.badgeClass = 'status-printed';
                break;
            case DocumentStatus.REJECTED:
            case SignerStatus.REJECTED:
                this.badgeClass = 'status-rejected';
                break;
            case 'DELETED':
            case 'deleted':
                this.badgeClass = 'status-deleted';
                break;
            case DocumentStatus.DRAFT:
                this.badgeClass = 'status-draft';
                break;
            default:
                this.badgeClass = 'status-draft';
        }
    }
}
