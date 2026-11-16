// ============================================================================
// MODELOS — espelham as tabelas MySQL do sistema original (gestao_patrimonio)
// ============================================================================

export type Perfil = 1 | 2; // 1 = Patrimônio (admin) | 2 = Usuário Padrão

export interface Usuario {
  id_usuario: number;
  nome: string;
  e_mail: string;
  senha: string;
  id_perfil: Perfil;
}

export interface PerfilTabela { id_perfil: Perfil; nome: string; }

export interface Sala {
  id_sala: number;
  numero_sala: string;
  bloco: string | null;
  id_tipo_sala?: number;
}

export interface Categoria { id_categoria: number; nome: string; }

export interface StatusBem { id_status: number; nome: string; }

export interface TipoChamado { id_tipo_chamado: number; nome: string; }
export interface TipoManutencao { id_tipo_manutencao: number; nome: string; }
export interface TipoAlerta { id_tipo_alerta: number; nome: string; }
export interface TipoVerba { id_tipo_verba: number; nome: string; }

export interface Patrimonio {
  id_patrimonio: number;
  nome: string;
  numero_patrimonio: string;
  valor_atual: number;
  data_aquisicao: string | null;
  taxa_depreciacao: number;
  id_sala: number | null;
  id_categoria: number | null;
  id_status: number;
  descricao: string | null;
  nota_fiscal: string | null;
  origem: string | null;
  id_verba: number | null;
  processo_baixa: string | null; // data (ISO) — em locações guarda o início do contrato
}

export interface Chamado {
  id_chamado: number;
  id_usuario: number;
  id_patrimonio: number | null;
  id_tipo_chamado: number | null;
  descricao_problema: string;
  prioridade: 'Baixa' | 'Media' | 'Alta';
  id_status: 1 | 2 | 3 | 4;
  data_abertura: string;
  data_previsao_conclusao: string | null;
}

export interface Manutencao {
  id_manutencao: number;
  id_chamado: number;
  data_inicio: string | null;
  data_fim: string | null;
  observacao: string | null;
  custo?: number;
}

export interface Movimentacao {
  id_movimentacao: number;
  data_movimentacao: string;
  id_sala_origem: number | null;
  id_sala_destino: number | null;
}

export interface ItemMovimentacao { id_item: number; id_movimentacao: number; id_patrimonio: number; }

export interface Verba {
  id_verba: number;
  nome: string;
  saldo_inicial: number;
  saldo_bloqueado: number;
  descricao: string | null;
  id_tipo_verba: number | null;
}

export interface Alerta {
  id_alerta: number;
  mensagem: string;
  data_vencimento: string;
  id_tipo_alerta: number;
}

export interface Anexo {
  id_anexo: number;
  id_chamado: number;
  caminho: string;
  data_upload: string;
}

export interface Historico {
  id_historico: number;
  id_chamado: number | null;
  data_evento: string;
  descricao: string;
}

export interface LogAuditoria {
  id_log: number;
  acao: string;
  descricao: string;
  id_usuario: number | null;
  data_hora: string;
}

export interface LancamentoCaixa {
  id_lancamento: number;
  data_lancamento: string;
  tipo_movimento: 'Receita' | 'Despesa';
  descricao: string;
  valor: number;
  forma_pagamento: string;
  numero_documento: string | null;
  bimestre: string | null;
  id_verba?: number | null;
  categoria?: string | null;
  aprovacao?: 0 | 1 | null;
}

export interface FormularioCaixa {
  id_formulario: number;
  nome: string;
  data_criacao: string;
}

export interface BancoDados {
  versao: number;
  Perfil: PerfilTabela[];
  Usuario: Usuario[];
  Sala: Sala[];
  Categoria: Categoria[];
  _status: StatusBem[];
  Tipo_chamado: TipoChamado[];
  Tipo_manutencao: TipoManutencao[];
  Tipo_alerta: TipoAlerta[];
  Tipo_verba: TipoVerba[];
  Patrimonio: Patrimonio[];
  Chamado: Chamado[];
  Manutencao: Manutencao[];
  Movimentacao: Movimentacao[];
  item_movimentacao: ItemMovimentacao[];
  verba: Verba[];
  Alerta: Alerta[];
  Anexo: Anexo[];
  Historico: Historico[];
  Log_auditoria: LogAuditoria[];
  Lancamento_caixa: LancamentoCaixa[];
  Formulario_caixa: FormularioCaixa[];
  _seq: Record<string, number>;
}
