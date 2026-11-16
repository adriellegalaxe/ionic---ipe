import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { brl, dataBR, diasAte, statusContrato } from '../../core/util';

@Component({
  selector: 'app-alugados',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Bens Alugados" subtitulo="Contratos de locação e terceirização">
      <button class="btn btn-primary" (click)="abrirNovo()"><ion-icon name="add-outline"></ion-icon><span>Novo Bem Locado</span></button>
    </app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card blue"><h3>Bens locados</h3><p>{{ resumo.total }}</p></div>
        <div class="stat-card green"><h3>Custo mensal</h3><p style="font-size:1.4rem">{{ brl(resumo.valor_mensal_total) }}</p></div>
        <div class="stat-card amber"><h3>Vencendo em 30 dias</h3><p>{{ resumo.vencendo_30 }}</p></div>
        <div class="stat-card red"><h3>Contratos vencidos</h3><p>{{ resumo.vencidos }}</p></div>
      </section>

      <div class="card" style="padding:16px">
        <div class="filtros">
          <div class="form-group" style="grid-column: span 2">
            <label>Buscar</label>
            <input class="input" [(ngModel)]="busca" (ngModelChange)="aplicar()" placeholder="Bem, fornecedor ou nº patrimônio">
          </div>
          <div class="form-group">
            <label>Vencendo em</label>
            <select class="select" [(ngModel)]="vencendo" (ngModelChange)="aplicar()">
              <option value="">Qualquer prazo</option>
              <option value="30d">30 dias</option>
              <option value="60d">60 dias</option>
              <option value="90d">90 dias</option>
            </select>
          </div>
          <div class="form-group">
            <label>Vencidos</label>
            <select class="select" [(ngModel)]="incluirVencidos" (ngModelChange)="aplicar()">
              <option [ngValue]="true">Incluir</option>
              <option [ngValue]="false">Ocultar</option>
            </select>
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <button class="btn btn-ghost" (click)="limpar()">Limpar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead>
            <tr><th>Nº</th><th>Bem</th><th>Fornecedor</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Dias</th><th>Mensal</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of itens">
              <td class="mono nowrap">{{ b.numero_patrimonio }}</td>
              <td><strong>{{ b.nome }}</strong><div class="muted">{{ b.nome_sala }}</div></td>
              <td>{{ b.fornecedor }}</td>
              <td><span class="badge outline">{{ b.tipo_posse }}</span></td>
              <td class="nowrap">{{ b.data_inicio_contrato }}</td>
              <td class="nowrap">{{ b.data_fim_contrato || '—' }}</td>
              <td class="nowrap">{{ b.dias_restantes === null ? '—' : b.dias_restantes + 'd' }}</td>
              <td class="nowrap">{{ brl(b.valor_mensal) }}</td>
              <td><span class="badge" [ngClass]="classe(b.status_contrato)">{{ b.status_contrato }}</span></td>
              <td>
                <div class="acoes">
                  <button class="btn btn-ghost btn-sm" (click)="abrirEditar(b)"><ion-icon name="create-outline"></ion-icon></button>
                  <button class="btn btn-danger btn-sm" (click)="excluir(b)"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!itens.length"><td colspan="10" class="empty">Nenhum bem locado encontrado.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="ipe-modal" *ngIf="modal()" (click)="modal.set(false)">
      <div class="ipe-modal__box wide" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>{{ editando ? 'Editar Contrato' : 'Novo Bem Locado' }}</h3><p>Controle de locação/terceirização</p></div>
          <button class="icon-btn" (click)="modal.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
        <div class="form-grid">
          <div class="form-group" *ngIf="!editando"><label>Nome do bem *</label><input class="input" [(ngModel)]="form.nome" placeholder="Ex: Notebook locado"></div>
          <div class="form-group" *ngIf="!editando"><label>Nº Patrimônio *</label><input class="input" [(ngModel)]="form.numero_patrimonio" placeholder="IPE-0012"></div>
          <div class="form-group"><label>Fornecedor *</label><input class="input" [(ngModel)]="form.fornecedor" placeholder="Ex: TechMais Locadora"></div>
          <div class="form-group"><label>Valor mensal (R$) *</label><input class="input" type="number" step="0.01" [(ngModel)]="form.valor_mensal"></div>
          <div class="form-group" *ngIf="!editando"><label>Início do contrato *</label><input class="input" type="date" [(ngModel)]="form.data_inicio"></div>
          <div class="form-group"><label>Fim do contrato *</label><input class="input" type="date" [(ngModel)]="form.data_fim"></div>
          <div class="form-group">
            <label>Sala</label>
            <select class="select" [(ngModel)]="form.id_sala">
              <option [ngValue]="null">Não alocado</option>
              <option *ngFor="let s of salas" [ngValue]="s.id_sala">{{ s.numero_sala }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="!editando">
            <label>Tipo de posse</label>
            <select class="select" [(ngModel)]="form.tipo_posse">
              <option value="Alugado">Alugado</option>
              <option value="Terceirizado">Terceirizado</option>
              <option value="Locado">Locado</option>
            </select>
          </div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-primary" (click)="salvar()"><ion-icon name="save-outline"></ion-icon> Salvar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; align-items: end; }
  `]
})
export class AlugadosPage {
  private api = inject(ApiService);

  brl = brl;
  dataBR = dataBR;
  salas = this.api.db.listarSalas();

  busca = '';
  vencendo = '';
  incluirVencidos = true;

  itens = this.api.listarAlugados();
  resumo = this.api.resumoAlugados();

  modal = signal(false);
  erro = signal('');
  editando = false;
  form: any = this.formVazio();
  private idEdicao = 0;

  private formVazio() {
    return {
      nome: '', numero_patrimonio: '', fornecedor: '', valor_mensal: 0,
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: '', id_sala: null, tipo_posse: 'Alugado'
    };
  }

  classe(status: string): string {
    if (status === 'Vigente') return 'Vigente';
    if (status === 'Vencendo') return 'Vencendo';
    if (status === 'Atenção') return 'Atenção';
    if (status === 'Vencido') return 'Vencido';
    return 'Sem';
  }

  aplicar(): void {
    this.itens = this.api.listarAlugados({
      busca: this.busca,
      vencendo: this.vencendo,
      incluir_vencidos: this.incluirVencidos
    });
  }

  limpar(): void {
    this.busca = '';
    this.vencendo = '';
    this.incluirVencidos = true;
    this.aplicar();
  }

  abrirNovo(): void {
    this.editando = false;
    this.form = this.formVazio();
    this.erro.set('');
    this.modal.set(true);
  }

  abrirEditar(b: any): void {
    this.editando = true;
    this.idEdicao = b.id_patrimonio;
    this.form = {
      nome: b.nome,
      numero_patrimonio: b.numero_patrimonio,
      fornecedor: b.fornecedor,
      valor_mensal: b.valor_mensal,
      data_inicio: b.data_inicio_contrato,
      data_fim: b.data_fim_contrato_iso ?? '',
      id_sala: this.api.db.patrimonio(b.id_patrimonio)?.id_sala ?? null,
      tipo_posse: b.tipo_posse
    };
    this.erro.set('');
    this.modal.set(true);
  }

  salvar(): void {
    this.erro.set('');
    if (!this.form.fornecedor || !this.form.data_fim) {
      this.erro.set('Informe o fornecedor e a data de fim do contrato.');
      return;
    }
    if (this.editando) {
      const r = this.api.editarAlugado(this.idEdicao, {
        fornecedor: this.form.fornecedor,
        valor_mensal: Number(this.form.valor_mensal),
        data_fim: this.form.data_fim,
        id_sala: this.form.id_sala
      });
      if (!r.ok) { this.erro.set(r.erro!); return; }
    } else {
      if (!this.form.nome || !this.form.numero_patrimonio) {
        this.erro.set('Informe o nome do bem e o número de patrimônio.');
        return;
      }
      const r = this.api.cadastrarAlugado({
        nome: this.form.nome,
        numero_patrimonio: this.form.numero_patrimonio,
        fornecedor: this.form.fornecedor,
        valor_mensal: Number(this.form.valor_mensal),
        data_inicio: this.form.data_inicio,
        data_fim: this.form.data_fim,
        id_sala: this.form.id_sala,
        tipo_posse: this.form.tipo_posse
      });
      if (!r.ok) { this.erro.set(r.erro!); return; }
    }
    this.modal.set(false);
    this.aplicar();
    this.resumo = this.api.resumoAlugados();
  }

  excluir(b: any): void {
    if (!confirm(`Remover o bem locado ${b.numero_patrimonio}?`)) return;
    this.api.excluirAlugado(b.id_patrimonio);
    this.aplicar();
    this.resumo = this.api.resumoAlugados();
  }
}
