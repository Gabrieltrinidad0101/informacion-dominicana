import { useLocation } from "react-router";
import { Evento } from "../../components/evento/Evento";
import EventosCss from "./Eventos.module.css";


export function Eventos() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  return (
    <div className={EventosCss.eventos} >
      <Evento exchangeName="downloadLinks" queryParams={queryParams} />
      <Evento exchangeName="downloads" queryParams={queryParams}  />
      <Evento exchangeName="postDownloads" queryParams={queryParams} />
      <Evento exchangeName="extractedTexts" queryParams={queryParams} />
      <Evento exchangeName="analyzeExtractedTexts" queryParams={queryParams} />
      <Evento exchangeName="aiTextAnalyzers" queryParams={queryParams}  />
      <Evento exchangeName="insertDatas" queryParams={queryParams}  />
      <Evento exchangeName="payrollExportToJsons" queryParams={queryParams}  />
      <Evento exchangeName="payrolls" queryParams={queryParams}  />
    </div>
  );
}
