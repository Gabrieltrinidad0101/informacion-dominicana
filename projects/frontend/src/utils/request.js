import constants from "../constants";

export const payroll = async (institution) => {
    const res = requestJson(`datas/townHalls/${institution}/Nomina`)
    return res;
}

const requests = {}

export const requestJson = async (url) => {
    if(requests[url]) return requests[url]
    const fullUrl = `${constants.urlData}/${sanitizeFilename(url)}.json`
    const encodeURL = encodeURI(fullUrl)
    const res = await fetch(encodeURL)
    requests[url] = await res.json()
    return requests[url]
}

function sanitizeFilename(filename) {
  filename = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  filename = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  return filename;
}

export const formatYYMM = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const formattedMonth = String(month + 1).padStart(2, '0');
    return `${year}-${formattedMonth}`
}


export const getLastDayOfMonth = (date) => {
    const lastDay = new Date(date.getYear, date.getMonth, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
