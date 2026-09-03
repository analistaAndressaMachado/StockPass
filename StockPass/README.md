# StockPass — Sistema de Controle de Estoque

API REST + aplicativo mobile para controle, gestão e rastreabilidade de estoque.

Projeto acadêmico desenvolvido para a disciplina de Laboratório de Engenharia de Software — FATEC Praia Grande - SP.

## Visão geral

O StockPass permite cadastrar produtos, categorias, fornecedores e usuários, registrar entradas e saídas de estoque, consultar movimentações, acompanhar estoque mínimo e visualizar alertas.

A estrutura segue o formato do projeto de referência: um repositório com `backend/` e `frontend/`.

## Tecnologias

Backend:
- Laravel 12
- PHP 8.2+
- MySQL
- API REST JSON

Frontend:
- Expo
- React Native
- TypeScript
- Axios

## Estrutura

```text
/
├── backend/                 # API REST Laravel
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── .env.example
│   ├── artisan
│   └── composer.json
├── frontend/                # Aplicativo mobile Expo
│   ├── src/
│   ├── App.tsx
│   ├── app.json
│   └── package.json
└── README.md
```

## Pré-requisitos

- PHP 8.2 ou superior
- Composer
- MySQL 8+ ou MariaDB
- Node.js 18+
- Expo Go no celular ou emulador Android/iOS

## Executar o backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

No Linux/macOS:

```bash
cp .env.example .env
```

Crie um banco chamado `stockpass` no MySQL/phpMyAdmin e confira o `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stockpass
DB_USERNAME=root
DB_PASSWORD=
```

Depois:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

A API ficará em:

```text
http://localhost:8000/api
```

Teste:

```text
GET http://localhost:8000/api/hello-world
```

## Executar o aplicativo Expo

Em outro terminal:

```bash
cd frontend
npm install
npx expo start
```

No arquivo `frontend/src/services/api.ts`, coloque o IP do computador na rede local. Exemplo:

```ts
const API_URL = "http://192.168.0.10:8000/api";
```

Para celular físico, o celular e o computador precisam estar na mesma rede Wi-Fi.

## API

### Hello World

```text
GET /api/hello-world
```

### Dashboard

```text
GET /api/dashboard
```

### Categorias

```text
GET    /api/categories
POST   /api/categories
GET    /api/categories/{id}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

### Fornecedores

```text
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/{id}
PUT    /api/suppliers/{id}
DELETE /api/suppliers/{id}
```

### Produtos

```text
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search/{term}
```

### Usuários

```text
GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Movimentações

```text
GET  /api/movements
POST /api/movements
GET  /api/movements/{id}
```

### Alertas

```text
GET /api/alerts
GET /api/alerts/{id}
PUT /api/alerts/{id}
```

## Produto com foto

O cadastro de produto aceita `multipart/form-data`:

```text
code
name
description
quantity
minimum_stock
expiration_date
category_id
supplier_id
photo
```

A foto é armazenada em `storage/app/public/products`.

## Dados de teste

Após `php artisan migrate --seed`:

```text
Administrador
e-mail: admin@stockpass.com
senha: 123456

Gestor
e-mail: gestor@stockpass.com
senha: 123456
```

Também é criado um produto de exemplo.

## Testes

```bash
cd backend
php artisan test
```

## GitHub

```bash
git init
git add .
git commit -m "feat: cria sistema StockPass"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/StockPass.git
git push -u origin main
```

Não envie o arquivo `.env`, a pasta `vendor` ou credenciais para o GitHub.

## Autores

Andressa Rosa de Lima Gonçalves Machado  
Henry Bittenbinder Dias de Oliveira  
Mariana Martins Nunes
