import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl, dataBR } from '../../core/util';

@Component({
  selector: 'app-baixa',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Baixa e Inutilização" subtitulo="Registro de bens retirados do acervo">
      <button class="btn btn-primary" (click)="abrirModal()"><ion-icon name="trending-down-outline"></ion-icon><span>Registrar Baixa</span></button>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card red"><h3>Total baixados</h3><p>{{ resumo.total_baixados }}</p></div>
        <div class="stat-card gray"><h3>Valor do acervo baixado</h3><p style="font-size:1.4rem">{{ brl(resumo.valor_total_perdido) }}</p></div>
        <div class="stat-card amber"><h3>Baixas no mês</h3><p>{{ resumo.baixas_mes_atual }}</p></div>
        <div class="stat-card blue"><h3>Última baixa</h3><p style="font-size:1rem">{{ resumo.ultima_baixa || '—' }}</p></div>
      </section>

      <div class="card" style="padding:16px">
        <div class="form-group">
          <label>Buscar nos baixados</label>
          <input class="input" [(ngModel)]="busca" (ngModelChange)="aplicar()" placeholder="Bem, nº patrimônio, motivo...">
        </div>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead><tr><th>Nº</th><th>Bem</th><th>Categoria</th><th>Local</th><th>Aquisição</th><th>Baixa</th><th>Valor</th><th>Motivo</th></tr></thead>
          <tbody>
            <tr *ngFor="let b of itens">
              <td class="mono nowrap">{{ b.numero_patrimonio }}</td>
              <td><strong>{{ b.nome }}</strong></td>
              <td class="muted" style="max-width:220px">{{ b.nome_categoria }}</td>
              <td>{{ b.nome_sala }}</td>
              <td class="nowrap">{{ b.data_aquisicao }}</td>
              <td class="nowrap">{{ b.data_baixa }}</td>
              <td class="nowrap">{{ brl(b.valor_atual) }}</td>
              <td><span class="badge Crítico">{{ b.motivo }}</span></td>
            </tr>
            <tr *ngIf="!itens.length"><td colspan="8" class="empty">Nenhum bem baixado até agora.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="ipe-modal" *ngIf="modal()" (click)="modal.set(false)">
      <div class="ipe-modal__box" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Registrar Baixa</h3><p>O bem sairá do acervo ativo</p></div>
          <button class="icon-btn" (click)="modal.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
        <div class="aviso warn" *ngIf="avisoBem()" style="margin-bottom:12px">
          <ion-icon name="warning-outline"></ion-icon><span>{{ avisoBem() }}</span>
        </div>
        <div class="col">
          <div class="form-group">
            <label>Bem patrimonial *</label>
            <select class="select" [(ngModel)]="idBem" (ngModelChange)="verificar()">
              <option [ngValue]="null">Selecione...</option>
              <option *ngFor="let p of disponiveis" [ngValue]="p.id_patrimonio">
                {{ p.numero_patrimonio }} — {{ p.nome }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Motivo da baixa *</label>
            <select class="select" [(ngModel)]="motivo">
              <option value="Obsolescência">Obsolescência</option>
              <option value="Dano irreparável">Dano irreparável</option>
              <option value="Perda / Furto">Perda / Furto</option>
              <option value="Doação">Doação</option>
              <option value="Transferência">Transferência</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Laudo técnico</label>
            <textarea class="textarea" [(ngModel)]="laudo" placeholder="Número/descrição do laudo"></textarea>
          </div>
          <div class="form-group">
            <label>Processo administrativo</label>
            <input class="input" [(ngModel)]="processo" placeholder="Ex: 2026/000123">
          </div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-danger" (click)="salvar()"><ion-icon name="trending-down-outline"></ion-icon> Confirmar Baixa</button>
        </div>
      </div>
    </div>
  `
})
export class BaixaPage {
  private api = inject(ApiService);

  brl = brl;
  dataBR = dataBR;

  itens = this.api.listarBaixas();
  resumo = this.api.resumoBaixas();
  disponiveis = this.api.listarInventario().filter(p => !(p.processo_baixa && p.id_status === 3));

  busca = '';
  modal = signal(false);
  erro = signal('');
  avisoBem = signal('');

  idBem: number | null = null;
  motivo = 'Obsolescência';
  laudo = '';
  processo = '';

  aplicar(): void {
    const b = this.busca.toLowerCase().trim();
    const todos = this.api.listarBaixas();
    this.itens = b
      ? todos.filter(i => [i.nome, i.numero_patrimonio, i.motivo, i.nome_sala].some(v => (v || '').toLowerCase().includes(b)))
      : todos;
  }

  abrirModal(): void {
    this.idBem = null;
    this.motivo = 'Obsolescência';
    this.laudo = '';
    this.processo = '';
    this.erro.set('');
    this.avisoBem.set('');
    this.disponiveis = this.api.listarInventario().filter(p => !(p.processo_baixa && p.id_status === 3));
    this.modal.set(true);
  }

  verificar(): void {
    this.avisoBem.set('');
    if (!this.idBem) return;
    const r = this.api.verificarBaixa(Number(this.idBem));
    if (!r.ok) { this.avisoBem.set(r.erro!); return; }
    if (r.alerta) this.avisoBem.set(r.alerta);
  }

  salvar(): void {
    this.erro.set('');
    if (!this.idBem) { this.erro.set('Selecione o bem.'); return; }
    const r = this.api.registrarBaixa(Number(this.idBem), this.motivo, this.laudo, this.processo);
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.modal.set(false);
    this.itens = this.api.listarBaixas();
    this.resumo = this.api.resumoBaixas();
  }
}
