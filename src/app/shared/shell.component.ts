import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonIcon, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { Router } from '@angular/router';

interface ItemMenu {
  rota: string;
  label: string;
  icone: string;
  admin?: boolean;
  grupo?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, IonIcon, IonContent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="ipe-mobile-top">
        <button class="icon-btn" style="background:rgba(255,255,255,.12);color:#fff" (click)="menuAberto.set(true)">
          <ion-icon name="menu-outline"></ion-icon>
        </button>
        <h1>IPE</h1>
        <div class="grow"></div>
        <a class="icon-btn" style="background:rgba(255,255,255,.12);color:#fff" routerLink="/notificacoes">
          <ion-icon name="notifications-outline"></ion-icon>
        </a>
      </div>

      <div class="ipe-layout">
        <div class="ipe-backdrop" *ngIf="menuAberto()" (click)="menuAberto.set(false)"></div>

        <aside class="ipe-sidebar" [class.open]="menuAberto()">
          <div class="ipe-logo">
            <div class="ipe-logo__mark"><img src="assets/logo.png" alt="Logo IPE" onerror="this.style.display='none'"></div>
            <div>
              <h1>IPE</h1>
              <p>Sistema de Inventário</p>
            </div>
            <button class="icon-btn" style="margin-left:auto;background:rgba(255,255,255,.12);color:#fff;display:none"
                    [style.display]="menuAberto() ? 'grid' : 'none'" (click)="menuAberto.set(false)">
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </div>

          <nav class="ipe-nav">
            <a *ngFor="let item of menuVisivel()" [routerLink]="item.rota" routerLinkActive="active"
               (click)="menuAberto.set(false)">
              <ion-icon [name]="item.icone"></ion-icon>
              <span>{{ item.label }}</span>
            </a>
          </nav>

          <div class="ipe-sidebar__footer">
            <div class="ipe-avatar">{{ iniciais() }}</div>
            <div class="grow">
              <div class="nome">{{ auth.nome }}</div>
              <div class="perfil">{{ perfilNome() }}</div>
            </div>
            <button class="icon-btn" style="background:rgba(255,255,255,.1);color:#fff" title="Sair" (click)="sair()">
              <ion-icon name="log-out-outline"></ion-icon>
            </button>
          </div>
        </aside>

        <main class="ipe-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </ion-content>
  `
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  menuAberto = signal(false);

  private itens: ItemMenu[] = [
    { rota: '/home', label: 'Página Inicial', icone: 'home-outline' },
    { rota: '/inventario', label: 'Inventário', icone: 'cube-outline' },
    { rota: '/alugados', label: 'Bens Alugados', icone: 'bag-handle-outline', admin: true },
    { rota: '/movimentacoes', label: 'Movimentações', icone: 'swap-horizontal-outline' },
    { rota: '/baixa', label: 'Baixa e Inutilização', icone: 'trending-down-outline', admin: true },
    { rota: '/chamados', label: 'Chamados', icone: 'alert-circle-outline' },
    { rota: '/reparos', label: 'Histórico de Reparos', icone: 'build-outline' },
    { rota: '/historico', label: 'Histórico', icone: 'time-outline' },
    { rota: '/financeiro', label: 'Financeiro', icone: 'cash-outline', admin: true },
    { rota: '/relatorios', label: 'Relatórios', icone: 'bar-chart-outline', admin: true },
    { rota: '/admin', label: 'Painel ADM', icone: 'shield-checkmark-outline', admin: true },
    { rota: '/notificacoes-envio', label: 'Enviar Notificações', icone: 'send-outline', admin: true },
    { rota: '/backup', label: 'Backup', icone: 'cloud-download-outline', admin: true },
    { rota: '/perfil', label: 'Meu Perfil', icone: 'person-outline' },
    { rota: '/sobre', label: 'Sobre', icone: 'information-circle-outline' }
  ];

  menuVisivel = computed(() => {
    const admin = this.auth.isAdmin;
    return this.itens.filter(i => !i.admin || admin);
  });

  perfilNome = computed(() => (this.auth.isAdmin ? 'Patrimônio' : 'Usuário Padrão'));

  iniciais = computed(() => {
    const nome = this.auth.nome || '';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  });

  constructor() {
    // mantém a sessão viva caso o usuário mude em outra aba
    this.auth.sessao();
  }

  sair(): void {
    this.api.registrarLog('LOGOUT', 'Sessão encerrada.');
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
