/**
 * Constantes
 */
var FINAL_MES = 'FINAL_MES';

/**
 * Módulos
 */
var moment = require('moment'),
    _ = require('underscore'),
    seguridad = require('../modules/seguridad'),
    fechaHora = require('../modules/fechaHora'),
    calendario = require('../modules/calendario');
    
/**
 * Modelos
 */
var Evento = require('../models/eventos').evento;

/**
 * Funciones
 */
function obtenerIndiceDiaSemana(diaSemana) {
  switch(diaSemana) {
    case 'L': return 0;
    case 'M': return 1;
    case 'X': return 2;
    case 'J': return 3;
    case 'V': return 4;
    case 'S': return 5;
    case 'D': return 6;
  }
}

function ordenarEventosPorHoraInicio(evento1, evento2) {
  var horaInicio1 = evento1.horaInicio.split(':');
  var horaInicio2 = evento2.horaInicio.split(':');  
  return (horaInicio1[0] + horaInicio1[1]) - (horaInicio2[0] + horaInicio2[1]);
}

function asignarEventoPuntual(calendario, evento) {
  var asignado = false;
  for(var i = 0; i < calendario.length && !asignado; i++) {
    var semana = calendario[i];
    for(var j = 0; j < semana.length && !asignado; j++) {
      var dia = semana[j];
      if(fechaHora.comparar(dia.fecha, '=', fechaHora.stringToFecha(evento.fecha, 'DD-MM-YYYY'))) {
        asignado = true;
        if(dia.eventos) {
          dia.eventos++;
        }
        else {
          dia.eventos = 1;
        }
      }
    }
  }  
}
 
function asignarEventoSemanal(calendario, evento) {
  var diasSemana = evento.fecha.split(',');
  for(var i = 0; i < diasSemana.length; i++) {
    var indiceDiaSemana = obtenerIndiceDiaSemana(diasSemana[i]);
    for(var j = 0; j < calendario.length; j++) {
      var semana = calendario[j];
      var dia = semana[indiceDiaSemana];
      var activo = true;
      if(evento.fechaInicio) {
        if(fechaHora.comparar(dia.fecha, '<', evento.fechaInicio)) {
          activo = false;
        }
      }
      if(evento.fechaFin) {
        if(fechaHora.comparar(dia.fecha, '>', evento.fechaFin)) {
          activo = false;
        }
      }
      
      if(activo) {
        if(dia.eventos) {
          dia.eventos++;
        }
        else {
          dia.eventos = 1;
        }
      }
    }
  }
}

function asignarEventoMensual(calendario, evento) {
  var diaEvento = evento.fecha;
  for(var i = 0; i < calendario.length; i++) {
    var semana = calendario[i];
    for(var j = 0; j < semana.length; j++) {
      var dia = semana[j];
      if((diaEvento == FINAL_MES && fechaHora.esFinalMes(dia.fecha)) || (eval(diaEvento) == dia.fecha.getDate())) {
        var activo = true;
        if(evento.fechaInicio) {
          if(fechaHora.comparar(dia.fecha, '<', evento.fechaInicio)) {
            activo = false;
          }
        }
        if(evento.fechaFin) {
          if(fechaHora.comparar(dia.fecha, '>', evento.fechaFin)) {
            activo = false;
          }
        }
        
        if(activo) {
          if(dia.eventos) {
            dia.eventos++;
          }
          else {
            dia.eventos = 1;
          }
        }
      }      
    }
  }  
}

function asignarEventoAnual(calendario, evento) {
  var fechaEvento = evento.fecha.split('-');
  var diaEvento = fechaEvento[0];
  var mesEvento = fechaEvento[1];
  for(var i = 0; i < calendario.length; i++) {
    var semana = calendario[i];
    for(var j = 0; j < semana.length; j++) {
      var dia = semana[j];
      if((eval(diaEvento) == dia.fecha.getDate()) && (eval(mesEvento) == dia.fecha.getMonth() + 1)) {
        var activo = true;
        if(evento.fechaInicio) {
          if(fechaHora.comparar(dia.fecha, '<', evento.fechaInicio)) {
            activo = false;
          }
        }
        if(evento.fechaFin) {
          if(fechaHora.comparar(dia.fecha, '>', evento.fechaFin)) {
            activo = false;
          }
        }
        
        if(activo) {
          if(dia.eventos) {
            dia.eventos++;
          }
          else {
            dia.eventos = 1;
          }
        }
      }      
    }
  }
}

