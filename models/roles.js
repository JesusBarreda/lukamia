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
var schemaRole = new Schema({
  _id: String,
  clave: String
}, {collection: 'roles'});

/**
 * Inicializa la base de datos con las claves de los roles USER y ADMIN.
 */
schemaRole.statics.inicializar = function() {
  this.findById('USER', function(err, role) {
    if(role == null) {
      role = new Role();
      role._id = 'USER';
      role.clave = 'ee11cbb19052e40b07aac0ca060c23ee';
      role.save();
    }
  });
  
  this.findById('ADMIN', function(err, role) {
    if(role == null) {
      role = new Role();
      role._id = 'ADMIN';
      role.clave = '21232f297a57a5a743894a0e4a801fc3';
      role.save();
    }
  });
}

/**
 * Obtiene el role correspondiente a la clave indicada.
 */
schemaRole.statics.obtener = function(clave, callback) {
  this.findOne({clave: clave}, function(err, role) {
    callback(role);
  });
};

/**
 * Actualiza la clave del role.
 */
schemaRole.methods.actualizar = function(callback) {
  Role.update({_id: this._id}, {clave: this.clave}, callback);
}

mongoose.model('Role', schemaRole);
var Role = mongoose.model('Role');

/**
 * Exports
 */
module.exports = Role;