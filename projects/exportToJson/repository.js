import Knex from 'knex';

const knex = Knex({
  client: 'pg',
  connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@postgres:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`,
});

export class Repository {
  async payroll(institutionName) {
    const result = await knex('payrolls')
      .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
      .select(knex.raw('SUM(income)::FLOAT AS value'))
      .where('institutionName', institutionName)
      .groupBy('time')
      .orderBy('time', 'asc');
      
    return result;
  }

  async payrollTotal(institutionName) { 
    const result = await knex('payrolls') 
      .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`)) 
      .select(knex.raw('COUNT(income)::FLOAT AS value')) 
      .where('institutionName', institutionName) 
      .groupBy('time') 
      .orderBy('time', 'asc'); 
    return result; 
  }

  async payrollBySex(institutionName, sex) {
    const result = await knex('payrolls')
      .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
      .select(knex.raw('COUNT(income)::FLOAT AS value'))
      .where('sex', sex)
      .where('institutionName', institutionName)
      .groupBy('time')
      .orderBy('time', 'asc');
    return result;
  }


  async employeersByMonthAndPosition(institutionName) {
    const rows = await knex('payrolls')
      .select(
        knex.raw(`TO_CHAR("date", 'YYYY-MM') AS date_key`),
        '*'
      )
      .where('institutionName', institutionName)
      .orderBy('income', 'asc');

    const grouped = {};

    rows.forEach(row => {
      const dateKey = row.date_key;
      grouped[dateKey] ??= {};
      grouped[dateKey][row.position] ??= [];
      delete row.date_key
      grouped[dateKey][row.position].push(row);
    });

    return grouped;
  }


  async percentageOfSpendingByPosition(institutionName) {
    const rows = await knex('payrolls').select(
    knex.raw(`TO_CHAR("date", 'YYYY-MM') AS date_key`),
    'position',
    knex.raw('COUNT(*) AS "employeeCount"'),
    knex.raw(`
      ROUND(
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY TO_CHAR("date", 'YYYY-MM')),
        6
      ) AS "employeeCountPercentage"
    `),
    knex.raw('ROUND(AVG(income)::numeric, 2) AS "averageSalary"'),
    knex.raw(`
      ROUND(
        AVG(income) * 100.0 / SUM(AVG(income)) OVER (PARTITION BY TO_CHAR("date", 'YYYY-MM')),
        6
      ) AS "averageSalaryPercentage"
    `)
  )
  .where('institutionName', institutionName)
  .groupBy('date_key', 'position')
  .orderBy('date_key', 'asc')
  .orderBy('employeeCount', 'desc');


    const nested = {};

    rows.forEach(row => {
      const dateKey = row.date_key;
      nested[dateKey] ??= {};
      nested[dateKey][row.position] = {
        employeeCount: Number(row.employeeCount),
        employeeCountPercentage: Number(row.employeeCountPercentage),
        averageSalary: Number(row.averageSalary),
        averageSalaryPercentage: Number(row.averageSalaryPercentage),
      };
    });
    return nested;
  }
}
