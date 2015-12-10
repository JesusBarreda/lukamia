/**
 * Constantes
 */
var DIR_WEB = 'http://luka.aws.af.cm';
var FINAL_MES = 'FINAL_MES';

/**
 * Módulos
 */
var mongoose = require('mongoose'),
    moment = require('moment'),
    fechaHora = require('../modules/fechaHora'),
    notificador = require('../modules/notificador');
    
/**
 * Modelos
 */
var Evento = require('./eventos').evento,
    schemaEvento = require('./eventos').schemaEvento;
    
/**
 * Variables
 */
var Schema = mongoose.Schema;

/**
 * Schema
 */
var schemaNotificacionesAgenda = new Schema({
  fecha: Date,
  eventos: [schemaEvento]
}, {collection: 'notificaciones.agenda'});

/**
 * Elimina todas las notificaciones que no correspondan a la fecha indicada.
 */
schemaNotificacionesAgenda.statics.limpiar = function(fecha, callback) {
  this.remove({fecha: {$ne: fecha}}, function(err) {
    callback();
  });
}

/**
 * Obtiene las notificaciones de eventos que han sido ya informadas.
 */
schemaNotificacionesAgenda.statics.obtener = function(fecha, callback) {
  this.findOne({fecha: fecha}, function(err, notificacionesAgenda) {
    callback(notificacionesAgenda);
  });
}

/**
 * Graba las notificaciones de eventos de la fecha indicada.
 */
schemaNotificacionesAgenda.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Añade un evento a las notificaciones de la fecha indicada.
 */
schemaNotificacionesAgenda.statics.registrarEvento = function(fecha, evento, callback) {
  this.update({fecha: fecha}, {$push: {eventos: evento}}, function(err) {
    callback();
  });
}

/**
 * Elimina el evento de las notificaciones de la fecha indicada.
 */
schemaNotificacionesAgenda.statics.eliminarEvento = function(fecha, idEvento, callback) {
  this.update({fecha: fecha}, {$pull: {eventos: {_id: idEvento}}}, function(err) {
    callback();
  });
}

mongoose.model('Notificaciones.Agenda', schemaNotificacionesAgenda);
var NotificacionesAgenda = mongoose.model('Notificaciones.Agenda');

/**
 * Funciones
 */
function iguales(evento1, evento2) {
  if(evento1.tipo != evento2.tipo) {
    return false;
  }
  else if(evento1.fecha != evento2.fecha) {
    return false;
  }
  else {
    var evento1HoraInicio = evento1.horaInicio || '';
    var evento2HoraInicio = evento2.horaInicio || '';
    
    if(evento1HoraInicio != evento2HoraInicio) {
      return false;
    }
    else {
      var evento1HoraFin = evento1.horaFin || '';
      var evento2HoraFin = evento2.horaFin || '';
      
      if(evento1HoraFin != evento2HoraFin) {
        return false;
      }
      else if(evento1.texto != evento2.texto) {
        return false;
      }
      else {
        var evento1Lugar = evento1.lugar || '';
        var evento2Lugar = evento2.lugar || '';
        
        if(evento1Lugar != evento2Lugar) {
          return false;
        }
        else {
          return true;
        }
      }
    }
  }
}

function ordenarEventosPorHoraInicio(evento1, evento2) {
  if(!evento1.horaInicio) {
    return -1;
  }
  else if(!evento2.horaInicio) {
    return 1;
  }
  else {
    var horaInicio1 = evento1.horaInicio.split(':');
    var horaInicio2 = evento2.horaInicio.split(':');  
    return (horaInicio1[0] + horaInicio1[1]) - (horaInicio2[0] + horaInicio2[1]);
  }
}

