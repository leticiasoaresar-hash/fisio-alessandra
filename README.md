# FisioApp

Aplicativo web (PWA, mobile-first) para uma fisioterapeuta autônoma controlar sessões, cobrança mensal e comunicação com as famílias de pacientes idosos atendidos em domicílio.

> ⚠️ Ferramenta de apoio: **não substitui** o controle financeiro/contábil oficial.

## Funcionalidades

- Cadastro de pacientes (nome, valor padrão da sessão, contato do familiar, observações)
- Registro rápido de sessões (data, valor editável, observação/evolução do dia)
- Fechamento mensal por paciente (sessões, total devido, marcar como pago)
- Geração de recibo em PDF ou texto copiável
- Geração de mensagem de evolução mensal para a família via API da Claude, a partir das anotações das sessões
- Backup manual dos dados (exportar/importar JSON)
- Instalável na tela inicial do celular (PWA), sem loja de aplicativos
- Todos os dados ficam salvos **apenas no aparelho** (IndexedDB), sem login e sem nuvem

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. A função de geração de mensagem por IA (`/api/gerar-mensagem`) só funciona quando publicada na Vercel (ou rodando com `vercel dev`), pois depende de uma variável de ambiente com a chave da API.

## Deploy na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) (se ainda não tiver) e conecte este repositório.
2. Ao importar o projeto, a Vercel detecta automaticamente que é um projeto Vite — não é preciso configurar nada manualmente.
3. Antes do primeiro deploy (ou depois, a qualquer momento), configure a variável de ambiente:
   - Vá em **Settings → Environment Variables**
   - Adicione `ANTHROPIC_API_KEY` com a chave da API da Anthropic (Claude)
   - Aplique para "Production" (e "Preview"/"Development" se for testar antes de publicar)
4. Publique. A cada acesso, a fisioterapeuta pode abrir o link no celular e usar **"Adicionar à tela inicial"** para instalar como app.

Sem a variável configurada, o app funciona normalmente — só a geração de mensagem por IA mostra um aviso pedindo para configurar a chave.

## Estrutura

- `src/pages/` — telas do app
- `src/repo.ts` — funções de acesso aos dados (pacientes, sessões, pagamentos, fechamento mensal)
- `src/db.ts` — banco local (Dexie/IndexedDB)
- `src/utils/receipt.ts` — geração do recibo (texto e PDF)
- `api/gerar-mensagem.ts` — função serverless que chama a API da Claude para reescrever as anotações da fisioterapeuta em uma mensagem para a família

## Backup dos dados

Como os dados ficam só no aparelho, use **Ajustes → Exportar backup** regularmente para gerar um arquivo de backup. Em caso de troca ou perda do celular, o mesmo arquivo pode ser restaurado em **Ajustes → Importar backup** em um novo aparelho.
