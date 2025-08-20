export class Payroll {
    constructor(payrollRepository, eventBus, fileAccess) {
        this.payrollRepository = payrollRepository;
        this.eventBus = eventBus;
        this.fileAccess = fileAccess;
        this.eventBus.on('payrollExportToJson', 'payrollExportToJsons', (data) => this.payroll(data));
    }

    async save(metadata, fileName, data) {
        const fileUrl = `${metadata.institutionName}/nomina/exportToJson/${fileName}`
        await this.fileAccess.createTextFile(fileUrl, JSON.stringify(data)
        );
    }

    payroll = async (data) => {
        console.log(data)
        const payroll = await this.payrollRepository.payroll(data.institutionName);
        const employeersM = await this.payrollRepository.payrollMale(data.institutionName);
        const employeersF = await this.payrollRepository.payrollFemale(data.institutionName);
        const employeersByPosition = await this.payrollRepository.employeersByMonthAndPosition(data.institutionName);
        const percentageOfSpendingByPosition = await this.payrollRepository.percentageOfSpendingByPosition(data.institutionName);
        // const wageGrowth = await this.payrollRepository.wageGrowth(data.institutionName);
        // const wageGrowthMale = await this.payrollRepository.wageGrowthMale(data.institutionName);
        // const wageGrowthFemale = await this.payrollRepository.wageGrowthFemale(data.institutionName);
        // const countByPosition = await this.payrollRepository.countByPosition(data.institutionName);

        await this.save(data, "payroll.json", payroll);
        await this.save(data, "employeersM.json", employeersM);
        await this.save(data, "employeersF.json", employeersF);
        await this.save(data, "employeersByPosition.json", employeersByPosition);
        await this.save(data, "percentageOfSpendingByPosition.json", percentageOfSpendingByPosition);
        // this.save(data,"wageGrowth.json",wageGrowth);
        // this.save(data,"wageGrowthMale.json",wageGrowthMale);
        // this.save(data,"wageGrowthFemale.json",wageGrowthFemale);   
        // this.save(data,"countByPosition.json",countByPosition);
    }
}