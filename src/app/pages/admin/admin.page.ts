import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Painel ADM" subtitulo="Usuários, logs e configurações do sistema"></app-topbar>

    <div class="ipe-page">
      <section class="cards-grid">
        <div class="stat-card blue"><h3>Usuários</h3><p>{{ stats.total_usuarios }}</p></div>
        <div class="stat-card green"><h3>Bens cadastrados</h3><p>{{ stats.total_patrimonios }}</p></div>
        <div class="stat-card amber"><h3>Chamados ativos</h3><p>{{ stats.chamados_ativos }}</p></div>
        <div class="stat-card gray"><h3>Logs registrados</h3><p>{{ stats.total_logs }}</p></div>
      </section>

      <div class="chip-toggle" style="align-self:flex-start">
        <button [class.active]="aba() === 'usuarios'" (click)="aba.set('usuarios')">👥 Usuários</button>
        <button [class.active]="aba() === 'logs'" (click)="aba.set('logs')">📋 Logs</button>
        <button [class.active]="aba() === 'config'" (click)="aba.set('config')">⚙️ Configurações</button>
      </div>

      <!-- USUÁRIOS -->
      <div class="table-wrap" *ngIf="aba() === 'usuarios'">
        <table class="ipe">
          <thead><tr><th>#</th><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Chamados</th><th>Ações</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of usuarios()">
              <td class="mono">{{ u.id_usuario }}</td>
              <td><strong>{{ u.nome }}</strong></td>
              <td>{{ u.e_mail }}</td>
              <td><span class="badge" [ngClass]="u.id_perfil === 1 ? 'Concluído' : 'outline'">{{ u.nome_perfil }}</span></td>
              <td class="nowrap">{{ u.total_chamados }} chamado(s)</td>
              <td>
                <div class="acoes">
                  <button class="btn btn-ghost btn-sm" (click)="alternarPerfil(u)">
                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                    {{ u.id_perfil === 1 ? 'Tornar Usuário' : 'Tornar Patrimônio' }}
                  </button>
                  <button class="btn btn-danger btn-sm" [disabled]="u.id_usuario === auth.sessao()?.id_usuario" (click)="excluir(u)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- LOGS -->
      <div *ngIf="aba() === 'logs'">
        <div class="card" style="padding:16px">
          <div class="row">
            <input class="input" style="max-width:320px" [(ngModel)]="buscaLog" (ngModelChange)="filtrarLogs()" placeholder="Buscar na ação ou usuário">
            <select class="select" style="max-width:200px" [(ngModel)]="filtroAcao" (ngModelChange)="filtrarLogs()">
              <option value="">Todas as ações</option>
              <option *ngFor="let a of acoes" [value]="a">{{ a }}</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table class="ipe">
            <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of logsVisiveis()">
                <td class="nowrap">{{ dataBR(l.data_hora, true) }}</td>
                <td>{{ l.nome_usuario || '—' }}</td>
                <td><span class="badge outline">{{ l.acao }}</span></td>
                <td style="max-width:360px" class="muted">{{ l.detalhes }}</td>
                <td class="mono muted">{{ l.ip }}</td>
              </tr>
              <tr *ngIf="!logsVisiveis().length"><td colspan="5" class="empty">Nenhum log encontrado.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CONFIG -->
      <div *ngIf="aba() === 'config'" class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Identidade do sistema</h3>
          <div class="col">
            <div class="form-group"><label>Nome da instituição</label><input class="input" [(ngModel)]="config.nome_instituicao"></div>
            <div class="form-group"><label>Chave de acesso administrativo</label><input class="input" [(ngModel)]="config.chave_admin"></div>
            <div class="form-group"><label>E-mail de notificações</label><input class="input" [(ngModel)]="config.email_notificacoes"></div>
            <div class="form-group"><label>Dias de alerta de contrato</label><input class="input" type="number" [(ngModel)]="config.dias_alerta_contrato"></div>
            <button class="btn btn-primary" (click)="salvarConfig()"><ion-icon name="save-outline"></ion-icon> Salvar Configurações</button>
          </div>
        </div>
        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Manutenção</h3>
          <div class="col">
            <div class="aviso warn">
              <ion-icon name="warning-outline"></ion-icon>
              <span>As ações abaixo afetam todos os dados salvos neste navegador.</span>
            </div>
            <button class="btn btn-ghost" (click)="exportarJson()"><ion-icon name="download-outline"></ion-icon> Exportar backup (JSON)</button>
            <button class="btn btn-danger" (click)="resetar()"><ion-icon name="refresh-outline"></ion-icon> Restaurar dados de demonstração</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class AdminPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);

  dataBR = dataBR;
  aba = signal<'usuarios' | 'logs' | 'config'>('usuarios');

  stats = this.api.estatisticasAdmin();
  usuarios = signal(this.api.listarUsuarios());
  logs = this.api.listarLogs(300);
  logsVisiveis = signal(this.logs);
  acoes = [...new Set(this.logs.map(l => l.acao))];
  buscaLog = '';
  filtroAcao = '';

  config = {
    nome_instituicao: 'Instituto Pedro II',
    chave_admin: 'IPE2026ADMIN',
    email_notificacoes: 'patrimonio@ipe.edu.br',
    dias_alerta_contrato: 30
  };

  filtrarLogs(): void {
    const b = this.buscaLog.toLowerCase().trim();
    this.logsVisiveis.set(this.logs.filter(l => {
      if (this.filtroAcao && l.acao !== this.filtroAcao) return false;
      if (b && ![l.acao, l.nome_usuario, l.detalhes].some(v => (v || '').toLowerCase().includes(b))) return false;
      return true;
    }));
  }

  alternarPerfil(u: any): void {
    const novo = u.id_perfil === 1 ? 2 : 1;
    const r = this.auth.alterarPerfilUsuario(u.id_usuario, novo);
    if (!r.ok) { alert(r.erro); return; }
    this.usuarios.set(this.api.listarUsuarios());
  }

  excluir(u: any): void {
    if (!confirm(`Excluir o usuário ${u.nome}?`)) return;
    const r = this.auth.excluirUsuario(u.id_usuario);
    if (!r.ok) { alert(r.erro); return; }
    this.usuarios.set(this.api.listarUsuarios());
    this.stats = this.api.estatisticasAdmin();
  }

  salvarConfig(): void {
    this.api.db.config = { ...this.config };
    this.api.registrarLog('Configuração atualizada', 'Identidade do sistema alterada');
    alert('Configurações salvas.');
  }

  exportarJson(): void {
    const json = this.api.exportarJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ipe_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  resetar(): void {
    if (!confirm('Restaurar os dados de demonstração? Todas as alterações locais serão perdidas.')) return;
    this.api.db.resetar();
    location.reload();
  }
}
