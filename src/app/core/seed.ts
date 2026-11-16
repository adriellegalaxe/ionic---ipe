// ============================================================================
// SEED — dados de demonstração (base zerada, igual à do sistema novo)
// Os dados são gravados no dispositivo (IndexedDB/localStorage) e podem ser
// redefinidos em Backup → Restaurar padrão.
// ============================================================================
import { BancoDados } from './models';

const hoje = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const menosDias = (dias: number) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() - dias);
  return d;
};
const maisDias = (dias: number) => menosDias(-dias);
const dataHora = (d: Date, h = 9, m = 30) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

export const USUARIOS_DEMO = [
  { e_mail: 'patrimonio@ipe.edu.br', senha: '1234', perfil: 1 as const },
  { e_mail: 'usuario@ipe.edu.br', senha: '1234', perfil: 2 as const }
];

export const CHAVE_ADMIN = 'IPE2026ADMIN';

export function bancoInicial(): BancoDados {
  return {
    versao: 1,
    Perfil: [
      { id_perfil: 1, nome: 'Patrimônio' },
      { id_perfil: 2, nome: 'Usuário Padrão' }
    ],
    Usuario: [
      { id_usuario: 1, nome: 'Mirian Souza', e_mail: 'patrimonio@ipe.edu.br', senha: '1234', id_perfil: 1 },
      { id_usuario: 2, nome: 'Paula Andrade', e_mail: 'paula@ipe.edu.br', senha: '1234', id_perfil: 1 },
      { id_usuario: 3, nome: 'Carlos Pereira', e_mail: 'usuario@ipe.edu.br', senha: '1234', id_perfil: 2 },
      { id_usuario: 4, nome: 'Ana Beatriz', e_mail: 'ana@ipe.edu.br', senha: '1234', id_perfil: 2 }
    ],
    Sala: [
      { id_sala: 1, numero_sala: 'Laboratório 01', bloco: 'Bloco A', id_tipo_sala: 1 },
      { id_sala: 2, numero_sala: 'Laboratório 02', bloco: 'Bloco A', id_tipo_sala: 1 },
      { id_sala: 3, numero_sala: 'Sala 101', bloco: 'Bloco B', id_tipo_sala: 1 },
      { id_sala: 4, numero_sala: 'Sala 102', bloco: 'Bloco B', id_tipo_sala: 1 },
      { id_sala: 5, numero_sala: 'Secretaria', bloco: 'Bloco C', id_tipo_sala: 2 },
      { id_sala: 6, numero_sala: 'Biblioteca', bloco: 'Bloco C', id_tipo_sala: 2 },
      { id_sala: 7, numero_sala: 'Quadra', bloco: 'Área Externa', id_tipo_sala: 3 }
    ],
    Categoria: [
      { id_categoria: 1, nome: '1.2.3.1.1.01.20.01 - Computadores e Periféricos' },
      { id_categoria: 2, nome: '1.2.3.1.1.01.23.14 - Mesas' },
      { id_categoria: 3, nome: '1.2.3.1.1.01.23.05 - Cadeiras, Poltronas e Cadeiras Universitárias' },
      { id_categoria: 4, nome: '1.2.3.1.1.01.23.10 - Estantes' },
      { id_categoria: 5, nome: '1.2.3.1.1.01.20.02 - Projetores e Equipamentos de Áudio e Vídeo' },
      { id_categoria: 6, nome: '1.2.3.1.1.01.23.99 - Diversos (Mobiliário)' }
    ],
    _status: [
      { id_status: 1, nome: 'Ativo' },
      { id_status: 2, nome: 'Em Manutenção' },
      { id_status: 3, nome: 'Baixado' },
      { id_status: 4, nome: 'Emprestado' }
    ],
    Tipo_chamado: [
      { id_tipo_chamado: 1, nome: 'Manutenção Corretiva' },
      { id_tipo_chamado: 2, nome: 'Manutenção Preventiva' },
      { id_tipo_chamado: 3, nome: 'Suporte Técnico' }
    ],
    Tipo_manutencao: [
      { id_tipo_manutencao: 1, nome: 'Interna' },
      { id_tipo_manutencao: 2, nome: 'Externa' }
    ],
    Tipo_alerta: [
      { id_tipo_alerta: 1, nome: 'SLA' },
      { id_tipo_alerta: 2, nome: 'Garantia' }
    ],
    Tipo_verba: [
      { id_tipo_verba: 1, nome: 'PDDE' },
      { id_tipo_verba: 2, nome: 'CITI' }
    ],
    Patrimonio: [
      {
        id_patrimonio: 1, nome: 'Notebook Dell Inspiron 15', numero_patrimonio: 'IPE-0001',
        valor_atual: 4200, data_aquisicao: iso(menosDias(900)), taxa_depreciacao: 20,
        id_sala: 1, id_categoria: 1, id_status: 1,
        descricao: 'Notebook utilizado no laboratório de informática.', nota_fiscal: 'NF-1123',
        origem: 'PDDE', id_verba: 1, processo_baixa: null
      },
      {
        id_patrimonio: 2, nome: 'Projetor Epson PowerLite', numero_patrimonio: 'IPE-0002',
        valor_atual: 2800, data_aquisicao: iso(menosDias(600)), taxa_depreciacao: 15,
        id_sala: 3, id_categoria: 5, id_status: 2,
        descricao: 'Projetor com lâmpada fraca, aguardando troca.', nota_fiscal: 'NF-1188',
        origem: 'CITI', id_verba: 2, processo_baixa: null
      },
      {
        id_patrimonio: 3, nome: 'Cadeira Universitária', numero_patrimonio: 'IPE-0003',
        valor_atual: 240, data_aquisicao: iso(menosDias(1500)), taxa_depreciacao: 10,
        id_sala: 4, id_categoria: 3, id_status: 1,
        descricao: null, nota_fiscal: 'NF-0942', origem: 'PDDE', id_verba: 1, processo_baixa: null
      },
      {
        id_patrimonio: 4, nome: 'Mesa de Reunião 8 lugares', numero_patrimonio: 'IPE-0004',
        valor_atual: 1350, data_aquisicao: iso(menosDias(400)), taxa_depreciacao: 10,
        id_sala: 5, id_categoria: 2, id_status: 1,
        descricao: null, nota_fiscal: 'NF-1301', origem: 'CITI', id_verba: 2, processo_baixa: null
      },
      {
        id_patrimonio: 5, nome: 'Estante de Aço 6 prateleiras', numero_patrimonio: 'IPE-0005',
        valor_atual: 890, data_aquisicao: iso(menosDias(1200)), taxa_depreciacao: 10,
        id_sala: 6, id_categoria: 4, id_status: 1,
        descricao: null, nota_fiscal: 'NF-0770', origem: 'PDDE', id_verba: 1, processo_baixa: null
      },
      {
        id_patrimonio: 6, nome: 'Impressora Multifuncional HP', numero_patrimonio: 'IPE-0006',
        valor_atual: 1650, data_aquisicao: iso(menosDias(300)), taxa_depreciacao: 20,
        id_sala: 5, id_categoria: 1, id_status: 1,
        descricao: null, nota_fiscal: 'NF-1450', origem: 'CITI', id_verba: 2, processo_baixa: null
      },
      {
        id_patrimonio: 7, nome: 'Notebook Positivo (locado)', numero_patrimonio: 'IPE-0007',
        valor_atual: 900, data_aquisicao: iso(menosDias(200)), taxa_depreciacao: 25,
        id_sala: 2, id_categoria: 1, id_status: 1,
        descricao: 'Equipamento locado.\n\n[CONTRATO:FIM:2026-11-30]',
        nota_fiscal: 'Locadora TechMais', origem: 'Alugado', id_verba: null,
        processo_baixa: iso(menosDias(200))
      },
      {
        id_patrimonio: 8, nome: 'Datashow Portátil (terceirizado)', numero_patrimonio: 'IPE-0008',
        valor_atual: 1200, data_aquisicao: iso(menosDias(120)), taxa_depreciacao: 20,
        id_sala: 3, id_categoria: 5, id_status: 1,
        descricao: 'Contrato de locação com a VisualPro.\n\n[CONTRATO:FIM:2026-12-20]',
        nota_fiscal: 'VisualPro Ltda', origem: 'Terceirizado', id_verba: null,
        processo_baixa: iso(menosDias(120))
      },
      {
        id_patrimonio: 9, nome: 'Retroprojetor antigo', numero_patrimonio: 'IPE-0009',
        valor_atual: 0, data_aquisicao: iso(menosDias(3000)), taxa_depreciacao: 10,
        id_sala: null, id_categoria: 5, id_status: 3,
        descricao: 'Equipamento obsoleto.\n\n--- BAIXA EM ' + new Date(menosDias(45)).toLocaleDateString('pt-BR') +
          ' ---\nMotivo: Obsolescência\nLaudo: Laudo técnico nº 12/2026',
        nota_fiscal: null, origem: null, id_verba: null, processo_baixa: iso(menosDias(45))
      },
      {
        id_patrimonio: 10, nome: 'Ventilador de Coluna', numero_patrimonio: 'IPE-0010',
        valor_atual: 320, data_aquisicao: iso(menosDias(500)), taxa_depreciacao: 15,
        id_sala: 4, id_categoria: 6, id_status: 1,
        descricao: null, nota_fiscal: 'NF-1250', origem: 'PDDE', id_verba: 1, processo_baixa: null
      }
    ],
    Chamado: [
      {
        id_chamado: 1, id_usuario: 3, id_patrimonio: 2, id_tipo_chamado: 1,
        descricao_problema: 'Projetor não liga a lâmpada, apenas o LED fica piscando.',
        prioridade: 'Alta', id_status: 2, data_abertura: dataHora(menosDias(12)),
        data_previsao_conclusao: iso(maisDias(5))
      },
      {
        id_chamado: 2, id_usuario: 4, id_patrimonio: 1, id_tipo_chamado: 3,
        descricao_problema: 'Notebook está muito lento e reiniciando sozinho.',
        prioridade: 'Media', id_status: 1, data_abertura: dataHora(menosDias(3)),
        data_previsao_conclusao: iso(maisDias(10))
      },
      {
        id_chamado: 3, id_usuario: 3, id_patrimonio: 3, id_tipo_chamado: 2,
        descricao_problema: 'Cadeira com parafuso solto no encosto.',
        prioridade: 'Baixa', id_status: 3, data_abertura: dataHora(menosDias(40)),
        data_previsao_conclusao: iso(menosDias(20))
      },
      {
        id_chamado: 4, id_usuario: 4, id_patrimonio: 6, id_tipo_chamado: 1,
        descricao_problema: 'Impressora apresentando atolamento de papel constante.',
        prioridade: 'Alta', id_status: 1, data_abertura: dataHora(menosDias(9)),
        data_previsao_conclusao: iso(maisDias(2))
      },
      {
        id_chamado: 5, id_usuario: 3, id_patrimonio: 10, id_tipo_chamado: 1,
        descricao_problema: 'Ventilador não gira na velocidade 2.',
        prioridade: 'Media', id_status: 4, data_abertura: dataHora(menosDias(25)),
        data_previsao_conclusao: null
      }
    ],
    Manutencao: [
      {
        id_manutencao: 1, id_chamado: 1, data_inicio: iso(menosDias(10)),
        data_fim: null, observacao: 'Orçamento aprovado com fornecedor externo.', custo: 450
      },
      {
        id_manutencao: 2, id_chamado: 3, data_inicio: iso(menosDias(38)),
        data_fim: iso(menosDias(30)), observacao: 'Aperto e troca de parafusos.', custo: 35
      }
    ],
    Movimentacao: [
      { id_movimentacao: 1, data_movimentacao: dataHora(menosDias(20), 10, 15), id_sala_origem: 3, id_sala_destino: 1 },
      { id_movimentacao: 2, data_movimentacao: dataHora(menosDias(7), 14, 40), id_sala_origem: 5, id_sala_destino: 4 }
    ],
    item_movimentacao: [
      { id_item: 1, id_movimentacao: 1, id_patrimonio: 1 },
      { id_item: 2, id_movimentacao: 2, id_patrimonio: 10 }
    ],
    verba: [
      { id_verba: 1, nome: 'PDDE Federal 2026', saldo_inicial: 18000, saldo_bloqueado: 1500, descricao: 'Programa Dinheiro Direto na Escola', id_tipo_verba: 1 },
      { id_verba: 2, nome: 'CITI Faetec 2026', saldo_inicial: 9500, saldo_bloqueado: 0, descricao: 'Centro de Integração e Tecnologia da Informação', id_tipo_verba: 2 }
    ],
    Alerta: [
      { id_alerta: 1, mensagem: 'Garantia do Projetor Epson vence em breve.', data_vencimento: iso(maisDias(6)), id_tipo_alerta: 2 },
      { id_alerta: 2, mensagem: 'SLA do chamado #1 próximo do limite.', data_vencimento: iso(maisDias(2)), id_tipo_alerta: 1 }
    ],
    Anexo: [
      { id_anexo: 1, id_chamado: 1, caminho: 'foto-projetor-01.jpg', data_upload: dataHora(menosDias(11), 8, 20) }
    ],
    Historico: [
      { id_historico: 1, id_chamado: 1, data_evento: dataHora(menosDias(12)), descricao: 'Chamado aberto com prioridade Alta.' },
      { id_historico: 2, id_chamado: 1, data_evento: dataHora(menosDias(10)), descricao: 'Status alterado para Em Atendimento.' },
      { id_historico: 3, id_chamado: 2, data_evento: dataHora(menosDias(3)), descricao: 'Chamado aberto com prioridade Média.' },
      { id_historico: 4, id_chamado: 3, data_evento: dataHora(menosDias(40)), descricao: 'Chamado aberto com prioridade Baixa.' },
      { id_historico: 5, id_chamado: 3, data_evento: dataHora(menosDias(30)), descricao: 'Chamado concluído.' },
      { id_historico: 6, id_chamado: 4, data_evento: dataHora(menosDias(9)), descricao: 'Chamado aberto com prioridade Alta.' },
      { id_historico: 7, id_chamado: 5, data_evento: dataHora(menosDias(25)), descricao: 'Chamado aberto com prioridade Média.' },
      { id_historico: 8, id_chamado: 5, data_evento: dataHora(menosDias(22)), descricao: 'Chamado cancelado.' }
    ],
    Log_auditoria: [
      { id_log: 1, acao: 'LOGIN', descricao: 'Login realizado por Mirian Souza.', id_usuario: 1, data_hora: dataHora(menosDias(1), 8, 5) },
      { id_log: 2, acao: 'INSERT', descricao: 'Patrimônio IPE-0010 cadastrado.', id_usuario: 1, data_hora: dataHora(menosDias(1), 9, 12) }
    ],
    Lancamento_caixa: [
      { id_lancamento: 1, data_lancamento: dataHora(menosDias(150), 10, 0), tipo_movimento: 'Receita', descricao: 'Repasse PDDE 1º semestre', valor: 18000, forma_pagamento: 'Transferência', numero_documento: 'DOC-9001', bimestre: '1º Bimestre', id_verba: 1, categoria: null, aprovacao: 1 },
      { id_lancamento: 2, data_lancamento: dataHora(menosDias(140), 11, 0), tipo_movimento: 'Despesa', descricao: 'Compra de notebooks', valor: 8400, forma_pagamento: 'Pix', numero_documento: 'NF-1123', bimestre: '1º Bimestre', id_verba: 1, categoria: 'Equipamentos', aprovacao: 1 },
      { id_lancamento: 3, data_lancamento: dataHora(menosDias(90), 9, 30), tipo_movimento: 'Receita', descricao: 'Repasse CITI', valor: 9500, forma_pagamento: 'Transferência', numero_documento: 'DOC-9110', bimestre: '2º Bimestre', id_verba: 2, categoria: null, aprovacao: 1 },
      { id_lancamento: 4, data_lancamento: dataHora(menosDias(80), 15, 20), tipo_movimento: 'Despesa', descricao: 'Troca de lâmpada do projetor', valor: 450, forma_pagamento: 'Pix', numero_documento: 'NF-1188', bimestre: '2º Bimestre', id_verba: 2, categoria: 'Manutenção', aprovacao: 1 },
      { id_lancamento: 5, data_lancamento: dataHora(menosDias(40), 10, 10), tipo_movimento: 'Despesa', descricao: 'Material de expediente', valor: 620.5, forma_pagamento: 'Boleto', numero_documento: 'NF-1250', bimestre: '3º Bimestre', id_verba: 1, categoria: 'Material de Consumo', aprovacao: 0 },
      { id_lancamento: 6, data_lancamento: dataHora(menosDias(15), 16, 0), tipo_movimento: 'Receita', descricao: 'Devolução de verba não utilizada', valor: 300, forma_pagamento: 'Depósito', numero_documento: 'DOC-9233', bimestre: '3º Bimestre', id_verba: 2, categoria: null, aprovacao: 1 }
    ],
    Formulario_caixa: [
      { id_formulario: 1, nome: 'Solicitação de despesa', data_criacao: dataHora(menosDias(200)) }
    ],
    _seq: {
      Usuario: 5, Sala: 8, Categoria: 7, Patrimonio: 11, Chamado: 6, Manutencao: 3,
      Movimentacao: 3, item_movimentacao: 3, verba: 3, Alerta: 3, Anexo: 2,
      Historico: 9, Log_auditoria: 3, Lancamento_caixa: 7, Formulario_caixa: 2,
      Tipo_chamado: 4, Tipo_verba: 3
    }
  };
}
