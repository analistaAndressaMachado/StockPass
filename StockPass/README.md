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

O sistema oferece controle de acesso, gestão do estoque e um portal para fornecedores publicarem ofertas que a equipe pode adquirir para abastecer o inventário.

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

### Fornecedores

- Cadastro e login com papel `FORNECEDOR`, separado das contas internas
- Cadastro, edição e retirada das próprias ofertas disponíveis
- Consulta das ofertas pelo catálogo interno de fornecedores
- Aquisição por usuários internos, com baixa da disponibilidade do fornecedor
- Entrada automática no estoque, histórico de movimentação e registro da compra
- APIs protegidas para que fornecedores não consultem nem alterem o estoque interno

### Clientes

- Cadastro e login com papel `CLIENTE`
- Loja com produtos disponíveis e saldo atualizado do estoque
- Carrinho, seleção de PIX/cartão demonstrativos e histórico de compras
- Confirmação de compra grava pedido e pagamento demonstrativo e registra a saída como venda
- O checkout é acadêmico/local: não cobra cartão nem envia pagamentos reais

### Estoque

- Cadastro e edição de produtos com SKU, categoria, preço, fornecedor e ponto de reposição
- Entradas e saídas registradas no histórico com data, hora e usuário autenticado
- Atualização automática do saldo a cada movimentação
- Bloqueio de saída acima do saldo disponível
- Estoque inicial do cadastro registrado como entrada no histórico
- Ação de reposição nos alertas, com quantidade sugerida para atingir o ponto de reposição
- Catálogo, alertas e indicadores carregados do banco de dados

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
- A tela **Usuários e Permissões** consulta contas internas no SQLite. Administradores podem criar, editar, ativar e desativar contas; gestores podem consultá-las.
- Alterações administrativas de contas são registradas a partir desta versão. A tabela de níveis de acesso é informativa e seus perfis são definidos no código; ela não permite configurar permissões individuais.
- O último acesso é registrado nos próximos logins; acessos anteriores não estão disponíveis.
- Relatórios são calculados a partir dos produtos e movimentações salvos; o relatório exibido não é armazenado como documento histórico.
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

2. Execute o projeto:

```bash
mvn spring-boot:run
```

3. O backend será iniciado em:

```text
http://localhost:8080
```

A API ficará disponível em:

```text
http://localhost:8080/api
```

4. Teste o Hello World:

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

### Recuperação de senha

Na simulação acadêmica, inicie o backend na pasta `backend` com o perfil de demonstração:

```powershell
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=demo'
```

Na tela de login, selecione **Esqueci minha senha** e informe o e-mail cadastrado e a nova senha. O perfil `demo` limita o servidor ao endereço local e habilita a redefinição sem confirmação de identidade. Qualquer pessoa com acesso local pode alterar senhas das contas cadastradas: use apenas dados fictícios, não use em produção e não exponha o servidor por proxy ou túnel. Sem o perfil, essa redefinição fica desabilitada.

Para a API de recuperação por e-mail, configure o SMTP no ambiente do backend antes de iniciá-lo. Sem um servidor SMTP válido, o fluxo não consegue enviar o e-mail.

```powershell
$env:MAIL_HOST="smtp.seuprovedor.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="seu-usuario"
$env:MAIL_PASSWORD="sua-senha-de-aplicativo"
$env:MAIL_SMTP_AUTH="true"
$env:MAIL_SMTP_STARTTLS="true"
$env:MAIL_FROM="nao-responda@seudominio.com"
$env:FRONTEND_URL="http://localhost:5173"
& "$PWD\mvnw.cmd" spring-boot:run
```

O link enviado pela API expira em 30 minutos e só pode ser usado uma vez. A API sempre responde com uma mensagem genérica para não revelar se um e-mail está cadastrado.

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

O arquivo `backend/stockpass.db` pode ser incluído no Git para levar os dados de demonstração a outro computador. **Ele contém cadastros, compras e hashes de senhas**; qualquer pessoa com acesso ao repositório poderá obter esses dados, inclusive de commits antigos. Use somente dados fictícios e não publique dados reais ou senhas reutilizadas. Tornar o repositório privado depois não remove dados já divulgados.

Antes de adicionar o banco a um commit, encerre o backend normalmente para que todas as alterações sejam gravadas no arquivo. Os arquivos temporários do SQLite não são versionados. Inclua o arquivo no commit e faça o push; no outro computador, obtenha esse commit e inicie o backend na pasta `backend`. Alterações locais no banco não são enviadas automaticamente: exigem outro commit e push. Evite editar o banco nos dois computadores ao mesmo tempo, pois arquivos SQLite binários não podem ser mesclados automaticamente pelo Git.

