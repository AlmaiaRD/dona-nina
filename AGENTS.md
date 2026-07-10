# Donde Doña Nina - Sistema de Gestión

## Comandos
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar linter

## Entorno
- NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY necesarios en .env.local

## Base de Datos
- Ejecutar `migracion-columnas-faltantes.sql` en el SQL Editor de Supabase para agregar tablas/columnas faltantes (bank_accounts, RPC functions, columnas itbis/pv/bank_account_id).
- Schema completo en `supabase-schema.sql`.
