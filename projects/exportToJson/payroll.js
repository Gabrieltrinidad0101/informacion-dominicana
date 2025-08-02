import archiver from "archiver";

class Payroll {
    constructor(payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    payroll = async (data) => {
        const payroll = await this.payrollRepository.payroll(data.institutionName);
        const employeersM = await this.payrollRepository.payrollMale(data.institutionName);
        const employeersF = await this.payrollRepository.payrollFemale(data.institutionName);
        const employeersTotal = await this.payrollRepository.employeersTotal(data.institutionName);
        const employeersByPosition = await this.payrollRepository.employeersByPosition(data.institutionName);
        const wageGrowth = await this.payrollRepository.wageGrowth(data.institutionName);
        const wageGrowthMale = await this.payrollRepository.wageGrowthMale(data.institutionName);
        const wageGrowthFemale = await this.payrollRepository.wageGrowthFemale(data.institutionName);
    }
}