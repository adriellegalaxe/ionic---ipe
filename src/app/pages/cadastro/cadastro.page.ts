import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonIcon, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonIcon, IonContent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="auth-wrap">
        <div class="auth-hero">
          <div class="auth-hero__mark">IPE</div>
          <h1>Crie sua conta no IPE</h1>
          <p>Usuários padrão abrem chamados e consultam o inventário. O setor de Patrimônio
             (com chave de acesso) gerencia bens, financeiro e relatórios.</p>
          <ul>
            <li><ion-icon name="checkmark-circle-outline"></ion-icon> Acompanhe seus chamados</li>
            <li><ion-icon name="checkmark-circle-outline"></ion-icon> Consulte bens e salas</li>
            <li><ion-icon name="checkmark-circle-outline"></ion-icon> Veja o histórico de reparos</li>
          </ul>
        </div>

        <div class="auth-card">
          <div class="auth-card__logo">
            <div class="ipe-logo__mark"><img src="assets/logo.png" alt="IPE" onerror="this.style.display='none'"></div>
            <div>
              <h2>Criar conta</h2>
              <p class="muted">Preencha os dados abaixo</p>
            </div>
          </div>

          <div *ngIf="erro()" class="aviso danger"><ion-icon name="warning-outline"></ion-icon><span>{{ erro() }}</span></div>
          <div *ngIf="sucesso()" class="aviso success"><ion-icon name="checkmark-circle-outline"></ion-icon><span>{{ sucesso() }}</span></div>

          <form (ngSubmit)="cadastrar()" class="col">
            <div class="form-group">
              <label>Nome completo</label>
              <input class="input" name="nome" [(ngModel)]="nome" placeholder="Seu nome" required>
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input class="input" type="email" name="email" [(ngModel)]="email" placeholder="nome@escola.edu.br" required>
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input class="input" type="password" name="senha" [(ngModel)]="senha" placeholder="Mínimo 4 caracteres" required>
            </div>
            <div class="form-group">
              <label>Confirmar senha</label>
              <input class="input" type="password" name="confirmar" [(ngModel)]="confirmar" placeholder="Repita a senha" required>
            </div>

            <label class="check">
              <input type="checkbox" [checked]="usarChave()" (change)="usarChave.set(!usarChave())">
              <span>Tenho chave de acesso (perfil Patrimônio)</span>
            </label>

            <div class="form-group" *ngIf="usarChave()">
              <label>Chave de Acesso</label>
              <input class="input" type="password" name="chave" [(ngModel)]="chave" placeholder="Ex: IPE2026ADMIN">
            </div>

            <button class="btn btn-primary" type="submit" style="width:100%;margin-top:6px">
              <ion-icon name="person-outline"></ion-icon> Criar conta
            </button>
          </form>

          <div class="auth-card__foot">
            <span class="muted">Já tem conta?</span>
            <a routerLink="/login">Entrar</a>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-wrap {
      min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr;
      background: linear-gradient(135deg, #152937 0%, #0f1f2a 60%, #123043 100%);
    }
    .auth-hero { padding: 60px 56px; color: #fff; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
    .auth-hero__mark {
      width: 64px; height: 64px; border-radius: 18px; background: var(--primary); color: var(--dark);
      display: grid; place-items: center; font-weight: 700; font-size: 1.4rem;
      box-shadow: 0 10px 30px rgba(255,215,48,.3);
    }
    .auth-hero h1 { font-size: 2.1rem; line-height: 1.15; margin: 10px 0 0; font-weight: 600; }
    .auth-hero p { color: rgba(255,255,255,.72); max-width: 440px; line-height: 1.6; }
    .auth-hero ul { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-direction: column; gap: 12px; }
    .auth-hero li { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,.88); font-size: .92rem; }
    .auth-hero li ion-icon { color: var(--primary); font-size: 1.15rem; }
    .auth-card { background: #fff; padding: 42px 38px; display: flex; flex-direction: column; gap: 16px; justify-content: center; overflow-y: auto; }
    .auth-card__logo { display: flex; align-items: center; gap: 14px; }
    .auth-card__logo h2 { margin: 0; font-size: 1.3rem; font-weight: 600; }
    .auth-card__logo p { margin: 2px 0 0; }
    .check { display: flex; align-items: center; gap: 8px; font-size: .85rem; cursor: pointer; }
    .check input { width: 16px; height: 16px; accent-color: var(--primary-dark); }
    .auth-card__foot { display: flex; gap: 6px; justify-content: center; font-size: .85rem; }
    .auth-card__foot a { color: var(--primary-dark); font-weight: 600; text-decoration: none; }
    @media (max-width: 900px) {
      .auth-wrap { grid-template-columns: 1fr; }
      .auth-hero { display: none; }
      .auth-card { padding: 30px 22px; min-height: 100vh; }
    }
  `]
})
export class CadastroPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = '';
  email = '';
  senha = '';
  confirmar = '';
  chave = '';
  usarChave = signal(false);
  erro = signal('');
  sucesso = signal('');

  cadastrar(): void {
    this.erro.set('');
    this.sucesso.set('');
    const r = this.auth.cadastrar(this.nome, this.email, this.senha, this.confirmar, this.usarChave() ? this.chave : undefined);
    if (!r.ok) {
      this.erro.set(r.erro ?? 'Não foi possível cadastrar.');
      return;
    }
    this.sucesso.set(r.mensagem ?? 'Conta criada!');
    setTimeout(() => this.router.navigate(['/login']), 1200);
  }
}
