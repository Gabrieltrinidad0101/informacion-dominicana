/**
 * 
 * @param {string} filePath 
 */
export const fixesRotationImages = (filePath)=>{
    if(
        (filePath.includes("2021") && filePath.includes("november")) ||     
        (filePath.includes("2021") && filePath.includes("october")) ||     
        (filePath.includes("2021") && filePath.includes("december")) ||     
        (filePath.includes("2018") && filePath.includes("april")) ||
        (filePath.includes("2023") && filePath.includes("august")) ||
        (filePath.includes("2023") && filePath.includes("october")) ||
        (filePath.includes("2023") && filePath.includes("september")) ||
        (filePath.includes("2022"))
    ){
        return -90
    }

    if(
        (filePath.includes("2018") && filePath.includes("october"))      
    ){
        return 90
    }

    if(
        (filePath.includes("2023") && filePath.includes("november"))      
    ){
        return 360
    }
    return 0
}


