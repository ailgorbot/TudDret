# --- Étape 1 : dépendances + build -----------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
# DATABASE_URL n'est pas nécessaire au build : la page est dynamique.
RUN npm run build

# --- Étape 2 : image d'exécution minimale -----------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Sortie standalone de Next.js + assets statiques
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations SQL + scripts JS purs (drizzle-orm et pg sont déjà
# dans les node_modules du standalone).
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs
EXPOSE 3000

# Migrations, seed idempotent (premier démarrage uniquement), puis serveur.
CMD ["sh", "-c", "node scripts/migrate.mjs && node scripts/seed.mjs && node server.js"]
