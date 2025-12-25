import Knex from 'knex';

const knex = Knex({
  client: 'pg',
  connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@postgres:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`,
});
export class Repository {
  constructor() {}

  static async init() {
    const exists = await knex.schema.hasTable('payrolls');
    knex.schema.dropTableIfExists('payrolls');
    if (!exists) {
      await knex.schema.createTable('payrolls', (table) => {
        table.text('_id').primary();
        table.timestamp('date', { useTz: true });
        table.text('document');
        table.integer('height');
        table.decimal('income', 15, 2);
        table.integer('index');
        table.text('institutionName');
        table.text('isDocumentValid');
        table.text('link');
        table.text('name');
        table.text('position');
        table.uuid('traceId');
        table.integer('width');
        table.integer('x');
        table.integer('y');
        table.string('sex', 1);
        table.text('urlDownload');
        table.text('confidences');
        table.text('institutionName');
      });
    }
  }

  async save(payrolls) {
    return knex('payrolls').insert(payrolls);
  }

  async delete({ date, institutionName, index, traceId, link }) {
    return knex('payrolls')
      .where({ date, institutionName, index, traceId, link })
      .del();
  }
}


await Repository.init();