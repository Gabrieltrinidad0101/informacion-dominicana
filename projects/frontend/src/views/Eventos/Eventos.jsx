import { Evento } from "../../components/evento/Evento";
import EventosCss from "./Eventos.module.css";

export function Eventos() {
  return (
    <div className={EventosCss.eventos} >
      <Evento exchangeName="downloadLinks"/>
      <Evento exchangeName="downloads" />
      <Evento exchangeName="postDownloads"/>
      <Evento exchangeName="extractedTexts"/>
      <Evento exchangeName="analyzeExtractedTexts"/>
      <Evento exchangeName="textAnalysisAIs" />
      <Evento exchangeName="insertDatas" />
      <Evento exchangeName="payrollExportToJsons" />
    </div>
  );
}
