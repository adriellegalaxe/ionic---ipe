import { Routes } from '@angular/router';
import { authGuard, adminGuard, loginGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'cadastro',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/cadastro/cadastro.page').then(m => m.CadastroPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage) },
      { path: 'inventario', loadComponent: () => import('./pages/inventario/inventario.page').then(m => m.InventarioPage) },
      { path: 'movimentacoes', loadComponent: () => import('./pages/movimentacoes/movimentacoes.page').then(m => m.MovimentacoesPage) },
      { path: 'chamados', loadComponent: () => import('./pages/chamados/chamados.page').then(m => m.ChamadosPage) },
      { path: 'novo-chamado', loadComponent: () => import('./pages/novo-chamado/novo-chamado.page').then(m => m.NovoChamadoPage) },
      { path: 'reparos', loadComponent: () => import('./pages/reparos/reparos.page').then(m => m.ReparosPage) },
      { path: 'historico', loadComponent: () => import('./pages/historico/historico.page').then(m => m.HistoricoPage) },
      { path: 'sobre', loadComponent: () => import('./pages/sobre/sobre.page').then(m => m.SobrePage) },
      { path: 'notificacoes', loadComponent: () => import('./pages/notificacoes/notificacoes.page').then(m => m.NotificacoesPage) },
      {
        path: 'alugados',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/alugados/alugados.page').then(m => m.AlugadosPage)
      },
      {
        path: 'baixa',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/baixa/baixa.page').then(m => m.BaixaPage)
      },
      {
        path: 'financeiro',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/financeiro/financeiro.page').then(m => m.FinanceiroPage)
      },
      {
        path: 'relatorios',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/relatorios/relatorios.page').then(m => m.RelatoriosPage)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
      },
      {
        path: 'notificacoes-envio',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/notificacoes-envio/notificacoes-envio.page').then(m => m.NotificacoesEnvioPage)
      },
      {
        path: 'backup',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/backup/backup.page').then(m => m.BackupPage)
      },
      {
        path: 'acesso-restrito',
        loadComponent: () => import('./pages/acesso-restrito/acesso-restrito.page').then(m => m.AcessoRestritoPage)
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
