const dataText = `842 LIBRADO SANTOS 050-0011361-2 3639.00 200010510258506 VIGILANTE NOCTURNO DEL PARQUE DURRT
4702 LIC. BELGICA ELCIRA CASTELLANOS PUJOLS0000-00-00 001-1762816-4 35,000.00 ENC. DIVISION DE SERVICIOS GENERALE
382 LIC. JOSE ENRIQUE TAVAREZ S 050-0028516-2 43,525.00 200010510415103 REGIDOR A
1622 LIC. RAFAEL AGUSTIN ABREU MENDEZ 05000395573 30,000.00 200010510310680 DIRECTOR DE RECURSOS HUMANOS A
730 LICDA. MARICELA ALT. GENAO DE JIMENEZ 050-0006288-4 43,525.00 200010510417266 REGIDORA A
873 LICDA. MARY AYBAR RAMOS 0000-00-00 050-0035361-4 20,000.00 200010510245111 CONTRALORA MUNICIPAL A
66 LICDA RHINA CHONG SURIEL 00000000 05000285857 30,000.00 200010510414120 ENC.DPATO. ADM. FINANCIERO A
123 LICDA. YANINA GALAN DE LEON 050-0040944-0 30,000.00 200010510417279 TESORERA MUNICIPAL A
534 LIDIA ALT. CELESTINO GARCIA 0000-00-00 050-0009274-1 3174.00 200010510247151 CONSERJE MERCADO A
32 LIDIO ANT. NUNEZ POLO 0000-00-00 050-0022753-7 5,871.00 CAPATAZ A
8468 LIGA MARCOS PENA O DAVID DURAN 00000000 2,500.00 0 AYUDA INSTITUCION A
8467 LIGA MARCOS PENA O JOSE ANTONIO TRINIDAD 00000000 1,500.00 0 AYUDA INSTITUCION A
4489 LISANDRO ALMONTE VICIOSO 050-0037550-0 3,000.00 0 AYUDA SOCIAL A
8484 LORENZO ROBERTO NUNEZ BUENO 2017-06-29 050-0042137-9 5,000.00 0 AAGENTE DE LIMPIEZA (CAMION) A
4254 LOURDES ANNERYS DOMINGUEZ DIAZ 0000-00-00 050-0035656-7 3,587.00 200010510333874 BARREDORA BRIGADA NO. 2 A
4731 LUCIA ALTAGRACIA DURAN ESPINAL 0000-00-00 402-2250002-3 3,587.00 'AGENTE DE LIMPIEZA (ASEO URBANO) BA
8484 LUIS ALBERTO CRUZ MORALES 050-0041642-9 10,000.00 200010510414984 COORDINADOR DEPORTIVO A
1446 LUIS ANTONIO DURAN 050-0004133-4 5,000.00 200010510309688 OBRERO DE CAMION A
872 LUIS GONZALO DURAN ROSA 2017-10-02 050-0014161-3 2,14500 200010510245962 MUSICO A
4739 LUIS MANUEL ABREU 050-0041609-8 2,702.00 MUSICO A
8476 LUIS MENA ALBERTO 2017-04-18 048-0039867-1 5,000.00 0 AAGENTE DE LIMPIEZA (CAMION) A
2046 LUIS MIGUEL VELOZ MUNOZ 00000000 05000502202 2,145.00 MUSICO A
4283 LUIS RAFAEL TIBURCIO 050-0019319-2 6,000.00 0 ASISTENTE ALCALDA-A PASO BAJITO A
47% LUZ BERENICE VICIOSO ACOSTA 0000-00-00 050-0036101-3 8,000.00 200010510414735 SECRETARIA A
4775 LUZ LORELY BAUTISTA HERRERA 0000-00-00 050-0042819-2 5,000.00 ASISTENTE DEL ALCALDE EN HATO VIEXD
`
//All the text is analize using only one for has better perfomarce
const numbers = new Set(["0","1","2","3","4","5","6","7","8","9"])
const letters = new Set(["q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","ñ","z","x","c","v","b","n","m","Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Ñ","Z","X","C","V","B","N","M"])

//by each line search number after find a number we continue since find to space after that 
//all the continue text is the name of emploment since we find a 0 because the rnc start with 0 in all the case
const returnGetName = ()=>{
    let findNumber = false
    let startGetName = false
    let name = ""
    let stop = false
    return (character)=>{
        if(stop) return name
        if(!findNumber) findNumber = numbers.has(character)
        if(numbers.has(character) && name != ""){
            stop = true
            return name
        }
        if(startGetName) name += character
        if(findNumber && character == " ") startGetName = true
    }
}

const returnGetPosition = ()=>{
    let position = ""
    let start = false
    let findAletter = false
    let text = ""
    return (character)=>{
        if(!start && text !== "") text += character
        if(character === ".") text = character
        if(text === ".00 ") start = true 
        if(text.length == 4) text = ""
        if(start && !findAletter) {
            findAletter = letters.has(character)
        }
        if(findAletter) position += character
        return position
    }
}


const getNameAndPosition = ()=>{
    let name = ""
    let position = ""
    let getName  = returnGetName()
    let getPosition  = returnGetPosition()
    let data = []
    for(let i = 0; i < dataText.length; i++){
        if(dataText[i] === "\n" || dataText[i] === "\r" || i == dataText.length - 1) {
            getName  = returnGetName()
            getPosition  = returnGetPosition()
            console.log({name,position})
            if(name != "" && position != "") data.push({name,position})
        }
        name = getName(dataText[i])
        position = getPosition(dataText[i])
    }
    console.log(data.length)
}

getNameAndPosition()

// (?:\d{1,3},)?\d{1,4}\.\d{2}
