import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Backup e Exportação" subtitulo="Copie os dados do sistema para fora do navegador"></app-topbar>

    <div class="ipe-page">
      <div class="aviso">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Os dados deste app ficam no <strong>armazenamento local do navegador</strong>. Exporte um backup antes de limpar o navegador ou trocar de computador.</span>
      </div>

      <section class="cards-grid">
        <div class="stat-card blue"><h3>Bens</h3><p>{{ info.total_patrimonios }}</p></div>
        <div class="stat-card amber"><h3>Chamados</h3><p>{{ info.total_chamados }}</p></div>
        <div class="stat-card green"><h3>Movimentações</h3><p>{{ info.total_movimentacoes }}</p></div>
        <div class="stat-card gray"><h3>Tamanho estimado</h3><p style="font-size:1.2rem">{{ info.tamanho_kb }} KB</p></div>
      </section>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Exportar</h3>
          <div class="col">
            <button class="btn btn-primary" (click)="json()"><ion-icon name="code-download-outline"></ion-icon> Backup completo (JSON)</button>
            <button class="btn btn-ghost" (click)="sql()"><ion-icon name="server-outline"></ion-icon> Dump SQL (MySQL)</button>
            <div class="form-group">
              <label>Tabela em CSV</label>
              <div class="row">
                <select class="select" style="max-width:240px" [(ngModel)]="tabela">
                  <option *ngFor="let t of tabelas" [value]="t">{{ t }}</option>
                </select>
                <button class="btn btn-ghost btn-sm" (click)="csv()">Baixar CSV</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;font-size:.95rem">Restaurar</h3>
          <div class="col">
            <div class="aviso warn"><ion-icon name="warning-outline"></ion-icon><span>A restauração substitui todos os dados atuais.</span></div>
            <input class="input" type="file" accept=".json" (change)="arquivo($event)">
            <button class="btn btn-orange" [disabled]="!conteudo()" (click)="restaurar()">
              <ion-icon name="cloud-upload-outline"></ion-icon> Restaurar do arquivo
            </button>
            <p class="muted" style="font-size:.8rem" *ngIf="conteudo()">Arquivo carregado: {{ nomeArquivo }}</p>
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
export class BackupPage {
  private api = inject(ApiService);

  info = this.api.infoBackup();
  tabelas = ['Patrimonio', 'Chamado', 'Movimentacao', 'LancamentoFinanceiro', 'Usuario', 'Sala', 'Baixa'];
  tabela = 'Patrimonio';

  conteudo = signal<string | null>(null);
  nomeArquivo = '';

  private baixar(nome: string, texto: string, mime: string): void {
    const blob = new Blob([texto], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
  }

  json(): void {
    this.baixar(`ipe_backup_${new Date().toISOString().slice(0, 10)}.json`, this.api.exportarJSON(), 'application/json');
  }

  sql(): void {
    this.baixar(`ipe_dump_${new Date().toISOString().slice(0, 10)}.sql`, this.api.exportarSQL(), 'application/sql');
  }

  csv(): void {
    const c = this.api.exportarCSVTabela(this.tabela);
    if (!c.ok) { alert(c.erro); return; }
    this.baixar(`${this.tabela.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`, c.csv!, 'text/csv;charset=utf-8');
  }

  arquivo(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.nomeArquivo = f.name;
    const leitor = new FileReader();
    leitor.onload = () => this.conteudo.set(String(leitor.result));
    leitor.readAsText(f);
  }

  restaurar(): void {
    if (!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
    const r = this.api.db.importarJSON(this.conteudo()!);
    if (!r.ok) { alert(r.erro); return; }
    alert('Backup restaurado.');
    location.reload();
  }
}
