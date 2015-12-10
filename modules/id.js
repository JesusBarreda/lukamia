/**
 * Módulos
 */
var moment = require('moment');

/**
 * Variables
 */
var ultimaId = '',
    semilla = 1;
    
/**
 * Devuelve un identificador único basado en la fecha actual.
 */
module.exports = function() {
  var id = moment().format('YYYYMMDDHHmmss');
  
  if(id == ultimaId) {
    id += semilla;
    semilla++;
  }
  else {
    ultimaId = id;
    semilla = 1;    
  }
  
  return id;
}