# Sistema IPE — Inventário e Patrimônio Escolar (versão Ionic)

Versão **Ionic 8 + Angular 18** do sistema IPE (original em Flask + MySQL).
Interface idêntica em identidade visual ao sistema original: amarelo `#FFD730`,
laranja `#F29310`, azul escuro `#152937`, fonte Poppins, layout com sidebar + topbar,
cards, tabelas, badges e modais.

---

## 1. Como rodar

Requisitos: **Node.js 18+** (recomendado 20+) e npm.

```bash
node -v
npm -v
npm install --legacy-peer-deps
npm start
Abra `http://localhost:4200`.

> O `--legacy-peer-deps` é necessário porque `@ionic/angular@8` declara peer deps
> ligeiramente diferentes das do Angular 18.





| Perfil | E-mail | Senha | Chave de acesso |
|---|---|---|---|
| Patrimônio (admin) | `patrimonio@ipe.edu.br` | `1234` | `IPE2026ADMIN` |
| Usuário padrão | `usuario@ipe.edu.br` | `1234` | — |

A tela de login tem botões que preenchem as duas contas automaticamente.

---

## 3. Telas implementadas

- **Login** e **Cadastro** (com chave de acesso para virar perfil Patrimônio)
- **Início** — dashboard com indicadores e bens recentes
- **Inventário** — busca, filtros (categoria, sala, status), ordenação, export CSV,
  cadastro de bem, cadastro de sala, detalhe do bem com chamados e linha do tempo
- **Movimentações** — transferência de bens entre salas, itens por movimentação
- **Chamados** — filtros por status/prioridade, stepper de andamento, anexos,
  iniciar/finalizar reparo, reabrir, cancelar, excluir
- **Abrir Chamado** — tipo, prioridade, bem vinculado, previsão
- **Histórico de Reparos** — ranking de reincidência, custo por bem, tempo médio
- **Histórico** — linha do tempo completa de um bem
- **Bens Alugados** — contratos de locação/terceirização, vencimentos, custo mensal
- **Baixa e Inutilização** — motivo, laudo técnico, processo administrativo
- **Financeiro** — entradas/saídas, gráfico mensal, verbas, origens de recurso,
  categorias, aprovação
- **Relatórios** — agrupamento mensal/bimestral/trimestral/semestral/anual,
  por origem e por categoria, export CSV e impressão
- **Painel ADM** — usuários, logs de auditoria, configurações do sistema
- **Enviar Notificações** — comunicados e alertas automáticos
- **Notificações** — caixa de entrada
- **Backup** — export JSON, dump SQL, CSV por tabela e restauração
- **Perfil** — dados, troca de senha, meus chamados
- **Sobre** e **Acesso Restrito**

Perfis: **Patrimônio** (admin, acesso total) e **Usuário Padrão** (consulta e abertura
de chamados). Módulos exclusivos do admin: Bens Alugados, Baixa, Financeiro,
Relatórios, Painel ADM, Enviar Notificações e Backup.

---

## 4. Arquitetura

```
src/app/
├── core/
│   ├── models.ts          # tipos de todas as tabelas (espelha o schema MySQL)
│   ├── seed.ts            # dados iniciais de demonstração
│   ├── db.service.ts      # "banco de dados" local (localStorage, chave ipe_db_v1)
│   ├── api.service.ts     # reimplementação de TODOS os endpoints /api/... do Flask
│   ├── auth.service.ts    # login, cadastro, perfis, chave de acesso
│   ├── guards.ts          # authGuard, adminGuard, loginGuard
│   ├── icons.ts           # registro dos ícones Ionicons
│   └── util.ts            # formatação BRL/data, helpers
├── shared/
│   ├── shell.component.ts # sidebar + topbar + router-outlet
│   └── topbar.component.ts
└── pages/                 # uma pasta por tela (componentes standalone)
```

