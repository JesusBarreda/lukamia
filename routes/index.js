/**
 * Módulos
 */
var pkgJson = require('../package.json'),
    seguridad = require('../modules/seguridad');

/**
 * Modelos
 */
var Role = require('../models/roles'),
    Usuario = require('../models/usuarios'),
    Acceso = require('../models/accesos');

/**
 * Rutas
 */
module.exports = function(app) {

  /**
   * Página principal.
   */
  app.get('/', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    res.render('index', {mailing: (req.cookies.mailingLuka ? true : false)});
  });
  
  /**
   * Página de autentificación (solicitud de clave de acceso).
   */
  app.get('/role', seguridad.roleNoVerificado, function(req, res) {
    res.render('role', {version: pkgJson.version, fecha: pkgJson.dateVersion});
  });
  
  /**
   * Verifica que la clave de acceso introducida corresponde con la de alguno de los roles
   * disponibles [USER, ADMIN].
   */
  app.post('/role', function(req, res) {
    Role.obtener(req.body.claveAcceso, function(role) {
      if(!role) {
        req.session.warningMessage = 'Clave de acceso incorrecta';
        res.redirect('/role');
      }
      else {
        var usuario = new Usuario();
        usuario.role = role;
        usuario.menu = '';
        req.session.usuario = usuario;
        res.redirect('/identificacion');
      }
    });
  });
  
  /**
   * Página de identificación (solicitud de username/nickname).
   */
  app.get('/identificacion', seguridad.roleVerificado, seguridad.usuarioNoIdentificado, function(req, res) {
    res.render('identificacion');
  });
  
  /**
   * Identifica al usuario logado con el username/nickname introducido.
   */
  app.post('/identificacion', function(req, res) {
    var usuario = req.session.usuario;
    usuario.id = req.body.idUsuario;
    
    var acceso = new Acceso();
    acceso.usuario = usuario.id;
    acceso.grabar(function() {
      res.redirect('/');
    });
  });
  
  /**
   * Realiza el logout de la aplicación.
   */
  app.get('/salir', function(req, res) {
    delete req.session.usuario;
    res.redirect('/');
  });
}