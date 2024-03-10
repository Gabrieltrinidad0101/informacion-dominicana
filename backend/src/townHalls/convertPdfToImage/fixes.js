/**
 * 
 * @param {string} filePath 
 */
const fixesRotationImages = (filePath)=>{
    if(
        (filePath.includes("2021") && filePath.includes("november")) ||     
        (filePath.includes("2018") && filePath.includes("april"))      
    ){
        return -90
    }

    if(
        (filePath.includes("2018") && filePath.includes("october"))      
    ){
        return 90
    }
    return 0
}


module.exports = {fixesRotationImages}