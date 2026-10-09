# Sistema de gestión del taller

App para llevar las órdenes de reparación del taller de relojería (y celulares): recepción del reloj, presupuesto, estado del trabajo, aviso al cliente, entrega y garantía.

Arrancó como una copia de [Fixr](https://github.com/fixrfam/fixr) (licencia MIT, ver `LICENSE`), un sistema de órdenes de servicio para talleres de electrónica, y se está adaptando al taller.

## Qué tiene adentro

```
apps/
 ├─ web/       La app que se usa en el mostrador (Next.js)
 ├─ server/    La API: guarda y lee los datos (Fastify)
 └─ workers/   Tareas en segundo plano, como mandar emails
packages/
 ├─ db/        Tablas de la base de datos y migraciones (MySQL + Drizzle)
 ├─ schemas/   Validaciones compartidas entre la app y la API
 └─ ...        Constantes, permisos, emails y configuración
```

Todo corre en una sola máquina con Docker. No depende de servicios pagos.

## Levantarlo con Docker

Hace falta [Docker](https://docs.docker.com/get-docker/) instalado.

1. Copiá `.env.example` a `.env` y cambiá todo lo marcado con **CHANGE**. Cada secreto se genera con `openssl rand -hex 32`.
2. Levantá todo:

   ```bash
   docker compose up -d --build
   ```

   La primera vez tarda unos minutos. Después la app queda en `http://localhost:3000` y la API en `http://localhost:3333` (documentación en `/reference`).

3. Creá el taller y el usuario del dueño, una sola vez, con la `SETUP_KEY` de tu `.env`:

   ```bash
   curl -X POST http://localhost:3333/companies \
     -H "Authorization: Bearer TU_SETUP_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Relojería",
       "subdomain": "relojeria",
       "cnpj": "11.222.333/0001-81",
       "owner_cpf": "529.982.247-25",
       "owner_email": "dueno@ejemplo.com",
       "owner_password": "UnaClaveSegura123!"
     }'
   ```

   Por ahora la API todavía pide CNPJ y CPF (documentos de Brasil, herencia de Fixr). Los de arriba son números de prueba válidos; se van a reemplazar por CUIT y DNI.

4. Entrá a `http://localhost:3000` con ese email y contraseña.

Para que el sistema mande emails (invitaciones a empleados, recuperar contraseña) completá las variables `SMTP_*` del `.env` con cualquier casilla de correo. Con Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, tu dirección en `SMTP_USER` y una [contraseña de aplicación](https://myaccount.google.com/apppasswords) en `SMTP_PASSWORD`. Si lo dejás vacío, la app funciona igual y los emails solo se anotan en el log de `workers` (`docker compose logs workers`).

Para usarlo desde otra compu o celular del local, poné la IP de la máquina que corre Docker en `PUBLIC_APP_URL` y `PUBLIC_API_URL` y volvé a correr el paso 2.

Para apagarlo: `docker compose down`. Los datos quedan guardados: la base de datos en el volumen `mysql` y las fotos de los relojes en el volumen `uploads`. Conviene hacer copia de seguridad de los dos.

## Para desarrollar

Hace falta [Bun](https://bun.sh/).

```bash
bun install
bun run db:start      # MySQL y Redis en Docker
bun run db:migrate
bun run dev           # API, workers y app web en modo desarrollo
```

Antes de subir cambios: `bun run check-types` y `bun run lint`. Las reglas del código están en `AGENTS.md`.
