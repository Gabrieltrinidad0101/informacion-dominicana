import constants from "../constants";

export const payroll = async (institution) => {
    const res = requestJson(`datas/townHalls/${institution}/Nomina`)
    return res;
}

const requests = {}

export const requestJson = async (url) => {
    if(requests[url]) return requests[url]
    const fullUrl = `${constants.urlData}/${url}.json`
    const encodeURL = encodeURI(fullUrl)
    const res = await fetch(encodeURL)
    requests[url] = await res.json()
    return requests[url]
}

export const formatYYMM = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); 
    const formattedMonth = String(month + 1).padStart(2, '0');
    return `${year}-${formattedMonth}`
}