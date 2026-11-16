import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TopbarComponent } from '../../shared/topbar.component';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-novo-chamado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonIcon, TopbarComponent],
  template: `
    <app-topbar titulo="Abrir Chamado" subtitulo="Solicite manutenção ou suporte técnico">
      <a class="btn btn-ghost" routerLink="/chamados"><ion-icon name="arrow-back-outline"></ion-icon><span>Voltar</span></a>
    </app-topbar>

    <div class="ipe-page">
      <div class="card" style="max-width:820px">
        <div class="aviso danger" *ngIf="erro()"><ion-icon name="warning-outline"></ion-icon><span>{{ erro() }}</span></div>
        <div class="aviso success" *ngIf="sucesso()"><ion-icon name="checkmark-circle-outline"></ion-icon><span>{{ sucesso() }}</span></div>

        <form (ngSubmit)="enviar()" class="col" style="margin-top:10px">
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo de chamado *</label>
              <select class="select" [(ngModel)]="idTipo" name="tipo">
                <option [ngValue]="null">Selecione...</option>
                <option *ngFor="let t of tipos" [ngValue]="t.id_tipo_chamado">{{ t.nome }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Prioridade *</label>
              <select class="select" [(ngModel)]="prioridade" name="prioridade">
                <option value="Baixa">Baixa</option>
                <option value="Media">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bem patrimonial</label>
              <select class="select" [(ngModel)]="idPatrimonio" name="patrimonio">
                <option [ngValue]="null">Não vincular / não sei</option>
                <option *ngFor="let p of patrimonios" [ngValue]="p.id_patrimonio">
                  {{ p.numero_patrimonio }} — {{ p.nome }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Previsão de conclusão</label>
              <input class="input" type="date" [(ngModel)]="previsao" name="previsao">
            </div>
            <div class="form-group full">
              <label>Descrição do problema *</label>
              <textarea class="textarea" [(ngModel)]="descricao" name="descricao"
                        placeholder="Descreva o que está acontecendo, onde e desde quando"></textarea>
            </div>
          </div>

          <div class="row" style="justify-content:flex-end">
            <a class="btn btn-ghost" routerLink="/chamados">Cancelar</a>
            <button class="btn btn-primary" type="submit"><ion-icon name="send-outline"></ion-icon> Abrir Chamado</button>
          </div>
        </form>
      </div>

      <div class="card" style="max-width:820px">
        <h3 style="margin:0 0 10px;font-size:.95rem">Como funciona</h3>
        <div class="timeline">
          <div class="timeline-item">O chamado entra como <strong>Aberto</strong> e aparece para o setor de Patrimônio.</div>
          <div class="timeline-item">Ao iniciar o reparo, o status passa para <strong>Em Atendimento</strong>.</div>
          <div class="timeline-item">Quando finalizado, vira <strong>Concluído</strong> e o custo entra no financeiro.</div>
        </div>
      </div>
    </div>
  `
})
export class NovoChamadoPage {
  private api = inject(ApiService);
  private router = inject(Router);

  tipos = this.api.tiposChamado();
  patrimonios = this.api.patrimoniosParaSelect();

  idTipo: number | null = null;
  prioridade = 'Media';
  idPatrimonio: number | null = null;
  previsao = '';
  descricao = '';
  erro = signal('');
  sucesso = signal('');

  enviar(): void {
    this.erro.set('');
    this.sucesso.set('');
    if (!this.idTipo) { this.erro.set('Selecione o tipo de chamado.'); return; }
    if (!this.descricao || this.descricao.trim().length < 5) {
      this.erro.set('Descreva o problema com pelo menos 5 caracteres.');
      return;
    }
    const r = this.api.criarChamado({
      id_tipo_chamado: Number(this.idTipo),
      prioridade: this.prioridade,
      descricao_problema: this.descricao,
      data_previsao_conclusao: this.previsao || null,
      id_patrimonio: this.idPatrimonio
    });
    if (!r.ok) { this.erro.set(r.erro!); return; }
    this.sucesso.set(r.mensagem!);
    setTimeout(() => this.router.navigate(['/chamados']), 900);
  }
}
