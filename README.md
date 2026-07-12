# TudDret — Carnet de voyage au Cap-Vert

Planificateur de voyage pour le Cap-Vert : itinéraire jour par jour, activités,
budget (€ / CVE), dépenses du groupe, météo des îles et actualités du pays.

Refonte de l'ancien site statique (Grist + localStorage + backups JSON manuels)
en une application **Next.js App Router + PostgreSQL** avec persistance réelle.

*Feito com morabeza.*

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, TypeScript strict) |
| Base de données | PostgreSQL 18 |
| ORM | Drizzle ORM (`node-postgres`) — migrations SQL versionnées dans `drizzle/` |
| Style | Tailwind CSS v4, mobile-first |
| Mutations | Server Actions (`src/lib/actions.ts`) |
| Flux externes | Route Handlers : `/api/weather` (Open-Meteo), `/api/news` (RSS TV5Monde) |
| Déploiement | Dockerfile multi-stage (sortie `standalone`) sur Coolify |

**Pourquoi Drizzle plutôt que Prisma ?** Migrations en SQL pur lisibles et
versionnées, pas d'étape de codegen ni de binaire moteur (image Alpine plus
simple et plus légère), et des requêtes typées TypeScript-first.

## Installation locale

Prérequis : Node.js ≥ 20.9, un PostgreSQL accessible (Docker suffit).

```bash
# 1. Démarrer un Postgres local
docker run -d --name tuddret-pg \
  -e POSTGRES_USER=tuddret -e POSTGRES_PASSWORD=tuddret -e POSTGRES_DB=tuddret \
  -p 5433:5432 postgres:18-alpine

# 2. Configurer l'environnement
cp .env.example .env
# puis renseigner DATABASE_URL, par exemple :
# DATABASE_URL=postgresql://tuddret:tuddret@localhost:5433/tuddret

# 3. Installer, migrer, seeder
npm install
npm run db:migrate
npm run db:seed        # importe l'itinéraire Cap-Vert 2026 (idempotent)

# 4. Lancer
npm run dev            # http://localhost:3000
```

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL de connexion PostgreSQL (`postgresql://user:pass@host:5432/db`) |

Aucun secret n'est commité : `.env*` est ignoré par git, seul `.env.example`
(noms de variables uniquement) est versionné.

## Commandes base de données

| Commande | Effet |
| --- | --- |
| `npm run db:generate` | Génère une migration SQL depuis `src/db/schema.ts` (drizzle-kit) |
| `npm run db:migrate` | Applique les migrations en attente (`scripts/migrate.mjs`, pg pur) |
| `npm run db:seed` | Importe les données du backup Grist si la base est vide |

Le schéma comprend : `trips` (voyage, devise, taux CVE), `days` (journées),
`activities` (type, impératif/optionnel, horaires, coût, notes, photos, infos
pratiques), `expenses` (dépenses du groupe) et `user_config` (préférences
clé/valeur).

## Déploiement Coolify

L'application est déployée sur le projet Coolify **TudDret** :

1. **Base de données** : service `postgresql-database-tuddret`
   (`postgres:18-alpine`) déjà provisionné.
2. **Application** : ressource de type *Dockerfile* pointant sur ce dépôt
   (branche `main`). Le `Dockerfile` construit la sortie standalone puis, au
   démarrage du conteneur : applique les migrations (`scripts/migrate.mjs`),
   exécute le seed idempotent (`scripts/seed.mjs`), et lance `node server.js`.
3. **Variables d'environnement** (onglet *Environment Variables* du service,
   jamais dans le code) :
   - `DATABASE_URL` → URL interne Coolify du service Postgres.
4. **Domaine & HTTPS** : gérés par Coolify (Let's Encrypt automatique).

Chaque `git push` sur la branche suivie déclenche un rebuild ; les migrations
sont rejouées au démarrage (no-op si la base est à jour).

## Structure

```
drizzle/               Migrations SQL + journal
scripts/               migrate.mjs, seed.mjs (JS pur, utilisés par Docker)
src/app/               Pages App Router + route handlers /api/*
src/components/        UI (Hero, Timeline, DayCard, dialogs, météo, actus…)
src/db/                Schéma Drizzle + connexion (pool paresseux)
src/lib/               Server Actions, requêtes, formatage, types partagés
public/hero, brand/    Photos des îles et logo, repris du site d'origine
```

## Design

Palette inspirée du drapeau et des paysages : bleu océan `#003893`, tons sable,
corail/terracotta, jaune étoile. Typographies Fraunces (titres) et DM Sans
(texte). Conception mobile-first (≤ 480 px → tablette ≥ 768 px → desktop
≥ 1024 px), zones tactiles ≥ 44 px, contrastes AA, focus visibles.