function esPeriodoValido(evento) {
  var periodoValido = false;
  var fechaAux = new Date(evento.fechaInicio.getFullYear(), evento.fechaInicio.getMonth(), evento.fechaInicio.getDate());
  
  if(evento.tipo == 'SEMANAL') {
    while(!periodoValido && fechaHora.comparar(fechaAux, '<=', evento.fechaFin)) {
      var diaSemana = fechaHora.obtenerInicialDiaSemana(fechaAux);
      if(evento.fecha.indexOf(diaSemana) != -1) {
        periodoValido = true;
      }
      else {
        fechaAux.setDate(fechaAux.getDate() + 1);
      }
    }
  }
  else if(evento.tipo == 'MENSUAL') {
    while(!periodoValido && fechaHora.comparar(fechaAux, '<=', evento.fechaFin)) {
      if(evento.fecha == FINAL_MES && fechaHora.esFinalMes(fechaAux)) {
        periodoValido = true;
      }
      else if(fechaAux.getDate() == eval(evento.fecha)) {
        periodoValido = true;
      }
      else {
        fechaAux.setDate(fechaAux.getDate() + 1);
      }
    }
  }
  else if(evento.tipo == 'ANUAL') {
    var fechaEvento = evento.fecha.split('-');
    while(!periodoValido && fechaHora.comparar(fechaAux, '<=', evento.fechaFin)) {
      if(fechaAux.getDate() == eval(fechaEvento[0]) && (fechaAux.getMonth() + 1) == eval(fechaEvento[1])) {
        periodoValido = true;
      }
      else {
        fechaAux.setDate(fechaAux.getDate() + 1);
      }
    }
  }
  
  return periodoValido;
}

