import { Evento } from "../../components/evento/Evento";
import EventosCss from "./Eventos.module.css";

export function Eventos() {
  return (
    <div className={EventosCss.eventos} >
      <Evento exchange="downloadLinks"/>
      <Evento exchange="downloads"/>
      <Evento exchange="postDownloads"/>
      <Evento exchange="extractedTexts"/>
    </div>
  );
}
