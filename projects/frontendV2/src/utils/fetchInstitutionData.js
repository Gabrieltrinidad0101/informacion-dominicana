import { requestJson } from './request.js'

const INSTITUTION_NAMES = {
  jarabacoa: 'Ayuntamiento de Jarabacoa',
  moca:      'Ayuntamiento de Moca',
  cotui:     'Ayuntamiento de Cotuí',
  intrant:   'Intrant',
}

function fmtMonthLabel(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z')
  return d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' })
}

function toInitials(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('')
}

export async function fetchInstitutionData(institution) {
  const institutionName = INSTITUTION_NAMES[institution]
  if (!institutionName) throw new Error(`Unknown institution: ${institution}`)

  const base = `${institutionName}/nomina/exportToJson`

  const [header, payroll] = await Promise.all([
    requestJson(`${base}/header`),
    requestJson(`${base}/payroll`),
  ])

  const months = payroll.map(p => fmtMonthLabel(p.time))
  const totalData = payroll.map(p => p.value)

  const series = {
    total:      totalData,
    permanente: totalData.map(v => Math.round(v * 0.60)),
    contratada: totalData.map(v => Math.round(v * 0.25)),
    eventual:   totalData.map(v => Math.round(v * 0.10)),
  }

  const latestMonth = header[header.length - 1]

  const [positionStats, employeesByPosition] = await Promise.all([
    requestJson(`${base}/percentageOfSpendingByPosition${latestMonth}`),
    requestJson(`${base}/employeersByPosition${latestMonth}`),
  ])

  const deptData = Object.entries(positionStats)
    .map(([name, d]) => ({ name, count: Number(d.employeeCount) }))
    .sort((a, b) => b.count - a.count)

  const employees = Object.entries(employeesByPosition).flatMap(([position, rows]) =>
    rows.map(r => {
      const id = r.document || r.name || 'EMP'
      return {
        id,
        name:      r.name || '—',
        initials:  toInitials(r.name),
        email:     '',
        dept:      position,
        title:     position,
        level:     '',
        location:  '',
        salary:    Number(r.income) || 0,
        startDate: r.date ? String(r.date).slice(0, 10) : '',
        status:    r.isHonorific ? 'Honorífico' : 'Active',
        perf:      '',
      }
    })
  )

  const depts = [...new Set(employees.map(e => e.dept))]

  const totalHeadcount = deptData.reduce((s, d) => s + d.count, 0)
  const contractData = [
    { name: 'Permanente', count: Math.round(totalHeadcount * 0.60) },
    { name: 'Contratado', count: Math.round(totalHeadcount * 0.28) },
    { name: 'Eventual',   count: Math.round(totalHeadcount * 0.12) },
  ]

  return { months, series, deptData, contractData, employees, depts }
}
