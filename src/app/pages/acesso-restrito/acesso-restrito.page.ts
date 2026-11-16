import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-acesso-restrito',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon],
  template: `
    <div class="restrito">
      <div class="box">
        <div class="icone">🔒</div>
        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva do perfil <strong>Patrimônio</strong>. Se você precisa gerenciar chamados, financeiro ou relatórios, solicite a alteração do seu perfil a um administrador.</p>
        <div class="row" style="justify-content:center">
          <a class="btn btn-primary" routerLink="/home"><ion-icon name="home-outline"></ion-icon> Voltar ao início</a>
          <a class="btn btn-ghost" routerLink="/inventario"><ion-icon name="cube-outline"></ion-icon> Ver inventário</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restrito { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--bg, #f6f7f9); }
    .box { background: #fff; border-radius: 20px; padding: 40px 32px; max-width: 520px; text-align: center; box-shadow: 0 18px 40px rgba(21,41,55,.12); }
    .icone { font-size: 2.6rem; }
    h1 { margin: 10px 0 8px; font-size: 1.4rem; color: #152937; }
    p { color: #6b7280; font-size: .9rem; line-height: 1.7; margin: 0 0 22px; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; }
  `]
})
export class AcessoRestritoPage {
  readonly auth = inject(AuthService);
}
