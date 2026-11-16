// ============================================================================
// API SERVICE — "endpoints" do Flask reimplementados como métodos tipados.
// Cada método corresponde a uma rota /api/... do sistema original.
// ============================================================================
import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import {
  Chamado, LancamentoCaixa, Manutencao, Movimentacao, Patrimonio, Perfil
} from './models';
import {
  ORIGENS_VALIDAS, STATUS_CHAMADO, diasAte, extrairDataFimContrato, extrairOrigemVerba,
  hojeISO, statusContrato
} from './util';

export interface ItemInventario {
  id_patrimonio: number;
  nome: string;
  numero_patrimonio: string;
  valor_compra: number;
  valor_atual: number;
  data_aquisicao: string | null;
  data_aquisicao_formatada: string;
  taxa_depreciacao: number;
  processo_baixa: string | null;
  nome_sala: string;
  bloco_sala: string | null;
  nome_status: string;
  nome_categoria: string;
  descricao: string | null;
  nota_fiscal: string | null;
  origem: string | null;
  id_status: number;
  id_sala: number | null;
  id_categoria: number | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(public db: DbService, public auth: AuthService) {}

  private get idUsuario(): number | null {
    return this.auth.sessao()?.id_usuario ?? null;
  }

  // =========================================================== USUÁRIO
  dadosUsuario() {
    const u = this.auth.usuario();
    if (!u) return null;
    const meus = this.db.db.Chamado.filter(c => c.id_usuario === u.id_usuario);
    return {
      id_usuario: u.id_usuario,
      nome: u.nome,
      e_mail: u.e_mail,
      id_perfil: u.id_perfil,
      nome_perfil: u.id_perfil === 1 ? 'Patrimônio' : 'Usuário Padrão',
      estatisticas: {
        total: meus.length,
        abertos: meus.filter(c => c.id_status === 1).length,
        andamento: meus.filter(c => c.id_status === 2).length,
        concluidos: meus.filter(c => c.id_status === 3).length
      }
    };
  }

  listarUsuarios() {
    return this.db.db.Usuario.map(u => ({
      id_usuario: u.id_usuario,
      nome: u.nome,
      e_mail: u.e_mail,
      id_perfil: u.id_perfil,
      nome_perfil: u.id_perfil === 1 ? 'Patrimônio' : 'Usuário Padrão',
      total_chamados: this.db.db.Chamado.filter(c => c.id_usuario === u.id_usuario).length
    }));
  }

  // =========================================================== INVENTÁRIO
  listarInventario(): ItemInventario[] {
    return this.db.listarPatrimonios().map(p => this.montarItem(p));
  }

  private montarItem(p: Patrimonio): ItemInventario {
    const sala = this.db.sala(p.id_sala);
    const cat = this.db.categoria(p.id_categoria);
    const st = this.db.status(p.id_status);
    return {
      id_patrimonio: p.id_patrimonio,
      nome: p.nome,
      numero_patrimonio: p.numero_patrimonio,
      valor_compra: p.valor_atual,
      valor_atual: this.db.depreciar(p.valor_atual, p.data_aquisicao, p.taxa_depreciacao),
      data_aquisicao: p.data_aquisicao,
      data_aquisicao_formatada: p.data_aquisicao
        ? p.data_aquisicao.split('-').reverse().join('/')
        : '—',
      taxa_depreciacao: p.taxa_depreciacao,
      processo_baixa: p.processo_baixa,
      nome_sala: sala?.numero_sala ?? 'Não Alocado',
      bloco_sala: sala?.bloco ?? null,
      nome_status: st?.nome ?? 'Ativo',
      nome_categoria: cat?.nome ?? '—',
      descricao: p.descricao,
      nota_fiscal: p.nota_fiscal,
      origem: p.origem,
      id_status: p.id_status,
      id_sala: p.id_sala,
      id_categoria: p.id_categoria
    };
  }

  filtrosInventario() {
    return {
      categorias: [...this.db.db.Categoria].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      salas: this.db.listarSalas().map(s => ({ id_sala: s.id_sala, nome: s.numero_sala, bloco: s.bloco })),
      status: [...this.db.db._status]
    };
  }

