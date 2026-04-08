import Knex from 'knex';
import fs from 'fs/promises';
import path from 'path';

const knex = Knex({
    client: 'pg',
    connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@postgres:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`,
});

export class CustomDispatch {
    constructor(eventBus, eventsRepository) {
        this.eventBus = eventBus;
        this.eventsRepository = eventsRepository;
    }

    parseFileName(filename) {
        // Format: {exchangeName}-force-{date}.sql  or  {exchangeName}-{date}.sql
        const name = filename.replace(/\.sql$/, '');
        const parts = name.split('-');
        const exchangeName = parts[0];
        const force = parts[1] === 'force';
        return { exchangeName, force };
    }

    async dispatch() {
        const dir = './projects/events/customDispatch';
        let files;
        try {
            files = await fs.readdir(dir);
        } catch {
            console.log('[customDispatch] No customDispatch folder found, skipping.');
            return;
        }

        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        if (sqlFiles.length === 0) return;

        const doneDir = path.join(dir, 'done');
        await fs.mkdir(doneDir, { recursive: true });

        for (const file of sqlFiles) {
            const { exchangeName, force } = this.parseFileName(file);
            console.log(`[customDispatch] Processing ${file} → exchange: ${exchangeName}, force: ${force}`);

            const sql = await fs.readFile(path.join(dir, file), 'utf-8');
            const { rows } = await knex.raw(sql);

            if (rows.length === 0) {
                console.log(`[customDispatch] No rows returned from ${file}`);
            } else {
                const seen = new Set();
                const uniqueRows = rows.filter(r => {
                    const traceId = r.traceId ?? r.traceid;
                    const page = r.page ?? r.index ?? null;
                    const key = `${traceId}__${page}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                console.log(`[customDispatch] Found ${uniqueRows.length} unique traceId+page combinations from ${file}`);

                for (const row of uniqueRows) {
                    const traceId = row.traceId ?? row.traceid;
                    const page = row.page ?? row.index ?? null;
                    const query = { exchangeName, traceId, ...(page != null && { index: page }) };
                    const events = await this.eventsRepository.find(query);
                    for (const event of (Array.isArray(events) ? events : events?.data ?? [])) {
                        event.retryCount = (event.retryCount ?? 0) + 1;
                        await this.eventsRepository.updateEvent({ exchangeName, _id: event._id });
                        await this.eventBus.emitCustomExchange(exchangeName, event, { force });
                        console.log(`[customDispatch] Emitted event ${event._id} to ${exchangeName} (force: ${force})`);
                    }
                }
            }

            await fs.rename(path.join(dir, file), path.join(doneDir, file));
            console.log(`[customDispatch] Moved ${file} → done/`);
        }
    }
}
