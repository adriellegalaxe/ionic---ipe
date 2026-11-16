// ============================================================================
// HELPERS de formatação e utilidades (equivalentes às funções dos .js antigos)
// ============================================================================

export function brl(valor: number | string | null | undefined): string {
  return 'R$ ' + Number(valor || 0).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function numero(valor: number | string | null | undefined, casas = 0): string {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

export function dataBR(iso: string | null | undefined, comHora = false): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d.getTime())) return '—';
  const s = d.toLocaleDateString('pt-BR');
  return comHora ? `${s} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : s;
}

export function hojeISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function diasAte(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const hoje = new Date(hojeISO() + 'T00:00:00');
  return Math.round((d.getTime() - hoje.getTime()) / 86400000);
}

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export const STATUS_CHAMADO: Record<number, string> = {
  1: 'Aberto', 2: 'Em Atendimento', 3: 'Concluído', 4: 'Cancelado'
};

export const PRIORIDADES = ['Baixa', 'Media', 'Alta'] as const;
export const PRIORIDADE_LABEL: Record<string, string> = { Baixa: 'Baixa', Media: 'Média', Alta: 'Alta' };

export const ORIGENS_VALIDAS: Record<string, { nome: string; cor: string; icone: string; descricao: string }> = {
  PDDE: { nome: 'PDDE Federal', cor: '#15803d', icone: '🏛️', descricao: 'Programa Dinheiro Direto na Escola' },
  CITI: { nome: 'CITI Faetec', cor: '#1e40af', icone: '🏫', descricao: 'Centro de Integração e Tecnologia da Informação' },
  FAETEC: { nome: 'FAETEC', cor: '#b45309', icone: '🎓', descricao: 'Recursos próprios da rede' },
  CONVENIO: { nome: 'Convênio', cor: '#7c3aed', icone: '🤝', descricao: 'Recursos de convênios e parcerias' },
  DOACAO: { nome: 'Doação', cor: '#0f766e', icone: '🎁', descricao: 'Bens e recursos doados' },
  SEM_ORIGEM: { nome: 'Sem Origem', cor: '#9ca3af', icone: '❓', descricao: 'Lançamentos sem origem vinculada' }
};

/** Extrai a origem embutida no nome da verba: "[ORIGEM:PDDE] Nome" */
export function extrairOrigemVerba(nome: string | null | undefined): string | null {
  const m = /\[ORIGEM:([A-Z_]+)\]/.exec(nome || '');
  return m ? m[1] : null;
}

/** Data fim de contrato guardada na descrição: "[CONTRATO:FIM:2026-11-30]" */
export function extrairDataFimContrato(descricao: string | null | undefined): string | null {
  const m = /\[CONTRATO:FIM:(\d{4}-\d{2}-\d{2})\]/.exec(descricao || '');
  return m ? m[1] : null;
}

export function statusContrato(dias: number | null): string {
  if (dias === null) return 'Sem data';
  if (dias < 0) return 'Vencido';
  if (dias <= 30) return 'Vencendo';
  if (dias <= 90) return 'Atenção';
  return 'Vigente';
}

export function baixarArquivo(nome: string, conteudo: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob(['\uFEFF' + conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function carimbo(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
