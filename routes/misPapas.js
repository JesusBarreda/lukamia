/**
 * Módulos
 */
var seguridad = require('../modules/seguridad');

/**
 * Rutas
 */
module.exports = function(app) {

  /**
   * Página principal del módulo.
   */
  app.get('/misPapas', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    req.session.usuario.menu = 'misPapas';
    res.render('misPapas');
  });
}