import { useLocation } from "react-router";
import { Evento } from "../../components/evento/Evento";
import EventosCss from "./Eventos.module.css";


export function Eventos({exchangeName}) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const exchangeNames = ["downloadLinks","downloads","postDownloads","extractedTexts","analyzeExtractedTexts","aiTextAnalyzers","insertDatas","payrollExportToJsons","payrolls"]
  const allData = queryParams.get("allData");
  if(allData){
    for(let exchangeName of exchangeNames){
      queryParams.set(exchangeName, allData);
    }
    queryParams.delete("allData");
  }
  
  return (
    <div className={EventosCss.eventos} >
      <Evento exchangeName={exchangeName} queryParams={queryParams} />
    </div>
  );
}
