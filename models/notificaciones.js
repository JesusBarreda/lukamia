/**
 * Módulos
 */
var mongoose = require('mongoose');

/**
 * Variables
 */
var Schema = mongoose.Schema;

/**
 * Schema
 */
var schemaNotificaciones = new Schema({
  eventos: [{type: String, enum: ['COMENTARIO_FOTO', 'COMENTARIO_BLOG', 'EVENTO_AGENDA']}],
  listaDistribucion: [String]
}, {collection: 'notificaciones'});

/**
 * Inicializa la estructura de configuración de las notificaciones en caso de que no exista.
 */
schemaNotificaciones.statics.inicializar = function() {
  this.findOne(function(err, notificaciones) {
    if(!notificaciones) {
      var notificaciones = new Notificaciones();
      notificaciones.eventos = [];
      notificaciones.listaDistribucion = [];
      notificaciones.save(function() {});      
    }
  });
}

/**
 * Obtiene los eventos a notificar y la lista de distribución.
 */
schemaNotificaciones.statics.obtener = function(callback) {
  this.findOne(function(err, notificaciones) {
    callback(notificaciones);
  });
}

/**
 * Graba los eventos a notificar y la lista de distribución.
 */
schemaNotificaciones.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Añade una nueva dirección de correo a la lista de distribución.
 */
schemaNotificaciones.statics.registrarEmail = function(email, callback) {
  this.update({$push: {listaDistribucion: email}}, function(err) {
    callback();
  });
}

/**
 * Elimina la dirección de correo de la lista de distribución.
 */
schemaNotificaciones.statics.eliminarEmail = function(email, callback) {
  this.update({$pull: {listaDistribucion: email}}, function(err) {
    callback();
  });
}

mongoose.model('Notificaciones', schemaNotificaciones);
var Notificaciones = mongoose.model('Notificaciones');

/**
 * Exports
 */
module.exports = Notificaciones;