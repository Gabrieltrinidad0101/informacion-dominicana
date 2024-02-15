const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { fileExists } = require('../../../utils');

const getPath = (...paths)=>{
  const pathToReturn = path.join(...paths)
  if(pathToReturn === "") return pathToReturn
  fs.mkdir(pathToReturn,{ recursive: true }).catch((error)=>{console.log(error)})
  return pathToReturn
}

const getTextFromImage = async (analize)=>{
  const townHallsPath = path.join(__dirname,"../../../../processedData/townHalls")
  const townHalls = await fs.readdir(townHallsPath)

  for(const townHall of townHalls){
      const yearsPath = path.join(townHallsPath,townHall,"images")  
      const years = await fs.readdir(yearsPath)
      const nominaData = []
      const employee = []
      for(const year of years){
        const monthsPath = path.join(yearsPath,year)
        const months = await fs.readdir(monthsPath)
        for(const month of months){
          const nominaImages = path.join(monthsPath,month)
          const filePath = path.join(nominaImages,"data.txt")
          if(await fileExists(filePath)) {
            const dataText = await fs.readFile(filePath, 'utf8');
            const jsonData = analize({townHall,dataText,year,month, parse: (data)=>{
              return {
                value: data.salary,
                time: data.time 
              }
            }})

            nominaData.push(jsonData)
            employee.push({value: jsonData.length,date: jsonData[0].time})
            continue
          }
          const images = await fs.readdir(nominaImages)
          let dataText = ""
          console.log(`converting image to text ${nominaImages}`)
          for(const image of images){
            console.log(`   image to text: ${image}`)
            const text = await Tesseract.recognize(path.join(nominaImages,image),'eng',{
              errorHandler: (error) => console.log(error)
            })
            dataText += `${text.data.text}\n`
          }
          await fs.writeFile(filePath, dataText);
          nominaData.concat(analize({dataText,year,month,parse: (data)=>{
            return {
              value: data.salary,
              time: data.time 
            }
          }}))
        }
        const jsonFilePath = getPath(townHallsPath,townHall,`datas`)
        await fs.writeFile(path.join(jsonFilePath,`/${year}-nomina.json`),JSON.stringify(nominaData))
        await fs.writeFile(path.join(jsonFilePath,`/${year}-employee.json`),JSON.stringify(employee))
      }
  }
}


module.exports = {getTextFromImage}
