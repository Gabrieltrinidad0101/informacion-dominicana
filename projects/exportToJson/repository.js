import mongoose from 'mongoose';

await mongoose.connect('mongodb://root:root@mongo:27017/informacion-dominicana?authSource=admin');

const dynamicSchema = new mongoose.Schema({}, { strict: false });
const Payroll = mongoose.models.payroll ?? mongoose.model("payroll", dynamicSchema);
const PayrollExportToJson = mongoose.models.payrollExportToJson ?? mongoose.model("payrollExportToJsons", dynamicSchema);

export class Repository {

    async insertDefaultValues() {
        try {
            await PayrollExportToJson.updateOne(
                { _id: new mongoose.Types.ObjectId("688fa9e6c1e5bf7298db4b9b") },
                {
                    $set: {
                        institutionName: "Ayuntamiento de Jarabacoa"
                    }
                },
                { upsert: true }
            );
        } catch {

        }
    }

    async payroll(institutionName, sex) {
        const match = {
            date: { $type: "date" },
        }
        if (institutionName) match.institutionName = institutionName
        if (sex) match.sex = sex

        return await Payroll.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" }
                    },
                    value: {
                        $sum: {
                            $convert: {
                                input: "$income", // puede ser string, vacío o número
                                to: "double",
                                onError: 0,       // si falla (ej: ""), cuenta como 0
                                onNull: 0         // si es null, también 0
                            }
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            },
            {
                $project: {
                    _id: 0,
                    time: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.day", 10] },
                                    { $concat: ["0", { $toString: "$_id.day" }] },
                                    { $toString: "$_id.day" }
                                ]
                            }
                        ]
                    },
                    value: 1
                }
            }
        ]);
    }



    async payrollMale(institutionName) {
        return await this.payroll(institutionName, "M")
    }

    async payrollFemale(institutionName) {
        return await this.payroll(institutionName, "F")
    }

    async employeersTotal(institutionName) {
        return Payroll.countDocuments({ institutionName });
    }

    async percentageOfSpendingByPosition(institutionName) {
        const employeesByMonthAndPosition = await Payroll.aggregate([
            {
                $match: {
                    date: { $type: "date" },
                    name: { $exists: true, $ne: "" },
                    position: { $exists: true, $ne: "" },
                    income: { $exists: true, $ne: "" },
                    ...(institutionName ? { institutionName } : {}) // 👈 filtro dinámico
                }
            },
            {
                $addFields: {
                    incomeNum: { $toDouble: "$income" }
                }
            },
            // 1️⃣ Agrupar por mes y posición
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        position: "$position"
                    },
                    employees: { $addToSet: "$name" },
                    positionIncome: { $sum: "$incomeNum" }
                }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    position: "$_id.position",
                    employeeCount: { $size: "$employees" },
                    positionIncome: 1,
                    _id: 0
                }
            },
            // 2️⃣ Agrupar por mes para obtener total de ingresos
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    positions: {
                        $push: {
                            position: "$position",
                            employeeCount: "$employeeCount",
                            positionIncome: "$positionIncome"
                        }
                    },
                    totalIncome: { $sum: "$positionIncome" }
                }
            },
            // 3️⃣ Calcular porcentaje y salario promedio
            {
                $project: {
                    _id: 0,
                    time: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { $toString: "$_id.month" }
                        ]
                    },
                    positions: {
                        $map: {
                            input: "$positions",
                            as: "p",
                            in: {
                                position: "$$p.position",
                                employeeCount: "$$p.employeeCount",
                                percentage: {
                                    $cond: [
                                        { $eq: ["$totalIncome", 0] },
                                        0,
                                        {
                                            $round: [
                                                { $multiply: [{ $divide: ["$$p.positionIncome", "$totalIncome"] }, 100] },
                                                2
                                            ]
                                        }
                                    ]
                                },
                                averageSalary: {
                                    $cond: [
                                        { $eq: ["$$p.employeeCount", 0] },
                                        0,
                                        { $round: [{ $divide: ["$$p.positionIncome", "$$p.employeeCount"] }, 2] }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            { $unwind: "$positions" },
            {
                $project: {
                    _id: 0,
                    time: 1,
                    position: "$positions.position",
                    employeeCount: "$positions.employeeCount",
                    percentage: "$positions.percentage",
                    averageSalary: "$positions.averageSalary"
                }
            },
            { $sort: { time: 1, position: 1 } }
        ]);

        // 4️⃣ Convertir array en objeto con clave por "year-month"
        return employeesByMonthAndPosition.reduce((acc, curr) => {
            if (!acc[curr.time]) acc[curr.time] = [];
            acc[curr.time].push({
                position: curr.position,
                employeeCount: curr.employeeCount,
                percentage: curr.percentage,
                averageSalary: curr.averageSalary
            });
            return acc;
        }, {});
    }


    async wageGrowth(institutionName) {
        const wageGrowth = await Payroll.aggregate([
            {
                $match: {
                    date: { $type: "date" },
                    income: { $exists: true, $ne: "" }
                }
            },
            {
                $addFields: {
                    incomeNum: {
                        $convert: {
                            input: "$income",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalIncome: { $sum: "$incomeNum" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $group: {
                    _id: null,
                    months: {
                        $push: {
                            time: {
                                $concat: [
                                    { $toString: { $ifNull: ["$_id.year", ""] } },
                                    "-",
                                    { $toString: { $ifNull: ["$_id.month", ""] } }
                                ]
                            },
                            value: "$totalIncome"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    growth: {
                        $map: {
                            input: { $range: [1, { $size: "$months" }] },
                            as: "i",
                            in: {
                                time: { $arrayElemAt: ["$months.time", "$$i"] },
                                value: {
                                    $subtract: [
                                        { $arrayElemAt: ["$months.value", "$$i"] },
                                        { $arrayElemAt: ["$months.value", { $subtract: ["$$i", 1] }] }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            { $unwind: "$growth" },
            { $replaceRoot: { newRoot: "$growth" } }
        ]);

        return wageGrowth;
    }

    async wageGrowthMale(institutionName) {
        const result = await Payroll.aggregate([
            { $match: { institutionName, sex: "M" } },
            {
                $group: {
                    _id: null,
                    averageIncome: { $avg: { $toDouble: "$income" } }
                }
            }
        ]);
        return result[0]?.averageIncome ?? 0;
    }

    async wageGrowthFemale(institutionName) {
        const result = await Payroll.aggregate([
            { $match: { institutionName, sex: "F" } },
            {
                $group: {
                    _id: null,
                    averageIncome: { $avg: { $toDouble: "$income" } }
                }
            }
        ]);
        return result[0]?.averageIncome ?? 0;
    }


    async employeersByMonthAndPosition(institutionName) {
        const payrollByMonthAndPosition = await Payroll.aggregate([
            {
                $match: {
                    date: { $type: "date" },
                    name: { $exists: true, $ne: "" },
                    position: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        position: "$position"
                    },
                    employees: {
                        $push: {
                            name: "$name",
                            income: "$income",
                            sex: "$sex",
                            x: "$x",
                            y: "$y",
                            width: "$width",
                            height: "$height",
                            downloadLink: "$downloadLink",
                            traceId: "$traceId"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { year: "$_id.year", month: "$_id.month" },
                    positions: {
                        $push: {
                            position: "$_id.position",
                            employees: "$employees"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    time: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }
                        ]
                    },
                    positions: 1
                }
            }
        ]);

        // Convertir a objeto con claves YYYY-MM
        const result = payrollByMonthAndPosition.reduce((acc, curr) => {
            acc[curr.time] = {};
            curr.positions.forEach(pos => {
                acc[curr.time][pos.position] = pos.employees;
            });
            return acc;
        }, {});

        return result

    }

    async payrollTotal(institutionName, sex) {
        const match = { date: { $type: "date" } }
        if (institutionName) match.institutionName = institutionName
        if (sex) match.sex = sex

        return await Payroll.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" }
                    },
                    value: { $sum: 1 } // count of employees
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
            {
                $project: {
                    _id: 0,
                    time: {
                        $concat: [
                            { $toString: "$_id.year" }, "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            }, "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.day", 10] },
                                    { $concat: ["0", { $toString: "$_id.day" }] },
                                    { $toString: "$_id.day" }
                                ]
                            }
                        ]
                    },
                    value: 1
                }
            }
        ]);
    }

}
