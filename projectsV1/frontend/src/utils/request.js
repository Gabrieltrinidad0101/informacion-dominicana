import constants from "../constants";

export const payroll = async (institution) => {
    const res = requestJson(`datas/townHalls/${institution}/Nomina`)
    return res;
}

const requests = {}
export const requestJson = async (path) => {
  if (requests[path]) return requests[path];

  const parts = path.split("/");
  const last = parts.pop();                    // filename
  const sanitized = sanitizeFilename(last);    // sanitize only filename
  parts.push(sanitized);                       // put back sanitized filename

  const finalPath = parts.join("/");
  const fullUrl = `${constants.urlData}/${finalPath}.json`;

  const encodedURL = encodeURI(fullUrl);
  const res = await fetch(encodedURL);

  requests[path] = await res.json();
  return requests[path];
};

function sanitizeFilename(filename) {
  return filename
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^A-Za-z0-9._-]/g, "_");                // replace invalid chars
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
