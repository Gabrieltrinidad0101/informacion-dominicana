/**
 * 
 * @param {string} description 
 */
const getConcept = (description)=>{
    const sociedad =  description.includes("Desempleo") ||
    description.includes("Relación entre empleo y población") ||
    description.includes("Tasa de participación en la fuerza laboral") ||
    description.includes("Tasa de mortalidad") ||
    description.includes("Uso de preservativos") ||
    description.includes("Alimentación mediante lactancia exclusivamente") ||
    description.includes("Alumnos de mayor edad") ||
    description.includes("Adolescentes que no asisten") ||
    description.includes("Supervivencia hasta los") ||
    description.includes("Educación de nivel") ||
    description.includes("Población entre") ||
    description.includes("Población de ")


    if(sociedad){
        return "social"
    }

    return null

}

module.exports = getConcept