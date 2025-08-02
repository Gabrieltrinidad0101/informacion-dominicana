export const payroll = async (institution) => {
    const res = requestJson(`datas/townHalls/${institution}/Nomina`)
    return res;
}

const requests = {}

export const requestJson = async (url) => {
    if(requests[url]) return requests[url]
    const fullUrl = `http://127.0.0.1:5500/${url}.json`
    const encodeURL = encodeURI(fullUrl)
    const res = await fetch(encodeURL)
    requests[url] = await res.json()
    return requests[url]
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