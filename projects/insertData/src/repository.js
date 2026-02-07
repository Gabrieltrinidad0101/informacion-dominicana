import Knex from 'knex';

const knex = Knex({
  client: 'pg',
  connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@postgres:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`,
});
export class Repository {
  constructor() {}

  static async init() {
    const exists = await knex.schema.hasTable('payrolls');
    if (!exists) {
      await knex.schema.createTable('payrolls', (table) => {
        table.text('_id').primary();
        table.timestamp('date', { useTz: true });
        table.text('document');
        table.decimal('income', 15, 2);
        table.integer('index');
        table.text('institutionName');
        table.boolean('isDocumentValid');
        table.text('link');
        table.text('internalLink');
        table.text('name');
        table.text('position');
        table.boolean('isHonorific');
        table.uuid('traceId');
        table.decimal('x', 10, 4);
        table.decimal('y', 10, 4);
        table.decimal('width', 10, 4);
        table.decimal('height', 10, 4);
        table.string('sex', 1);
        table.text('urlDownload');
        table.text('confidences');
      });
    }
  }

  async save(payrolls) {
    return knex('payrolls').insert(payrolls);
  }

  async delete({ date, institutionName, index,page, traceId, link }) {
    return knex('payrolls')
      .where({ date, institutionName, index: index ?? page, traceId, link })
      .del();
  }
}


await Repository.init();