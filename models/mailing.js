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
var schemaMailing = new Schema({
  email: String
}, {collection: 'mailing'});

/**
 * Obtiene la lista de direcciones de correo a notificar.
 */
schemaMailing.statics.obtenerMailing = function(callback) {
  this.find().sort({email: 'ascending'}).exec(function(err, mailing) {
    callback(mailing);
  });
}

/**
 * Comprueba si la dirección de correo ya existe en el mailing.
 */
schemaMailing.statics.existe = function(email, callback) {
  this.findOne({email: email}, function(err, email) {
    if(email != null) {
      callback(true);    
    }
    else {
      callback(false);
    }
  });
}

/**
 * Graba una dirección de correo.
 */
schemaMailing.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Elimina una dirección de correo.
 */
schemaMailing.statics.eliminar = function(email, callback) {
  this.remove({email: email}, callback);
}

mongoose.model('Mailing', schemaMailing);
var Mailing = mongoose.model('Mailing');

/**
 * Exports
 */
module.exports = Mailing;