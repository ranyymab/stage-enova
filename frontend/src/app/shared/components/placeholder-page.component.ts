import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder">
      <header class="placeholder-header">
        <h1>{{ title }}</h1>
        <span class="placeholder-date">{{ today | date: 'EEEE d MMMM yyyy' }}</span>
      </header>
      <div class="placeholder-body">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 4v5"/></svg>
        <p class="placeholder-text">Cette page sera connectée à <code>{{ endpoint }}</code> une fois le backend disponible.</p>
      </div>
    </div>
  `,
  styles: [`
    .placeholder {
      padding: 24px 28px 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .placeholder-header h1 {
      margin: 0;
      font-size: 21px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .placeholder-date {
      font-size: 13px;
      color: var(--text-muted);
      text-transform: capitalize;
    }
    .placeholder-body {
      border: 1px dashed var(--border-subtle);
      border-radius: 10px;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      color: var(--text-muted);
    }
    .placeholder-icon {
      width: 30px;
      height: 30px;
      margin: 0;
      color: var(--text-muted);
    }
    .placeholder-text {
      margin: 0;
      font-size: 13px;
    }
    code {
      font-family: var(--font-mono);
      color: var(--accent-info);
      background: var(--panel-raised);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `],
})
export class PlaceholderPageComponent {
  title = '';
  icon = '◇';
  endpoint = '';
  today = new Date();

  constructor(private readonly route: ActivatedRoute) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? '';
    this.icon = data['icon'] ?? '◇';
    this.endpoint = data['endpoint'] ?? '';
  }
}
