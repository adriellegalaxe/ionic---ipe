import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Sobre o Sistema" subtitulo="IPE · Inventário e Patrimônio Escolar"></app-topbar>

    <div class="ipe-page">
      <div class="card hero-sobre">
        <img src="assets/logo.png" alt="IPE" style="width:72px;height:72px;object-fit:contain">
        <div>
          <h2 style="margin:0">Sistema IPE</h2>
          <p class="muted" style="margin:4px 0 0">Inventário e Patrimônio Escolar · versão 2.0 (Ionic)</p>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 10px;font-size:.95rem">O que o sistema faz</h3>
          <ul style="margin:0;padding-left:18px;line-height:1.9;font-size:.86rem">
            <li>Cadastro e consulta de bens patrimoniais</li>
            <li>Controle de salas e movimentações</li>
            <li>Chamados de manutenção com prioridade e status</li>
            <li>Histórico de reparos e custos por bem</li>
            <li>Gestão financeira com verbas e origens de recurso</li>
            <li>Relatórios por período, categoria e origem</li>
            <li>Baixa e inutilização de bens</li>
            <li>Contratos de locação (bens alugados)</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="margin:0 0 10px;font-size:.95rem">Perfis de acesso</h3>
          <div class="col">
            <div class="perfil-box">
              <strong>Patrimônio (administrador)</strong>
              <p class="muted" style="margin:4px 0 0;font-size:.82rem">Acesso completo: cadastros, chamados, financeiro, relatórios, baixas, locações, backup e configurações. Requer chave de acesso.</p>
            </div>
            <div class="perfil-box">
              <strong>Usuário Padrão</strong>
              <p class="muted" style="margin:4px 0 0;font-size:.82rem">Consulta o inventário, abre chamados e acompanha seus pedidos.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin:0 0 10px;font-size:.95rem">Tecnologia</h3>
        <div class="row" style="flex-wrap:wrap;gap:8px">
          <span class="badge outline">Ionic 8</span>
          <span class="badge outline">Angular 18</span>
          <span class="badge outline">TypeScript</span>
          <span class="badge outline">SCSS</span>
          <span class="badge outline">PWA</span>
          <span class="badge outline">localStorage</span>
        </div>
        <p class="muted" style="font-size:.82rem;margin:14px 0 0">
          Esta versão roda 100% no navegador. A camada de dados (<code>ApiService</code>) reproduz os endpoints
          do sistema Flask original — basta trocar as implementações por chamadas HTTP para reconectar o MySQL.
        </p>
      </div>

      <div class="row" style="justify-content:center">
        <a class="btn btn-primary" routerLink="/home"><ion-icon name="home-outline"></ion-icon> Ir para o início</a>
      </div>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .hero-sobre { display: flex; align-items: center; gap: 18px; border-left: 5px solid var(--primary-dark); }
    .perfil-box { background: #fafafa; border-radius: 12px; padding: 12px 14px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class SobrePage {
  readonly auth = inject(AuthService);
}
