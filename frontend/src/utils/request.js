const payrolls = {}
export const payroll = async (department) => {
    if (payrolls[department]) return payrolls[department];
    const res = requestJson(`datas/townHalls/${department}/Nomina`)
    payrolls[department] = res;
    return res;
}


export const requestJson = async (url) => {
    const res = await fetch(`http://127.0.0.1:5500/${url.replaceAll("%", "%25")}.json`)
    return await res.json()
}

export const formatToLastDayOfMonth = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed

    // Create a new date for the first day of the next month, then subtract one day
    const lastDay = new Date(year, month + 1, 0).getDate();

    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(lastDay).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`
}