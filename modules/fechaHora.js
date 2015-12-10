/**
 * Constantes
 */
var inicialesDiasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/**
 * Módulos
 */
var moment = require('moment');

/**
 * Fijamos el idioma al español
 */
moment.locale('es');

/**
 * Funciones
 */
function comparar(fecha1, comparador, fecha2) {
  var f1 = moment(fecha1).format('YYYYMMDDHHmmssSSS');
  var f2 = moment(fecha2).format('YYYYMMDDHHmmssSSS');
  
  switch(comparador) {
    case '=': return f1 == f2;
    case '<': return f1 < f2;
    case '>': return f1 > f2;
    case '<=': return f1 <= f2;
    case '>=': return f1 >= f2;
    default: return false;
  }
}

function esBisiesto(anyo) {
  return !(anyo % 4) && (anyo % 100) || !(anyo % 400) ? true : false;
}

/**
 * Devuelve la fecha en formato dd/MM/yyyy HH:mm
 */
module.exports.formatFechaHora = function(fecha) {
  return moment(fecha).format('DD/MM/YYYY HH:mm');
}

/**
 * Devuelve el tiempo transcurrido desde la fecha hasta la actualidad.
 */
module.exports.formatFromNow = function(fecha) {
  return moment(fecha).fromNow();
}

/**
 * Devuelve la fecha actual sin la hora.
 */
module.exports.getFecha = function() {
  var fecha = new Date();
  
  fecha.setHours(0);
  fecha.setMinutes(0);
  fecha.setSeconds(0);
  fecha.setMilliseconds(0);
  
  return fecha;
}

/**
 * Compara ambas fechas.
 * comparador: ['=', '<', '>', '<=', '>=']
 */
module.exports.comparar = comparar;

/**
 * Convierte una fecha en formato string a una fecha Date.
 */
module.exports.stringToFecha = function(strFecha, formato) {
  return moment(strFecha, formato)._d;
}

/**
 * Convierte una fecha Date a formato string.
 */
module.exports.fechaToString = function(fecha, formato) {
  return moment(fecha).format(formato);
}

/**
 * Devuelve los meses del año.
 */
module.exports.obtenerMeses = function() {
  var meses = [];
  
  meses.push({numero: '01', nombre: 'Enero'});
  meses.push({numero: '02', nombre: 'Febrero'});
  meses.push({numero: '03', nombre: 'Marzo'});
  meses.push({numero: '04', nombre: 'Abril'});
  meses.push({numero: '05', nombre: 'Mayo'});
  meses.push({numero: '06', nombre: 'Junio'});
  meses.push({numero: '07', nombre: 'Julio'});
  meses.push({numero: '08', nombre: 'Agosto'});
  meses.push({numero: '09', nombre: 'Septiembre'});
  meses.push({numero: '10', nombre: 'Octubre'});
  meses.push({numero: '11', nombre: 'Noviembre'});
  meses.push({numero: '12', nombre: 'Diciembre'});
  
  return meses;
}

/**
 * Devuelve el nombre del mes correspondiente al índice indicado.
 */
module.exports.obtenerNombreMes = function(mes) {
  switch(eval(mes)) {
    case 1: return 'Enero';
    case 2: return 'Febrero';
    case 3: return 'Marzo';
    case 4: return 'Abril';
    case 5: return 'Mayo';
    case 6: return 'Junio';
    case 7: return 'Julio';
    case 8: return 'Agosto';
    case 9: return 'Septiembre';
    case 10: return 'Octubre';
    case 11: return 'Noviembre';
    case 12: return 'Diciembre';
  }
}

/**
 * Devuelve las fechas mes a mes comprendidas en el período indicado.
 */
module.exports.obtenerFechasPeriodoMeses = function(mesDesde, anyoDesde, mesHasta, anyoHasta) {
  var fechas = [];
  var fechaDesde = new Date(anyoDesde, mesDesde - 1, 1);
  var fechaHasta = new Date(anyoHasta, mesHasta - 1, 1);
  
  while(comparar(fechaDesde, '<=', fechaHasta)) {
    fechas.push(moment(fechaDesde).format('MM-YYYY'));
    fechaDesde = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth() + 1, 1);
  }
  
  return fechas;
}

/**
 * Devuelve la años comprendidos en el período indicado.
 */
module.exports.obtenerFechasPeriodoAnyos = function(anyoDesde, anyoHasta) {
  var fechas = [];
  var fechaDesde = new Number(anyoDesde);
  var fechaHasta = new Number(anyoHasta);
  
  while(fechaDesde <= fechaHasta) {
    fechas.push(fechaDesde.toString());
    fechaDesde++;
  }
  
  return fechas;
}

/**
 * Devuelve la letra inicial del día de la semana correspondiente a la fecha indicada.
 */
module.exports.obtenerInicialDiaSemana = function(fecha) {
  return inicialesDiasSemana[fecha.getDay()];
}

/**
 * Comprueba si el año indicado es bisiesto.
 */
module.exports.esBisiesto = esBisiesto;

/**
 * Comprueba si la fecha corresponde a un final de mes.
 */
module.exports.esFinalMes = function(fecha) {
  var dia = fecha.getDate();
  var mes = fecha.getMonth() + 1;
  
  switch(mes) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      if(dia == 31) return true;
      else return false;
    case 2:
      if(esBisiesto(fecha.getFullYear())) {
        if(dia == 29) return true;
        else return false;
      }
      else {
        if(dia == 28) return true;
        else return false;
      }
    case 4:
    case 6:
    case 9:
    case 11:
      if(dia == 30) return true;
      else return false;
  }
}
