import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl, carimbo, csvEscape } from '../../core/util';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Relatórios" subtitulo="Consolidado financeiro por período e origem">
      <button class="btn btn-ghost" (click)="exportarCsv()"><ion-icon name="download-outline"></ion-icon><span>Exportar CSV</span></button>
      <button class="btn btn-ghost" (click)="imprimir()"><ion-icon name="print-outline"></ion-icon><span>Imprimir</span></button>
    </app-topbar>

    <div class="ipe-page">
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-left:5px solid var(--primary-dark)">
        <div class="row" style="gap:10px">
          <ion-icon name="calendar-outline"></ion-icon>
          <strong>Período do relatório</strong>
        </div>
        <div class="row">
          <select class="select" style="max-width:120px" [(ngModel)]="ano" (ngModelChange)="carregar()">
            <option *ngFor="let a of anos" [ngValue]="a">{{ a }}</option>
          </select>
          <div class="chip-toggle">
            <button *ngFor="let p of periodos" [class.active]="periodo === p.id" (click)="mudarPeriodo(p.id)">{{ p.label }}</button>
          </div>
        </div>
      </div>

      <section class="cards-grid">
        <div class="stat-card green"><h3>Entradas no ano</h3><p style="font-size:1.4rem">{{ brl(dados.resumo_geral.total_entradas) }}</p></div>
        <div class="stat-card red"><h3>Saídas no ano</h3><p style="font-size:1.4rem">{{ brl(dados.resumo_geral.total_saidas) }}</p></div>
        <div class="stat-card" [ngClass]="dados.resumo_geral.saldo >= 0 ? 'green' : 'red'">
          <h3>Saldo</h3><p style="font-size:1.4rem">{{ brl(dados.resumo_geral.saldo) }}</p>
        </div>
        <div class="stat-card blue"><h3>Movimentações</h3><p>{{ dados.resumo_geral.total_movimentacoes }}</p></div>
      </section>

      <div class="card">
        <div class="section-title" style="margin-bottom:14px"><div><h2>Resumo por {{ rotuloPeriodo }}</h2></div></div>
        <div class="table-wrap" style="box-shadow:none;border:1px solid var(--border)">
          <table class="ipe">
            <thead><tr><th>Período</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Movimentações</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of dados.detalhamento">
                <td><strong>{{ d.label }}</strong></td>
                <td style="color:#15803d">{{ brl(d.entradas) }}</td>
                <td style="color:#991b1b">{{ brl(d.saidas) }}</td>
                <td><strong>{{ brl(d.saldo) }}</strong></td>
                <td>{{ d.movimentacoes }}</td>
              </tr>
              <tr *ngIf="!dados.detalhamento.length"><td colspan="5" class="empty">Sem dados no período.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Por origem de recurso</h3>
          <div class="col">
            <div class="origem-row" *ngFor="let o of dados.por_origem">
              <span class="tag-origem" [style.background]="o.cor + '22'" [style.color]="o.cor">{{ o.icone }} {{ o.nome }}</span>
              <span class="grow"></span>
              <span style="color:#15803d">+{{ brl(o.entradas) }}</span>
              <span style="color:#991b1b">-{{ brl(o.saidas) }}</span>
              <strong style="min-width:110px;text-align:right">{{ brl(o.saldo) }}</strong>
            </div>
            <div class="empty" *ngIf="!dados.por_origem.length">Sem lançamentos.</div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Despesas por categoria</h3>
          <div class="col">
            <div class="cat-row" *ngFor="let c of dados.por_categoria">
              <span class="grow">{{ c.categoria }}</span>
              <span class="muted">{{ c.quantidade }}x</span>
              <strong>{{ brl(c.total) }}</strong>
            </div>
            <div class="empty" *ngIf="!dados.por_categoria.length">Sem despesas no ano.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin:0 0 12px;font-size:.95rem">Evolução mensal</h3>
        <div class="bars">
          <div class="col" *ngFor="let m of dados.por_periodo">
            <div class="duo">
              <div class="bar entrada" [style.height.%]="alturaMensal(m.entradas)"></div>
              <div class="bar saida" [style.height.%]="alturaMensal(m.saidas)"></div>
            </div>
            <span class="lbl">{{ m.mes_nome }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .origem-row, .cat-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f2f4; font-size: .84rem; }
    .origem-row:last-child, .cat-row:last-child { border-bottom: none; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class RelatoriosPage {
  private api = inject(ApiService);

  brl = brl;
  anos = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  ano = new Date().getFullYear();
  periodo = 'bimestral';
  periodos = [
    { id: 'mensal', label: 'Mensal' },
    { id: 'bimestral', label: 'Bimestral' },
    { id: 'trimestral', label: 'Trimestral' },
    { id: 'semestral', label: 'Semestral' },
    { id: 'anual', label: 'Anual' }
  ];

  dados = this.api.resumoRelatorios(this.ano, this.periodo);
  private maxMensal = 1;

  constructor() { this.calcularMax(); }

  get rotuloPeriodo(): string {
    return this.periodos.find(p => p.id === this.periodo)?.label.toLowerCase() ?? 'período';
  }

  private calcularMax(): void {
    this.maxMensal = Math.max(1, ...this.dados.por_periodo.map(m => Math.max(m.entradas, m.saidas)));
  }

  alturaMensal(v: number): number {
    return Math.round((v / this.maxMensal) * 100);
  }

  mudarPeriodo(p: string): void {
    this.periodo = p;
    this.carregar();
  }

  carregar(): void {
    this.dados = this.api.resumoRelatorios(Number(this.ano), this.periodo);
    this.calcularMax();
  }

  exportarCsv(): void {
    const l: string[] = [];
    l.push(`RELATORIO FINANCEIRO IPE - ${this.periodo.toUpperCase()} - ${this.ano}`);
    l.push(`Gerado em;${new Date().toLocaleString('pt-BR')}`);
    l.push('');
    l.push('RESUMO GERAL');
    l.push('Item;Valor');
    l.push(`Total de Entradas;${this.dados.resumo_geral.total_entradas.toFixed(2)}`);
    l.push(`Total de Saidas;${this.dados.resumo_geral.total_saidas.toFixed(2)}`);
    l.push(`Saldo;${this.dados.resumo_geral.saldo.toFixed(2)}`);
    l.push(`Total de Movimentacoes;${this.dados.resumo_geral.total_movimentacoes}`);
    l.push('');
    l.push('DETALHAMENTO POR PERIODO');
    l.push('Periodo;Entradas;Saidas;Saldo;Movimentacoes');
    this.dados.detalhamento.forEach(d => l.push([d.label, d.entradas.toFixed(2), d.saidas.toFixed(2), d.saldo.toFixed(2), d.movimentacoes].map(csvEscape).join(';')));
    l.push('');
    l.push('DESPESAS POR CATEGORIA');
    l.push('Categoria;Total;Quantidade');
    this.dados.por_categoria.forEach(c => l.push([c.categoria, c.total.toFixed(2), c.quantidade].map(csvEscape).join(';')));
    l.push('');
    l.push('POR ORIGEM');
    l.push('Origem;Entradas;Saidas;Saldo');
    this.dados.por_origem.forEach(o => l.push([o.nome, o.entradas.toFixed(2), o.saidas.toFixed(2), o.saldo.toFixed(2)].map(csvEscape).join(';')));

    const blob = new Blob(['\uFEFF' + l.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_${this.periodo}_${this.ano}_${carimbo()}.csv`;
    a.click();
  }

  imprimir(): void {
    window.print();
  }
}