O banco é criado automaticamente pelo Spring Boot/JPA a partir das entidades do projeto.

### Tabelas

O Spring Boot/JPA cria e atualiza as tabelas abaixo no arquivo `backend/stockpass.db`:

```text
users
products
stock_movements
stock_replenishments
supplier_offers
supplier_purchases
client_purchases
client_purchase_items
```

`products` mantém o catálogo e o saldo atual; `stock_movements` guarda cada entrada e saída vinculada ao produto. `stock_replenishments` acompanha reposições planejadas. `supplier_offers` guarda produtos publicados pelos fornecedores e `supplier_purchases` registra aquisições internas. `client_purchases` e `client_purchase_items` armazenam pedidos demonstrativos e seus itens.

Campos principais de `products`:

```text
id, sku, name, category, quantity, price, supplier, reorder_point, created_at
```

Campos principais de `stock_movements`:

```text
id, type, product_id, quantity, supplier, invoice_number, reason,
observation, registered_by, created_at
```

Campos principais de `stock_replenishments`:

```text
id, product_id, quantity, quantity_received, status, registered_by,
scheduled_at, completed_at
```

Campos principais de `supplier_offers` e `supplier_purchases`:

```text
supplier_offers: id, supplier_id, supplier_sku, name, category, price,
available_quantity, active, inventory_product_id
supplier_purchases: id, offer_id, product_id, quantity, unit_price,
purchased_by, purchased_at
client_purchases: id, order_number, client_id, total, payment_method,
payment_status, created_at
client_purchase_items: id, purchase_id, product_id, quantity, unit_price
```

A senha dos usuários continua armazenada utilizando hash BCrypt.

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
POST /api/auth/register-supplier
POST /api/auth/register-client
GET  /api/auth/profile
PUT  /api/auth/password
```

`login`, `register`, `register-supplier` e `register-client` são públicos. Os cadastros especializados atribuem seus papéis no servidor; o usuário não escolhe o próprio papel. `profile` e `password` exigem autenticação.

### Usuários

```text
GET /api/users
```

Exige autenticação.

### Estoque

Todas as rotas abaixo exigem autenticação JWT:

```text
GET  /api/products
POST /api/products
PUT  /api/products/{id}
GET  /api/entries
POST /api/entries
GET  /api/exits
POST /api/exits
GET  /api/replenishments
POST /api/replenishments
```

O cadastro de produto recebe `initialQuantity`; se maior que zero, o sistema cria uma entrada inicial no histórico. Entradas e saídas atualizam o saldo e o histórico na mesma transação. Reposições agendadas são persistidas e passam para concluídas quando o recebimento vinculado completa a quantidade planejada.

### Fornecedores

```text
GET    /api/suppliers/me
GET    /api/suppliers/offers/mine
GET    /api/suppliers/purchases/mine
POST   /api/suppliers/offers/mine
PUT    /api/suppliers/offers/mine/{id}
DELETE /api/suppliers/offers/mine/{id}
GET    /api/suppliers/offers
POST   /api/suppliers/offers/{id}/acquire
```

As rotas `offers/mine` e `suppliers/me` são exclusivas de fornecedores. O marketplace e a aquisição são exclusivos de usuários internos. A aquisição registra imediatamente uma entrada de estoque e salva o preço, fornecedor, comprador e quantidade.

Na aba Relatórios, entradas, saídas, estoque e reposições são agregados por dia no período selecionado. Os dados são atualizados automaticamente a cada 15 segundos enquanto a aba está aberta.

### Loja do cliente

Todas as rotas abaixo exigem uma conta `CLIENTE`:

```text
GET  /api/store/products
POST /api/store/purchases
GET  /api/store/purchases
```

O checkout demonstrativo baixa o estoque e registra o pedido, pagamento simulado e saída de venda na mesma transação. Não há integração com gateway nem cobrança financeira real.

---

## Dados de teste

Na primeira execução, o backend cria automaticamente dois usuários para facilitar a apresentação:

### Administrador

```text
E-mail: admin@stockpass.com
Senha: 123456
Perfil: ADMIN
```

### Gestor

```text
E-mail: gestor@stockpass.com
Senha: 123456
Perfil: GESTOR
```

> Essas credenciais são destinadas somente ao ambiente acadêmico/local. Em um ambiente real, devem ser substituídas por senhas seguras.

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
- **Mariana Martins Nunes**

Projeto acadêmico desenvolvido para a **FATEC Praia Grande - SP**.

---

## Licença

Este projeto foi desenvolvido para fins **acadêmicos**, na disciplina de **Laboratório de Engenharia de Software — FATEC Praia Grande - SP**.
