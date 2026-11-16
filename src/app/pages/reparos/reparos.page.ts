import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl, dataBR } from '../../core/util';

@Component({
  selector: 'app-reparos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Histórico de Reparos" subtitulo="Reincidência, custos e tempo médio de manutenção">
      <select class="select" style="max-width:200px" [(ngModel)]="periodo" (ngModelChange)="aplicar()">
        <option [ngValue]="180">Últimos 6 meses</option>
        <option [ngValue]="365">Últimos 12 meses</option>
        <option [ngValue]="730">Últimos 24 meses</option>
      </select>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card blue"><h3>Total de reparos</h3><p>{{ resumo.total_reparos }}</p></div>
        <div class="stat-card green"><h3>Custo total</h3><p style="font-size:1.4rem">{{ brl(resumo.custo_total_manutencoes) }}</p></div>
        <div class="stat-card red"><h3>Bens críticos</h3><p>{{ resumo.bens_criticos }}</p></div>
        <div class="stat-card amber"><h3>Tempo médio</h3><p>{{ resumo.tempo_medio_reparo_dias }}<span style="font-size:.9rem"> dias</span></p></div>
      </section>

      <div class="aviso">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Um bem é considerado <strong>crítico</strong> a partir de 3 chamados no período. Clique em "Ver" para abrir o histórico completo do bem.</span>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead>
            <tr><th>#</th><th>Bem</th><th>Categoria</th><th>Local</th><th>Chamados</th><th>Manutenções</th><th>Custo</th><th>Último</th><th>Reincidência</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of ranking">
              <td class="mono">{{ r.id_patrimonio }}</td>
              <td><strong>{{ r.nome }}</strong><div class="muted mono">{{ r.numero_patrimonio }}</div></td>
              <td class="muted" style="max-width:200px">{{ r.nome_categoria }}</td>
              <td>{{ r.nome_sala }}</td>
              <td>
                <strong>{{ r.total_chamados }}</strong>
                <div class="muted">{{ r.chamados_ativos }} ativo(s)</div>
              </td>
              <td>{{ r.total_manutencoes }}</td>
              <td class="nowrap">{{ brl(r.valor_total_gasto) }}</td>
              <td class="nowrap">{{ r.ultimo_chamado }}</td>
              <td><span class="badge" [ngClass]="r.nivel_reincidencia">{{ r.nivel_reincidencia }}</span></td>
              <td><button class="btn btn-ghost btn-sm" (click)="ver(r)"><ion-icon name="eye-outline"></ion-icon> Ver</button></td>
            </tr>
            <tr *ngIf="!ranking.length"><td colspan="10" class="empty">Nenhum chamado registrado no período.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="ipe-modal" *ngIf="detalhe()" (click)="detalhe.set(null)">
      <div class="ipe-modal__box wide" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div>
            <h3>{{ detalhe()!.patrimonio.nome }}</h3>
            <p class="mono">{{ detalhe()!.patrimonio.numero_patrimonio }} · {{ detalhe()!.patrimonio.nome_sala }}</p>
          </div>
          <button class="icon-btn" (click)="detalhe.set(null)"><ion-icon name="close-outline"></ion-icon></button>
        </div>

        <div class="cards-grid" style="margin-bottom:16px">
          <div class="stat-card blue"><h3>Chamados</h3><p>{{ detalhe()!.resumo.total_chamados }}</p></div>
          <div class="stat-card amber"><h3>Manutenções</h3><p>{{ detalhe()!.resumo.total_manutencoes }}</p></div>
          <div class="stat-card green"><h3>Custo total</h3><p style="font-size:1.2rem">{{ brl(detalhe()!.resumo.custo_total) }}</p></div>
          <div class="stat-card"><h3>Valor do bem</h3><p style="font-size:1.2rem">{{ brl(detalhe()!.resumo.valor_bem) }}</p></div>
        </div>

        <div class="timeline">
          <div class="timeline-item" *ngFor="let c of detalhe()!.chamados">
            <small>{{ c.data_abertura_fmt }} · {{ c.nome_status }}</small>
            <strong>#{{ c.id_chamado }}</strong> {{ c.descricao_problema }}
            <div class="muted" *ngFor="let m of c.manutencoes">
              🔧 {{ dataBR(m.data_inicio) }} → {{ dataBR(m.data_fim) }} · {{ brl(m.custo) }} {{ m.observacao ? '· ' + m.observacao : '' }}
            </div>
          </div>
          <div class="empty" *ngIf="!detalhe()!.chamados.length">Nenhum chamado para este bem.</div>
        </div>
      </div>
    </div>
  `
})
export class ReparosPage {
  private api = inject(ApiService);

  brl = brl;
  dataBR = dataBR;

  periodo = 365;
  resumo = this.api.resumoReparos();
  ranking = this.api.rankingReparos(30, 365);
  detalhe = signal<any>(null);

  aplicar(): void {
    this.ranking = this.api.rankingReparos(30, Number(this.periodo));
  }

  ver(r: any): void {
    this.detalhe.set(this.api.reparosPorPatrimonio(r.id_patrimonio));
  }
}
