import { constants } from '../../constants.js';
import { forEachFolder } from '../../utils.js';
import { santoDomingoEsteAnalyze } from './santoDomingoEste.js';
import { sanFranciscoDeMacorisAnalyze } from './sanFranciscoDeMacoris.js';
import { santiagoDeLosCaballerosAnalyze } from './santiagoDeLosCaballeros.js';

const townHallsAnalyzes = {
    "Santo Domingo Este": santoDomingoEsteAnalyze,
    "San Francisco de Macoris": sanFranciscoDeMacorisAnalyze,
    "Santiago de los Caballeros": santiagoDeLosCaballerosAnalyze
}

try{
    await forEachFolder(constants.datosOrgTownHalls(),async(townHallName,townHallPath)=>{
        townHallsAnalyzes[townHallName](townHallName,townHallPath)
    })
}catch(err){
    console.error('Error converting CSV to JSON:', err);
}