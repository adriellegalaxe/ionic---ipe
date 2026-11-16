import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-notificacoes-envio',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Enviar Notificações" subtitulo="Comunicados e alertas para os usuários"></app-topbar>

    <div class="ipe-page">
      <div class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 14px;font-size:.95rem">Novo comunicado</h3>
          <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
          <div class="aviso success" *ngIf="ok()" style="margin-bottom:12px">{{ ok() }}</div>
          <div class="col">
            <div class="form-group"><label>Título *</label><input class="input" [(ngModel)]="form.titulo" placeholder="Ex: Manutenção no laboratório 3"></div>
            <div class="form-group"><label>Mensagem *</label><textarea class="textarea" [(ngModel)]="form.mensagem" placeholder="Detalhe o comunicado"></textarea></div>
            <div class="form-group">
              <label>Tipo</label>
              <select class="select" [(ngModel)]="form.tipo">
                <option value="Info">Informação</option>
                <option value="Alerta">Alerta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <div class="form-group">
              <label>Destinatário</label>
              <select class="select" [(ngModel)]="form.destino">
                <option value="todos">Todos os usuários</option>
                <option value="admin">Somente Patrimônio</option>
              </select>
            </div>
            <button class="btn btn-primary" (click)="enviar()"><ion-icon name="send-outline"></ion-icon> Enviar</button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 14px;font-size:.95rem">Alertas automáticos</h3>
          <div class="col">
            <div class="alerta-row" *ngFor="let a of alertas()">
              <div class="grow">
                <strong>{{ a.mensagem | slice:0:70 }}</strong>
                <p style="margin:2px 0 0;font-size:.8rem;color:var(--muted)">Vence em {{ dataBR(a.data_vencimento) }}</p>
              </div>
              <span class="badge" [ngClass]="a.id_tipo_alerta === 1 ? 'Urgente' : 'Alerta'">{{ a.id_tipo_alerta === 1 ? 'Urgente' : 'Alerta' }}</span>
              <button class="btn btn-danger btn-sm" (click)="excluir(a)"><ion-icon name="trash-outline"></ion-icon></button>
            </div>
            <div class="empty" *ngIf="!alertas().length">Nenhum alerta automático configurado.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin:0 0 14px;font-size:.95rem">Enviadas recentemente</h3>
        <div class="table-wrap" style="box-shadow:none;border:1px solid var(--border)">
          <table class="ipe">
            <thead><tr><th>Data</th><th>Tipo</th><th>Título</th><th>Mensagem</th><th>Destino</th></tr></thead>
            <tbody>
              <tr *ngFor="let n of enviadas()">
                <td class="nowrap">{{ n.data_fmt }}</td>
                <td><span class="badge" [ngClass]="n.tipo">{{ n.tipo }}</span></td>
                <td><strong>{{ n.titulo }}</strong></td>
                <td class="muted" style="max-width:340px">{{ n.mensagem }}</td>
                <td>{{ n.destino }}</td>
              </tr>
              <tr *ngIf="!enviadas().length"><td colspan="5" class="empty">Nenhum comunicado enviado.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .alerta-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f2f4; }
    .alerta-row:last-child { border-bottom: none; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class NotificacoesEnvioPage {
  private api = inject(ApiService);

  dataBR = dataBR;
  erro = signal('');
  ok = signal('');

  form = { titulo: '', mensagem: '', tipo: 'Info', destino: 'todos' };

  alertas = signal(this.api.listarAlertas());
  enviadas = signal(this.api.listarNotificacoes().slice(0, 12));

  enviar(): void {
    this.erro.set('');
    this.ok.set('');
    if (!this.form.titulo.trim() || !this.form.mensagem.trim()) {
      this.erro.set('Preencha título e mensagem.');
      return;
    }
    this.api.criarAlerta(this.form.titulo, this.form.mensagem, this.form.tipo, this.form.destino);
    this.ok.set('Comunicado enviado com sucesso.');
    this.form = { titulo: '', mensagem: '', tipo: 'Info', destino: 'todos' };
    this.enviadas.set(this.api.listarNotificacoes().slice(0, 12));
    this.alertas.set(this.api.listarAlertas());
  }

  excluir(a: any): void {
    if (!confirm('Remover este alerta?')) return;
    this.api.excluirAlerta(a.id_alerta);
    this.alertas.set(this.api.listarAlertas());
  }
}
