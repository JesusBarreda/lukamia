/**
 * Constantes
 */
var indiceDiaSemana = [7, 1, 2, 3, 4, 5, 6];

/**
 * Módulos
 */
var moment = require('moment'),
    fechaHora = require('./fechaHora');

/**
 * Funciones
 */
function diasMes(mes, anyo) {
  return new Date(anyo || new Date().getFullYear(), mes, 0).getDate();
}

function mesAnterior(fecha) {
  if(fecha.getMonth() == 0) {
    return new Date(fecha.getFullYear() - 1, 11, 1);
  }
  else {
    return new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1);
  }
}

function mesSiguiente(fecha) {
  if(fecha.getMonth() == 11) {
    return new Date(fecha.getFullYear() + 1, 0, 1);
  }
  else {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
  }
}

function crearMes(fecha) {
  var mesFecha = fecha.getMonth() + 1;
  var anyoFecha = fecha.getFullYear();
  var numDiasMes = diasMes(mesFecha, anyoFecha);
  var diaSemanaDiaUno = new Date(fecha.getFullYear(), mesFecha - 1, 1).getDay();
  var diaSemanaUltimoDia = new Date(fecha.getFullYear(), mesFecha - 1, numDiasMes).getDay();
  var mesAnteriorFecha = mesAnterior(fecha);
  var numDiasMesAnterior = diasMes(mesAnteriorFecha.getMonth() + 1, mesAnteriorFecha.getFullYear());
  var mesSiguienteFecha = mesSiguiente(fecha);
  var mes = [];
  var semana = [];

  for(var i = (numDiasMesAnterior - (indiceDiaSemana[diaSemanaDiaUno] - 2)); i <= numDiasMesAnterior; i++) {
    var dia = {fecha: new Date(mesAnteriorFecha.getFullYear(), mesAnteriorFecha.getMonth(), i)};    
    semana.push(dia);
    if(semana.length == 7) {
      mes.push(semana);
      semana = [];
    }
  }
  
  for(var i = 1; i <= numDiasMes; i++) {
    var dia = {fecha: new Date(anyoFecha, mesFecha - 1, i)};
    semana.push(dia);
    if(semana.length == 7) {
      mes.push(semana);
      semana = [];
    }
  }
  
  if(diaSemanaUltimoDia != 0) {
    for(var i = 1; i <= (7 - indiceDiaSemana[diaSemanaUltimoDia]); i++) {
      var dia = {fecha: new Date(mesSiguienteFecha.getFullYear(), mesSiguienteFecha.getMonth(), i)};
      semana.push(dia);
      if(semana.length == 7) {
        mes.push(semana);
        semana = [];
      }
    }
  }
  
  if(semana.length > 0) {
    mes.push(semana);
  }
  
  return {mes: moment(fecha).format('MMMM YYYY'), calendario: mes};
}

/**
 * Número de días que tiene el mes indicado.
 */
module.exports.diasMes = diasMes;

/**
 * Mes anterior al indicado.
 */
module.exports.mesAnterior = mesAnterior;

/**
 * Mes siguiente al indicado.
 */
module.exports.mesSiguiente = mesSiguiente;

/**
 * Crea el calendario comprendido entre los meses indicados.
 * calendario -> [{mes: 'nombre mes', calendario: [semana]}]
 * semana -> [{fecha: Date}]
 */
module.exports.crear = function(mesDesde, anyoDesde, mesHasta, anyoHasta) {
  var fechaDesde = new Date(anyoDesde, mesDesde - 1, 1);
  var fechaHasta = new Date(anyoHasta, mesHasta - 1, 1);
  var calendario = [];
  
  for(var fecha = fechaDesde; fechaHora.comparar(fecha, '<=', fechaHasta); fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1)) {
    var mes = crearMes(fecha);
    calendario.push(mes);
  }
  
  return calendario;
}