# StockPass
# Sistema de Controle de Estoque

Aplicação web de controle, gestão e rastreabilidade de estoque, com **API REST** e interface em **React + TypeScript**.

Projeto acadêmico desenvolvido para a disciplina de **Laboratório de Engenharia de Software** — **FATEC Praia Grande - SP**.

---

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Controle de acesso](#controle-de-acesso)
- [Tecnologias](#tecnologias)
- [Como executar (local)](#como-executar-local)
  - [Pré-requisitos](#pré-requisitos)
  - [Backend (Spring Boot)](#backend-spring-boot)
  - [Frontend (React)](#frontend-react)
- [Banco de dados](#banco-de-dados)
- [API](#api)
- [Dados de teste](#dados-de-teste)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Testes](#testes)
- [GitHub](#github)
- [Autores](#autores)
- [Licença](#licença)

---

## Visão geral

O **StockPass** foi desenvolvido para auxiliar no controle de produtos e na rastreabilidade das movimentações de estoque.

A aplicação é organizada em duas partes:

- **Backend:** API REST responsável pelas regras de negócio, autenticação, controle de usuários e persistência dos dados.
- **Frontend:** aplicação web responsável pela interação do usuário com o sistema.

A primeira etapa do projeto contempla a estrutura inicial do sistema e as **rotinas de controle de acesso**, conforme o acompanhamento da disciplina.

O projeto está preparado para evoluir posteriormente para as rotinas completas de produtos, categorias, fornecedores, entradas, saídas e alertas de estoque.

---

## Funcionalidades

### Hello World

- Endpoint inicial da API
- Validação de comunicação com o backend
- Mensagem `Hello World - StockPass`

### Controle de acesso

- Cadastro de usuário
- Login com e-mail e senha
- Senhas armazenadas com **BCrypt**
- Autenticação por token JWT
- Página de perfil
- Consulta dos dados do usuário autenticado
- Troca de senha
- Logout no frontend
- Proteção das rotas da API que exigem autenticação

### Usuários

- Cadastro de usuários
- Identificação por e-mail
- Perfil de acesso (`USER`, `GESTOR` ou `ADMIN`)
- Consulta dos usuários autenticados

### Próximas rotinas do estoque

A arquitetura foi organizada para receber as próximas funcionalidades do StockPass:

- Produtos
- Categorias
- Fornecedores
- Entradas de estoque
- Saídas de estoque
- Histórico de movimentações
- Estoque mínimo
- Alertas
- Dashboard

---

## Controle de acesso

O fluxo inicial do sistema é:

```text
Cadastro / Usuário existente
          ↓
        Login
          ↓
     Validação de e-mail
          ↓
     Validação da senha
          ↓
       Token JWT
          ↓
   Área autenticada
      ↙       ↘
   Perfil    Sistema
      ↓
 Troca de senha
```

### Regras

- O e-mail do usuário deve ser único.
- A senha deve possuir pelo menos **6 caracteres**.
- A senha não é armazenada em texto puro: é protegida utilizando **BCrypt**.
- O login retorna um token JWT.
- Endpoints protegidos exigem o cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

---

## Tecnologias

### Backend

- **Java 17+**
- **Spring Boot 3.5**
- Spring Web
- Spring Data JPA
- Spring Security
- BCrypt
- JWT

### Frontend

- **React**
- **TypeScript**
- **Vite**
- Axios

### Banco de dados

- **SQLite**
- Hibernate/JPA

### Testes

- JUnit
- Spring Boot Test

---

## Como executar (local)

### Pré-requisitos

- **Java 17 ou superior**
- **Maven 3.9+**
- **Node.js 18+**
- **npm**

O SQLite é utilizado como banco local e não exige a instalação de um servidor MySQL.

---

### Backend (Spring Boot)

1. Entre na pasta do backend:

```bash
cd backend
```

2. (Opcional) Para criar as contas iniciais em um banco vazio, defina senhas próprias no PowerShell. O inicializador só cria contas ausentes e nunca altera usuários existentes:

```powershell
$env:STOCKPASS_ADMIN_PASSWORD = Read-Host "Senha inicial do administrador"
$env:STOCKPASS_MANAGER_PASSWORD = Read-Host "Senha inicial do gestor"
```

3. Execute o projeto:

```bash
.\mvnw.cmd spring-boot:run
```

O perfil `local` é usado por padrão e tem uma chave JWT exclusiva para desenvolvimento local. Para substituí-la, defina `APP_JWT_SECRET` com pelo menos 32 bytes. Nos perfis `prod` e `demo`, essa variável é obrigatória e a API não inicia se estiver vazia ou curta. Não reutilize a chave local nesses ambientes.

As contas de apresentação só são criadas se ainda não existirem e se as variáveis de senha acima estiverem definidas. Se o banco já possui essas contas, o login e as senhas atuais são preservados; o inicializador não redefine senhas.

4. O backend será iniciado em:

```text
http://localhost:8080
```

A API ficará disponível em:

```text
http://localhost:8080/api
```

5. Teste o Hello World:

```text
GET http://localhost:8080/api/hello-world
```

Resposta esperada:

```json
{
  "message": "Hello World - StockPass"
}
```

Na primeira execução, o arquivo `backend/stockpass.db` será criado automaticamente.

---

### Frontend (React)

Em outro terminal:

1. Entre na pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Rode o projeto:

```bash
npm run dev
```

4. O Vite disponibilizará a aplicação em um endereço semelhante a:

```text
http://localhost:5173
```

O endereço da API está configurado em:

```text
frontend/src/services/api.ts
```

Por padrão:

```ts
baseURL: "http://localhost:8080/api"
```

---

## Banco de dados

O projeto utiliza **SQLite** para manter a mesma proposta de banco local do projeto de referência.

O banco é criado automaticamente pelo Spring Boot/JPA a partir das entidades do projeto.

### Tabela inicial

A primeira tabela principal é:

```text
users
```

Com informações como:

```text
id
name
email
password
role
created_at
```

A senha é armazenada utilizando hash BCrypt.

---

## API

### Hello World

```text
GET /api/hello-world
```

Não exige autenticação.

### Autenticação

```text
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
PUT  /api/auth/password
```

`login` e `register` são públicos. `profile` e `password` exigem autenticação.

### Usuários

```text
GET /api/users
```

Exige autenticação.

---

## Dados de teste

Em um banco vazio, o backend pode criar os dois usuários de apresentação se `STOCKPASS_ADMIN_PASSWORD` e `STOCKPASS_MANAGER_PASSWORD` forem definidas antes de iniciar a API. Não há senhas padrão no código. Em banco existente, contas e senhas são preservadas.

### Administrador

```text
E-mail: admin@stockpass.com
Senha: definida em STOCKPASS_ADMIN_PASSWORD ao criar a conta
Perfil: ADMIN
```

### Gestor

```text
E-mail: gestor@stockpass.com
Senha: definida em STOCKPASS_MANAGER_PASSWORD ao criar a conta
Perfil: GESTOR
```

As variáveis são usadas apenas na inicialização e não devem ser salvas no repositório. Para trocar a senha de uma conta existente, use o fluxo de troca de senha do sistema.

---

## Estrutura do repositório

```text
/
├── backend/                         # API REST Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/stockpass/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   ├── security/
│   │   │   │   └── service/
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/com/stockpass/
│   ├── pom.xml
│   └── stockpass.db
│
├── frontend/                        # Aplicação web React
│   ├── src/
│   │   ├── services/
│   │   ├── types.ts
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── App.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## Testes

Para executar os testes do backend:

```bash
cd backend
mvn test
```

---

## GitHub

O projeto está versionado no GitHub:

urlRepositório StockPass no GitHubhttps://github.com/analistaAndressaMachado/StockPass/tree/main/StockPass

Para enviar as alterações:

```bash
git add .
git commit -m "feat: adiciona controle de acesso do StockPass"
git push origin main
```

### Arquivos que não devem ser enviados

Não envie arquivos com informações sensíveis ou dependências geradas automaticamente, como:

```text
.env
backend/stockpass.db
backend/target/
frontend/node_modules/
frontend/dist/
```

---

## Autores

- **Andressa Rosa de Lima Gonçalves Machado**
- **Henry Bittenbinder Dias de Oliveira**
- **Gabriela Hormina de Oliveira Sousa**

Projeto acadêmico desenvolvido para a **FATEC Praia Grande - SP**.

---

## Licença

Este projeto foi desenvolvido para fins **acadêmicos**, na disciplina de **Laboratório de Engenharia de Software — FATEC Praia Grande - SP**.

### Carga de dados fictícios de demonstração

O carregador opcional adiciona categorias, produtos, fornecedores, clientes, movimentações e reservas fictícias ao SQLite local. Não cria credenciais de acesso conhecidas: os clientes fictícios recebem senhas aleatórias guardadas somente como hash. O carregador não altera registros existentes e identifica os produtos de demonstração pelo prefixo `DEMO-2026-`. As descrições de produto não são carregadas porque o modelo atual não possui esse campo.

No PowerShell, dentro de `backend`, execute:

```powershell
$env:APP_DEMO_DATA_ENABLED = "true"
.\mvnw.cmd spring-boot:run
```

A carga é executada ao iniciar a API. Ela é idempotente: iniciar novamente com a variável habilitada não duplica os dados. Após a carga, pare a API com `Ctrl+C` e desabilite o carregador antes de iniciar normalmente:

```powershell
Remove-Item Env:APP_DEMO_DATA_ENABLED
.\mvnw.cmd spring-boot:run
```

Use esta opção somente no banco local de demonstração. As entradas e saídas fictícias ficam registradas no histórico, e o saldo final de cada produto corresponde às movimentações. Uma reserva ativa de demonstração permanece válida por 30 dias.
