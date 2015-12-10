/**
 * Constantes
 */
var COOKIE_EXPIRES_DAYS = 365;
 
/**
 * Módulos
 */
var seguridad = require('../modules/seguridad');

/**
 * Modelos
 */
var Mailing = require('../models/mailing');

/**
 * Rutas
 */
module.exports = function(app) {

  function grabarEmail(email) {
    var mailing = new Mailing();
    mailing.email = email;
    Mailing.existe(mailing.email, function(existe) {
      if(!existe) {
        mailing.grabar(function() {});
      }
    });
  }

  /**
   * Registra por primera vez la respuesta del usuario en relación al mailing.
   */
  app.post('/mailing', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var notificar = eval(req.body.mailing);
    
    if(notificar) {
      grabarEmail(req.body.email.toLowerCase());
    }
    
    var fecha = new Date();
    fecha.setDate(fecha.getDate() + COOKIE_EXPIRES_DAYS);
        
    res.cookie('mailingLuka', true, {path: '/', expires: fecha, httpOnly: true});
    res.send();
  });
  
  /**
   * Presenta al usuario la opción de suscribirse o darse de baja en las notificaciones.
   */
  app.get('/mailing', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    req.session.usuario.menu = 'mailing';
    res.render('mailing');
  });
  
  /**
   * Permite configurar en cualquier momento la opción deseada por el usuario sobre el mailing. 
   */
  app.post('/mailing/configurar', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var opcion = req.body.opcion;
    var email = req.body.email.toLowerCase();
    
    if(opcion == 'alta') {
      grabarEmail(email);
      res.render('mailing', {
        tipoMsg: 'info',
        msg: 'Tu dirección de correo ha sido registrada'
      });
    }
    else {
      Mailing.existe(email, function(existe) {
        if(existe) {
          Mailing.eliminar(email, function() {
            res.render('mailing', {
              tipoMsg: 'info',
              msg: 'Tu dirección de correo ha sido eliminada de la lista de distribución'
            });
          });
        }
        else {
          res.render('mailing', {
            opcion: opcion,
            email: req.body.email,
            tipoMsg: 'warning',
            msg: 'La dirección de correo especificada no existe en la lista de direcciones a notificar'
          });
        }
      });
    }
  });
}