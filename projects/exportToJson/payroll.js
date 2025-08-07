export class Payroll {
    constructor(payrollRepository,eventBus,fileAccess) {
        this.payrollRepository = payrollRepository;
        this.eventBus = eventBus;
        this.fileAccess = fileAccess;
        this.eventBus.on('payrollExportToJson','payrollExportToJsons', (data)=>this.payroll(data));
    }

    save(metadata,fileName,data){
        const makePath = this.fileAccess.makePath(metadata.institutionName,
            "nomina",
            "exportToJson")
        this.fileAccess.saveFileToPath(makePath,fileName,  JSON.stringify(data)
        );
    }

    payroll = async (data) => {
        const payroll = await this.payrollRepository.payroll(data.institutionName);
        const employeersM = await this.payrollRepository.payrollMale(data.institutionName);
        const employeersF = await this.payrollRepository.payrollFemale(data.institutionName);
        const employeersTotal = await this.payrollRepository.employeersTotal(data.institutionName);
        const employeersByPosition = await this.payrollRepository.employeersByMonthAndPosition(data.institutionName);
        const wageGrowth = await this.payrollRepository.wageGrowth(data.institutionName);
        const wageGrowthMale = await this.payrollRepository.wageGrowthMale(data.institutionName);
        const wageGrowthFemale = await this.payrollRepository.wageGrowthFemale(data.institutionName);
        const percentageOfSpendingByPosition = await this.payrollRepository.percentageOfSpendingByPosition(data.institutionName);   
        const countByPosition = await this.payrollRepository.countByPosition(data.institutionName);

        this.save(data,"payroll.json",payroll);
        this.save(data,"employeersM.json",employeersM);
        this.save(data,"employeersF.json",employeersF);
        this.save(data,"employeersTotal.json",employeersTotal);
        this.save(data,"employeersByPosition.json",employeersByPosition);
        this.save(data,"wageGrowth.json",wageGrowth);
        this.save(data,"wageGrowthMale.json",wageGrowthMale);
        this.save(data,"wageGrowthFemale.json",wageGrowthFemale);   
        this.save(data,"percentageOfSpendingByPosition.json",percentageOfSpendingByPosition);
        this.save(data,"countByPosition.json",countByPosition);
    }
}