import archiver from "archiver";

class Payroll {
    constructor(payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    payroll = async (data) => {
        const payroll = await this.payrollRepository.payroll(data.instituction);
        const employeersM = await this.payrollRepository.payrollMale(data.instituction);
        const employeersF = await this.payrollRepository.payrollFemale(data.instituction);
        const employeersTotal = await this.payrollRepository.employeersTotal(data.instituction);
        const employeersByPosition = await this.payrollRepository.employeersByPosition(data.instituction);
        const wageGrowth = await this.payrollRepository.wageGrowth(data.instituction);
        const wageGrowthMale = await this.payrollRepository.wageGrowthMale(data.instituction);
        const wageGrowthFemale = await this.payrollRepository.wageGrowthFemale(data.instituction);
    }
}