  patrimonioDetalhes(id: number) {
    const p = this.db.patrimonio(id);
    if (!p) return null;
    const item = this.montarItem(p);
    const chamados = this.db.db.Chamado
      .filter(c => c.id_patrimonio === id)
      .sort((a, b) => b.id_chamado - a.id_chamado)
      .map(c => this.montarChamado(c));
    const movs = this.db.db.item_movimentacao
      .filter(i => i.id_patrimonio === id)
      .map(i => this.db.db.Movimentacao.find(m => m.id_movimentacao === i.id_movimentacao))
      .filter((m): m is Movimentacao => !!m)
      .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao));
    const anexos = this.db.db.Anexo.filter(a => chamados.some(c => c.id_chamado === a.id_chamado));
    return { ...item, chamados, movimentacoes: movs, anexos, verba: this.db.verba(p.id_verba) };
  }

  cadastrarPatrimonio(dados: Parameters<DbService['cadastrarPatrimonio']>[0]) {
    if (this.db.db.Patrimonio.some(p => p.numero_patrimonio === dados.numero_patrimonio)) {
      return { ok: false, erro: 'Já existe um bem com este número de patrimônio.' };
    }
    const novo = this.db.cadastrarPatrimonio(dados);
    this.db.log('INSERT', `Patrimônio ${novo.numero_patrimonio} cadastrado (${novo.nome}).`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Patrimônio cadastrado com sucesso!', id: novo.id_patrimonio };
  }

  excluirPatrimonio(id: number) {
    const p = this.db.patrimonio(id);
    if (!p) return { ok: false, erro: 'Patrimônio não encontrado.' };
    if (this.db.db.Chamado.some(c => c.id_patrimonio === id && [1, 2].includes(c.id_status))) {
      return { ok: false, erro: 'Existem chamados abertos vinculados a este bem.' };
    }
    this.db.excluirPatrimonio(id);
    this.db.log('DELETE', `Patrimônio ${p.numero_patrimonio} excluído.`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Patrimônio excluído.' };
  }

  // ============================================================ CHAMADOS
  private montarChamado(c: Chamado) {
    const u = this.db.usuario(c.id_usuario);
    const p = this.db.patrimonio(c.id_patrimonio);
    const manut = this.db.db.Manutencao.find(m => m.id_chamado === c.id_chamado) ?? null;
    const historico = this.db.db.Historico
      .filter(h => h.id_chamado === c.id_chamado)
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
    const anexos = this.db.db.Anexo
      .filter(a => a.id_chamado === c.id_chamado)
      .sort((a, b) => b.id_anexo - a.id_anexo);
    return {
      ...c,
      nome_usuario: u?.nome ?? 'Sistema',
      nome_patrimonio: p?.nome ?? 'Não informado',
      numero_patrimonio: p?.numero_patrimonio ?? null,
      nome_status: STATUS_CHAMADO[c.id_status] ?? 'Aberto',
      tipo_chamado: this.db.tipoChamado(c.id_tipo_chamado)?.nome ?? '—',
      data_abertura_fmt: this.formatarDataHora(c.data_abertura),
      data_previsao_fmt: c.data_previsao_conclusao
        ? c.data_previsao_conclusao.split('-').reverse().join('/') : null,
      dias_aberto: Math.max(0, Math.floor((Date.now() - new Date(c.data_abertura).getTime()) / 86400000)),
      manutencao: manut,
      historico,
      anexos,
      bens: p ? [{ id: p.id_patrimonio, nome: p.nome, numero: p.numero_patrimonio }] : []
    };
  }

  private formatarDataHora(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR') + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  listarChamados() {
    const admin = this.auth.isAdmin;
    const eu = this.idUsuario;
    return this.db.db.Chamado
      .filter(c => admin || c.id_usuario === eu)
      .sort((a, b) => b.id_chamado - a.id_chamado)
      .map(c => this.montarChamado(c));
  }

  chamadoDetalhes(id: number) {
    const c = this.db.db.Chamado.find(x => x.id_chamado === id);
    return c ? this.montarChamado(c) : null;
  }

  tiposChamado() {
    return this.db.db.Tipo_chamado;
  }

  patrimoniosParaSelect() {
    return this.db.db.Patrimonio
      .filter(p => !p.processo_baixa || p.id_status !== 3)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map(p => ({ id_patrimonio: p.id_patrimonio, nome: p.nome, numero_patrimonio: p.numero_patrimonio }));
  }

  criarChamado(dados: {
    id_tipo_chamado: number; prioridade: string; descricao_problema: string;
    data_previsao_conclusao?: string | null; id_patrimonio?: number | null;
  }) {
    if (!dados.id_tipo_chamado) return { ok: false, erro: 'Selecione o tipo de chamado.' };
    if (!dados.descricao_problema || dados.descricao_problema.trim().length < 5) {
      return { ok: false, erro: 'Descreva o problema com pelo menos 5 caracteres.' };
    }
    const novo: Chamado = {
      id_chamado: this.db.proximoId('Chamado'),
      id_usuario: this.idUsuario!,
      id_patrimonio: dados.id_patrimonio ?? null,
      id_tipo_chamado: dados.id_tipo_chamado,
      descricao_problema: dados.descricao_problema.trim(),
      prioridade: (dados.prioridade as Chamado['prioridade']) || 'Media',
      id_status: 1,
      data_abertura: new Date().toISOString(),
      data_previsao_conclusao: dados.data_previsao_conclusao || null
    };
    this.db.db.Chamado.push(novo);
    this.db.historico(novo.id_chamado, `Chamado aberto com prioridade ${novo.prioridade}.`);
    this.db.log('INSERT', `Chamado #${novo.id_chamado} aberto.`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: `Chamado #${novo.id_chamado} aberto com sucesso!`, id: novo.id_chamado };
  }

  atualizarStatusChamado(id: number, status: number) {
    const c = this.db.db.Chamado.find(x => x.id_chamado === id);
    if (!c) return { ok: false, erro: 'Chamado não encontrado.' };
    c.id_status = status as Chamado['id_status'];
    this.db.historico(id, `Status alterado para ${STATUS_CHAMADO[status]}.`);
    this.db.log('UPDATE', `Chamado #${id} → ${STATUS_CHAMADO[status]}.`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Status atualizado.' };
  }

  alterarPrioridade(id: number, prioridade: string) {
    const c = this.db.db.Chamado.find(x => x.id_chamado === id);
    if (!c) return { ok: false, erro: 'Chamado não encontrado.' };
    c.prioridade = prioridade as Chamado['prioridade'];
    this.db.historico(id, `Prioridade alterada para ${prioridade}.`);
    this.db.persistir();
    return { ok: true, mensagem: 'Prioridade atualizada.' };
  }

  cancelarChamado(id: number, motivo = '') {
    const r = this.atualizarStatusChamado(id, 4);
    if (r.ok && motivo) this.db.historico(id, `Cancelado. Motivo: ${motivo}`);
    this.db.persistir();
    return r;
  }

  reabrirChamado(id: number) {
    const r = this.atualizarStatusChamado(id, 1);
    if (r.ok) this.db.historico(id, 'Chamado reaberto.');
    this.db.persistir();
    return r;
  }

  excluirChamado(id: number) {
    const c = this.db.db.Chamado.find(x => x.id_chamado === id);
    if (!c) return { ok: false, erro: 'Chamado não encontrado.' };
    this.db.db.Chamado = this.db.db.Chamado.filter(x => x.id_chamado !== id);
    this.db.db.Historico = this.db.db.Historico.filter(h => h.id_chamado !== id);
    this.db.db.Anexo = this.db.db.Anexo.filter(a => a.id_chamado !== id);
    this.db.db.Manutencao = this.db.db.Manutencao.filter(m => m.id_chamado !== id);
    this.db.log('DELETE', `Chamado #${id} excluído.`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Chamado excluído.' };
  }

  anexarFoto(id: number, nomeArquivo: string) {
    this.db.db.Anexo.push({
      id_anexo: this.db.proximoId('Anexo'),
      id_chamado: id,
      caminho: nomeArquivo,
      data_upload: new Date().toISOString()
    });
    this.db.historico(id, `Anexo enviado: ${nomeArquivo}`);
    this.db.persistir();
    return { ok: true, mensagem: 'Anexo enviado.' };
  }

  // ========================================================= MANUTENÇÃO
  iniciarReparo(id: number) {
    const c = this.db.db.Chamado.find(x => x.id_chamado === id);
    if (!c) return { ok: false, erro: 'Chamado não encontrado.' };
    if (this.db.db.Manutencao.some(m => m.id_chamado === id && !m.data_fim)) {
      return { ok: false, erro: 'Já existe um reparo em andamento.' };
    }
    this.db.db.Manutencao.push({
      id_manutencao: this.db.proximoId('Manutencao'),
      id_chamado: id,
      data_inicio: hojeISO(),
      data_fim: null,
      observacao: null,
      custo: 0
    });
    this.atualizarStatusChamado(id, 2);
    this.db.historico(id, 'Reparo iniciado.');
    this.db.persistir();
    return { ok: true, mensagem: 'Reparo iniciado.' };
  }

  finalizarReparo(id: number, observacao: string, custo: number) {
    const m = this.db.db.Manutencao.find(x => x.id_chamado === id && !x.data_fim);
    if (!m) return { ok: false, erro: 'Nenhum reparo em andamento para este chamado.' };
    m.data_fim = hojeISO();
    m.observacao = observacao || null;
    m.custo = Number(custo || 0);
    this.atualizarStatusChamado(id, 3);
    this.db.historico(id, `Reparo concluído. ${observacao || ''}`.trim());
    if (m.custo > 0) {
      const c = this.db.db.Chamado.find(x => x.id_chamado === id);
      this.db.db.Lancamento_caixa.push({
        id_lancamento: this.db.proximoId('Lancamento_caixa'),
        data_lancamento: new Date().toISOString(),
        tipo_movimento: 'Despesa',
        descricao: `Manutenção do Chamado #${id}${c?.id_patrimonio ? ` (${this.db.patrimonio(c.id_patrimonio)?.numero_patrimonio})` : ''}`,
        valor: m.custo,
        forma_pagamento: 'Pix',
        numero_documento: null,
        bimestre: null,
        id_verba: 1,
        categoria: 'Manutenção',
        aprovacao: 1
      });
    }
    this.db.persistir();
    return { ok: true, mensagem: 'Reparo finalizado e chamado concluído.' };
  }

  estimarCusto(id: number) {
    const manuts = this.db.db.Manutencao.filter(m => m.id_chamado === id);
    const custo = manuts.reduce((s, m) => s + Number(m.custo || 0), 0);
    const chamado = this.db.db.Chamado.find(c => c.id_chamado === id);
    const p = chamado ? this.db.patrimonio(chamado.id_patrimonio) : null;
    const base = p ? this.db.depreciar(p.valor_atual, p.data_aquisicao, p.taxa_depreciacao) : 0;
    const estimado = custo > 0 ? custo : Math.round(base * 0.25 * 100) / 100;
    return { custo_registrado: custo, estimado, valor_bem: base, recomenda_troca: estimado > base * 0.6 };
  }

  obterManutencao(id: number) {
    return this.db.db.Manutencao.filter(m => m.id_chamado === id);
  }

  // ======================================================== MOVIMENTAÇÕES
  listarMovimentacoes(filtro?: { busca?: string; sala_origem?: number | null; sala_destino?: number | null }) {
    let lista = [...this.db.db.Movimentacao];
    if (filtro?.sala_origem) lista = lista.filter(m => m.id_sala_origem === filtro.sala_origem);
    if (filtro?.sala_destino) lista = lista.filter(m => m.id_sala_destino === filtro.sala_destino);
    if (filtro?.busca) {
      const b = filtro.busca.toLowerCase();
      lista = lista.filter(m => {
        const o = this.db.sala(m.id_sala_origem)?.numero_sala?.toLowerCase() ?? '';
        const d = this.db.sala(m.id_sala_destino)?.numero_sala?.toLowerCase() ?? '';
        return o.includes(b) || d.includes(b);
      });
    }
    return lista
      .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao))
      .map(m => {
        const so = this.db.sala(m.id_sala_origem);
        const sd = this.db.sala(m.id_sala_destino);
        const itens = this.db.db.item_movimentacao.filter(i => i.id_movimentacao === m.id_movimentacao);
        return {
          ...m,
          data_formatada: this.formatarDataHora(m.data_movimentacao),
          sala_origem: so?.numero_sala ?? '—',
          bloco_origem: so?.bloco ?? null,
          sala_destino: sd?.numero_sala ?? '—',
          bloco_destino: sd?.bloco ?? null,
          total_itens: itens.length,
          itens: itens.map(i => this.db.patrimonio(i.id_patrimonio)).filter(Boolean)
        };
      });
  }

  criarMovimentacao(idOrigem: number | null, idDestino: number, idsPatrimonios: number[]) {
    if (!idDestino) return { ok: false, erro: 'Selecione a sala de destino.' };
    if (!idsPatrimonios.length) return { ok: false, erro: 'Selecione pelo menos um bem.' };
    const mov: Movimentacao = {
      id_movimentacao: this.db.proximoId('Movimentacao'),
      data_movimentacao: new Date().toISOString(),
      id_sala_origem: idOrigem,
      id_sala_destino: idDestino
    };
    this.db.db.Movimentacao.push(mov);
    idsPatrimonios.forEach(idP => {
      this.db.db.item_movimentacao.push({
        id_item: this.db.proximoId('item_movimentacao'),
        id_movimentacao: mov.id_movimentacao,
        id_patrimonio: idP
      });
      const p = this.db.patrimonio(idP);
      if (p) p.id_sala = idDestino;
    });
    const destino = this.db.sala(idDestino)?.numero_sala ?? '—';
    this.db.log('INSERT', `Movimentação #${mov.id_movimentacao} para ${destino} (${idsPatrimonios.length} item(ns)).`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Movimentação registrada com sucesso!' };
  }

  excluirMovimentacao(id: number) {
    this.db.db.Movimentacao = this.db.db.Movimentacao.filter(m => m.id_movimentacao !== id);
    this.db.db.item_movimentacao = this.db.db.item_movimentacao.filter(i => i.id_movimentacao !== id);
    this.db.persistir();
    return { ok: true, mensagem: 'Movimentação excluída.' };
  }

  resumoMovimentacoes() {
    const movs = this.db.db.Movimentacao;
    const salas = new Set<number>();
    movs.forEach(m => {
      if (m.id_sala_origem) salas.add(m.id_sala_origem);
      if (m.id_sala_destino) salas.add(m.id_sala_destino);
    });
    const ultima = movs.length ? movs.map(m => m.data_movimentacao).sort().pop()! : null;
    return {
      total_movimentacoes: movs.length,
      total_itens_movimentados: this.db.db.item_movimentacao.length,
      salas_envolvidas: salas.size,
      ultima_movimentacao: ultima ? this.formatarDataHora(ultima) : null
    };
  }

  // =============================================================== BAIXA
  verificarBaixa(id: number) {
    const p = this.db.patrimonio(id);
    if (!p) return { ok: false, erro: 'Patrimônio não encontrado.' };
    if (p.processo_baixa && p.id_status === 3) return { ok: false, erro: 'Este bem já foi baixado.' };
    const abertos = this.db.db.Chamado.filter(c => c.id_patrimonio === id && [1, 2].includes(c.id_status));
    return {
      ok: true,
      bem: this.montarItem(p),
      chamados_abertos: abertos.length,
      alerta: abertos.length ? 'Existem chamados abertos para este bem. Recomenda-se concluí-los antes da baixa.' : null
    };
  }

  registrarBaixa(id: number, motivo: string, laudo: string, processo: string) {
    const p = this.db.patrimonio(id);
    if (!p) return { ok: false, erro: 'Patrimônio não encontrado.' };
    if (!motivo) return { ok: false, erro: 'Informe o motivo da baixa.' };
    const data = new Date().toLocaleDateString('pt-BR');
    p.descricao = `${p.descricao ?? ''}\n\n--- BAIXA EM ${data} ---\nMotivo: ${motivo}\nLaudo: ${laudo || '—'}` +
      (processo ? `\nProcesso: ${processo}` : '');
    p.processo_baixa = hojeISO();
    p.id_status = 3;
    this.db.log('UPDATE', `Baixa registrada para ${p.numero_patrimonio}. Motivo: ${motivo}`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Baixa registrada com sucesso.' };
  }

  listarBaixas() {
    return this.db.db.Patrimonio
      .filter(p => p.processo_baixa && p.id_status === 3)
      .sort((a, b) => (b.processo_baixa ?? '').localeCompare(a.processo_baixa ?? ''))
      .map(p => {
        const sala = this.db.sala(p.id_sala);
        const m = /Motivo:\s*([^\n]+)/.exec(p.descricao || '');
        return {
          id_patrimonio: p.id_patrimonio,
          nome: p.nome,
          numero_patrimonio: p.numero_patrimonio,
          valor_atual: Number(p.valor_atual || 0),
          data_aquisicao: p.data_aquisicao ? p.data_aquisicao.split('-').reverse().join('/') : '—',
          data_baixa: p.processo_baixa ? p.processo_baixa.split('-').reverse().join('/') : '—',
          nome_sala: sala?.numero_sala ?? '—',
          bloco_sala: sala?.bloco ?? null,
          nome_categoria: this.db.categoria(p.id_categoria)?.nome ?? '—',
          motivo: m ? m[1].trim() : '—'
        };
      });
  }

  resumoBaixas() {
    const baixados = this.db.db.Patrimonio.filter(p => p.processo_baixa && p.id_status === 3);
    const agora = new Date();
    const mes = baixados.filter(p => {
      const d = new Date(p.processo_baixa! + 'T00:00:00');
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    });
    const datas = baixados.map(p => p.processo_baixa!).sort();
    return {
      total_baixados: baixados.length,
      valor_total_perdido: baixados.reduce((s, p) => s + Number(p.valor_atual || 0), 0),
      baixas_mes_atual: mes.length,
      ultima_baixa: datas.length ? datas[datas.length - 1].split('-').reverse().join('/') : null
    };
  }

  // ============================================================ ALUGADOS
  listarAlugados(filtro?: { busca?: string; vencendo?: string; incluir_vencidos?: boolean }) {
    let lista = this.db.db.Patrimonio.filter(p => {
      const o = (p.origem || '').toLowerCase();
      return o.includes('alugado') || o.includes('terceiriz') || o.includes('locad');
    });
    if (filtro?.busca) {
      const b = filtro.busca.toLowerCase();
      lista = lista.filter(p =>
        (p.nome || '').toLowerCase().includes(b) ||
        (p.numero_patrimonio || '').toLowerCase().includes(b) ||
        (p.nota_fiscal || '').toLowerCase().includes(b));
    }
    let itens = lista.map(p => {
      const fim = extrairDataFimContrato(p.descricao);
      const dias = diasAte(fim);
      return {
        id_patrimonio: p.id_patrimonio,
        nome: p.nome,
        numero_patrimonio: p.numero_patrimonio,
        valor_atual: Number(p.valor_atual || 0),
        valor_mensal: Number(p.valor_atual || 0),
        fornecedor: p.nota_fiscal ?? '—',
        tipo_posse: p.origem ?? '—',
        data_inicio_contrato: p.processo_baixa ? p.processo_baixa.split('-').reverse().join('/') : '—',
        data_fim_contrato_iso: fim,
        data_fim_contrato: fim ? fim.split('-').reverse().join('/') : null,
        dias_restantes: dias,
        status_contrato: statusContrato(dias),
        nome_sala: this.db.sala(p.id_sala)?.numero_sala ?? 'Não Alocado',
        nome_categoria: this.db.categoria(p.id_categoria)?.nome ?? '—',
        descricao: p.descricao
      };
    });
    if (filtro?.vencendo) {
      const lim = { '30d': 30, '60d': 60, '90d': 90 }[filtro.vencendo];
      if (lim) itens = itens.filter(i => i.dias_restantes !== null && i.dias_restantes >= 0 && i.dias_restantes <= lim);
    }
    if (filtro?.incluir_vencidos === false) itens = itens.filter(i => i.status_contrato !== 'Vencido');
    return itens.sort((a, b) => b.id_patrimonio - a.id_patrimonio);
  }

  resumoAlugados() {
    const itens = this.listarAlugados();
    return {
      total: itens.length,
      valor_mensal_total: itens.reduce((s, i) => s + i.valor_mensal, 0),
      vencendo_30: itens.filter(i => i.dias_restantes !== null && i.dias_restantes >= 0 && i.dias_restantes <= 30).length,
      vencidos: itens.filter(i => i.status_contrato === 'Vencido').length,
      fornecedores: new Set(itens.map(i => i.fornecedor)).size
    };
  }

  cadastrarAlugado(dados: {
    nome: string; numero_patrimonio: string; fornecedor: string; valor_mensal: number;
    data_inicio: string; data_fim: string; id_sala: number | null; tipo_posse: string;
  }) {
    if (this.db.db.Patrimonio.some(p => p.numero_patrimonio === dados.numero_patrimonio)) {
      return { ok: false, erro: 'Já existe um bem com este número de patrimônio.' };
    }
    const descricao = `Equipamento ${dados.tipo_posse.toLowerCase()} de ${dados.fornecedor}.\n\n[CONTRATO:FIM:${dados.data_fim}]`;
    const p: Patrimonio = {
      id_patrimonio: this.db.proximoId('Patrimonio'),
      nome: dados.nome,
      numero_patrimonio: dados.numero_patrimonio,
      valor_atual: Number(dados.valor_mensal || 0),
      data_aquisicao: dados.data_inicio || hojeISO(),
      taxa_depreciacao: 0,
      id_sala: dados.id_sala,
      id_categoria: this.db.db.Categoria[0]?.id_categoria ?? null,
      id_status: 1,
      descricao,
      nota_fiscal: dados.fornecedor,
      origem: dados.tipo_posse || 'Alugado',
      id_verba: null,
      processo_baixa: dados.data_inicio || hojeISO()
    };
    this.db.db.Patrimonio.push(p);
    this.db.log('INSERT', `Bem locado ${p.numero_patrimonio} cadastrado (${dados.fornecedor}).`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Bem alugado cadastrado.' };
  }

  editarAlugado(id: number, dados: { fornecedor?: string; valor_mensal?: number; data_fim?: string; id_sala?: number | null }) {
    const p = this.db.patrimonio(id);
    if (!p) return { ok: false, erro: 'Bem não encontrado.' };
    if (dados.fornecedor) p.nota_fiscal = dados.fornecedor;
    if (dados.valor_mensal !== undefined) p.valor_atual = Number(dados.valor_mensal);
    if (dados.id_sala !== undefined) p.id_sala = dados.id_sala;
    if (dados.data_fim) {
      p.descricao = (p.descricao || '').replace(/\[CONTRATO:FIM:[^\]]+\]/g, '').trim() +
        `\n\n[CONTRATO:FIM:${dados.data_fim}]`;
    }
    this.db.persistir();
    return { ok: true, mensagem: 'Contrato atualizado.' };
  }

  excluirAlugado(id: number) {
    this.db.excluirPatrimonio(id);
    return { ok: true, mensagem: 'Bem locado removido.' };
  }

  // ============================================================= REPAROS
  rankingReparos(limite = 20, periodoDias = 365) {
    const limiteData = Date.now() - periodoDias * 86400000;
    const mapa = new Map<number, any>();
    this.db.db.Chamado
      .filter(c => c.id_patrimonio && new Date(c.data_abertura).getTime() >= limiteData)
      .forEach(c => {
        const id = c.id_patrimonio!;
        const p = this.db.patrimonio(id);
        if (!p) return;
        if (!mapa.has(id)) {
          mapa.set(id, {
            id_patrimonio: id,
            nome: p.nome,
            numero_patrimonio: p.numero_patrimonio,
            nome_sala: this.db.sala(p.id_sala)?.numero_sala ?? 'Não Alocado',
            bloco_sala: this.db.sala(p.id_sala)?.bloco ?? null,
            nome_categoria: this.db.categoria(p.id_categoria)?.nome ?? '—',
            total_chamados: 0,
            chamados_concluidos: 0,
            chamados_ativos: 0,
            total_manutencoes: 0,
            valor_total_gasto: 0,
            _datas: [] as string[]
          });
        }
        const row = mapa.get(id);
        row.total_chamados++;
        if (c.id_status === 3) row.chamados_concluidos++;
        if (c.id_status === 1 || c.id_status === 2) row.chamados_ativos++;
        row.total_manutencoes += this.db.db.Manutencao.filter(m => m.id_chamado === c.id_chamado).length;
        row.valor_total_gasto += this.db.db.Manutencao
          .filter(m => m.id_chamado === c.id_chamado)
          .reduce((s, m) => s + Number(m.custo || 0), 0);
        row._datas.push(c.data_abertura);
      });
    return [...mapa.values()]
      .map(r => {
        const datas = r._datas.sort();
        delete r._datas;
        const nivel = r.total_chamados >= 5 ? 'Crítico' : r.total_chamados >= 3 ? 'Alto' : r.total_chamados >= 2 ? 'Médio' : 'Baixo';
        return {
          ...r,
          ultimo_chamado: datas.length ? this.formatarDataHora(datas[datas.length - 1]).split(' ')[0] : '—',
          primeiro_chamado: datas.length ? this.formatarDataHora(datas[0]).split(' ')[0] : '—',
          nivel_reincidencia: nivel
        };
      })
      .sort((a, b) => b.total_chamados - a.total_chamados || b.valor_total_gasto - a.valor_total_gasto)
      .slice(0, limite);
  }

  resumoReparos() {
    const manuts = this.db.db.Manutencao;
    const concluidas = manuts.filter(m => m.data_inicio && m.data_fim);
    const dias = concluidas.map(m => Math.abs(
      (new Date(m.data_fim!).getTime() - new Date(m.data_inicio!).getTime()) / 86400000));
    return {
      total_reparos: manuts.length,
      bens_com_reparo: new Set(
        manuts.map(m => this.db.db.Chamado.find(c => c.id_chamado === m.id_chamado)?.id_patrimonio)
          .filter(Boolean) as number[]
      ).size,
      bens_criticos: this.rankingReparos(999, 365).filter(r => r.total_chamados >= 3).length,
      custo_total_manutencoes: manuts.reduce((s, m) => s + Number(m.custo || 0), 0),
      tempo_medio_reparo_dias: dias.length ? Number((dias.reduce((a, b) => a + b, 0) / dias.length).toFixed(1)) : 0
    };
  }

  reparosPorPatrimonio(id: number) {
    const p = this.db.patrimonio(id);
    if (!p) return null;
    const chamados = this.db.db.Chamado
      .filter(c => c.id_patrimonio === id)
      .sort((a, b) => b.data_abertura.localeCompare(a.data_abertura))
      .map(c => {
        const manuts = this.db.db.Manutencao.filter(m => m.id_chamado === c.id_chamado);
        return {
          ...this.montarChamado(c),
          manutencoes: manuts,
          custo_total: manuts.reduce((s, m) => s + Number(m.custo || 0), 0)
        };
      });
    const custo = chamados.reduce((s, c) => s + c.custo_total, 0);
    return {
      patrimonio: this.montarItem(p),
      chamados,
      resumo: {
        total_chamados: chamados.length,
        total_manutencoes: chamados.reduce((s, c) => s + c.manutencoes.length, 0),
        custo_total: custo,
        valor_bem: this.db.depreciar(p.valor_atual, p.data_aquisicao, p.taxa_depreciacao)
      }
    };
  }

  // =========================================================== HISTÓRICO
  listarHistorico(idPatrimonio?: number | null) {
    const todos = [...this.db.db.Historico]
      .sort((a, b) => b.data_evento.localeCompare(a.data_evento))
      .map(h => {
        const c = h.id_chamado ? this.db.db.Chamado.find(x => x.id_chamado === h.id_chamado) : null;
        const u = c ? this.db.usuario(c.id_usuario) : null;
        return {
          ...h,
          id_patrimonio: c?.id_patrimonio ?? null,
          data_evento_fmt: this.formatarDataHora(h.data_evento),
          descricao_problema: c?.descricao_problema ?? null,
          prioridade: c?.prioridade ?? null,
          nome_usuario: u?.nome ?? 'Sistema'
        };
      });

    if (!idPatrimonio) return todos;

    const p = this.db.patrimonio(idPatrimonio);
    if (!p) return null;
    const eventos = todos
      .filter(h => h.id_patrimonio === idPatrimonio)
      .map(h => ({ data: h.data_evento, tipo: h.nome_usuario, descricao: h.descricao }));

    // movimentações do bem
    this.db.db.item_movimentacao.forEach((mi: any) => {
      const m = this.db.db.Movimentacao.find(x => x.id_movimentacao === mi.id_movimentacao);
      if (mi.id_patrimonio === idPatrimonio && m) {
        eventos.push({
          data: m.data_movimentacao,
          tipo: 'Movimentação',
          descricao: `Transferido de ${this.db.sala(m.id_sala_origem)?.numero_sala ?? '—'} para ${this.db.sala(m.id_sala_destino)?.numero_sala ?? '—'}.`
        });
      }
    });

    eventos.sort((a, b) => b.data.localeCompare(a.data));

    return {
      patrimonio: {
        id_patrimonio: p.id_patrimonio,
        nome: p.nome,
        numero_patrimonio: p.numero_patrimonio,
        nome_sala: this.db.sala(p.id_sala)?.numero_sala ?? '—',
        nome_status: this.db.status(p.id_status)?.nome ?? '—'
      },
      eventos
    };
  }

  // =========================================================== FINANCEIRO
  resumoFinanceiro() {
    const l = this.db.db.Lancamento_caixa;
    const entradas = l.filter(x => x.tipo_movimento === 'Receita').reduce((s, x) => s + Number(x.valor), 0);
    const saidas = l.filter(x => x.tipo_movimento === 'Despesa').reduce((s, x) => s + Number(x.valor), 0);
    return {
      total_entradas: entradas,
      total_saidas: saidas,
      saldo_atual: Number((entradas - saidas).toFixed(2)),
      total_movimentacoes: l.length,
      saldo_bloqueado: this.db.db.verba.reduce((s, v) => s + Number(v.saldo_bloqueado || 0), 0)
    };
  }

  listarLancamentos(filtro?: {
    tipo?: string; categoria?: string; origem?: string; busca?: string;
    data_ini?: string; data_fim?: string;
  }) {
    let lista = [...this.db.db.Lancamento_caixa];
    if (filtro?.tipo) lista = lista.filter(l => l.tipo_movimento === filtro.tipo);
    if (filtro?.categoria) lista = lista.filter(l => (l.categoria || '') === filtro.categoria);
    if (filtro?.busca) {
      const b = filtro.busca.toLowerCase();
      lista = lista.filter(l => l.descricao.toLowerCase().includes(b) || (l.numero_documento || '').toLowerCase().includes(b));
    }
    if (filtro?.data_ini) lista = lista.filter(l => l.data_lancamento.slice(0, 10) >= filtro.data_ini!);
    if (filtro?.data_fim) lista = lista.filter(l => l.data_lancamento.slice(0, 10) <= filtro.data_fim!);
    let itens = lista
      .sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento))
      .map(l => {
        const v = this.db.verba(l.id_verba);
        const origem = extrairOrigemVerba(v?.nome) ?? (v ? null : null);
        return {
          ...l,
          data_formatada: this.formatarDataHora(l.data_lancamento),
          verba_nome: v?.nome ?? null,
          origem,
          origem_nome: origem ? ORIGENS_VALIDAS[origem]?.nome ?? null : null,
          origem_cor: origem ? ORIGENS_VALIDAS[origem]?.cor ?? null : null,
          origem_icone: origem ? ORIGENS_VALIDAS[origem]?.icone ?? null : null,
          status: l.tipo_movimento === 'Despesa' ? (l.aprovacao === 1 ? 'Aprovado' : 'Pendente') : 'Recebido'
        };
      });
    if (filtro?.origem) {
      itens = filtro.origem === 'SEM_ORIGEM'
        ? itens.filter(i => !i.origem)
        : itens.filter(i => i.origem === filtro.origem);
    }
    return itens;
  }

  criarLancamento(dados: {
    tipo_movimento: 'Receita' | 'Despesa'; descricao: string; valor: number;
    categoria?: string; forma_pagamento?: string; numero_documento?: string;
    aprovacao?: number; id_verba?: number | null; data?: string;
  }) {
    if (!dados.descricao?.trim()) return { ok: false, erro: 'Informe a descrição.' };
    if (!dados.valor || Number(dados.valor) <= 0) return { ok: false, erro: 'Informe um valor maior que zero.' };
    const l: LancamentoCaixa = {
      id_lancamento: this.db.proximoId('Lancamento_caixa'),
      data_lancamento: dados.data ? new Date(dados.data + 'T12:00:00').toISOString() : new Date().toISOString(),
      tipo_movimento: dados.tipo_movimento,
      descricao: dados.descricao.trim(),
      valor: Number(dados.valor),
      forma_pagamento: dados.forma_pagamento || 'Pix',
      numero_documento: dados.numero_documento || null,
      bimestre: null,
      id_verba: dados.id_verba ?? null,
      categoria: dados.tipo_movimento === 'Despesa' ? (dados.categoria || null) : null,
      aprovacao: dados.tipo_movimento === 'Despesa' ? ((dados.aprovacao ?? 0) as 0 | 1) : 1
    };
    this.db.db.Lancamento_caixa.push(l);
    this.db.log('INSERT', `Lançamento ${l.tipo_movimento} de R$ ${l.valor.toFixed(2)}: ${l.descricao}`, this.idUsuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Movimentação registrada.' };
  }

  editarLancamento(id: number, dados: Partial<LancamentoCaixa>) {
    const l = this.db.db.Lancamento_caixa.find(x => x.id_lancamento === id);
    if (!l) return { ok: false, erro: 'Lançamento não encontrado.' };
    Object.assign(l, dados);
    this.db.persistir();
    return { ok: true, mensagem: 'Lançamento atualizado.' };
  }

  excluirLancamento(id: number) {
    this.db.db.Lancamento_caixa = this.db.db.Lancamento_caixa.filter(l => l.id_lancamento !== id);
    this.db.persistir();
    return { ok: true, mensagem: 'Lançamento excluído.' };
  }

  categoriasFinanceiro() {
    return [...new Set(this.db.db.Lancamento_caixa.map(l => l.categoria).filter(Boolean) as string[])].sort();
  }

  verbas() {
    return this.db.db.verba;
  }

  graficoFinanceiro() {
    const mapa = new Map<string, { mes: string; mes_label: string; entradas: number; saidas: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mapa.set(chave, {
        mes: chave,
        mes_label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        entradas: 0,
        saidas: 0
      });
    }
    this.db.db.Lancamento_caixa.forEach(l => {
      const chave = l.data_lancamento.slice(0, 7);
      const item = mapa.get(chave);
      if (!item) return;
      if (l.tipo_movimento === 'Receita') item.entradas += Number(l.valor);
      else item.saidas += Number(l.valor);
    });
    return [...mapa.values()];
  }

  origensFinanceiro() {
    const base: Record<string, any> = {};
    Object.entries(ORIGENS_VALIDAS).forEach(([k, v]) => {
      base[k] = { id: k, ...v, total_movimentacoes: 0, entradas: 0, saidas: 0 };
    });
    this.listarLancamentos().forEach(l => {
      const chave = l.origem ?? 'SEM_ORIGEM';
      const o = base[chave] ?? base['SEM_ORIGEM'];
      o.total_movimentacoes++;
      if (l.tipo_movimento === 'Receita') o.entradas += Number(l.valor);
      else o.saidas += Number(l.valor);
    });
    return Object.values(base).map((o: any) => ({ ...o, saldo: Number((o.entradas - o.saidas).toFixed(2)) }));
  }

  // ============================================================ RELATÓRIOS
  resumoRelatorios(ano: number, periodo: string) {
    const doAno = this.db.db.Lancamento_caixa.filter(l => new Date(l.data_lancamento).getFullYear() === ano);
    const entradas = doAno.filter(l => l.tipo_movimento === 'Receita').reduce((s, l) => s + Number(l.valor), 0);
    const saidas = doAno.filter(l => l.tipo_movimento === 'Despesa').reduce((s, l) => s + Number(l.valor), 0);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const porPeriodo = meses.map((m, i) => {
      const ls = doAno.filter(l => new Date(l.data_lancamento).getMonth() === i);
      const e = ls.filter(l => l.tipo_movimento === 'Receita').reduce((s, l) => s + Number(l.valor), 0);
      const s = ls.filter(l => l.tipo_movimento === 'Despesa').reduce((s2, l) => s2 + Number(l.valor), 0);
      return { mes: i + 1, mes_nome: m, entradas: e, saidas: s, saldo: Number((e - s).toFixed(2)), total_movimentacoes: ls.length };
    });

    const od: Record<string, any> = {};
    doAno.forEach(l => {
      const v = this.db.verba(l.id_verba);
      const origem = extrairOrigemVerba(v?.nome) ?? 'SEM_ORIGEM';
      const chave = ORIGENS_VALIDAS[origem] ? origem : 'SEM_ORIGEM';
      const info = ORIGENS_VALIDAS[chave];
      if (!od[chave]) od[chave] = { id: chave, nome: info.nome, cor: info.cor, icone: info.icone, entradas: 0, saidas: 0 };
      if (l.tipo_movimento === 'Receita') od[chave].entradas += Number(l.valor);
      else od[chave].saidas += Number(l.valor);
    });
    Object.values(od).forEach((o: any) => {
      o.saldo = Number((o.entradas - o.saidas).toFixed(2));
    });

    const catMapa: Record<string, { total: number; quantidade: number }> = {};
    doAno.filter(l => l.tipo_movimento === 'Despesa').forEach(l => {
      const c = l.categoria || 'Sem categoria';
      catMapa[c] = catMapa[c] || { total: 0, quantidade: 0 };
      catMapa[c].total += Number(l.valor);
      catMapa[c].quantidade++;
    });
    const porCategoria = Object.entries(catMapa)
      .map(([categoria, v]) => ({ categoria, total: v.total, quantidade: v.quantidade }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    const config: Record<string, { np: number; div: number; rotulo: (i: number) => string }> = {
      mensal: { np: 12, div: 1, rotulo: i => meses[i] },
      bimestral: { np: 6, div: 2, rotulo: i => `${i + 1}º Bimestre` },
      trimestral: { np: 4, div: 3, rotulo: i => `${i + 1}º Trimestre` },
      semestral: { np: 2, div: 6, rotulo: i => `${i + 1}º Semestre` },
      anual: { np: 1, div: 12, rotulo: () => `Ano ${ano}` }
    };
    const cfg = config[periodo] ?? config['bimestral'];
    const detalhamento = Array.from({ length: cfg.np }, (_, i) => {
      const mi = i * cfg.div, mf = (i + 1) * cfg.div - 1;
      const ls = doAno.filter(l => {
        const m = new Date(l.data_lancamento).getMonth();
        return m >= mi && m <= mf;
      });
      const e = ls.filter(l => l.tipo_movimento === 'Receita').reduce((s, l) => s + Number(l.valor), 0);
      const s = ls.filter(l => l.tipo_movimento === 'Despesa').reduce((s2, l) => s2 + Number(l.valor), 0);
      return {
        label: cfg.rotulo(i), mes_ini: mi + 1, mes_fim: mf + 1,
        entradas: Number(e.toFixed(2)), saidas: Number(s.toFixed(2)),
        saldo: Number((e - s).toFixed(2)), movimentacoes: ls.length
      };
    });

    return {
      ano, periodo,
      resumo_geral: {
        total_entradas: entradas, total_saidas: saidas,
        saldo: Number((entradas - saidas).toFixed(2)), total_movimentacoes: doAno.length
      },
      por_origem: Object.values(od),
      por_categoria: porCategoria,
      por_periodo: porPeriodo,
      detalhamento
    };
  }

  // ================================================================ ADMIN
  estatisticasAdmin() {
    const porPerfil = this.db.db.Perfil.map(p => ({
      perfil: p.nome,
      qtd: this.db.db.Usuario.filter(u => u.id_perfil === p.id_perfil).length
    }));
    const porStatus = this.db.db._status.map(s => ({
      status: s.nome,
      qtd: this.db.db.Patrimonio.filter(p => p.id_status === s.id_status).length
    }));
    const chamadosPorStatus = [1, 2, 3, 4].map(id => ({
      id_status: id,
      nome: STATUS_CHAMADO[id],
      qtd: this.db.db.Chamado.filter(c => c.id_status === id).length
    }));
    const agora = new Date();
    return {
      usuarios_por_perfil: porPerfil,
      patrimonios_por_status: porStatus,
      chamados_por_status: chamadosPorStatus,
      valor_total_patrimonio: Number(this.db.db.Patrimonio
        .filter(p => p.id_status !== 3)
        .reduce((s, p) => s + this.db.depreciar(p.valor_atual, p.data_aquisicao, p.taxa_depreciacao), 0)
        .toFixed(2)),
      chamados_concluidos_mes: this.db.db.Chamado.filter(c => {
        const d = new Date(c.data_abertura);
        return c.id_status === 3 && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
      }).length,
      total_usuarios: this.db.db.Usuario.length,
      total_bens: this.db.db.Patrimonio.length,
      total_chamados: this.db.db.Chamado.length,
      total_patrimonios: this.db.db.Patrimonio.length,
      chamados_ativos: this.db.db.Chamado.filter(c => c.id_status === 1 || c.id_status === 2).length,
      total_logs: this.db.db.Log_auditoria.length
    };
  }

  listarLogs(limite = 500) {
    return [...this.db.db.Log_auditoria]
      .sort((a, b) => b.data_hora.localeCompare(a.data_hora))
      .slice(0, limite)
      .map(l => ({
        ...l,
        detalhes: l.descricao,
        ip: '127.0.0.1',
        data_hora_fmt: this.formatarDataHora(l.data_hora),
        nome_usuario: this.db.usuario(l.id_usuario)?.nome ?? 'Sistema'
      }));
  }

  registrarLog(acao: string, descricao: string) {
    this.db.log(acao, descricao, this.idUsuario);
    this.db.persistir();
  }

  // ========================================================== NOTIFICAÇÕES
  listarNotificacoes() {
    const lista: any[] = [];
    this.db.db.Alerta.forEach(a => {
      const dias = diasAte(a.data_vencimento);
      const urg = dias !== null && dias < 0 ? 'vencido' : dias !== null && dias <= 3 ? 'urgente' : 'info';
      lista.push({
        id: `alerta-${a.id_alerta}`,
        tipo: a.id_tipo_alerta === 1 ? 'sla' : 'garantia',
        urgencia: urg,
        titulo: this.db.db.Tipo_alerta.find(t => t.id_tipo_alerta === a.id_tipo_alerta)?.nome ?? 'Alerta',
        mensagem: a.mensagem,
        data: a.data_vencimento.split('-').reverse().join('/'),
        link: '/admin',
        origem: 'Alerta'
      });
    });

    this.db.db.Chamado
      .filter(c => [1, 2].includes(c.id_status))
      .forEach(c => {
        const dias = Math.floor((Date.now() - new Date(c.data_abertura).getTime()) / 86400000);
        if (dias < 7) return;
        const p = this.db.patrimonio(c.id_patrimonio);
        lista.push({
          id: `chamado-${c.id_chamado}`,
          tipo: 'chamado',
          urgencia: dias >= 30 ? 'vencido' : dias >= 14 ? 'urgente' : 'info',
          titulo: `Chamado #${c.id_chamado} aberto há ${dias} dias`,
          mensagem: `${p?.nome ?? 'Sem patrimônio'}: ${c.descricao_problema.slice(0, 80)}...`,
          data: new Date(c.data_abertura).toLocaleDateString('pt-BR'),
          link: '/chamados',
          origem: 'Chamado'
        });
      });

    this.listarAlugados().forEach(b => {
      if (b.dias_restantes === null || b.dias_restantes < -30 || b.dias_restantes > 30) return;
      lista.push({
        id: `contrato-${b.id_patrimonio}`,
        tipo: 'contrato',
        urgencia: b.dias_restantes < 0 ? 'vencido' : b.dias_restantes <= 7 ? 'urgente' : 'info',
        titulo: `Contrato ${b.dias_restantes < 0 ? 'vencido' : 'vence'} em ${Math.abs(b.dias_restantes)} dia(s)`,
        mensagem: `${b.nome} — ${b.fornecedor}`,
        data: b.data_fim_contrato ?? '—',
        link: '/alugados',
        origem: 'Locação'
      });
    });

    this.db.db.Manutencao
      .filter(m => !m.data_fim && m.data_inicio)
      .forEach(m => {
        const dias = Math.floor((Date.now() - new Date(m.data_inicio! + 'T00:00:00').getTime()) / 86400000);
        if (dias < 5) return;
        const c = this.db.db.Chamado.find(x => x.id_chamado === m.id_chamado);
        lista.push({
          id: `manutencao-${m.id_manutencao}`,
          tipo: 'manutencao',
          urgencia: dias >= 15 ? 'vencido' : dias >= 8 ? 'urgente' : 'info',
          titulo: `Reparo parado há ${dias} dias`,
          mensagem: `Chamado #${m.id_chamado} — ${c?.descricao_problema.slice(0, 70) ?? ''}`,
          data: m.data_inicio!.split('-').reverse().join('/'),
          link: '/reparos',
          origem: 'Manutenção'
        });
      });

    const lidas = this.db.notificacoesLidas();
    const ordem: Record<string, number> = { vencido: 0, urgente: 1, info: 2 };
    return lista
      .sort((a, b) => ordem[a.urgencia] - ordem[b.urgencia])
      .map(n => ({
        ...n,
        lida: lidas.includes(String(n.id)),
        icone: n.urgencia === 'vencido' ? '⛔' : n.urgencia === 'urgente' ? '⚠️' : 'ℹ️',
        data_fmt: n.data
      }));
  }

  criarAlerta(titulo: string, mensagem: string, tipo: string, destino = 'todos') {
    if (!mensagem?.trim()) return { ok: false, erro: 'Informe a mensagem do alerta.' };
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 30);
    this.db.db.Alerta.push({
      id_alerta: this.db.proximoId('Alerta'),
      mensagem: `${titulo} — ${mensagem.trim()}`.slice(0, 240),
      data_vencimento: hoje.toISOString().slice(0, 10),
      id_tipo_alerta: tipo === 'Urgente' ? 1 : 2
    } as any);
    this.db.persistir();
    return { ok: true, mensagem: 'Alerta criado.' };
  }

  listarAlertas() {
    return [...this.db.db.Alerta].sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento));
  }

  excluirAlerta(id: number) {
    this.db.db.Alerta = this.db.db.Alerta.filter(a => a.id_alerta !== id);
    this.db.persistir();
    return { ok: true };
  }

  // ================================================================ HOME
  estatisticasHome() {
    const chamados = this.listarChamados();
    return {
      itens: this.db.db.Patrimonio.length,
      salas: this.db.db.Sala.length,
      chamados_abertos: chamados.filter(c => c.id_status === 1 || c.id_status === 2).length,
      recentes: this.listarInventario().slice(0, 5)
    };
  }

  // =============================================================== BACKUP
  exportarJSON() {
    return JSON.stringify(this.db.exportar(), null, 2);
  }

  exportarSQL(): string {
    const banco = this.db.exportar();
    const linhas: string[] = [
      '-- Backup IPE (versão Ionic) gerado em ' + new Date().toLocaleString('pt-BR'),
      '-- Compatível com o esquema MySQL do sistema Flask (gestao_patrimonio)',
      'SET FOREIGN_KEY_CHECKS=0;',
      ''
    ];
    Object.entries(banco).forEach(([tabela, valor]) => {
      if (tabela === '_seq' || !Array.isArray(valor) || !valor.length) return;
      linhas.push(`-- ${tabela}`);
      (valor as any[]).forEach(reg => {
        const cols = Object.keys(reg);
        const vals = cols.map(c => {
          const v = (reg as any)[c];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return String(v);
          return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        linhas.push(`INSERT INTO \`${tabela}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${vals.join(', ')});`);
      });
      linhas.push('');
    });
    linhas.push('SET FOREIGN_KEY_CHECKS=1;');
    return linhas.join('\n');
  }

  exportarCSVTabela(tabela: string): { ok: boolean; csv?: string; erro?: string } {
    const dados = (this.db.exportar() as any)[tabela];
    if (!Array.isArray(dados)) return { ok: false, erro: `Tabela "${tabela}" não encontrada.` };
    if (!dados.length) return { ok: true, csv: 'sem registros\n' };
    const cols = Object.keys(dados[0]);
    const linhas = [cols.join(';')];
    dados.forEach(r => linhas.push(cols.map(c => {
      const v = (r as any)[c];
      const s = v === null || v === undefined ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(';')));
    return { ok: true, csv: linhas.join('\n') };
  }

  infoBackup() {
    const banco = this.db.exportar();
    const tamanho = new Blob([JSON.stringify(banco)]).size;
    return {
      tabelas: Object.entries(banco)
        .filter(([k, v]) => k !== '_seq' && Array.isArray(v))
        .map(([tabela, v]) => ({ tabela, registros: (v as any[]).length })),
      total_patrimonios: banco.Patrimonio.length,
      total_chamados: banco.Chamado.length,
      total_movimentacoes: banco.Movimentacao.length,
      total_usuarios: banco.Usuario.length,
      tamanho_bytes: tamanho,
      tamanho_kb: Math.round(tamanho / 102.4) / 10,
      gerado_em: new Date().toLocaleString('pt-BR')
    };
  }
}
