import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl, dataBR } from '../../core/util';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Movimentações" subtitulo="Transferências de bens entre salas">
      <button class="btn btn-primary" *ngIf="auth.isAdmin" (click)="abrirModal()">
        <ion-icon name="add-outline"></ion-icon><span>Nova Movimentação</span>
      </button>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card blue"><h3>Movimentações</h3><p>{{ resumo.total_movimentacoes }}</p></div>
        <div class="stat-card green"><h3>Itens movimentados</h3><p>{{ resumo.total_itens_movimentados }}</p></div>
        <div class="stat-card amber"><h3>Salas envolvidas</h3><p>{{ resumo.salas_envolvidas }}</p></div>
        <div class="stat-card gray"><h3>Última movimentação</h3><p style="font-size:1rem">{{ resumo.ultima_movimentacao || '—' }}</p></div>
      </section>

      <div class="card" style="padding:16px">
        <div class="filtros">
          <div class="form-group" style="grid-column: span 2">
            <label>Buscar por sala</label>
            <input class="input" [(ngModel)]="busca" (ngModelChange)="aplicar()" placeholder="Nome da sala ou bloco">
          </div>
          <div class="form-group">
            <label>Sala de origem</label>
            <select class="select" [(ngModel)]="salaOrigem" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let s of salas" [value]="s.id_sala">{{ s.numero_sala }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sala de destino</label>
            <select class="select" [(ngModel)]="salaDestino" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let s of salas" [value]="s.id_sala">{{ s.numero_sala }}</option>
            </select>
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <button class="btn btn-ghost" (click)="limpar()">Limpar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead><tr><th>#</th><th>Data</th><th>Origem</th><th>Destino</th><th>Itens</th><th>Ações</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of movs">
              <td class="mono">#{{ m.id_movimentacao }}</td>
              <td class="nowrap">{{ m.data_formatada }}</td>
              <td>{{ m.sala_origem }}<div class="muted" *ngIf="m.bloco_origem">{{ m.bloco_origem }}</div></td>
              <td>{{ m.sala_destino }}<div class="muted" *ngIf="m.bloco_destino">{{ m.bloco_destino }}</div></td>
              <td><span class="badge outline">{{ m.total_itens }} item(ns)</span></td>
              <td>
                <div class="acoes">
                  <button class="btn btn-ghost btn-sm" (click)="verItens(m)"><ion-icon name="list-outline"></ion-icon> Itens</button>
                  <button class="btn btn-danger btn-sm" *ngIf="auth.isAdmin" (click)="excluir(m)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!movs.length"><td colspan="6" class="empty">Nenhuma movimentação registrada.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal nova movimentação -->
    <div class="ipe-modal" *ngIf="modal()" (click)="modal.set(false)">
      <div class="ipe-modal__box" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Nova Movimentação</h3><p>Transfira bens de uma sala para outra</p></div>
          <button class="icon-btn" (click)="modal.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
        <div class="col">
          <div class="form-group">
            <label>Sala de destino *</label>
            <select class="select" [(ngModel)]="novaSalaDestino">
              <option [ngValue]="null">Selecione...</option>
              <option *ngFor="let s of salas" [ngValue]="s.id_sala">{{ s.numero_sala }}{{ s.bloco ? ' · ' + s.bloco : '' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bens a movimentar *</label>
            <div class="bens-list">
              <label class="bem-item" *ngFor="let p of patrimonios">
                <input type="checkbox" [checked]="selecionados.includes(p.id_patrimonio)"
                       (change)="toggle(p.id_patrimonio)">
                <span class="mono">{{ p.numero_patrimonio }}</span>
                <span>{{ p.nome }}</span>
              </label>
            </div>
            <span class="muted">{{ selecionados.length }} selecionado(s)</span>
          </div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-primary" (click)="salvar()">Registrar</button>
        </div>
      </div>
    </div>

    <!-- Modal itens -->
    <div class="ipe-modal" *ngIf="itensModal()" (click)="itensModal.set(null)">
      <div class="ipe-modal__box" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Itens da movimentação #{{ itensModal().id_movimentacao }}</h3><p>{{ itensModal().data_formatada }}</p></div>
          <button class="icon-btn" (click)="itensModal.set(null)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="table-wrap" style="box-shadow:none;border:1px solid var(--border)">
          <table class="ipe">
            <thead><tr><th>Nº</th><th>Item</th><th>Valor</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of itensModal().itens">
                <td class="mono">{{ i.numero_patrimonio }}</td>
                <td>{{ i.nome }}</td>
                <td>{{ brl(i.valor_atual) }}</td>
              </tr>
              <tr *ngIf="!itensModal().itens.length"><td colspan="3" class="empty">Sem itens.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; align-items: end; }
    .bens-list { max-height: 260px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px; padding: 8px; }
    .bem-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; font-size: .84rem; cursor: pointer; }
    .bem-item:hover { background: #fafafa; }
    .bem-item input { accent-color: var(--primary-dark); }
  `]
})
export class MovimentacoesPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);

  brl = brl;
  dataBR = dataBR;

  salas = this.api.db.listarSalas();
  patrimonios = this.api.listarInventario().filter(p => p.id_status !== 3);
  movs = this.api.listarMovimentacoes();
  resumo = this.api.resumoMovimentacoes();

  busca = '';
  salaOrigem: number | '' = '';
  salaDestino: number | '' = '';

  modal = signal(false);
  itensModal = signal<any>(null);
  erro = signal('');

  novaSalaDestino: number | null = null;
  selecionados: number[] = [];

  aplicar(): void {
    this.movs = this.api.listarMovimentacoes({
      busca: this.busca,
      sala_origem: this.salaOrigem ? Number(this.salaOrigem) : null,
      sala_destino: this.salaDestino ? Number(this.salaDestino) : null
    });
  }

  limpar(): void {
    this.busca = '';
    this.salaOrigem = '';
    this.salaDestino = '';
    this.aplicar();
  }

  abrirModal(): void {
    this.novaSalaDestino = null;
    this.selecionados = [];
    this.erro.set('');
    this.modal.set(true);
  }

  toggle(id: number): void {
    this.selecionados = this.selecionados.includes(id)
      ? this.selecionados.filter(x => x !== id)
      : [...this.selecionados, id];
  }

  salvar(): void {
    this.erro.set('');
    if (!this.novaSalaDestino) { this.erro.set('Selecione a sala de destino.'); return; }
    if (!this.selecionados.length) { this.erro.set('Selecione pelo menos um bem.'); return; }
    const r = this.api.criarMovimentacao(null, Number(this.novaSalaDestino), this.selecionados);
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.modal.set(false);
    this.aplicar();
    this.resumo = this.api.resumoMovimentacoes();
    this.patrimonios = this.api.listarInventario().filter(p => p.id_status !== 3);
  }

  verItens(m: any): void { this.itensModal.set(m); }

  excluir(m: any): void {
    if (!confirm(`Excluir a movimentação #${m.id_movimentacao}?`)) return;
    this.api.excluirMovimentacao(m.id_movimentacao);
    this.aplicar();
    this.resumo = this.api.resumoMovimentacoes();
  }
}
