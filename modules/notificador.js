/**
 * Constantes
 */
var emailSender = 'la.web.de.luka@gmail.com';
 
/**
 * Módulos
 */
var nodemailer = require('nodemailer'),
    _ = require('underscore'),
    cronJob = require('cron').CronJob;
    
/**
 * Modelos
 */
var Notificaciones = require('../models/notificaciones'),
    NotificacionesAgenda = require('../models/notificaciones.agenda');

/**
 * Variables
 */
var smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: emailSender,
    pass: 'deugghuwwjuedwfi' // Password para el servicio de notificación de la web de Luka y Mia (verificación en 2 pasos de Google)
  }
});

/**
 * Activa un cron para el notificado de eventos de la agenda.
 * El cron comprobará cada 2 horas los eventos activos para el día
 * siguiente y los notificará por email a modo de recordatorio.
 */
module.exports.iniciarCronEventosAgenda = function() {
  new cronJob({
    /* Planificación cron (github cron-node):
        Campos: segundos (0-59), minutos (0-59), horas (0-23), días mes (1-31), meses (1-12), días semana (1-7)
        Steps : campo/step
    */
    cronTime: '0 0 */2 * * *',
    onTick: function() {
      NotificacionesAgenda.notificarEventos();
    },
    start: true
  });
}

/**
 * Envía por correo una notificación con el título y el texto indicados
 * si el tipo de evento está configurado para ser notificado.
 */
module.exports.notificar = function(tipo, titulo, texto) {
  Notificaciones.obtener(function(notificaciones) {
    if(_.contains(notificaciones.eventos, tipo)) {
      var mailOptions = {
        from: emailSender,
        to: notificaciones.listaDistribucion.toString(),
        subject: titulo,
        html: texto
      }
      
      smtpTransport.sendMail(mailOptions, function(err, res) {});
    }
  });
}

/**
 * Envía un correo.
 */
module.exports.enviarCorreo = function(titulo, texto, destinatarios, callback) {
  var mailOptions = {
    from: emailSender,
    to: destinatarios,
    subject: titulo,
    html: texto
  }
  
  smtpTransport.sendMail(mailOptions, function(err, res) {
    callback(err);
  });
}