import Knex from 'knex';

const knex = Knex({
  client: 'pg',
  connection: 'postgresql://myuser:mypassword@postgres:5432/informacion-dominicana',
});

export class Repository {
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

