/**
 * Constantes
 */
var FINAL_MES = 'FINAL_MES';

/**
 * Módulos
 */
var moment = require('moment'),
    mongoose = require('mongoose'),
    fechaHora = require('../modules/fechaHora');
    
/**
 * Variables
 */
var Schema = mongoose.Schema;

/**
 * Schema
 */
var schemaEvento = new Schema({
  tipo: {type: String, enum: ['PUNTUAL', 'SEMANAL', 'MENSUAL', 'ANUAL']},
  fecha: String,
  horaInicio: String,
  horaFin: String,
  texto: String,
  lugar: String,
  fechaInicio: Date,
  fechaFin: Date
}, {collection: 'agenda'});

/**
 * Obtiene los eventos de la agenda planificados para la fecha indicada.
 */
schemaEvento.statics.obtenerEventosFecha = function(fecha, callback) {
  var condiciones = [];
  
  // Condición tipo PUNTUAL
  condiciones.push({tipo: 'PUNTUAL', fecha: moment(fecha).format('DD-MM-YYYY')});
  
  // Condición tipo SEMANAL
  var diaSemana = fechaHora.obtenerInicialDiaSemana(fecha);
  condiciones.push({tipo: 'SEMANAL', fecha: new RegExp(diaSemana, 'g')});
  
  // Condición tipo MENSUAL
  var finalMes = fechaHora.esFinalMes(fecha);
  condiciones.push({tipo: 'MENSUAL', fecha: moment(fecha).format('DD')});
  if(finalMes) {
    condiciones.push({tipo: 'MENSUAL', fecha: FINAL_MES});
  }
  
  // Condición tipo ANUAL
  condiciones.push({tipo: 'ANUAL', fecha: moment(fecha).format('DD-MM')});
  
  this.find({$or: condiciones}, function(err, eventos) {
    // Filtramos los eventos aplicando el periodo de actividad [fechaInicio, fechaFin]
    var eventosFiltrados = [];
    for(var i = 0; i < eventos.length; i++) {
      var evento = eventos[i];
      var activo = true;
      if(evento.tipo == 'SEMANAL' || evento.tipo == 'MENSUAL' || evento.tipo == 'ANUAL') {
        if(evento.fechaInicio) {
          if(fechaHora.comparar(fecha, '<', evento.fechaInicio)) {
            activo = false;
          }          
        }
        if(evento.fechaFin) {
          if(fechaHora.comparar(fecha, '>', evento.fechaFin)) {
            activo = false;
          }
        }
      }
      
      if(activo) {
        eventosFiltrados.push(evento);
      }
    }
    
    callback(eventosFiltrados);
  });
}

/**
 * Obtiene los eventos de la agenda planificados para el mes de la fecha indicada.
 */
schemaEvento.statics.obtenerEventosMes = function(fecha, callback) {
  var condiciones = [];
  
  // Condición tipo PUNTUAL
  var rePuntual = new RegExp(moment(fecha).format('-MM-YYYY'), 'g');
  condiciones.push({tipo: 'PUNTUAL', fecha: rePuntual});
  
  var fechaMesAnterior = new Date(fecha.getFullYear(), fecha.getMonth() - 1, fecha.getDate());
  var rePuntualMesAnterior = new RegExp(moment(fechaMesAnterior).format('-MM-YYYY'), 'g');
  condiciones.push({tipo: 'PUNTUAL', fecha: rePuntualMesAnterior});
  
  var fechaMesSiguiente = new Date(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
  var rePuntualMesSiguiente = new RegExp(moment(fechaMesSiguiente).format('-MM-YYYY'), 'g');
  condiciones.push({tipo: 'PUNTUAL', fecha: rePuntualMesSiguiente});
  
  // Condición tipo SEMANAL
  condiciones.push({tipo: 'SEMANAL'});
  
  // Condición tipo MENSUAL
  condiciones.push({tipo: 'MENSUAL'});
  
  // Condición tipo ANUAL
  var reAnualMes = new RegExp(moment(fecha).format('-MM'), 'g');
  condiciones.push({tipo: 'ANUAL', fecha: reAnualMes});

  var reAnualMesAnterior = new RegExp(moment(fechaMesAnterior).format('-MM'), 'g');
  condiciones.push({tipo: 'ANUAL', fecha: reAnualMesAnterior});
  
  var reAnualMesSiguiente = new RegExp(moment(fechaMesSiguiente).format('-MM'), 'g');
  condiciones.push({tipo: 'ANUAL', fecha: reAnualMesSiguiente});
  
  this.find({$or: condiciones}, function(err, eventos) {
    callback(eventos);
  });
}

/**
 * Graba un evento.
 */
schemaEvento.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Actualiza un evento.
 */
schemaEvento.statics.actualizar = function(evento, callback) {
  var cambios = {
    tipo: evento.tipo,
    fecha: evento.fecha,
    texto: evento.texto
  };
  
  if(evento.horaInicio) {
    cambios.horaInicio = evento.horaInicio;
  }
  else {
    cambios.horaInicio = null;
  }
  
  if(evento.horaFin) {
    cambios.horaFin = evento.horaFin;
  }
  else {
    cambios.horaFin = null;
  }
  
  if(evento.lugar) {
    cambios.lugar = evento.lugar;
  }
  else {
    cambios.lugar = null;
  }
  
  if(evento.fechaInicio) {
    cambios.fechaInicio = evento.fechaInicio;
  }
  else {
    cambios.fechaInicio = null;
  }
  
  if(evento.fechaFin) {
    cambios.fechaFin = evento.fechaFin;
  }
  else {
    cambios.fechaFin = null;
  }

  this.update({_id: evento._id}, cambios, function(err) {
    callback();
  });
}

/**
 * Elimina el evento.
 */
schemaEvento.methods.eliminar = function(callback) {
  this.remove(callback);
}

/**
 * Obtiene el evento.
 */
schemaEvento.statics.obtener = function(idEvento, callback) {
  this.findOne({_id: idEvento}, function(err, evento) {
    callback(evento);
  });
}

mongoose.model('Evento', schemaEvento);
var Evento = mongoose.model('Evento');

/**
 * Exports
 */
module.exports = {
  evento: Evento,
  schemaEvento: schemaEvento
};