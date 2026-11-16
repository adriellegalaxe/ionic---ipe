import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { dataBR } from '../../core/util';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Meu Perfil" subtitulo="Seus dados de acesso e histórico"></app-topbar>

    <div class="ipe-page">
      <div class="grid-2">
        <div class="card">
          <div class="row" style="gap:16px;margin-bottom:18px">
            <div class="avatar-lg">{{ inicial }}</div>
            <div>
              <h2 style="margin:0;font-size:1.15rem">{{ sessao()?.nome }}</h2>
              <p class="muted" style="margin:2px 0 6px">{{ sessao()?.email }}</p>
              <span class="badge" [ngClass]="sessao()?.id_perfil === 1 ? 'Concluído' : 'outline'">{{ sessao()?.nome_perfil }}</span>
            </div>
          </div>

          <div class="aviso danger" *ngIf="erro()" style="margin-bottom:12px">{{ erro() }}</div>
          <div class="aviso success" *ngIf="ok()" style="margin-bottom:12px">{{ ok() }}</div>

          <div class="col">
            <div class="form-group"><label>Nome</label><input class="input" [(ngModel)]="nome"></div>
            <div class="form-group"><label>E-mail</label><input class="input" [(ngModel)]="email"></div>
            <button class="btn btn-primary" (click)="salvar()"><ion-icon name="save-outline"></ion-icon> Salvar alterações</button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Trocar senha</h3>
          <div class="aviso danger" *ngIf="erroSenha()" style="margin-bottom:12px">{{ erroSenha() }}</div>
          <div class="aviso success" *ngIf="okSenha()" style="margin-bottom:12px">{{ okSenha() }}</div>
          <div class="col">
            <div class="form-group"><label>Senha atual</label><input class="input" type="password" [(ngModel)]="senhaAtual"></div>
            <div class="form-group"><label>Nova senha</label><input class="input" type="password" [(ngModel)]="senhaNova"></div>
            <div class="form-group"><label>Confirmar nova senha</label><input class="input" type="password" [(ngModel)]="senhaConf"></div>
            <button class="btn btn-dark" (click)="trocarSenha()"><ion-icon name="lock-closed-outline"></ion-icon> Alterar senha</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin:0 0 12px;font-size:.95rem">Meus chamados recentes</h3>
        <div class="table-wrap" style="box-shadow:none;border:1px solid var(--border)">
          <table class="ipe">
            <thead><tr><th>#</th><th>Abertura</th><th>Bem</th><th>Problema</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of meusChamados">
                <td class="mono">#{{ c.id_chamado }}</td>
                <td class="nowrap">{{ c.data_abertura_fmt }}</td>
                <td>{{ c.nome_patrimonio }}</td>
                <td class="muted" style="max-width:320px">{{ c.descricao_problema }}</td>
                <td><span class="badge" [ngClass]="c.nome_status">{{ c.nome_status }}</span></td>
              </tr>
              <tr *ngIf="!meusChamados.length"><td colspan="5" class="empty">Você ainda não abriu chamados.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .avatar-lg { width: 64px; height: 64px; border-radius: 50%; background: var(--primary); color: var(--ink); display: grid; place-items: center; font-weight: 700; font-size: 1.5rem; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class PerfilPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  dataBR = dataBR;
  sessao = this.auth.sessao;
  nome = this.auth.sessao()?.nome ?? '';
  email = this.auth.sessao()?.email ?? '';

  senhaAtual = '';
  senhaNova = '';
  senhaConf = '';

  erro = signal('');
  ok = signal('');
  erroSenha = signal('');
  okSenha = signal('');

  meusChamados = this.api.listarChamados().filter(c => c.id_usuario === this.auth.sessao()?.id_usuario);

  get inicial(): string {
    return (this.auth.sessao()?.nome ?? '?').charAt(0).toUpperCase();
  }

  salvar(): void {
    this.erro.set(''); this.ok.set('');
    if (!this.nome.trim() || !this.email.trim()) { this.erro.set('Nome e e-mail são obrigatórios.'); return; }
    const r = this.auth.atualizarPerfil(this.nome.trim(), this.email.trim());
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.ok.set('Perfil atualizado.');
  }

  trocarSenha(): void {
    this.erroSenha.set(''); this.okSenha.set('');
    if (!this.senhaAtual || !this.senhaNova) { this.erroSenha.set('Preencha todas as senhas.'); return; }
    if (this.senhaNova !== this.senhaConf) { this.erroSenha.set('A confirmação não confere.'); return; }
    if (this.senhaNova.length < 4) { this.erroSenha.set('A nova senha deve ter ao menos 4 caracteres.'); return; }
    const r = this.auth.trocarSenha(this.senhaAtual, this.senhaNova);
    if (!r.ok) { this.erroSenha.set(r.erro!); return; }
    this.okSenha.set('Senha alterada.');
    this.senhaAtual = this.senhaNova = this.senhaConf = '';
  }
}
