import { forPayroll } from "../../utils.js"

/**
 * 
 * @param {string} dataText 
 * @returns 
 */

export const analyze = async () => {
    forPayroll((data)=>{
        console.log(data)
    })
}