// ============================================================================
// AUTH — sessão local equivalente ao Flask session + chave de acesso
// ============================================================================
import { Injectable, signal } from '@angular/core';
import { DbService } from './db.service';
import { Perfil, Usuario } from './models';
import { CHAVE_ADMIN } from './seed';

const CHAVE_SESSAO = 'ipe_sessao_v1';

export interface Sessao {
  id_usuario: number;
  nome: string;
  email: string;
  id_perfil: Perfil;
  nome_perfil: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly sessao = signal<Sessao | null>(null);

  constructor(private db: DbService) {
    try {
      const raw = localStorage.getItem(CHAVE_SESSAO);
      if (raw) this.sessao.set(JSON.parse(raw));
    } catch { /* sessão inválida */ }
  }

  get logado(): boolean { return !!this.sessao(); }
  get isAdmin(): boolean { return this.sessao()?.id_perfil === 1; }
  get nome(): string { return this.sessao()?.nome ?? ''; }

  usuario(): Usuario | null {
    const s = this.sessao();
    return s ? this.db.usuario(s.id_usuario) : null;
  }

  /** Valida a chave de acesso (equivalente a _validar_chave do Flask). */
  validarChave(chave: string): { ok: boolean; erro?: string } {
    const limpa = (chave || '').trim().toUpperCase();
    if (!limpa) return { ok: false, erro: 'Informe a chave de acesso.' };
    if (limpa !== CHAVE_ADMIN) return { ok: false, erro: 'Chave de acesso inválida.' };
    return { ok: true };
  }

  login(email: string, senha: string, chave?: string): { ok: boolean; erro?: string } {
    const mail = (email || '').trim().toLowerCase();
    const u = this.db.db.Usuario.find(x => x.e_mail.toLowerCase() === mail);
    if (!u || u.senha !== senha) return { ok: false, erro: 'E-mail ou senha incorretos!' };

    // Perfil Patrimônio exige chave; usuário padrão não.
    if (u.id_perfil === 1 || (chave && chave.trim())) {
      const r = this.validarChave(chave ?? '');
      if (!r.ok) return { ok: false, erro: r.erro };
      if (u.id_perfil !== 1) {
        return { ok: false, erro: 'Chave válida, mas esta conta está registrada como Usuário Padrão.' };
      }
    }

    this.definirSessao(u);
    this.db.log('LOGIN', `Login realizado por ${u.nome}.`, u.id_usuario);
    this.db.persistir();
    return { ok: true };
  }

  cadastrar(nome: string, email: string, senha: string, confirmar: string, chave?: string) {
    const mail = (email || '').trim().toLowerCase();
    if (!nome || !mail || !senha) return { ok: false, erro: 'Preencha todos os campos obrigatórios.' };
    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(mail)) return { ok: false, erro: 'E-mail inválido. Use o formato nome@dominio.com' };
    if (senha.length < 4) return { ok: false, erro: 'A senha deve ter pelo menos 4 caracteres.' };
    if (senha !== confirmar) return { ok: false, erro: 'As senhas não coincidem. Digite a mesma senha nos dois campos.' };
    if (this.db.db.Usuario.some(u => u.e_mail.toLowerCase() === mail)) {
      return { ok: false, erro: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' };
    }
    let perfil: Perfil = 2;
    if (chave && chave.trim()) {
      const r = this.validarChave(chave);
      if (!r.ok) return { ok: false, erro: r.erro! };
      perfil = 1;
    }
    const novo: Usuario = {
      id_usuario: this.db.proximoId('Usuario'),
      nome: nome.trim(),
      e_mail: mail,
      senha,
      id_perfil: perfil
    };
    this.db.db.Usuario.push(novo);
    this.db.log('INSERT', `Usuário ${novo.nome} cadastrado (${perfil === 1 ? 'Patrimônio' : 'Usuário Padrão'}).`, novo.id_usuario);
    this.db.persistir();
    return {
      ok: true,
      mensagem: `Conta criada com sucesso como ${perfil === 1 ? 'Patrimônio' : 'Usuário Padrão'}! Faça login para continuar.`
    };
  }

  atualizarPerfil(nome: string, email: string, novaSenha?: string) {
    const u = this.usuario();
    if (!u) return { ok: false, erro: 'Sessão expirada.' };
    const mail = (email || '').trim().toLowerCase();
    if (!nome || !mail) return { ok: false, erro: 'Nome e e-mail são obrigatórios.' };
    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(mail)) return { ok: false, erro: 'E-mail inválido.' };
    if (this.db.db.Usuario.some(x => x.id_usuario !== u.id_usuario && x.e_mail.toLowerCase() === mail)) {
      return { ok: false, erro: 'Este e-mail já pertence a outra conta.' };
    }
    if (novaSenha && novaSenha.length < 4) return { ok: false, erro: 'A nova senha deve ter pelo menos 4 caracteres.' };
    u.nome = nome.trim();
    u.e_mail = mail;
    if (novaSenha) u.senha = novaSenha;
    this.definirSessao(u);
    this.db.log('UPDATE', `Perfil atualizado (${u.nome}).`, u.id_usuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Perfil atualizado com sucesso!' };
  }

  alterarPerfilUsuario(id: number, perfil: Perfil) {
    const u = this.db.usuario(id);
    if (!u) return { ok: false, erro: 'Usuário não encontrado.' };
    u.id_perfil = perfil;
    this.db.log('UPDATE', `Perfil do usuário ${u.nome} alterado para ${perfil === 1 ? 'Patrimônio' : 'Usuário Padrão'}.`, this.sessao()?.id_usuario ?? null);
    this.db.persistir();
    return { ok: true };
  }

  excluirUsuario(id: number) {
    const u = this.db.usuario(id);
    if (!u) return { ok: false, erro: 'Usuário não encontrado.' };
    if (u.id_usuario === this.sessao()?.id_usuario) return { ok: false, erro: 'Você não pode excluir a própria conta.' };
    this.db.db.Usuario = this.db.db.Usuario.filter(x => x.id_usuario !== id);
    this.db.persistir();
    return { ok: true };
  }

  private definirSessao(u: Usuario) {
    const s: Sessao = {
      id_usuario: u.id_usuario,
      nome: u.nome,
      email: u.e_mail,
      id_perfil: u.id_perfil,
      nome_perfil: this.db.db.Perfil.find(p => p.id_perfil === u.id_perfil)?.nome ?? 'Usuário Padrão'
    };
    this.sessao.set(s);
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  }

  trocarSenha(senhaAtual: string, senhaNova: string) {
    const u = this.usuario();
    if (!u) return { ok: false, erro: 'Sessão expirada.' };
    if (u.senha !== senhaAtual) return { ok: false, erro: 'Senha atual incorreta.' };
    if (!senhaNova || senhaNova.length < 4) return { ok: false, erro: 'A nova senha deve ter pelo menos 4 caracteres.' };
    u.senha = senhaNova;
    this.db.log('UPDATE', `Senha alterada (${u.nome}).`, u.id_usuario);
    this.db.persistir();
    return { ok: true, mensagem: 'Senha alterada com sucesso!' };
  }

  logout(): void {
    const s = this.sessao();
    if (s) {
      this.db.log('LOGOUT', `Sessão encerrada (${s.nome}).`, s.id_usuario);
      this.db.persistir();
    }
    this.sessao.set(null);
    localStorage.removeItem(CHAVE_SESSAO);
  }
}
