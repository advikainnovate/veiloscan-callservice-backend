# AdvikaInnovate Backend Service Template

A production-ready microservice template boilerplate built with Node.js, Express, and PostgreSQL using Sequelize ORM. It provides built-in support for User CRUD, JWT verification/authorization, Joi validations, structured Pino logging, and automated API Swagger docs.

## 🚀 Features

- **User CRUD Operations**: Ready-to-use CRUD endpoints for user management.
- **Stateless Authorization**: Robust JWT verification middleware (`validateAccessToken`, `validateRefreshToken`, `optionalAuth`) ready for microservice deployments.
- **Validation Layer**: Flexible input validation schema architecture using Joi.
- **Database Migrations**: Simple schema migrations and database seeding using Sequelize-CLI.
- **Logging**: High-performance logging utilizing Pino and Pino-pretty for clean local terminal debugging.
- **API Documentation**: Automatic interactive documentation rendered via Swagger at `/api-docs`.
- **Pre-configured Linting & Formatting**: Strict linting rules using ESLint and Prettier.

## 🛠️ Tech Stack

- **Runtime**: Node.js / Bun
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Validation**: Joi
- **Logging**: Pino & Pino-Pretty
- **API Documentation**: Swagger / OpenAPI 3.0

## 📂 Project Structure

```
src/
├── config/         # App, DB, and SMTP configuration
├── database/       # Migrations, Models, and Seeders
├── docs/           # Swagger JSON specifications
├── helpers/        # Centralized HTTP error handlers and helper classes
├── middlewares/    # Express middlewares (Validation, Authorisation)
├── modules/        # Business logic modules (Users CRUD)
├── routes/         # Central API route index
├── utils/          # Logger, Email client, JWT and encryption utilities
├── app.js          # Express app definition and core middlewares
└── server.js       # App listener port configuration
```

## ⚙️ Setup & Installation

1.  **Install dependencies**

    ```bash
    bun install
    # or
    npm install
    ```

2.  **Environment Configuration**
    Copy `.env.sample` to `.env` and fill out your PostgreSQL database and JWT token secrets.

    ```bash
    cp .env.sample .env
    ```

3.  **Database Migration**
    Run the migrations to set up the database tables (e.g., `users` table):
    ```bash
    bun run prestart
    ```

## 🏃‍♂️ Running the Application

### Development Mode (with hot-reloading)

```bash
bun run dev
# or
npm run dev
```

### Production Mode

```bash
bun start
# or
npm start
```

## 📖 API Documentation

Once the server starts up, interactive API documentation is available at:
**http://localhost:5002/api-docs**

## 🩺 Health Check

Verify service health status at:
**http://localhost:5002/api/v1/healthz**
