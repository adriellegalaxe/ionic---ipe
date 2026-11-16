import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl } from '../../core/util';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Financeiro" subtitulo="Receitas, despesas e verbas da escola">
      <button class="btn btn-success" (click)="abrirModal('Receita')"><ion-icon name="add-outline"></ion-icon><span>Nova Receita</span></button>
      <button class="btn btn-danger" (click)="abrirModal('Despesa')"><ion-icon name="add-outline"></ion-icon><span>Nova Despesa</span></button>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card green"><h3>Entradas</h3><p style="font-size:1.4rem">{{ brl(resumo.total_entradas) }}</p></div>
        <div class="stat-card red"><h3>Saídas</h3><p style="font-size:1.4rem">{{ brl(resumo.total_saidas) }}</p></div>
        <div class="stat-card" [ngClass]="resumo.saldo_atual >= 0 ? 'green' : 'red'">
          <h3>Saldo atual</h3><p style="font-size:1.4rem">{{ brl(resumo.saldo_atual) }}</p>
        </div>
        <div class="stat-card gray"><h3>Saldo bloqueado</h3><p style="font-size:1.4rem">{{ brl(resumo.saldo_bloqueado) }}</p></div>
      </section>

      <div class="card">
        <div class="section-title" style="margin-bottom:16px">
          <div><h2>Entradas x Saídas</h2><p>Últimos 6 meses</p></div>
          <div class="legend">
            <span><i style="background:#15803d"></i> Entradas</span>
            <span><i style="background:#991b1b"></i> Saídas</span>
          </div>
        </div>
        <div class="bars">
          <div class="col" *ngFor="let g of grafico">
            <div class="duo">
              <div class="bar entrada" [style.height.%]="altura(g.entradas)"></div>
              <div class="bar saida" [style.height.%]="altura(g.saidas)"></div>
            </div>
            <span class="lbl">{{ g.mes_label }}</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:16px">
        <div class="filtros">
          <div class="form-group" style="grid-column: span 2">
            <label>Buscar</label>
            <input class="input" [(ngModel)]="filtro.busca" (ngModelChange)="aplicar()" placeholder="Descrição ou documento">
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select class="select" [(ngModel)]="filtro.tipo" (ngModelChange)="aplicar()">
              <option value="">Todos</option>
              <option value="Receita">Receitas</option>
              <option value="Despesa">Despesas</option>
            </select>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select class="select" [(ngModel)]="filtro.categoria" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let c of categorias" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Origem</label>
            <select class="select" [(ngModel)]="filtro.origem" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let o of origens" [value]="o.id">{{ o.icone }} {{ o.nome }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>De</label>
            <input class="input" type="date" [(ngModel)]="filtro.data_ini" (ngModelChange)="aplicar()">
          </div>
          <div class="form-group">
            <label>Até</label>
            <input class="input" type="date" [(ngModel)]="filtro.data_fim" (ngModelChange)="aplicar()">
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <button class="btn btn-ghost" (click)="limpar()">Limpar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead>
            <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Origem</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of lancamentos">
              <td class="nowrap">{{ l.data_formatada }}</td>
              <td>
                <strong>{{ l.descricao }}</strong>
                <div class="muted" *ngIf="l.numero_documento">Doc: {{ l.numero_documento }}</div>
              </td>
              <td>{{ l.categoria || '—' }}</td>
              <td>
                <span class="tag-origem" *ngIf="l.origem" [style.background]="(l.origem_cor || '#9ca3af') + '22'" [style.color]="l.origem_cor">
                  {{ l.origem_icone }} {{ l.origem_nome }}
                </span>
                <span class="muted" *ngIf="!l.origem">—</span>
              </td>
              <td>
                <span class="badge" [ngClass]="l.tipo_movimento === 'Receita' ? 'Concluído' : 'Crítico'">
                  {{ l.tipo_movimento }}
                </span>
              </td>
              <td class="nowrap"><strong>{{ brl(l.valor) }}</strong></td>
              <td><span class="badge" [ngClass]="l.status">{{ l.status }}</span></td>
              <td>
                <button class="btn btn-danger btn-sm" (click)="excluir(l)"><ion-icon name="trash-outline"></ion-icon></button>
              </td>
            </tr>
            <tr *ngIf="!lancamentos.length"><td colspan="8" class="empty">Nenhum lançamento encontrado.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="ipe-modal" *ngIf="modal()" (click)="modal.set(false)">
      <div class="ipe-modal__box" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Nova {{ form.tipo_movimento }}</h3><p>Registre um lançamento no caixa</p></div>
          <button class="icon-btn" (click)="modal.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
        <div class="col">
          <div class="form-group"><label>Descrição *</label><input class="input" [(ngModel)]="form.descricao" placeholder="Ex: Compra de materiais"></div>
          <div class="form-group"><label>Valor (R$) *</label><input class="input" type="number" step="0.01" [(ngModel)]="form.valor"></div>
          <div class="form-group" *ngIf="form.tipo_movimento === 'Despesa'">
            <label>Categoria</label>
            <input class="input" [(ngModel)]="form.categoria" placeholder="Ex: Equipamentos, Manutenção">
          </div>
          <div class="form-group">
            <label>Forma de pagamento</label>
            <select class="select" [(ngModel)]="form.forma_pagamento">
              <option>Pix</option><option>Transferência</option><option>Boleto</option>
              <option>Dinheiro</option><option>Cartão</option><option>Depósito</option>
            </select>
          </div>
          <div class="form-group"><label>Documento</label><input class="input" [(ngModel)]="form.numero_documento" placeholder="NF / DOC"></div>
          <div class="form-group">
            <label>Verba</label>
            <select class="select" [(ngModel)]="form.id_verba">
              <option [ngValue]="null">Sem verba</option>
              <option *ngFor="let v of verbas" [ngValue]="v.id_verba">{{ v.nome }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="form.tipo_movimento === 'Despesa'">
            <label>Aprovação</label>
            <select class="select" [(ngModel)]="form.aprovacao">
              <option [ngValue]="0">Pendente</option>
              <option [ngValue]="1">Aprovado</option>
            </select>
          </div>
          <div class="form-group"><label>Data</label><input class="input" type="date" [(ngModel)]="form.data"></div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-primary" (click)="salvar()">Registrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; align-items: end; }
  `]
})
export class FinanceiroPage {
  private api = inject(ApiService);

  brl = brl;

  resumo = this.api.resumoFinanceiro();
  grafico = this.api.graficoFinanceiro();
  origens = this.api.origensFinanceiro().filter(o => o.id !== 'SEM_ORIGEM' || o.total_movimentacoes > 0);
  categorias = this.api.categoriasFinanceiro();
  verbas = this.api.verbas();

  filtro = { busca: '', tipo: '', categoria: '', origem: '', data_ini: '', data_fim: '' };
  lancamentos = this.api.listarLancamentos();

  modal = signal(false);
  erro = signal('');
  form: any = this.formVazio('Despesa');

  private maxValor = 1;

  constructor() {
    this.calcularMax();
  }

  private calcularMax(): void {
    this.maxValor = Math.max(1, ...this.grafico.map(g => Math.max(g.entradas, g.saidas)));
  }

  altura(v: number): number {
    return Math.round((v / this.maxValor) * 100);
  }

  private formVazio(tipo: 'Receita' | 'Despesa') {
    return {
      tipo_movimento: tipo, descricao: '', valor: 0, categoria: '',
      forma_pagamento: 'Pix', numero_documento: '', id_verba: null,
      aprovacao: 0, data: new Date().toISOString().slice(0, 10)
    };
  }

  aplicar(): void {
    this.lancamentos = this.api.listarLancamentos({ ...this.filtro });
  }

  limpar(): void {
    this.filtro = { busca: '', tipo: '', categoria: '', origem: '', data_ini: '', data_fim: '' };
    this.aplicar();
  }

  abrirModal(tipo: 'Receita' | 'Despesa'): void {
    this.form = this.formVazio(tipo);
    this.erro.set('');
    this.modal.set(true);
  }

  salvar(): void {
    this.erro.set('');
    const r = this.api.criarLancamento({
      tipo_movimento: this.form.tipo_movimento,
      descricao: this.form.descricao,
      valor: Number(this.form.valor),
      categoria: this.form.categoria,
      forma_pagamento: this.form.forma_pagamento,
      numero_documento: this.form.numero_documento,
      aprovacao: Number(this.form.aprovacao),
      id_verba: this.form.id_verba,
      data: this.form.data
    });
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.modal.set(false);
    this.recarregar();
  }

  excluir(l: any): void {
    if (!confirm(`Excluir o lançamento "${l.descricao}"?`)) return;
    this.api.excluirLancamento(l.id_lancamento);
    this.recarregar();
  }

  private recarregar(): void {
    this.resumo = this.api.resumoFinanceiro();
    this.grafico = this.api.graficoFinanceiro();
    this.calcularMax();
    this.categorias = this.api.categoriasFinanceiro();
    this.aplicar();
  }
}
