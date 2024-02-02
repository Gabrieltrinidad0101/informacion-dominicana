/**
 * 
 * @param {string} description 
 */
const getConcept = (description)=>{
    const social =  ["Desempleo",
    "Relación entre empleo y población",
    "Tasa de participación en la fuerza laboral",
    "Tasa de mortalidad",
    "Uso de preservativos",
    "Cobertura de los",
    "Brecha de pobreza a $1,90 por día",
    "Alimentación mediante lactancia exclusivamente",
    "Supervivencia hasta los",
    "Población entre",
    "Mujeres que creen",
    "Acceso a la electricidad",
    "Horas de trabajo promedio de niños",
    "Number of deaths",
    "Niños económicamente activos",
    "Empleados",
    "Empleo infantil",
    "Consumo de energía",
    "Crecimiento de la población",
    "Compensación de empleados",
    "Técnicos de investigación y desarrollo (por cada millón de personas)",
    "Población"]

    const educacion = ["Nivel de instrucción",
    "Adolescentes que no asisten",
    "Alumnos de mayor edad",
    "Educacin terciaria",
    "Educación",
    "Transición a la escuela",
    "Maestros",
    "Inscripción escolar",
    "Fuerza laboral",
    "Personas desempleadas",
    "Niños que no asisten"]

    const medioambiente =  ["Exportaciones de materias primas para la actividad","Emisiones ","Área selvática","Exportaciones de combustible"]
    const economia =  ["Gasto nacional bruto",
    "Inversión extranjera",
    "Tierras cultivables",
    "Área de tierra",
    "Empresas",
    "PIB",
    "Servicio de la deuda",
    "Valor agregado bruto al costo de los factores",
    "Turismo internacional",
    "Calificación de",
    "Crédito interno",
    "Agricultura, valor",
    "Valor actual de la deuda externa",
    "Importaciones",
    "Flujos de ayuda bilateral",
    "Tiempo necesario para",
    "Gasto de consumo final",
    "Tasa ",
    "pago",
    "Ayuda oficial",
    "Ahorro"]

    if(social.some(data=>description.includes(data))){
        return "Social"
    }

    if(medioambiente.some(data=>description.includes(data))){
        return "Medioambiente"
    }

    if(economia.some(data=>description.includes(data))){
        return "Economia"
    }

    if(educacion.some(data=>description.includes(data))){
        return "Educacion"
    }

    return "./"

}

module.exports = getConcept