import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-chamados',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Chamados" subtitulo="Solicitações de manutenção e suporte técnico">
      <button class="btn btn-ghost" (click)="carregar()"><ion-icon name="refresh-outline"></ion-icon><span>Atualizar</span></button>
      <a class="btn btn-primary" routerLink="/novo-chamado"><ion-icon name="add-outline"></ion-icon><span>Abrir Chamado</span></a>
    </app-topbar>

    <div class="ipe-page">
      <div class="aviso" *ngIf="!auth.isAdmin">
        <ion-icon name="eye-outline"></ion-icon>
        <span>Você está no modo <strong>consulta</strong>. Apenas a equipe de Patrimônio pode gerenciar os status dos chamados.</span>
      </div>

      <section class="cards-grid">
        <div class="stat-card blue"><h3>Abertos</h3><p>{{ contar(1) }}</p></div>
        <div class="stat-card amber"><h3>Em Atendimento</h3><p>{{ contar(2) }}</p></div>
        <div class="stat-card green"><h3>Concluídos</h3><p>{{ contar(3) }}</p></div>
        <div class="stat-card gray"><h3>Cancelados</h3><p>{{ contar(4) }}</p></div>
      </section>

      <div class="card" style="padding:16px">
        <div class="filtros">
          <div class="form-group" style="grid-column: span 2">
            <label>Buscar</label>
            <input class="input" [(ngModel)]="busca" (ngModelChange)="aplicar()" placeholder="Nº chamado, bem, problema, solicitante...">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="select" [(ngModel)]="filtroStatus" (ngModelChange)="aplicar()">
              <option value="">Todos</option>
              <option *ngFor="let s of statusLista" [value]="s.id">{{ s.nome }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridade</label>
            <select class="select" [(ngModel)]="filtroPrioridade" (ngModelChange)="aplicar()">
              <option value="">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Média</option>
              <option value="Baixa">Baixa</option>
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
            <tr><th>#</th><th>Abertura</th><th>Bem</th><th>Solicitante</th><th>Problema</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of visiveis()">
              <td class="mono">#{{ c.id_chamado }}</td>
              <td class="nowrap">{{ c.data_abertura_fmt }}<div class="muted">{{ c.dias_aberto }} dia(s)</div></td>
              <td>
                <strong>{{ c.nome_patrimonio }}</strong>
                <div class="muted mono" *ngIf="c.numero_patrimonio">{{ c.numero_patrimonio }}</div>
              </td>
              <td>{{ c.nome_usuario }}</td>
              <td style="max-width:280px">{{ c.descricao_problema }}</td>
              <td><span class="badge" [ngClass]="c.prioridade === 'Alta' ? 'Crítico' : c.prioridade === 'Media' ? 'Médio' : 'Baixo'">{{ prioridadeLabel(c.prioridade) }}</span></td>
              <td><span class="badge" [ngClass]="statusClasse(c.nome_status)">{{ c.nome_status }}</span></td>
              <td>
                <div class="acoes">
                  <button class="btn btn-ghost btn-sm" (click)="abrir(c)"><ion-icon name="eye-outline"></ion-icon> Abrir</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visiveis().length"><td colspan="8" class="empty">Nenhum chamado encontrado.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de detalhes/ações -->
    <div class="ipe-modal" *ngIf="atual()" (click)="fechar()">
      <div class="ipe-modal__box wide" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div>
            <h3>Chamado #{{ atual()!.id_chamado }}</h3>
            <p>{{ atual()!.tipo_chamado }} · aberto em {{ atual()!.data_abertura_fmt }} por {{ atual()!.nome_usuario }}</p>
          </div>
          <button class="icon-btn" (click)="fechar()"><ion-icon name="close-outline"></ion-icon></button>
        </div>

        <div class="stepper" style="margin-bottom:16px">
          <div class="step" *ngFor="let e of etapas" [class.done]="atual()!.id_status === e.status"
               [class.current]="atual()!.id_status === e.status">
            {{ e.icone }} {{ e.label }}
          </div>
          <div class="step" *ngIf="atual()!.id_status === 4">🚫 Cancelado</div>
        </div>

        <div class="form-grid" style="font-size:.86rem;margin-bottom:14px">
          <div><span class="muted">Bem</span><div>{{ atual()!.nome_patrimonio }} <span class="mono" *ngIf="atual()!.numero_patrimonio">({{ atual()!.numero_patrimonio }})</span></div></div>
          <div><span class="muted">Previsão de conclusão</span><div>{{ atual()!.data_previsao_fmt || '—' }}</div></div>
          <div><span class="muted">Prioridade</span><div>{{ prioridadeLabel(atual()!.prioridade) }}</div></div>
          <div><span class="muted">Dias em aberto</span><div>{{ atual()!.dias_aberto }}</div></div>
        </div>

        <div class="card" style="box-shadow:none;border:1px solid var(--border);padding:16px">
          <span class="muted">Descrição do problema</span>
          <p style="margin:6px 0 0;line-height:1.6">{{ atual()!.descricao_problema }}</p>
        </div>

        <div class="aviso" style="margin-top:14px" *ngIf="atual()!.manutencao">
          <ion-icon name="build-outline"></ion-icon>
          <span>
            Reparo iniciado em <strong>{{ dataBR(atual()!.manutencao.data_inicio) }}</strong>
            <span *ngIf="atual()!.manutencao.data_fim"> · finalizado em <strong>{{ dataBR(atual()!.manutencao.data_fim) }}</strong></span>
            <span *ngIf="atual()!.manutencao.observacao"><br>{{ atual()!.manutencao.observacao }}</span>
          </span>
        </div>

        <!-- Ações do administrador -->
        <div *ngIf="auth.isAdmin" style="margin-top:18px">
          <h4 style="margin:0 0 10px">Ações</h4>
          <div class="row" style="margin-bottom:12px">
            <select class="select" style="max-width:220px" [(ngModel)]="novoStatus">
              <option *ngFor="let s of statusLista" [ngValue]="s.id">{{ s.nome }}</option>
            </select>
            <button class="btn btn-orange btn-sm" (click)="salvarStatus()">Atualizar Status</button>

            <select class="select" style="max-width:200px" [(ngModel)]="novaPrioridade">
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
            </select>
            <button class="btn btn-ghost btn-sm" (click)="salvarPrioridade()">Salvar Prioridade</button>
          </div>
          <div class="row">
            <button class="btn btn-dark btn-sm" (click)="iniciarReparo()"><ion-icon name="build-outline"></ion-icon> Iniciar Reparo</button>
            <button class="btn btn-success btn-sm" (click)="abrirFinalizar()"><ion-icon name="checkmark-outline"></ion-icon> Finalizar Reparo</button>
            <button class="btn btn-ghost btn-sm" (click)="reabrir()"><ion-icon name="refresh-outline"></ion-icon> Reabrir</button>
            <button class="btn btn-ghost btn-sm" (click)="cancelar()"><ion-icon name="close-circle-outline"></ion-icon> Cancelar</button>
            <button class="btn btn-danger btn-sm" (click)="excluir()"><ion-icon name="trash-outline"></ion-icon> Excluir</button>
          </div>
        </div>

        <h4 style="margin:18px 0 8px">Anexos</h4>
        <div class="col" *ngIf="atual()!.anexos.length; else semAnexo">
          <div class="row" *ngFor="let a of atual()!.anexos" style="justify-content:space-between;background:#fafafa;padding:8px 12px;border-radius:10px">
            <span class="row" style="gap:8px"><ion-icon name="image-outline"></ion-icon> {{ a.caminho }}</span>
            <span class="muted">{{ dataBR(a.data_upload, true) }}</span>
          </div>
        </div>
        <ng-template #semAnexo><p class="muted">Nenhum anexo enviado.</p></ng-template>

        <div class="row" *ngIf="auth.isAdmin" style="margin-top:8px">
          <input class="input" style="max-width:260px" [(ngModel)]="nomeAnexo" placeholder="Nome do arquivo (ex: foto-01.jpg)">
          <button class="btn btn-ghost btn-sm" (click)="anexar()"><ion-icon name="camera-outline"></ion-icon> Anexar</button>
        </div>

        <h4 style="margin:18px 0 8px">Histórico</h4>
        <div class="timeline">
          <div class="timeline-item" *ngFor="let h of atual()!.historico">
            <small>{{ dataBR(h.data_evento, true) }}</small>
            {{ h.descricao }}
          </div>
          <div class="empty" *ngIf="!atual()!.historico.length">Sem eventos.</div>
        </div>
      </div>
    </div>

    <!-- Modal finalizar -->
    <div class="ipe-modal" *ngIf="modalFinalizar()" (click)="modalFinalizar.set(false)">
      <div class="ipe-modal__box" style="max-width:520px" (click)="$event.stopPropagation()">
        <div class="ipe-modal__head">
          <div><h3>Finalizar Reparo</h3><p>O chamado será marcado como concluído</p></div>
          <button class="icon-btn" (click)="modalFinalizar.set(false)"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div class="col">
          <div class="form-group"><label>Observação</label><textarea class="textarea" [(ngModel)]="observacaoFinal" placeholder="O que foi feito no reparo"></textarea></div>
          <div class="form-group"><label>Custo do reparo (R$)</label><input class="input" type="number" step="0.01" [(ngModel)]="custoFinal"></div>
        </div>
        <div class="ipe-modal__actions">
          <button class="btn btn-ghost" (click)="modalFinalizar.set(false)">Cancelar</button>
          <button class="btn btn-success" (click)="confirmarFinalizar()">✅ Confirmar Conclusão</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; align-items: end; }
  `]
})
export class ChamadosPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);

  dataBR = dataBR;
  routerLink = '/novo-chamado';

  chamados = this.api.listarChamados();
  busca = '';
  filtroStatus = '';
  filtroPrioridade = '';

  atual = signal<any>(null);
  modalFinalizar = signal(false);

  novoStatus = 1;
  novaPrioridade = 'Media';
  nomeAnexo = '';
  observacaoFinal = '';
  custoFinal = 0;

  etapas = [
    { status: 1, label: 'Aberto', icone: '📩' },
    { status: 2, label: 'Em Atendimento', icone: '🔧' },
    { status: 3, label: 'Concluído', icone: '✅' }
  ];

  statusLista = [
    { id: 1, nome: 'Aberto' },
    { id: 2, nome: 'Em Atendimento' },
    { id: 3, nome: 'Concluído' },
    { id: 4, nome: 'Cancelado' }
  ];

  visiveis = computed(() => {
    const b = this.busca.toLowerCase().trim();
    return this.chamados.filter(c => {
      if (b && ![String(c.id_chamado), c.nome_patrimonio, c.descricao_problema, c.nome_usuario, c.numero_patrimonio]
        .some(v => (v || '').toString().toLowerCase().includes(b))) return false;
      if (this.filtroStatus && c.id_status !== Number(this.filtroStatus)) return false;
      if (this.filtroPrioridade && c.prioridade !== this.filtroPrioridade) return false;
      return true;
    });
  });

  contar(status: number): number {
    return this.chamados.filter(c => c.id_status === status).length;
  }

  prioridadeLabel(p: string): string {
    return p === 'Media' ? 'Média' : p;
  }

  statusClasse(nome: string): string {
    if (nome === 'Aberto') return 'Aberto';
    if (nome === 'Em Atendimento') return 'Em';
    if (nome === 'Concluído') return 'Concluído';
    return 'Cancelado';
  }

  aplicar(): void { /* computed */ }

  limpar(): void {
    this.busca = '';
    this.filtroStatus = '';
    this.filtroPrioridade = '';
  }

  carregar(): void {
    this.chamados = this.api.listarChamados();
    const id = this.atual()?.id_chamado;
    if (id) this.atual.set(this.api.chamadoDetalhes(id));
  }

  abrir(c: any): void {
    const det = this.api.chamadoDetalhes(c.id_chamado);
    if (!det) return;
    this.atual.set(det);
    this.novoStatus = det.id_status;
    this.novaPrioridade = det.prioridade;
    this.nomeAnexo = '';
  }

  fechar(): void { this.atual.set(null); }

  salvarStatus(): void {
    const r = this.api.atualizarStatusChamado(this.atual()!.id_chamado, Number(this.novoStatus));
    if (!r.ok) { alert(r.erro); return; }
    this.carregar();
  }

  salvarPrioridade(): void {
    this.api.alterarPrioridade(this.atual()!.id_chamado, this.novaPrioridade);
    this.carregar();
  }

  iniciarReparo(): void {
    const r = this.api.iniciarReparo(this.atual()!.id_chamado);
    if (!r.ok) { alert(r.erro); return; }
    this.carregar();
  }

  abrirFinalizar(): void {
    this.observacaoFinal = '';
    this.custoFinal = 0;
    this.modalFinalizar.set(true);
  }

  confirmarFinalizar(): void {
    const r = this.api.finalizarReparo(this.atual()!.id_chamado, this.observacaoFinal, Number(this.custoFinal));
    if (!r.ok) { alert(r.erro); return; }
    this.modalFinalizar.set(false);
    this.carregar();
  }

  cancelar(): void {
    const motivo = prompt('Motivo do cancelamento (opcional):') ?? '';
    this.api.cancelarChamado(this.atual()!.id_chamado, motivo);
    this.carregar();
  }

  reabrir(): void {
    this.api.reabrirChamado(this.atual()!.id_chamado);
    this.carregar();
  }

  excluir(): void {
    if (!confirm('Excluir definitivamente este chamado?')) return;
    const r = this.api.excluirChamado(this.atual()!.id_chamado);
    if (!r.ok) { alert(r.erro); return; }
    this.fechar();
    this.carregar();
  }

  anexar(): void {
    if (!this.nomeAnexo.trim()) return;
    this.api.anexarFoto(this.atual()!.id_chamado, this.nomeAnexo.trim());
    this.nomeAnexo = '';
    this.carregar();
  }
}
