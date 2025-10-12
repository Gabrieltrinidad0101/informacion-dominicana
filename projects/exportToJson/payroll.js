export class Payroll {
    constructor(payrollRepository, eventBus, fileAccess) {
        this.payrollRepository = payrollRepository;
        this.eventBus = eventBus;
        this.fileAccess = fileAccess;
        this.eventBus.on('payrollExportToJson', 'payrollExportToJsons', (data) => this.payroll(data));
    }

    async save(metadata, fileName, data) {
        const fileUrl = `${metadata.institutionName}/nomina/exportToJson/${fileName}`
        await this.fileAccess.createTextFile(fileUrl, JSON.stringify(data));
    }

    payroll = async (data) => {
        const payroll = await this.payrollRepository.payroll(data.institutionName);
        const employeersTotal = await this.payrollRepository.payrollTotal(data.institutionName);
        const employeersM = await this.payrollRepository.payrollBySex(data.institutionName, "M");
        const employeersF = await this.payrollRepository.payrollBySex(data.institutionName, "F");
        const employeersByPosition = await this.payrollRepository.employeersByMonthAndPosition(data.institutionName);
        const percentageOfSpendingByPosition = await this.payrollRepository.percentageOfSpendingByPosition(data.institutionName);

        const header = [];
        await this.save(data, "payroll.json", payroll);
        await this.save(data, "employeersM.json", employeersM);
        await this.save(data, "employeersF.json", employeersF);
        await this.save(data, "employeersTotal.json", employeersTotal);
        for(const key of Object.keys(employeersByPosition) ){
            await this.save(data, `employeersByPosition${key}.json`, employeersByPosition[key]);
            header.push(key);
        }
        
        for(const key of Object.keys(percentageOfSpendingByPosition) ){
            await this.save(data, `percentageOfSpendingByPosition${key}.json`, percentageOfSpendingByPosition[key]);
        }

        await this.save(data, `header.json`, header);

        // this.save(data,"wageGrowth.json",wageGrowth);
        // this.save(data,"wageGrowthMale.json",wageGrowthMale);
        // this.save(data,"wageGrowthFemale.json",wageGrowthFemale);   
        // this.save(data,"countByPosition.json",countByPosition);
    }
}