import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { brl } from '../../core/util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon, TopbarComponent],
  template: `
    <app-topbar [titulo]="'Bem-vindo(a), ' + auth.nome" subtitulo="Painel geral do sistema de inventário e patrimônio">
      <a class="btn btn-ghost" routerLink="/notificacoes"><ion-icon name="notifications-outline"></ion-icon><span>Notificações</span></a>
      <a class="btn btn-primary" routerLink="/novo-chamado"><ion-icon name="add-outline"></ion-icon><span>Abrir Chamado</span></a>
    </app-topbar>

    <div class="ipe-page">
      <div class="aviso" *ngIf="!auth.isAdmin">
        <ion-icon name="eye-outline"></ion-icon>
        <span>Você está logado como <strong>usuário padrão</strong>. Alguns módulos (Bens Alugados, Financeiro,
          Painel ADM, Backup, Relatórios) exigem perfil de Patrimônio.</span>
      </div>

      <section class="hero card">
        <div class="hero__text">
          <h2>Sistema de inventário e patrimônio escolar</h2>
          <p>Organização eficiente dos equipamentos e recursos da escola: bens, salas, chamados,
             manutenções, movimentações e finanças em um só lugar.</p>
          <div class="row" style="margin-top:14px">
            <a class="btn btn-orange" routerLink="/inventario"><ion-icon name="cube-outline"></ion-icon> Ver Inventário</a>
            <a class="btn btn-ghost" routerLink="/chamados"><ion-icon name="alert-circle-outline"></ion-icon> Chamados</a>
          </div>
        </div>
        <div class="hero__stats">
          <div class="mini"><span>Valor do acervo</span><strong>{{ brl(valorAcervo) }}</strong></div>
          <div class="mini"><span>Em manutenção</span><strong>{{ emManutencao }}</strong></div>
          <div class="mini"><span>Bens baixados</span><strong>{{ baixados }}</strong></div>
        </div>
      </section>

      <section class="cards-grid">
        <div class="stat-card blue">
          <h3>Itens Cadastrados</h3>
          <p>{{ stats.itens }}</p>
          <small>patrimônios no inventário</small>
        </div>
        <div class="stat-card green">
          <h3>Salas Cadastradas</h3>
          <p>{{ stats.salas }}</p>
          <small>locais de alocação</small>
        </div>
        <div class="stat-card amber">
          <h3>Chamados Abertos</h3>
          <p>{{ stats.chamados_abertos }}</p>
          <small>aguardando atendimento</small>
        </div>
        <div class="stat-card">
          <h3>Meus Chamados</h3>
          <p>{{ meus.total }}</p>
          <small>{{ meus.abertos }} abertos · {{ meus.andamento }} em atendimento · {{ meus.concluidos }} concluídos</small>
        </div>
      </section>

      <section>
        <div class="section-title" style="margin-bottom:12px">
          <div>
            <h2>Itens Recentes</h2>
            <p>Últimos bens cadastrados no inventário</p>
          </div>
          <a class="btn btn-ghost btn-sm" routerLink="/inventario">Ver todos</a>
        </div>
        <div class="table-wrap">
          <table class="ipe">
            <thead>
              <tr><th>Nº Patrimônio</th><th>Item</th><th>Local</th><th>Valor atual</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of stats.recentes">
                <td class="mono">{{ item.numero_patrimonio }}</td>
                <td>{{ item.nome }}</td>
                <td>{{ item.nome_sala }}<span class="muted" *ngIf="item.bloco_sala"> ({{ item.bloco_sala }})</span></td>
                <td>{{ brl(item.valor_atual) }}</td>
                <td><span class="badge" [ngClass]="classeStatus(item.nome_status)">{{ item.nome_status }}</span></td>
              </tr>
              <tr *ngIf="!stats.recentes.length">
                <td colspan="5" class="empty">Nenhum item cadastrado ainda. <a routerLink="/inventario">Cadastre o primeiro item</a>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="cards-grid">
        <a class="atalho" routerLink="/chamados"><ion-icon name="alert-circle-outline"></ion-icon><div><strong>Chamados</strong><span>Abrir e acompanhar</span></div></a>
        <a class="atalho" routerLink="/movimentacoes"><ion-icon name="swap-horizontal-outline"></ion-icon><div><strong>Movimentações</strong><span>Transferir bens</span></div></a>
        <a class="atalho" routerLink="/reparos"><ion-icon name="build-outline"></ion-icon><div><strong>Reparos</strong><span>Reincidência e custos</span></div></a>
        <a class="atalho" routerLink="/perfil"><ion-icon name="person-outline"></ion-icon><div><strong>Meu Perfil</strong><span>Dados da conta</span></div></a>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; align-items: center;
      background: linear-gradient(120deg, #fff 0%, #fffdf3 100%);
      border-left: 6px solid var(--primary);
    }
    .hero h2 { margin: 0 0 8px; font-size: 1.35rem; font-weight: 600; }
    .hero p { margin: 0; color: var(--text-light); line-height: 1.6; font-size: .9rem; }
    .hero__stats { display: grid; gap: 10px; }
    .mini { background: #f8f9fa; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .mini span { font-size: .78rem; color: var(--text-light); }
    .mini strong { font-size: 1.05rem; }
    .atalho {
      display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 16px;
      background: #fff; box-shadow: var(--shadow); text-decoration: none; color: var(--text);
      transition: transform .2s;
    }
    .atalho:hover { transform: translateY(-3px); }
    .atalho ion-icon { font-size: 1.5rem; color: var(--primary-dark); }
    .atalho strong { display: block; font-size: .9rem; }
    .atalho span { font-size: .78rem; color: var(--text-light); }
    @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
  `]
})
export class HomePage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);

  brl = brl;
  stats = this.api.estatisticasHome();
  meus = this.api.dadosUsuario()?.estatisticas ?? { total: 0, abertos: 0, andamento: 0, concluidos: 0 };
  valorAcervo = this.api.estatisticasAdmin().valor_total_patrimonio;
  emManutencao = this.api.db.db.Patrimonio.filter(p => p.id_status === 2).length;
  baixados = this.api.db.db.Patrimonio.filter(p => p.id_status === 3).length;

  classeStatus(nome: string): string {
    if (nome === 'Ativo') return 'ativo';
    if (nome === 'Em Manutenção') return 'manutencao';
    if (nome === 'Baixado') return 'baixado';
    return 'emprestado';
  }
}
