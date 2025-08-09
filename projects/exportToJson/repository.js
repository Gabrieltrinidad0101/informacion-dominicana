import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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

    async payroll(institutionName,sex) {
        const match = {
            date: { $type: "date" },
        }
        if(institutionName) match.institutionName = institutionName
        if(sex) match.sex = sex
        return await Payroll.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    value: { $sum: { $toDouble: { $ifNull: ["$income", "0"] } } }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
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
                            }
                        ]
                    },
                    value: 1
                }
            }
        ]);


    }

    async payrollMale(institutionName) {
        return await this.payroll(institutionName,"M")
    }

    async payrollFemale(institutionName) {
        return await this.payroll(institutionName,"F")
    }

    async employeersTotal(institutionName) {
        return Payroll.countDocuments({ institutionName });
    }

    async employeersByMonthAndPosition(institutionName) {
        const pipeline = [
            {
                $project: {
                    _id: 0,
                    yearMonth: { $concat: ["$year", "-", "$month"] },
                    position: "$position",
                    user: {
                        name: "$name",
                        income: "$income",
                        sex: "$sex",
                        x: "$x",
                        y: "$y",
                        width: "$width",
                        height: "$height",
                        institution: "$institution",
                        downloadLink: "$downloadLink"
                    }
                }
            },
            {
                $group: {
                    _id: {
                        yearMonth: "$yearMonth",
                        position: "$position"
                    },
                    users: { $push: "$user" }
                }
            },
            {
                $group: {
                    _id: "$_id.yearMonth",
                    positions: {
                        $push: {
                            k: "$_id.position",
                            v: "$users"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    yearMonth: "$_id",
                    value: { $arrayToObject: "$positions" }
                }
            },
            {
                $replaceRoot: {
                    newRoot: { $arrayToObject: [[{ k: "$yearMonth", v: "$value" }]] }
                }
            }
        ]
        const results = await Payroll.aggregate(pipeline);

        return results;

    }


    async wageGrowth(institutionName) {
        const result = await Payroll.aggregate([
            {
                $project: {
                    yearMonth: { $concat: ["$year", "-", "$month"] },
                    income: { $toDouble: "$income" } // Changed from $toInt to $toDouble
                }
            },
            {
                $group: {
                    _id: "$yearMonth",
                    totalIncome: { $sum: "$income" }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $setWindowFields: {
                    sortBy: { _id: 1 },
                    output: {
                        prevIncome: {
                            $shift: {
                                output: "$totalIncome",
                                by: -1
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    yearMonth: "$_id",
                    totalIncome: 1,
                    wageGrowth: {
                        $cond: {
                            if: { $eq: ["$prevIncome", null] },
                            then: null,
                            else: {
                                $divide: [
                                    { $subtract: ["$totalIncome", "$prevIncome"] },
                                    "$prevIncome"
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        return result;
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


    async percentageOfSpendingByPosition(institutionName) {
        const pipeline = [
            {
                $match: { institutionName }
            },
            {
                $addFields: {
                    numericIncome: { $toDouble: "$income" }
                }
            },
            {
                $group: {
                    _id: "$position",
                    totalByPosition: { $sum: "$numericIncome" }
                }
            },
            {
                $group: {
                    _id: null,
                    positions: {
                        $push: {
                            position: "$_id",
                            totalByPosition: "$totalByPosition"
                        }
                    },
                    institutionTotal: { $sum: "$totalByPosition" }
                }
            },
            {
                $unwind: "$positions"
            },
            {
                $project: {
                    _id: 0,
                    position: "$positions.position",
                    percentage: {
                        $multiply: [
                            { $divide: ["$positions.totalByPosition", "$institutionTotal"] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { percentage: -1 }
            }
        ];

        return Payroll.aggregate(pipeline);
    }

    async countByPosition(institutionName) {
        return Payroll.aggregate([
            { $match: { institutionName } },
            {
                $group: {
                    _id: "$position",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    position: "$_id",
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
    }
}
