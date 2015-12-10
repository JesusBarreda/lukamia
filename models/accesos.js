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
var schemaAcceso = new Schema({
  usuario: String,
  fechaLogin: {type: Date, default: Date.now}
}, {collection: 'accesos'});

/**
 * Obtiene los accesos registrados hasta la fecha.
 */
schemaAcceso.statics.obtenerTodos = function(callback) {
  this.find().sort({fechaLogin: 'descending'}).exec(function(err, accesos) {
    callback(accesos);
  });
}

/**
 * Graba un nuevo acceso.
 */
schemaAcceso.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Elimina los accesos registrados hasta la fecha.
 */
schemaAcceso.statics.eliminarTodos = function(callback) {
  this.remove(callback);
}

mongoose.model('Acceso', schemaAcceso);
var Acceso = mongoose.model('Acceso');

/**
 * Exports
 */
module.exports = Acceso;