/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  /**
   * Todas las rutas de acceso a este módulo requiren que el usuario tenga el role ADMIN.
   */
  app.all('/agenda*', usuarioAdmin, function(req, res, next) {
    next();
  });
  
  /**
   * Obtiene la fecha actual y redirige la petición a la obtención de los eventos de la fecha actual y del
   * calendario del mes al que pertenece dicha fecha.
   */
  app.get('/agenda', function(req, res) {
    req.session.usuario.menu = 'agenda';
    res.redirect('/agenda/' + moment(new Date()).format('DD-MM-YYYY'));
  });
  
  /**
   * Obtiene los eventos que hay planificados para la fecha indicada y para el calendario del mes al que
   * pertenece.
   */
  app.get('/agenda/:fecha', function(req, res) {
    var fecha = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    var cal = calendario.crear(fecha.getMonth() + 1, fecha.getFullYear(), fecha.getMonth() + 1, fecha.getFullYear())[0];
    Evento.obtenerEventosFecha(fecha, function(eventosFecha) {
      // Separamos los eventos que tienen hora de inicio de los que no tienen.
      // Los que no tienen hora de inicio los presentaremos al principio.
      var eventosFechaSinHoraInicio = _.filter(eventosFecha, function(evento) { return !evento.horaInicio; });
      var eventosFechaConHoraInicio = _.filter(eventosFecha, function(evento) { return evento.horaInicio; }).sort(ordenarEventosPorHoraInicio);
    
      Evento.obtenerEventosMes(fecha, function(eventosMes) {
        // Filtramos los eventos del mes aplicando el periodo de actividad [fechaInicio, fechaFin]
        for(var i = 0; i < eventosMes.length; i++) {
          var evento = eventosMes[i];
          if(evento.tipo == 'PUNTUAL') {
            asignarEventoPuntual(cal.calendario, evento);
          }
          else if(evento.tipo == 'SEMANAL') {
            asignarEventoSemanal(cal.calendario, evento);
          }
          else if(evento.tipo == 'MENSUAL') {
            asignarEventoMensual(cal.calendario, evento);
          }
          else if(evento.tipo == 'ANUAL') {
            asignarEventoAnual(cal.calendario, evento);
          }
        }
      
        res.render('agenda', {
          fecha: fecha,
          calendario: cal,
          eventosFechaSinHoraInicio: eventosFechaSinHoraInicio,
          eventosFechaConHoraInicio: eventosFechaConHoraInicio,
          mesAnterior: moment(calendario.mesAnterior(fecha)).format('DD-MM-YYYY'),
          mesSiguiente: moment(calendario.mesSiguiente(fecha)).format('DD-MM-YYYY'),
          fechaHora: fechaHora
        });
      });
    });
  });
  
  /**
   * Crea un evento.
   */
  app.post('/agenda', function(req, res) {
    var fecha = req.body.fecha;
    var evento = new Evento();
  
    evento.tipo = req.body.tipo;
  
    if(evento.tipo == 'PUNTUAL') {
      evento.fecha = req.body.diaPuntual + '-' + req.body.mesPuntual + '-' + req.body.anyoPuntual;    
    }
    else if(evento.tipo == 'SEMANAL') {
      var sep = '';
    
      evento.fecha = '';
    
      if(req.body.LSemanal) {
        evento.fecha = evento.fecha + sep + req.body.LSemanal;
        sep = ',';
      }
      if(req.body.MSemanal) {
        evento.fecha = evento.fecha + sep + req.body.MSemanal;
        sep = ',';
      }
      if(req.body.XSemanal) {
        evento.fecha = evento.fecha + sep + req.body.XSemanal;
        sep = ',';
      }
      if(req.body.JSemanal) {
        evento.fecha = evento.fecha + sep + req.body.JSemanal;
        sep = ',';
      }
      if(req.body.VSemanal) {
        evento.fecha = evento.fecha + sep + req.body.VSemanal;
        sep = ',';
      }
      if(req.body.SSemanal) {
        evento.fecha = evento.fecha + sep + req.body.SSemanal;
        sep = ',';
      }
      if(req.body.DSemanal) {
        evento.fecha = evento.fecha + sep + req.body.DSemanal;
      }
    }
    else if(evento.tipo == 'MENSUAL') {
      evento.fecha = req.body.diaMensual || req.body.finalMesMensual;
    }
    else if(evento.tipo == 'ANUAL') {
      evento.fecha = req.body.diaAnual + '-' + req.body.mesAnual;
    }
  
    if(req.body.horaInicio) {
      evento.horaInicio = req.body.horaInicio + ':' + req.body.minutoInicio;
    }
  
    if(req.body.horaFin) {
      evento.horaFin = req.body.horaFin + ':' + req.body.minutoFin;
    }
  
    evento.texto = req.body.texto;
  
    if(req.body.lugar) {
      evento.lugar = req.body.lugar;
    }
  
    if(req.body.diaFechaInicio) {
      evento.fechaInicio = fechaHora.stringToFecha(req.body.diaFechaInicio + req.body.mesFechaInicio + req.body.anyoFechaInicio, 'DDMMYYYY');
    }

    if(req.body.diaFechaFin) {
      evento.fechaFin = fechaHora.stringToFecha(req.body.diaFechaFin + req.body.mesFechaFin + req.body.anyoFechaFin, 'DDMMYYYY');
    }
  
    var periodoValido = true;
  
    if(evento.fechaInicio && evento.fechaFin) {
      periodoValido = esPeriodoValido(evento);
    }
  
    if(periodoValido) {
      evento.grabar(function() {
        res.redirect('/agenda/' + fecha);
      });
    }
    else {
      req.session.warningMessage = 'El evento definido est&aacute; fuera del periodo de validez indicado';
      res.redirect('/agenda/' + fecha);
    }
  });
  
  /**
   * Actualiza un evento.
   */
  app.put('/agenda/:idEvento', function(req, res) {
    var fecha = req.body.fecha;
    var evento = new Evento();
  
    evento._id = req.params.idEvento;
    evento.tipo = req.body.tipo;
  
    if(evento.tipo == 'PUNTUAL') {
      evento.fecha = req.body.diaPuntual + '-' + req.body.mesPuntual + '-' + req.body.anyoPuntual;    
    }
    else if(evento.tipo == 'SEMANAL') {
      var sep = '';
      evento.fecha = '';    
      if(req.body.LSemanal) {
        evento.fecha += sep + req.body.LSemanal;
        sep = ',';
      }
      if(req.body.MSemanal) {
        evento.fecha += sep + req.body.MSemanal;
        sep = ',';
      }
      if(req.body.XSemanal) {
        evento.fecha += sep + req.body.XSemanal;
        sep = ',';
      }
      if(req.body.JSemanal) {
        evento.fecha += sep + req.body.JSemanal;
        sep = ',';
      }
      if(req.body.VSemanal) {
        evento.fecha += sep + req.body.VSemanal;
        sep = ',';
      }
      if(req.body.SSemanal) {
        evento.fecha += sep + req.body.SSemanal;
        sep = ',';
      }
      if(req.body.DSemanal) {
        evento.fecha += sep + req.body.DSemanal;
      }
    }
    else if(evento.tipo == 'MENSUAL') {
      evento.fecha = req.body.diaMensual || req.body.finalMesMensual;
    }
    else if(evento.tipo == 'ANUAL') {
      evento.fecha = req.body.diaAnual + '-' + req.body.mesAnual;
    }
  
    if(req.body.horaInicio) {
      evento.horaInicio = req.body.horaInicio + ':' + req.body.minutoInicio;
    }

    if(req.body.horaFin) {
      evento.horaFin = req.body.horaFin + ':' + req.body.minutoFin;
    }
  
    evento.texto = req.body.texto;
  
    if(req.body.lugar) {
      evento.lugar = req.body.lugar;
    }
  
    if(req.body.diaFechaInicio) {
      evento.fechaInicio = fechaHora.stringToFecha(req.body.diaFechaInicio + req.body.mesFechaInicio + req.body.anyoFechaInicio, 'DDMMYYYY');
    }
  
    if(req.body.diaFechaFin) {
      evento.fechaFin = fechaHora.stringToFecha(req.body.diaFechaFin + req.body.mesFechaFin + req.body.anyoFechaFin, 'DDMMYYYY');
    }
  
    var periodoValido = true;
  
    if(evento.fechaInicio && evento.fechaFin) {
      periodoValido = esPeriodoValido(evento);
    }
  
    if(periodoValido) {
      Evento.actualizar(evento, function() {
        res.redirect('/agenda/' + fecha);
      });
    }
    else {
      req.session.warningMessage = 'El evento definido est&aacute; fuera del periodo de validez indicado';
      res.redirect('/agenda/' + fecha);
    }
  });
  
  /**
   * Elimina un evento.
   */
  app.delete('/agenda/:idEvento', function(req, res) {
    var evento = new Evento();
    evento._id = req.params.idEvento;
  
    evento.eliminar(function() {
      res.redirect('/agenda/' + req.body.fecha);
    });
  });
}