function tipoToHTML(tipo, fecha) {
  var tipoHTML = 'Evento ' + tipo;
  
  if(tipo == 'PUNTUAL') {
    var arrayFecha = fecha.split('-');
    tipoHTML += ' [ ' + arrayFecha[0] + ' ' + fechaHora.obtenerNombreMes(arrayFecha[1]) + ' ' + arrayFecha[2] + ' ] ';
  }
  else if(tipo == 'SEMANAL') {
    var diasSemana = fecha.replace(/,/g, ', ');
    tipoHTML += ' [ ' + diasSemana + ' ]';
  }
  else if(tipo == 'MENSUAL') {
    if(fecha == FINAL_MES) {
      tipoHTML += ' [ FINAL DE MES ]';
    }
    else {
      tipoHTML += ' [ ' + fecha + ' ]';
    }
  }
  else if(tipo == 'ANUAL') {
    var arrayFecha = fecha.split('-');
    tipoHTML += ' [ ' + arrayFecha[0] + ' ' + fechaHora.obtenerNombreMes(arrayFecha[1]) + ' ]';
  }
  
  return tipoHTML;
}

function eventoNuevoToHTML(evento) {
  var horarioEvento = '';
  if(evento.horaInicio) {
    horarioEvento = evento.horaInicio;
  }
  if(evento.horaFin) {
    horarioEvento += ' - ' + evento.horaFin;
  }
  
  var texto = '<div style="background-color:#FFFFFF; border:1px solid #339966">' +
              '  <div style="height:25px; background-color:#339966">' +
              '    <div style="float:left; width:auto; color:#FFFFFF; padding:5px">' + horarioEvento + '</div>' +
              '    <div style="float:left; width:300px; text-align:center; color:#FFFFFF; padding:5px">' + tipoToHTML(evento.tipo, evento.fecha) + '</div>' +
              '    <div style="float:right; width:auto; text-align:right; color:#FFFFFF; padding:5px">NUEVO</div>' +
              '  </div>' +
              '  <div style="width:auto; color:#666666; padding:5px">' + evento.texto.replace(/\n/gi, '<br/>') + '</div>';
               
  if(evento.lugar) {
    texto += '  <div style="width:auto; color:#339966; padding:5px; border-top:1px solid #339966">' + evento.lugar.replace(/\n/gi, '<br/>') + '</div>';
  }
       
  texto += '</div><br/><br/>';
  
  return texto;
}

function eventoModificadoToHTML(evento) {
  var horarioEvento = '';
  if(evento.horaInicio) {
    horarioEvento = evento.horaInicio;
  }
  if(evento.horaFin) {
    horarioEvento += ' - ' + evento.horaFin;
  }
      
  var texto = '<div style="background-color:#FFFFFF; border:1px solid #FF6600">' +
              '  <div style="height:25px; background-color:#FF6600">' +
              '    <div style="float:left; width:auto; color:#FFFFFF; padding:5px">' + horarioEvento + '</div>' +
              '    <div style="float:left; width:300px; text-align:center; color:#FFFFFF; padding:5px">' + tipoToHTML(evento.tipo, evento.fecha) + '</div>' +
              '    <div style="float:right; width:auto; text-align:right; color:#FFFFFF; padding:5px">MODIFICADO</div>' +
              '  </div>' +
              '  <div style="width:auto; color:#666666; padding:5px">' + evento.texto.replace(/\n/gi, '<br/>') + '</div>';
               
  if(evento.lugar) {
    texto += '  <div style="width:auto; color:#339966; padding:5px; border-top:1px solid #FF6600">' + evento.lugar.replace(/\n/gi, '<br/>') + '</div>';
  }
       
  texto += '</div><br/><br/>';
  
  return texto;
}

function eventoReplanificadoToHTML(evento) {
  var horarioEvento = '';
  if(evento.horaInicio) {
    horarioEvento = evento.horaInicio;
  }
  if(evento.horaFin) {
    horarioEvento += ' - ' + evento.horaFin;
  }
      
  var texto = '<div style="background-color:#FFFFFF; border:1px solid #0099CC">' +
              '  <div style="height:25px; background-color:#0099CC">' +
              '    <div style="float:left; width:auto; color:#FFFFFF; padding:5px">' + horarioEvento + '</div>' +
              '    <div style="float:left; width:300px; text-align:center; color:#FFFFFF; padding:5px">' + tipoToHTML(evento.tipo, evento.fecha) + '</div>' +
              '    <div style="float:right; width:auto; text-align:right; color:#FFFFFF; padding:5px">REPLANIFICADO</div>' +
              '  </div>' +
              '  <div style="width:auto; color:#666666; padding:5px">' + evento.texto.replace(/\n/gi, '<br/>') + '</div>';
               
  if(evento.lugar) {
    texto += '  <div style="width:auto; color:#339966; padding:5px; border-top:1px solid #0099CC">' + evento.lugar.replace(/\n/gi, '<br/>') + '</div>';
  }
       
  texto += '</div><br/><br/>';
  
  return texto;
}

