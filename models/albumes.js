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
var schemaAlbum = new Schema({
  titulo: String,
  fechaCreacion: {type: Date, default: Date.now},
  fechaModificacion: {type: Date, default: Date.now},
  fotoPortada: String
}, {collection: 'albumes'});

/**
 * Obtiene los álbumes ordenados de forma descendente por el criterio indicado.
 */
schemaAlbum.statics.obtenerTodos = function(orden, callback) {
  var ordenConsulta = {};
  if(orden == 'fechaCreacion') {
    ordenConsulta.fechaCreacion = 'descending';
  }
  else if(orden == 'fechaModificacion') {
    ordenConsulta.fechaModificacion = 'descending';
  }
  
  this.find().sort(ordenConsulta).exec(function(err, albumes) {
    callback(albumes);
  });
}

/**
 * Obtiene el álbum indicado.
 */
schemaAlbum.statics.obtener = function(idAlbum, callback) {
  this.findById(idAlbum, function(err, album) {
    callback(album);
  }); 
}

/**
 * Graba el álbum.
 */
schemaAlbum.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Elimina el álbum.
 */
schemaAlbum.methods.eliminar = function(callback) {
  this.remove(callback);
}

mongoose.model('Album', schemaAlbum);
var Album = mongoose.model('Album');

/**
 * Exports
 */
module.exports = Album;