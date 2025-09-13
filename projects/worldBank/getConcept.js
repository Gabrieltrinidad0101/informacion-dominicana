/**
 * 
 * @param {string} description 
 */
export const getConcept = (description)=>{
    const social =  ["Desempleo",
    "Relación entre empleo y población",
    "Tasa de participación en la fuerza laboral",
    "Uso de preservativos",
    "Cobertura de los",
    "Brecha de pobreza a $1,90 por día",
    "Alimentación mediante lactancia exclusivamente",
    "Población entre",
    "Mujeres que creen",
    "Acceso a la electricidad",
    "Horas de trabajo promedio de niños",
    "Number of deaths",
    "Niños económicamente activos",
    "Niños que trabajan",
    "Empleados",
    "Empleo infantil",
    "Consumo de energía",
    "Crecimiento de la población",
    "Compensación de empleados",
    "Técnicos de investigación y desarrollo (por cada millón de personas)",
    "Mujeres que se casaron por primera vez antes de los 18",
    "Women who were first married by age 15",
    "Población"]

    const educacion = ["Nivel de instrucción",
    "Adolescentes que no asisten",
    "Alumnos de mayor edad",
    "Educacin terciaria",
    "Educación",
    "alfabetización",
    "Relación alumno-maestro",
    "escuela",
    "educación",
    "Maestros",
    "Inscripción escolar",
    "Fuerza laboral",
    "Personas desempleadas",
    "Incidencia",
    "Niños que no asisten"]

    const salud = ["Mujeres adultas con",
    "Mortalidad",
    "Mortality",
    "HepB3",
    "VIH",
    "Embarazadas",
    "Tasa de mortalidad",
    "Bebés",
    "Médicos",
    "muerte",
    "muertes",
    "Supervivencia hasta los",
    "Prevalencia de ",
    "Adultos (de 15 años en adelante)",
    "Niños con fiebre que reciben ",
    "Empleadores",
    "Enfermeras",
    "Esperanza",
    "Tratamiento de la diarrea"]
    
    const medioambiente =  ["Exportaciones de materias primas para la actividad",
    "emisiones",
    "Emisiones ",
    "Intensidad",
    "Tierras agrícolas",
    "Especies",
    "Área selvática",
    "Exportaciones de combustible"]
    
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
    "Aduana",
    "Costo para exportar",
    "pago",
    "Formación bruta de",
    "Tiempo para",
    "Impuestos",
    "Ayuda oficial",
    "Deuda",
    "Empleo",
    "Ahorro"]

    const militar = ["militar","Muertes producto de la guerra"]

    if(educacion.some(data=>description.includes(data))){
        return "Educacion"
    }

    if(social.some(data=>description.includes(data))){
        return "Social"
    }

    if(medioambiente.some(data=>description.includes(data))){
        return "Medioambiente"
    }

    if(economia.some(data=>description.includes(data))){
        return "Economia"
    }

    if(salud.some(data=>description.includes(data))){
        return "Salud"
    }

    if(militar.some(data=>description.includes(data))){
        return "Militar"
    }

    return "./"

}

