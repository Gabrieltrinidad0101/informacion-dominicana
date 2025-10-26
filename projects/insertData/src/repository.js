import Knex from 'knex';

const knex = Knex({
  client: 'pg',
  connection: 'postgresql://myuser:mypassword@postgres:5432/informacion-dominicana',
});

export class Repository {
  constructor() {
    void async function () {
      await knex.schema.hasTable('payrolls').then(async (exists) => {
        if (exists) return
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
        });
      });
    }
  }
  async save(payrolls) {
    try {
      await knex('payrolls').insert(payrolls);
    } catch (err) {
      throw err;
    }
  }

  async delete({ date, institutionName, index, traceId, link }) {
    try {
      const deletedCount = await knex('payrolls')
        .where({
          date,
          institutionName,
          index,
          traceId,
          link,
        })
        .del();
      return deletedCount;
    } catch (err) {
      throw err;
    }
  }
}

