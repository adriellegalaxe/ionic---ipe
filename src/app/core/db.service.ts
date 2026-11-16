// ============================================================================
// DB SERVICE — camada de dados local que substitui o MySQL do backend Flask.
// Mantém a mesma "forma" das tabelas, para que a troca por uma API REST real
// seja apenas a substituição deste serviço (ver README).
// ============================================================================
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BancoDados } from './models';
import { bancoInicial } from './seed';

const CHAVE = 'ipe_db_v1';

@Injectable({ providedIn: 'root' })
export class DbService {
  private banco!: BancoDados;
  readonly mudou$ = new BehaviorSubject<number>(0);

  constructor() {
    this.carregar();
  }

  // ------------------------------------------------------------------ base
  private carregar(): void {
    try {
      const raw = localStorage.getItem(CHAVE);
      if (raw) {
        this.banco = JSON.parse(raw) as BancoDados;
        return;
      }
    } catch {
      /* ignora e recria */
    }
    this.banco = bancoInicial();
    this.persistir();
  }

  persistir(): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(this.banco));
    } catch (e) {
      console.warn('[IPE] Não foi possível salvar os dados localmente', e);
    }
    this.mudou$.next(this.mudou$.value + 1);
  }

  get db(): BancoDados {
    return this.banco;
  }

  config = {
    nome_instituicao: 'Instituto Pedro II',
    chave_admin: 'IPE2026ADMIN',
    email_notificacoes: 'patrimonio@ipe.edu.br',
    dias_alerta_contrato: 30
  };

  marcarNotificacaoLida(id: string | number): void {
    const lidas: string[] = JSON.parse(localStorage.getItem('ipe_notif_lidas') || '[]');
    if (!lidas.includes(String(id))) {
      lidas.push(String(id));
      localStorage.setItem('ipe_notif_lidas', JSON.stringify(lidas));
    }
  }

  notificacoesLidas(): string[] {
    try { return JSON.parse(localStorage.getItem('ipe_notif_lidas') || '[]'); } catch { return []; }
  }

  importarJSON(texto: string): { ok: boolean; erro?: string } {
    try {
      const dados = JSON.parse(texto);
      if (!dados || typeof dados !== 'object' || !dados.Patrimonio) {
        return { ok: false, erro: 'Arquivo inválido: não parece um backup do IPE.' };
      }
      this.importar(dados);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, erro: 'Não foi possível ler o arquivo: ' + (e?.message ?? 'JSON inválido') };
    }
  }

  resetar(): void {
    this.banco = bancoInicial();
    this.persistir();
  }

  importar(dados: BancoDados): void {
    if (!dados || !dados.Patrimonio || !dados.Usuario) {
      throw new Error('Arquivo inválido: não parece um backup do IPE.');
    }
    this.banco = dados;
    this.persistir();
  }

  exportar(): BancoDados {
    return JSON.parse(JSON.stringify(this.banco));
  }

  proximoId(tabela: string): number {
    const seq = this.banco._seq;
    const atual = seq[tabela] ?? 1;
    seq[tabela] = atual + 1;
    return atual;
  }

  // --------------------------------------------------------------- helpers
  usuario(id: number | null | undefined) {
    return this.banco.Usuario.find(u => u.id_usuario === id) ?? null;
  }
  sala(id: number | null | undefined) {
    return this.banco.Sala.find(s => s.id_sala === id) ?? null;
  }
  categoria(id: number | null | undefined) {
    return this.banco.Categoria.find(c => c.id_categoria === id) ?? null;
  }
  status(id: number | null | undefined) {
    return this.banco._status.find(s => s.id_status === id) ?? null;
  }
  patrimonio(id: number | null | undefined) {
    return this.banco.Patrimonio.find(p => p.id_patrimonio === id) ?? null;
  }
  verba(id: number | null | undefined) {
    return this.banco.verba.find(v => v.id_verba === id) ?? null;
  }
  tipoChamado(id: number | null | undefined) {
    return this.banco.Tipo_chamado.find(t => t.id_tipo_chamado === id) ?? null;
  }

  log(acao: string, descricao: string, idUsuario: number | null): void {
    this.banco.Log_auditoria.unshift({
      id_log: this.proximoId('Log_auditoria'),
      acao,
      descricao,
      id_usuario: idUsuario,
      data_hora: new Date().toISOString()
    });
    if (this.banco.Log_auditoria.length > 500) this.banco.Log_auditoria.pop();
  }

  historico(idChamado: number | null, descricao: string): void {
    this.banco.Historico.unshift({
      id_historico: this.proximoId('Historico'),
      id_chamado: idChamado,
      data_evento: new Date().toISOString(),
      descricao
    });
  }

  // ---------------------------------------------------------------- salas
  listarSalas() {
    return [...this.banco.Sala].sort((a, b) => a.numero_sala.localeCompare(b.numero_sala, 'pt-BR'));
  }

  criarSala(numeroSala: string, bloco: string, idTipoSala = 1) {
    const sala = {
      id_sala: this.proximoId('Sala'),
      numero_sala: numeroSala,
      bloco: bloco || null,
      id_tipo_sala: idTipoSala
    };
    this.banco.Sala.push(sala);
    this.persistir();
    return sala;
  }

  // ----------------------------------------------------------- patrimônio
  listarPatrimonios() {
    return [...this.banco.Patrimonio].sort((a, b) => b.id_patrimonio - a.id_patrimonio);
  }

  /** Depreciação exponencial: valor * (1 - taxa)^anos — igual ao Flask */
  depreciar(valor: number, dataAquisicao: string | null, taxa: number | null): number {
    try {
      if (!dataAquisicao) return Number(valor || 0);
      const inicio = new Date(dataAquisicao + 'T00:00:00');
      const anos = (Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const t = Number(taxa || 0) / 100;
      return Math.max(Number((Number(valor || 0) * Math.pow(1 - t, Math.max(anos, 0))).toFixed(2)), 0);
    } catch {
      return Number(valor || 0);
    }
  }

  cadastrarPatrimonio(dados: {
    nome: string; numero_patrimonio: string; valor_atual: number; data_aquisicao: string;
    taxa_depreciacao: number; id_sala: number | null; id_categoria: number | null;
    descricao?: string | null; nota_fiscal?: string | null; origem?: string | null;
    id_verba?: number | null;
  }) {
    const novo = {
      id_patrimonio: this.proximoId('Patrimonio'),
      id_status: 1,
      processo_baixa: null,
      ...dados,
      descricao: dados.descricao || null,
      nota_fiscal: dados.nota_fiscal || null,
      origem: dados.origem || null,
      id_verba: dados.id_verba ?? null
    };
    this.banco.Patrimonio.push(novo);
    this.persistir();
    return novo;
  }

  atualizarPatrimonio(id: number, campos: Partial<import('./models').Patrimonio>) {
    const p = this.patrimonio(id);
    if (!p) return false;
    Object.assign(p, campos);
    this.persistir();
    return true;
  }

  excluirPatrimonio(id: number) {
    this.banco.Patrimonio = this.banco.Patrimonio.filter(p => p.id_patrimonio !== id);
    this.banco.item_movimentacao = this.banco.item_movimentacao.filter(i => i.id_patrimonio !== id);
    this.persistir();
  }
}
