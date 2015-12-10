/**
 * Middleware para la autentificación de los usuarios.
 */

module.exports.roleNoVerificado = function(req, res, next) {
  if(req.session.usuario && req.session.usuario.role) {
    res.redirect('/');
  }
  else {
    next();
  }
}

module.exports.usuarioNoIdentificado = function(req, res, next) {
  if(req.session.usuario && req.session.usuario.id) {
    res.redirect('/');
  }
  else {
    next();
  }
}

module.exports.roleVerificado = function(req, res, next) {
  if(!req.session.usuario || !req.session.usuario.role) {
    res.redirect('/role');
  }
  else {
    next();
  }
}

module.exports.usuarioIdentificado = function(req, res, next) {
  if(!req.session.usuario || !req.session.usuario.id) {
    res.redirect('/identificacion');
  }
  else {
    next();
  }
}

module.exports.roleRequerido = function(role) {
  return function(req, res, next) {
    if(req.session.usuario.role._id != role) {
      req.session.usuario.menu = '';
      res.redirect('/');
    }
    else {
      next();
    }
  }
}