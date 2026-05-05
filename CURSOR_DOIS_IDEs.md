# Trabalhando com Cursor e outro IDE (repositório único)

Este projeto usa o repositório **https://github.com/fabricioms85/nutrismart**. Para evitar conflitos ao alternar entre o Cursor e outro IDE, siga este fluxo.

---

## Configuração feita

- **origin** aponta para `https://github.com/fabricioms85/nutrismart.git` (repositório oficial).
- Suas alterações feitas no Cursor foram preservadas na branch **`feature/cursor-alteracoes`**.

---

## Fluxo diário (evitar conflitos)

### Ao abrir o projeto no Cursor

1. Atualize a `main` com o que foi feito no outro IDE:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Se for continuar um trabalho já iniciado, use a branch da tarefa:
   ```bash
   git checkout feature/nome-da-tarefa
   git pull origin main   # trazer últimas mudanças da main
   ```
3. Se for começar uma **nova** tarefa, crie uma branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nome-da-sua-tarefa
   ```

### Ao terminar uma sessão no Cursor

1. Commit e envio da **branch** (não faça push direto na `main`):
   ```bash
   git add .
   git commit -m "Descrição clara da mudança"
   git push origin feature/nome-da-tarefa
   ```
2. No GitHub, abra um **Pull Request** da sua branch para `main`.

### No outro IDE

- Antes de começar a editar: `git pull origin main` (e, se estiver numa branch, `git pull origin main` para atualizar a branch).
- Assim os dois ambientes ficam alinhados ao mesmo repositório.

---

## Resumo rápido

| Onde você está | Ação |
|----------------|------|
| Abrindo no Cursor | `git checkout main` → `git pull origin main` → criar ou usar branch de feature |
| Terminando no Cursor | Commit → `git push origin feature/nome-da-branch` → abrir PR no GitHub |
| Abrindo no outro IDE | `git pull origin main` (e atualizar sua branch se aplicável) |

---

## Variáveis de ambiente

- Use **`.env.local`** na raiz para credenciais locais (Supabase, Gemini).
- O arquivo `.env.local` já está no `.gitignore`; não faça commit dele.
- Se o outro IDE usar `.env`, pode manter os dois; o Vite carrega `.env.local` com prioridade.

---

## Suas alterações já feitas no Cursor

Elas estão na branch **`feature/cursor-alteracoes`**. Para enviar ao repositório:

```bash
git checkout feature/cursor-alteracoes
git push origin feature/cursor-alteracoes
```

Depois, no GitHub, abra um Pull Request de `feature/cursor-alteracoes` para `main`.

Se quiser alinhar sua `main` local à do servidor (descartando diferenças locais na main), feche os arquivos do projeto no Cursor e no outro IDE e execute:

```bash
git checkout main
git fetch origin
git reset --hard origin/main
```

Assim a `main` local fica igual à do repositório remoto.
