import archiver from "archiver";

class Payroll {
    constructor(payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    payroll = async (data) => {
        const payroll = await this.payrollRepository.payroll(data.instituctionName);
        const employeersM = await this.payrollRepository.payrollMale(data.instituctionName);
        const employeersF = await this.payrollRepository.payrollFemale(data.instituctionName);
        const employeersTotal = await this.payrollRepository.employeersTotal(data.instituctionName);
        const employeersByPosition = await this.payrollRepository.employeersByPosition(data.instituctionName);
        const wageGrowth = await this.payrollRepository.wageGrowth(data.instituctionName);
        const wageGrowthMale = await this.payrollRepository.wageGrowthMale(data.instituctionName);
        const wageGrowthFemale = await this.payrollRepository.wageGrowthFemale(data.instituctionName);
    }
}