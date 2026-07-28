import 'dotenv/config'
import Knex from 'knex'

// Single source of truth for the PostgreSQL connection used by all Node services.
export const createKnex = () => Knex({
    client: 'pg',
    connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`
})