function eventoEliminadoToHTML(evento) {
  var horarioEvento = '';
  if(evento.horaInicio) {
    horarioEvento = evento.horaInicio;
  }
  if(evento.horaFin) {
    horarioEvento += ' - ' + evento.horaFin;
  }
      
  var texto = '<div style="background-color:#FFFFFF; border:1px solid #FF0000">' +
              '  <div style="height:25px; background-color:#FF0000">' +
              '    <div style="float:left; width:auto; color:#FFFFFF; padding:5px">' + horarioEvento + '</div>' +
              '    <div style="float:left; width:300px; text-align:center; color:#FFFFFF; padding:5px">' + tipoToHTML(evento.tipo, evento.fecha) + '</div>' +
              '    <div style="float:right; width:auto; text-align:right; color:#FFFFFF; padding:5px">ELIMINADO</div>' +
              '  </div>' +
              '  <div style="width:auto; color:#666666; padding:5px">' + evento.texto.replace(/\n/gi, '<br/>') + '</div>';
               
  if(evento.lugar) {
    texto += '  <div style="width:auto; color:#339966; padding:5px; border-top:1px solid #FF0000">' + evento.lugar.replace(/\n/gi, '<br/>') + '</div>';
  }
       
  texto += '</div><br/><br/>';
  
  return texto;
}

function toHTML(tipo, notificaciones) {
  var texto = '';
  
  if(tipo == 'NUEVOS') {
    if(notificaciones.length > 0) {
      texto += '<h3 style="color:#006699">Eventos planificados para ma&ntilde;ana</h3>';
    }
    for(var i = 0; i < notificaciones.length; i++) {
      var evento = notificaciones[i];
      texto += eventoNuevoToHTML(evento);
    }
  }
  else if(tipo == 'MODIFICADOS') {
    if(notificaciones.length > 0) {
      texto += '<h3 style="color:#006699">Eventos planificados para ma&ntilde;ana (modificados)</h3>';
    }
    for(var i = 0; i < notificaciones.length; i++) {
      var evento = notificaciones[i];
      texto += eventoModificadoToHTML(evento);
    }
  }
  else if(tipo == 'REPLANIFICADOS') {
    if(notificaciones.length > 0) {
      texto += '<h3 style="color:#006699">Eventos cambiados de fecha</h3>';
    }
    for(var i = 0; i < notificaciones.length; i++) {
      var evento = notificaciones[i];
      texto += eventoReplanificadoToHTML(evento);
    }
  }
  else if(tipo == 'ELIMINADOS') {
    if(notificaciones.length > 0) {
      texto += '<h3 style="color:#006699">Eventos eliminados</h3>';
    }
    for(var i = 0; i < notificaciones.length; i++) {
      var evento = notificaciones[i];
      texto += eventoEliminadoToHTML(evento);
    }
  }
  
  return texto;
}

function enviarCorreo(notificaciones) {
  var hayNotificaciones = false;  
  if(notificaciones['NUEVOS'].length > 0) {
    notificaciones['NUEVOS'] = notificaciones['NUEVOS'].sort(ordenarEventosPorHoraInicio);
    hayNotificaciones = true;
  }
  else if(notificaciones['MODIFICADOS'].length > 0) {
    notificaciones['MODIFICADOS'] = notificaciones['MODIFICADOS'].sort(ordenarEventosPorHoraInicio);
    hayNotificaciones = true;
  }
  else if(notificaciones['REPLANIFICADOS'].length > 0) {
    notificaciones['REPLANIFICADOS'] = notificaciones['REPLANIFICADOS'].sort(ordenarEventosPorHoraInicio);
    hayNotificaciones = true;
  }
  else if(notificaciones['ELIMINADOS'].length > 0) {
    notificaciones['ELIMINADOS'] = notificaciones['ELIMINADOS'].sort(ordenarEventosPorHoraInicio);
    hayNotificaciones = true;
  }
          
  if(hayNotificaciones) {
    var notificacion = {};
    
    notificacion.tipo = 'EVENTO_AGENDA';
    notificacion.titulo = 'Eventos planificados para ma\u00f1ana';
    
    notificacion.texto = toHTML('NUEVOS', notificaciones['NUEVOS']);
    notificacion.texto += toHTML('MODIFICADOS', notificaciones['MODIFICADOS']);
    notificacion.texto += toHTML('REPLANIFICADOS', notificaciones['REPLANIFICADOS']);
    notificacion.texto += toHTML('ELIMINADOS', notificaciones['ELIMINADOS']);
    
    notificacion.texto += '<a href="' + DIR_WEB + '" style="color:#777777">La web de Luka &amp; Mia</a>';
    
    notificador.notificar(notificacion.tipo, notificacion.titulo, notificacion.texto);
  }
}

