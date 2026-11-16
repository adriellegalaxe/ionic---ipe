import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonIcon],
  template: `
    <div class="auth-wrap">
      <aside class="auth-hero">
        <div class="brand">
          <img src="assets/logo.png" alt="IPE">
          <div>
            <h1>IPE</h1>
            <p>Inventário e Patrimônio Escolar</p>
          </div>
        </div>
        <div class="hero-text">
          <h2>Controle total do patrimônio da sua escola</h2>
          <p>Bens, salas, chamados de manutenção, custos e relatórios em um só lugar.</p>
        </div>
        <ul class="hero-list">
          <li>📦 Cadastro e consulta de bens</li>
          <li>🔧 Chamados e reparos</li>
          <li>💰 Financeiro e verbas</li>
          <li>📊 Relatórios por período</li>
        </ul>
      </aside>

      <main class="auth-card">
        <h2>Entrar no sistema</h2>
        <p class="muted">Use sua conta institucional para continuar</p>

        <div class="aviso danger" *ngIf="erro"><ion-icon name="warning-outline"></ion-icon><span>{{ erro }}</span></div>

        <form (submit)="entrar($event)">
          <div class="form-group">
            <label>E-mail</label>
            <input class="input" type="email" [(ngModel)]="email" name="email" placeholder="seu@ipe.edu.br" autocomplete="username">
          </div>
          <div class="form-group">
            <label>Senha</label>
            <div class="senha">
              <input class="input" [type]="mostrarSenha ? 'text' : 'password'" [(ngModel)]="senha" name="senha" placeholder="••••" autocomplete="current-password">
              <button type="button" class="icon-btn" (click)="mostrarSenha = !mostrarSenha">
                <ion-icon [name]="mostrarSenha ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </button>
            </div>
          </div>
          <div class="form-group" *ngIf="precisaChave">
            <label>Chave de acesso administrativo</label>
            <input class="input" [(ngModel)]="chave" name="chave" placeholder="IPE2026ADMIN">
          </div>
          <button class="btn btn-primary full" type="submit"><ion-icon name="log-in-outline"></ion-icon> Entrar</button>
        </form>

        <p class="muted center" style="margin-top:16px">
          Não tem conta? <a routerLink="/cadastro">Cadastre-se</a>
        </p>

        <div class="demo">
          <span class="muted">Contas de demonstração</span>
          <div class="row">
            <button class="btn btn-ghost btn-sm" (click)="preencher('admin')">Patrimônio (admin)</button>
            <button class="btn btn-ghost btn-sm" (click)="preencher('usuario')">Usuário padrão</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-wrap { display: grid; grid-template-columns: 1.1fr .9fr; min-height: 100vh; }
    .auth-hero { background: linear-gradient(160deg, #152937 0%, #1e3a4c 100%); color: #fff; padding: 48px; display: flex; flex-direction: column; gap: 32px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { width: 56px; height: 56px; object-fit: contain; background: #fff; border-radius: 14px; padding: 6px; }
    .brand h1 { margin: 0; font-size: 1.5rem; color: #ffd730; }
    .brand p { margin: 0; font-size: .8rem; color: #cbd5e1; }
    .hero-text h2 { font-size: 1.8rem; line-height: 1.25; margin: 0 0 12px; }
    .hero-text p { color: #cbd5e1; margin: 0; }
    .hero-list { list-style: none; padding: 0; margin: auto 0 0; display: flex; flex-direction: column; gap: 10px; font-size: .88rem; color: #e2e8f0; }
    .auth-card { padding: 56px 48px; display: flex; flex-direction: column; justify-content: center; max-width: 520px; width: 100%; margin: 0 auto; }
    .auth-card h2 { margin: 0; font-size: 1.4rem; }
    .auth-card > p { margin: 4px 0 22px; font-size: .86rem; }
    .senha { position: relative; }
    .senha .icon-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); }
    .full { width: 100%; justify-content: center; margin-top: 8px; }
    .center { text-align: center; }
    a { color: var(--primary-dark, #b45309); font-weight: 600; }
    .demo { margin-top: 24px; border-top: 1px dashed var(--border, #e5e7eb); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .demo .row { display: flex; gap: 8px; flex-wrap: wrap; }
    @media (max-width: 900px) {
      .auth-wrap { grid-template-columns: 1fr; }
      .auth-hero { padding: 28px; }
      .hero-list { display: none; }
      .auth-card { padding: 28px 22px; }
    }
  `]
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  chave = '';
  mostrarSenha = false;
  erro = '';

  get precisaChave(): boolean {
    return this.email.trim().toLowerCase() === 'patrimonio@ipe.edu.br' || this.email.trim().toLowerCase().includes('admin');
  }

  preencher(tipo: 'admin' | 'usuario'): void {
    if (tipo === 'admin') {
      this.email = 'patrimonio@ipe.edu.br';
      this.chave = 'IPE2026ADMIN';
    } else {
      this.email = 'usuario@ipe.edu.br';
      this.chave = '';
    }
    this.senha = '1234';
    this.erro = '';
  }

  entrar(ev: Event): void {
    ev.preventDefault();
    this.erro = '';
    if (!this.email.trim() || !this.senha) { this.erro = 'Informe e-mail e senha.'; return; }
    const r = this.auth.login(this.email.trim(), this.senha, this.chave.trim() || undefined);
    if (!r.ok) { this.erro = r.erro ?? 'Não foi possível entrar.'; return; }
    this.router.navigate(['/home']);
  }
}
