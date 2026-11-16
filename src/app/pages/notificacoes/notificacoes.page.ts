import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Notificações" subtitulo="Alertas do sistema e dos seus chamados">
      <button class="btn btn-ghost" (click)="carregar()"><ion-icon name="refresh-outline"></ion-icon><span>Atualizar</span></button>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card blue"><h3>Total</h3><p>{{ lista().length }}</p></div>
        <div class="stat-card amber"><h3>Não lidas</h3><p>{{ naoLidas() }}</p></div>
        <div class="stat-card red"><h3>Urgentes</h3><p>{{ urgentes() }}</p></div>
        <div class="stat-card gray"><h3>Hoje</h3><p>{{ hoje() }}</p></div>
      </section>

      <div class="col">
        <div class="notif" *ngFor="let n of lista()" [class.unread]="!n.lida" [ngClass]="n.tipo">
          <div class="notif-icone">{{ n.icone }}</div>
          <div class="grow">
            <div class="row" style="justify-content:space-between">
              <strong>{{ n.titulo }}</strong>
              <span class="muted">{{ n.data_fmt }}</span>
            </div>
            <p style="margin:4px 0 0;font-size:.85rem;color:var(--muted)">{{ n.mensagem }}</p>
          </div>
          <button class="btn btn-ghost btn-sm" *ngIf="!n.lida" (click)="marcarLida(n)">Marcar lida</button>
        </div>
        <div class="card empty" *ngIf="!lista().length">Nenhuma notificação.</div>
      </div>
    </div>
  `,
  styles: [`
    .notif { display: flex; gap: 14px; align-items: flex-start; background: #fff; border: 1px solid var(--border); border-left: 4px solid #cbd5e1; border-radius: 14px; padding: 14px 16px; }
    .notif.unread { background: #fffdf5; border-left-color: var(--primary-dark); }
    .notif.Urgente { border-left-color: #991b1b; }
    .notif.Alerta { border-left-color: #f29310; }
    .notif-icone { font-size: 1.3rem; }
    .grow { flex: 1; }
  `]
})
export class NotificacoesPage {
  private api = inject(ApiService);

  dataBR = dataBR;
  lista = signal(this.api.listarNotificacoes());

  carregar(): void { this.lista.set(this.api.listarNotificacoes()); }

  naoLidas(): number { return this.lista().filter(n => !n.lida).length; }
  urgentes(): number { return this.lista().filter(n => n.tipo === 'Urgente').length; }
  hoje(): number {
    const h = new Date().toISOString().slice(0, 10);
    return this.lista().filter(n => (n.data || '').slice(0, 10) === h).length;
  }

  marcarLida(n: any): void {
    this.api.db.marcarNotificacaoLida(n.id_notificacao);
    this.carregar();
  }
}