function notificarEventos() {
  var notificaciones = [];
  var fechaDmas1 = new Date();
  
  // Informamos acerca de los eventos de D+1
  fechaDmas1.setDate(fechaDmas1.getDate() + 1);
  fechaDmas1.setHours(0);
  fechaDmas1.setMinutes(0);
  fechaDmas1.setSeconds(0);
  fechaDmas1.setMilliseconds(0);
  
  // Eliminamos todas las notificaciones que no correspondan a D+1
  NotificacionesAgenda.limpiar(fechaDmas1, function() {});
  
  // Obtenemos las notificaciones de D+1 sobre las que ya hemos informado
  NotificacionesAgenda.obtener(fechaDmas1, function(notificacionesInformadas) {
    if(!notificacionesInformadas) {
      notificacionesInformadas = new NotificacionesAgenda();
      notificacionesInformadas.fecha = fechaDmas1;
      notificacionesInformadas.eventos = [];
      notificacionesInformadas.grabar(function() {});
    }
      
    var notificaciones = [];
      
    notificaciones['NUEVOS'] = [];
    notificaciones['MODIFICADOS'] = [];
    notificaciones['REPLANIFICADOS'] = [];
    notificaciones['ELIMINADOS'] = [];
      
    var hashNotificacionesInformadas = [];
    for(var i = 0; i < notificacionesInformadas.eventos.length; i++) {
      var evento = notificacionesInformadas.eventos[i];
      hashNotificacionesInformadas[evento._id] = evento;
    }
      
    Evento.obtenerEventosFecha(fechaDmas1, function(eventos) {
      for(var i = 0; i < eventos.length; i++) {
        var evento = eventos[i];
        var eventoInformado = hashNotificacionesInformadas[evento._id];
        if(eventoInformado) {
          delete hashNotificacionesInformadas[evento._id];
          if(!iguales(evento, eventoInformado)) {
            NotificacionesAgenda.eliminarEvento(fechaDmas1, eventoInformado._id, function() {});
            NotificacionesAgenda.registrarEvento(fechaDmas1, evento, function() {});
            notificaciones['MODIFICADOS'].push(evento);
          }
        }
        else {
          NotificacionesAgenda.registrarEvento(fechaDmas1, evento, function() {});
          notificaciones['NUEVOS'].push(evento);
        }
      }
        
      var numNotificaciones = 0;
      for(var key in hashNotificacionesInformadas) {
        numNotificaciones++;
      }

      function comprobarCompletado() {
        numNotificaciones--;
        if(numNotificaciones == 0) {
          enviarCorreo(notificaciones);
        }
      }
        
      if(numNotificaciones == 0) {
        enviarCorreo(notificaciones);
      }
      else {
        for(var key in hashNotificacionesInformadas) {
          var evento = hashNotificacionesInformadas[key];
          Evento.obtener(evento._id, function(evt) {
            if(evt) {
              notificaciones['REPLANIFICADOS'].push(evt);
            }
            else {
              notificaciones['ELIMINADOS'].push(evento);
            }
              
            NotificacionesAgenda.eliminarEvento(fechaDmas1, evento._id, function() {
              comprobarCompletado();
            });
          });
        }
      }
    });
  });
}

/**
 * Exports
 */
module.exports.notificarEventos = notificarEventos;
