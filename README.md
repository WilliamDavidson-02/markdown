# Markdown

![Typing](https://i.giphy.com/iFU36VwXUd2O43gdcr.webp)

This project is a markdown editor built with Svelte and SvelteKit, using tools like Drizzle ORM, Neon DB, Lucia Auth, and CodeMirror. It allows users to connect to their GitHub repositories to create, edit, and manage markdown files and folders, while also supporting standalone markdown files not linked to GitHub.
It features helper functions that simplify markdown formatting by automatically applying it as you type.

## Table of Contents

- [Markdown](#markdown)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)

## Installation

`Step 1:` Clone and install dependencies

```bash
git clone https://github.com/WilliamDavidson-02/markdown.git
cd markdown
npm install
```

`Step 2:` Connect to a neon database (get the neon connection string for both pooled and non-pooled)

```bash
# Add the connection strings to the .env
NEON_DB_URL=
NEON_DB_URL_POOL=
```

`Step 3:` One connected to the database, run the migration with drizzle kit

```bash
npm run db:migrate
```

`Step 4:` Create a [OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) and add the client ID and secret to the .env

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

`Step 5:` Create a [GitHub app](https://docs.github.com/en/developers/apps/creating-an-app) and add the client ID, secret, and private key to the .env

```bash
GITHUB_APP_SECRET=
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
```

`Step 6:` Add the public GitHub installation URL to the .env

```bash
PUBLIC_GITHUB_INSTALLATION_URL=https://github.com/apps/<app-name>/installations/select_target
```

`Step 7:` Run the development server

```bash
npm run dev
```
