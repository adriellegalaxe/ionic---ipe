import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Histórico" subtitulo="Linha do tempo de tudo o que aconteceu com um bem">
      <select class="select" style="max-width:320px" [(ngModel)]="idSel" (ngModelChange)="carregar()">
        <option [ngValue]="null">Selecione um bem...</option>
        <option *ngFor="let p of patrimonios" [ngValue]="p.id_patrimonio">{{ p.numero_patrimonio }} — {{ p.nome }}</option>
      </select>
    </app-topbar>

    <div class="ipe-page">
      <div class="card" *ngIf="!idSel">
        <div class="empty" style="padding:40px 0">
          <ion-icon name="time-outline" style="font-size:2rem;color:var(--muted)"></ion-icon>
          <p>Escolha um bem acima para ver o histórico completo.</p>
        </div>
      </div>

      <ng-container *ngIf="dados()">
        <div class="card">
          <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <h2 style="margin:0;font-size:1.15rem">{{ dados()!.patrimonio.nome }}</h2>
              <p class="muted" style="margin:2px 0 0">
                <span class="mono">{{ dados()!.patrimonio.numero_patrimonio }}</span> ·
                {{ dados()!.patrimonio.nome_sala }} · {{ dados()!.patrimonio.nome_status }}
              </p>
            </div>
            <div class="row">
              <span class="badge outline">{{ dados()!.eventos.length }} evento(s)</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="timeline">
            <div class="timeline-item" *ngFor="let e of dados()!.eventos">
              <small>{{ dataBR(e.data, true) }} · {{ e.tipo }}</small>
              {{ e.descricao }}
            </div>
            <div class="empty" *ngIf="!dados()!.eventos.length">Nenhum evento registrado para este bem.</div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class HistoricoPage {
  private api = inject(ApiService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  dataBR = dataBR;
  patrimonios = this.api.patrimoniosParaSelect();
  idSel: number | null = null;
  dados = signal<any>(null);

  carregar(): void {
    if (!this.idSel) { this.dados.set(null); return; }
    this.dados.set(this.api.listarHistorico(Number(this.idSel)));
  }
}
