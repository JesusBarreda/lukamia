/**
 * Módulos
 */
var seguridad = require('../modules/seguridad'),
    _ = require('underscore'),
    fechaHora = require('../modules/fechaHora'),
    notificador = require('../modules/notificador');
    
/**
 * Modelos
 */
var Role = require('../models/roles'),
    Notificaciones = require('../models/notificaciones'),
    Acceso = require('../models/accesos'),
    Mailing = require('../models/mailing');
    
/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  /**
   * Todas las rutas de acceso a este módulo requieren que el usuario tenga el role ADMIN.
   */
  app.all('/admin*', usuarioAdmin, function(req, res, next) {
    next();
  });
  
  /**
   * Página principal del módulo Admin.
   */
  app.get('/admin', function(req, res) {
    req.session.usuario.menu = 'admin';
    res.render('admin');
  });
   
  /**
   * Formulario para el cambio de claves de acceso.
   */
  app.get('/admin/claves', function(req, res) {
    res.render('admin/claves');
  });
   
  /**
   * Actualiza la clave del role.
   */
  app.put('/admin/claves',  function(req, res) {
    var role = new Role();
    role._id = req.body.role;
    role.clave = req.body.claveAcceso;
    
    role.actualizar(function() {
      req.session.infoMessage = 'Clave modificada para el role ' + role._id;
      res.redirect('/admin/claves');
    });
  });
   
  /**
   * Presenta un formulario para la configuración de las notificaciones.
   */
  app.get('/admin/notificaciones', function(req, res) {
    Notificaciones.obtener(function(notificaciones) {
      var sortListaDistribucion = _.sortBy(notificaciones.listaDistribucion, function(email) { return email; });
      notificaciones.listaDistribucion = sortListaDistribucion;
      res.render('admin/notificaciones', {notificaciones: notificaciones, funcContains: _.contains});
    }); 
  });
  
  /**
   * Actualiza los eventos a notificar.
   */
  app.put('/admin/notificaciones', function(req, res) {
    Notificaciones.obtener(function(notificaciones) {
      var eventos = [];
      if(req.body.comentarioFoto) {
        eventos.push(req.body.comentarioFoto);
      }
      if(req.body.comentarioBlog) {
        eventos.push(req.body.comentarioBlog);
      }
      if(req.body.eventoAgenda) {
        eventos.push(req.body.eventoAgenda);
      }
    
      notificaciones.eventos = eventos;
      notificaciones.grabar(function() {
        req.session.infoMessage = 'Eventos a notificar actualizados';
        res.redirect('/admin/notificaciones');
      });    
    });
  });
  
  /**
   * Añade una nueva dirección de correo a la lista de distribución.
   */
  app.post('/admin/notificaciones', function(req, res) {
    Notificaciones.registrarEmail(req.body.email, function() {
      req.session.infoMessage = 'Nueva dirección de correo registrada';
      res.redirect('/admin/notificaciones');
    });
  });
  
  /**
   * Elimina una dirección de correo de la lista de distribución.
   */
  app.delete('/admin/notificaciones', function(req, res) {
    Notificaciones.eliminarEmail(req.body.email, function() {
      req.session.infoMessage = 'Dirección de correo eliminada';
      res.redirect('/admin/notificaciones');
    });
  });
  
  /**
   * Obtiene los accesos registrados hasta la fecha.
   */
  app.get('/admin/accesos', function(req, res) {
    Acceso.obtenerTodos(function(accesos) {
      res.render('admin/accesos', {accesos: accesos, fechaHora: fechaHora});
    });  
  });
  
  /**
   * Elimina todos los accesos registrados hasta la fecha.
   */
  app.get('/admin/accesos/eliminar', function(req, res) {
    Acceso.eliminarTodos(function() {
      res.redirect('/admin/accesos');
    });
  });
  
  /**
   * Obtiene la lista de direcciones a las que hay que notificar.
   */
  app.get('/admin/mailing', function(req, res) {
    Mailing.obtenerMailing(function(mailing) {
      res.render('admin/mailing', {mailing: mailing});
    });
  });
  
  /**
   * Envia un correo a la lista de distribución registrada en la aplicación.
   */
  app.post('/admin/mailing', function(req, res) {
    Mailing.obtenerMailing(function(mailing) {
      var destinatarios = '';
      var sep = '';
      for(var i in mailing) {
        destinatarios += sep + mailing[i].email;
        if(sep.length == 0) {
          sep = ',';
        }
      }
      
      notificador.enviarCorreo(req.body.titulo, req.body.texto, destinatarios, function(err) {
        var msg = 'Correo enviado';
        if(err) {
          msg = 'Se ha producido un error al enviar el correo';
        }
        
        res.render('admin/mailing', {mailing: mailing, msg: msg});
      });
    });
  });
}