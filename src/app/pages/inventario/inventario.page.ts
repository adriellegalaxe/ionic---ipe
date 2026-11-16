import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService, ItemInventario } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { brl, dataBR } from '../../core/util';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Inventário" subtitulo="Bens patrimoniais cadastrados na escola">
      <button class="btn btn-ghost" *ngIf="auth.isAdmin" (click)="abrirNovaSala()">
        <ion-icon name="location-outline"></ion-icon><span>Nova Sala</span>
      </button>
      <button class="btn btn-ghost" (click)="exportarCsv()">
        <ion-icon name="download-outline"></ion-icon><span>Exportar CSV</span>
      </button>
      <button class="btn btn-primary" *ngIf="auth.isAdmin" (click)="abrirNovo()">
        <ion-icon name="add-outline"></ion-icon><span>Novo Patrimônio</span>
      </button>
    </app-topbar>

    <div class="ipe-page">
      <div class="aviso" *ngIf="!auth.isAdmin">
        <ion-icon name="eye-outline"></ion-icon>
        <span>Modo <strong>consulta</strong>: apenas a equipe de Patrimônio pode cadastrar ou excluir bens.</span>
      </div>

      <section class="cards-grid">
        <div class="stat-card blue"><h3>Total de bens</h3><p>{{ itens.length }}</p><small>inclui baixados</small></div>
        <div class="stat-card green"><h3>Valor atual do acervo</h3><p style="font-size:1.4rem">{{ brl(valorTotal) }}</p><small>com depreciação aplicada</small></div>
        <div class="stat-card amber"><h3>Em manutenção</h3><p>{{ emManutencao }}</p></div>
        <div class="stat-card gray"><h3>Baixados</h3><p>{{ baixados }}</p></div>
      </section>

      <div class="card" style="padding:16px">
        <div class="filtros">
          <div class="form-group" style="grid-column: span 2">
            <label>Buscar</label>
            <div class="input-group-inline">
              <input class="input" [(ngModel)]="busca" (ngModelChange)="aplicar()" placeholder="Nome, nº patrimônio, sala, NF...">
              <ion-icon name="search-outline" class="muted" style="font-size:1.1rem"></ion-icon>
            </div>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select class="select" [(ngModel)]="filtroCategoria" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let c of filtros.categorias" [value]="c.id_categoria">{{ c.nome }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sala</label>
            <select class="select" [(ngModel)]="filtroSala" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option *ngFor="let s of filtros.salas" [value]="s.id_sala">{{ s.nome }}{{ s.bloco ? ' · ' + s.bloco : '' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="select" [(ngModel)]="filtroStatus" (ngModelChange)="aplicar()">
              <option value="">Todos</option>
              <option *ngFor="let s of filtros.status" [value]="s.id_status">{{ s.nome }}</option>
            </select>
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <button class="btn btn-ghost" (click)="limpar()"><ion-icon name="refresh-outline"></ion-icon> Limpar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="ipe">
          <thead>
            <tr>
              <th (click)="ordenar('numero')" style="cursor:pointer">Nº Patrimônio</th>
              <th (click)="ordenar('nome')" style="cursor:pointer">Item</th>
              <th (click)="ordenar('categoria')" style="cursor:pointer">Categoria</th>
              <th>Local</th>
              <th (click)="ordenar('valor')" style="cursor:pointer">Valor atual</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of visiveis()">
              <td class="mono nowrap">{{ item.numero_patrimonio }}</td>
              <td>
                <strong>{{ item.nome }}</strong>
                <div class="muted" *ngIf="item.nota_fiscal">NF: {{ item.nota_fiscal }}</div>
              </td>
              <td class="muted" style="max-width:240px">{{ item.nome_categoria }}</td>
              <td>{{ item.nome_sala }}<span class="muted" *ngIf="item.bloco_sala"> · {{ item.bloco_sala }}</span></td>
              <td class="nowrap">
                <strong>{{ brl(item.valor_atual) }}</strong>
                <div class="muted">compra {{ brl(item.valor_compra) }}</div>
              </td>
              <td><span class="badge" [ngClass]="classeStatus(item.nome_status)">{{ item.nome_status }}</span></td>
              <td>
                <div class="acoes">
                  <button class="btn btn-ghost btn-sm" (click)="verDetalhes(item)"><ion-icon name="eye-outline"></ion-icon> Ver</button>
                  <button class="btn btn-danger btn-sm" *ngIf="auth.isAdmin" (click)="excluir(item)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visiveis().length">
              <td colspan="7" class="empty">Nenhum bem encontrado com os filtros atuais.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: novo patrimônio -->
    <div class="ipe-modal" *ngIf="modalNovo()" (click)="fecharNovo()">
      <div class="ipe-modal__box wide" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Novo Patrimônio</h3><p>Cadastre um bem no inventário</p></div>
          <button class="icon-btn" (click)="fecharNovo()"><ion-icon name="close-outline"></ion-icon></button>
        </div>

        <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>

        <div class="form-grid">
          <div class="form-group"><label>Nome do item *</label><input class="input" [(ngModel)]="form.nome" placeholder="Ex: Notebook Dell"></div>
          <div class="form-group"><label>Nº Patrimônio *</label><input class="input" [(ngModel)]="form.numero_patrimonio" placeholder="IPE-0011"></div>
          <div class="form-group"><label>Valor de compra (R$) *</label><input class="input" type="number" step="0.01" [(ngModel)]="form.valor_atual"></div>
          <div class="form-group"><label>Data de aquisição *</label><input class="input" type="date" [(ngModel)]="form.data_aquisicao"></div>
          <div class="form-group"><label>Taxa de depreciação (%/ano)</label><input class="input" type="number" step="0.1" [(ngModel)]="form.taxa_depreciacao"></div>
          <div class="form-group">
            <label>Categoria</label>
            <select class="select" [(ngModel)]="form.id_categoria">
              <option [ngValue]="null">Selecione...</option>
              <option *ngFor="let c of filtros.categorias" [ngValue]="c.id_categoria">{{ c.nome }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sala</label>
            <select class="select" [(ngModel)]="form.id_sala">
              <option [ngValue]="null">Não alocado</option>
              <option *ngFor="let s of filtros.salas" [ngValue]="s.id_sala">{{ s.nome }}{{ s.bloco ? ' · ' + s.bloco : '' }}</option>
            </select>
          </div>
          <div class="form-group"><label>Nota fiscal</label><input class="input" [(ngModel)]="form.nota_fiscal" placeholder="NF-1234"></div>
          <div class="form-group full"><label>Descrição</label><textarea class="textarea" [(ngModel)]="form.descricao" placeholder="Observações sobre o bem"></textarea></div>
        </div>

        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="fecharNovo()">Cancelar</button>
          <button class="btn btn-primary" (click)="salvar()"><ion-icon name="save-outline"></ion-icon> Cadastrar</button>
        </div>
      </div>
    </div>

    <!-- Modal: nova sala -->
    <div class="ipe-modal" *ngIf="modalSala()" (click)="modalSala.set(false)">
      <div class="ipe-modal__box" style="max-width:480px" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Nova Sala</h3><p>Cadastre um local de alocação</p></div>
          <button class="icon-btn" (click)="modalSala.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="col">
          <div class="form-group"><label>Nome da sala *</label><input class="input" [(ngModel)]="novaSala.nome" placeholder="Ex: Laboratório 03"></div>
          <div class="form-group"><label>Bloco</label><input class="input" [(ngModel)]="novaSala.bloco" placeholder="Ex: Bloco A"></div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modalSala.set(false)">Cancelar</button>
          <button class="btn btn-primary" (click)="salvarSala()">Cadastrar</button>
        </div>
      </div>
    </div>

    <!-- Modal: detalhes -->
    <div class="ipe-modal" *ngIf="detalhe()" (click)="detalhe.set(null)">
      <div class="ipe-modal__box wide" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div>
            <h3>{{ detalhe()!.nome }}</h3>
            <p class="mono">{{ detalhe()!.numero_patrimonio }} · {{ detalhe()!.nome_categoria }}</p>
          </div>
          <button class="icon-btn" (click)="detalhe.set(null)"><ion-icon name="close-outline"></ion-icon></button>
        </div>

        <div class="cards-grid" style="margin-bottom:18px">
          <div class="stat-card blue"><h3>Valor atual</h3><p style="font-size:1.3rem">{{ brl(detalhe()!.valor_atual) }}</p><small>compra {{ brl(detalhe()!.valor_compra) }}</small></div>
          <div class="stat-card"><h3>Local</h3><p style="font-size:1.1rem">{{ detalhe()!.nome_sala }}</p><small>{{ detalhe()!.bloco_sala || '—' }}</small></div>
          <div class="stat-card amber"><h3>Status</h3><p style="font-size:1.1rem">{{ detalhe()!.nome_status }}</p></div>
        </div>

        <div class="form-grid" style="font-size:.86rem">
          <div><span class="muted">Aquisição</span><div>{{ dataBR(detalhe()!.data_aquisicao) }}</div></div>
          <div><span class="muted">Taxa de depreciação</span><div>{{ detalhe()!.taxa_depreciacao }}% ao ano</div></div>
          <div><span class="muted">Nota fiscal</span><div>{{ detalhe()!.nota_fiscal || '—' }}</div></div>
          <div><span class="muted">Origem</span><div>{{ detalhe()!.origem || '—' }}</div></div>
        </div>

        <p class="muted" style="white-space:pre-line;margin-top:14px" *ngIf="detalhe()!.descricao">{{ detalhe()!.descricao }}</p>

        <h4 style="margin:18px 0 8px">Chamados deste bem</h4>
        <div class="table-wrap" style="box-shadow:none;border:1px solid var(--border)">
          <table class="ipe">
            <thead><tr><th>#</th><th>Abertura</th><th>Problema</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of detalhe()!.chamados">
                <td class="mono">{{ c.id_chamado }}</td>
                <td class="nowrap">{{ c.data_abertura_fmt }}</td>
                <td>{{ c.descricao_problema }}</td>
                <td><span class="badge" [ngClass]="statusChamadoClasse(c.nome_status)">{{ c.nome_status }}</span></td>
              </tr>
              <tr *ngIf="!detalhe()!.chamados.length"><td colspan="4" class="empty">Nenhum chamado registrado.</td></tr>
            </tbody>
          </table>
        </div>

        <h4 style="margin:18px 0 8px">Movimentações</h4>
        <div class="timeline">
          <div class="timeline-item" *ngFor="let m of detalhe()!.movimentacoes">
            <small>{{ dataBR(m.data_movimentacao, true) }}</small>
            Transferido de <strong>{{ nomeSala(m.id_sala_origem) }}</strong> para <strong>{{ nomeSala(m.id_sala_destino) }}</strong>
          </div>
          <div class="empty" *ngIf="!detalhe()!.movimentacoes.length">Sem movimentações.</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; align-items: end; }
  `]
})
export class InventarioPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);

  brl = brl;
  dataBR = dataBR;

  itens: ItemInventario[] = this.api.listarInventario();
  filtros = this.api.filtrosInventario();

  busca = '';
  filtroCategoria: number | '' = '';
  filtroSala: number | '' = '';
  filtroStatus: number | '' = '';
  ordem = { campo: 'numero', asc: false };

  modalNovo = signal(false);
  modalSala = signal(false);
  detalhe = signal<any>(null);
  erro = signal('');

  form: any = this.formVazio();
  novaSala = { nome: '', bloco: '' };

  valorTotal = this.itens.filter(i => i.id_status !== 3).reduce((s, i) => s + i.valor_atual, 0);
  emManutencao = this.itens.filter(i => i.nome_status === 'Em Manutenção').length;
  baixados = this.itens.filter(i => i.nome_status === 'Baixado').length;

  visiveis = computed(() => {
    const b = this.busca.toLowerCase().trim();
    let lista = this.itens.filter(i => {
      if (b && ![i.nome, i.numero_patrimonio, i.nome_sala, i.nota_fiscal, i.nome_categoria]
        .some(v => (v || '').toString().toLowerCase().includes(b))) return false;
      if (this.filtroCategoria && i.id_categoria !== Number(this.filtroCategoria)) return false;
      if (this.filtroSala && i.id_sala !== Number(this.filtroSala)) return false;
      if (this.filtroStatus && i.id_status !== Number(this.filtroStatus)) return false;
      return true;
    });
    const campo = this.ordem.campo;
    lista = lista.sort((a: any, bb: any) => {
      let va: any, vb: any;
      if (campo === 'valor') { va = a.valor_atual; vb = bb.valor_atual; }
      else if (campo === 'categoria') { va = a.nome_categoria; vb = bb.nome_categoria; }
      else if (campo === 'nome') { va = a.nome; vb = bb.nome; }
      else { va = a.numero_patrimonio; vb = bb.numero_patrimonio; }
      const r = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR');
      return this.ordem.asc ? r : -r;
    });
    return lista;
  });

  private formVazio() {
    return {
      nome: '', numero_patrimonio: '', valor_atual: 0,
      data_aquisicao: new Date().toISOString().slice(0, 10),
      taxa_depreciacao: 10, id_sala: null, id_categoria: null,
      nota_fiscal: '', descricao: ''
    };
  }

  ordenar(campo: string): void {
    if (this.ordem.campo === campo) this.ordem.asc = !this.ordem.asc;
    else this.ordem = { campo, asc: true };
  }

  aplicar(): void { /* o computed já reage aos filtros */ }

  limpar(): void {
    this.busca = '';
    this.filtroCategoria = '';
    this.filtroSala = '';
    this.filtroStatus = '';
  }

  classeStatus(nome: string): string {
    if (nome === 'Ativo') return 'ativo';
    if (nome === 'Em Manutenção') return 'manutencao';
    if (nome === 'Baixado') return 'baixado';
    return 'emprestado';
  }

  statusChamadoClasse(nome: string): string {
    if (nome === 'Aberto') return 'Aberto';
    if (nome === 'Em Atendimento') return 'Em';
    if (nome === 'Concluído') return 'Concluído';
    return 'Cancelado';
  }

  nomeSala(id: number | null): string {
    return this.api.db.sala(id)?.numero_sala ?? '—';
  }

  abrirNovo(): void {
    this.form = this.formVazio();
    this.erro.set('');
    this.modalNovo.set(true);
  }
  fecharNovo(): void { this.modalNovo.set(false); }

  salvar(): void {
    this.erro.set('');
    if (!this.form.nome || !this.form.numero_patrimonio || !this.form.data_aquisicao) {
      this.erro.set('Preencha nome, número de patrimônio e data de aquisição.');
      return;
    }
    const r = this.api.cadastrarPatrimonio({
      nome: this.form.nome.trim(),
      numero_patrimonio: this.form.numero_patrimonio.trim(),
      valor_atual: Number(this.form.valor_atual || 0),
      data_aquisicao: this.form.data_aquisicao,
      taxa_depreciacao: Number(this.form.taxa_depreciacao || 0),
      id_sala: this.form.id_sala,
      id_categoria: this.form.id_categoria,
      nota_fiscal: this.form.nota_fiscal,
      descricao: this.form.descricao
    });
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.recarregar();
    this.modalNovo.set(false);
  }

  abrirNovaSala(): void {
    this.novaSala = { nome: '', bloco: '' };
    this.modalSala.set(true);
  }

  salvarSala(): void {
    if (!this.novaSala.nome.trim()) return;
    this.api.db.criarSala(this.novaSala.nome.trim(), this.novaSala.bloco.trim());
    this.filtros = this.api.filtrosInventario();
    this.modalSala.set(false);
  }

  verDetalhes(item: ItemInventario): void {
    this.detalhe.set(this.api.patrimonioDetalhes(item.id_patrimonio));
  }

  excluir(item: ItemInventario): void {
    if (!confirm(`Excluir o patrimônio ${item.numero_patrimonio} — ${item.nome}?`)) return;
    const r = this.api.excluirPatrimonio(item.id_patrimonio);
    if (!r.ok) { alert(r.erro); return; }
    this.recarregar();
  }

  exportarCsv(): void {
    const cols = ['numero_patrimonio', 'nome', 'nome_categoria', 'nome_sala', 'bloco_sala',
      'valor_compra', 'valor_atual', 'data_aquisicao', 'taxa_depreciacao', 'nome_status', 'nota_fiscal'];
    const linhas = [cols.join(';')];
    this.visiveis().forEach(i => linhas.push(cols.map(c => (i as any)[c] ?? '').join(';')));
    const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventario_ipe_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  private recarregar(): void {
    this.itens = this.api.listarInventario();
    this.valorTotal = this.itens.filter(i => i.id_status !== 3).reduce((s, i) => s + i.valor_atual, 0);
    this.emManutencao = this.itens.filter(i => i.nome_status === 'Em Manutenção').length;
    this.baixados = this.itens.filter(i => i.nome_status === 'Baixado').length;
  }
}
