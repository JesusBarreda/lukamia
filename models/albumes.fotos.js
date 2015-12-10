/**
 * Constantes
 */
var DIR_WEB = 'http://luka.aws.af.cm';

/**
 * Módulos
 */
var mongoose = require('mongoose'),
    moment = require('moment'),
    notificador = require('../modules/notificador');
    
/**
 * Modelos
 */
var Album = require('./albumes');

/**
 * Variables
 */
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
/**
 * Schema
 */
var schemaComentarioFoto = new Schema({
  usuario: String,  
  texto: String,
  fechaPublicacion: {type: Date, default: Date.now}
});

var schemaFotoAlbum = new Schema({
  _idAlbum: ObjectId,
  extension: String,
  img: {data: Buffer, contentType: String},
  fechaPublicacion: {type: Date, default: Date.now},
  comentarios: [schemaComentarioFoto]
}, {collection: 'albumes.fotos'});

/**
 * Funciones
 */
function obtenerNotificacion(usuario, comentario, album) {
  var notificacion = {};
  var fecha = new Date();
  notificacion.tipo = 'COMENTARIO_FOTO';
  notificacion.titulo = 'Comentario foto';
  notificacion.texto = 'Comentario sobre foto del &aacute;lbum <font style="color:#339966">' + album + '</font> ' +
                       'publicado el <font style="color:#006699">' + moment(fecha).format('DD \\d\\e MMMM \\d\\e YYYY') + '</font> ' +
                       'a las <font style="color:#006699">' + moment(fecha).format('HH:mm') + '</font> por el usuario ' +
                       '<font style="color:brown">' + usuario + '</font>:<br/><br/><font style="font-style:italic; color:#555555">"' +
                       comentario + '"</font><br/><br/><a href="' + DIR_WEB + '" style="color:#777777">La web de Luka &amp; Mia</a>';
  return notificacion;
}

/**
 * Obtiene las fotos del álbum (excluyendo las imágenes) ordenadas de forma ascendente por fecha de publicación.
 */
schemaFotoAlbum.statics.obtenerFotosAlbum = function(idAlbum, callback) {
  this.find({_idAlbum: idAlbum}, {img: 0}).sort({fechaPublicacion: 'ascending'}).exec(function(err, fotos) {
    callback(fotos);
  });
}

/**
 * Obtiene la foto indicada.
 */
schemaFotoAlbum.statics.obtener = function(idFoto, callback) {
  this.findById(idFoto, function(err, foto) {
    callback(foto);
  });
}

/**
 * Obtiene las fotos de la lista.
 */
schemaFotoAlbum.statics.obtenerFotosArray = function(arrayIdFotos, callback) {
  this.find({_id: {$in: arrayIdFotos}}, function(err, fotos) {
    callback(fotos);
  });
}

/**
 * Obtiene el número de fotos que tiene el álbum
 */
schemaFotoAlbum.statics.numFotosAlbum = function(idAlbum, callback) {
  this.count({_idAlbum: idAlbum}, function(err, numFotos) {
    callback(numFotos);
  });
}

/**
 * Registra un comentario en la foto.
 */
schemaFotoAlbum.statics.registrarComentario = function(idFoto, usuario, comentario, callback) {
  // Registramos el comentario
  this.update({_id: idFoto}, {$push: {comentarios: {usuario: usuario, texto: comentario}}}, function(err) {
    // Obtenemos el álbum de la foto para notificar la publicación
    FotoAlbum.obtener(idFoto, function(foto) {
      Album.obtener(foto._idAlbum, function(album) {
        var notificacion = obtenerNotificacion(usuario, comentario, album.titulo);
        notificador.notificar(notificacion.tipo, notificacion.titulo, notificacion.texto);
        callback();
      });
    });
  });
}

/**
 * Elimina un comentario de la foto.
 */
schemaFotoAlbum.methods.eliminarComentario = function(idComentario, callback) {
  FotoAlbum.update({_id: this._id}, {$pull: {comentarios: {_id: idComentario}}}, function(err) {
    callback();
  });
}

/**
 * Elimina la foto.
 */
schemaFotoAlbum.methods.eliminar = function(callback) {
  this.remove(callback);
}

/**
 * Actualiza una foto del álbum.
 */
schemaFotoAlbum.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Obtiene los comentarios de la foto indicada.
 */
schemaFotoAlbum.statics.obtenerComentarios = function(idFoto, callback) {
  this.findById(idFoto, function(err, foto) {
    callback(foto.comentarios);
  });
}

mongoose.model('FotoAlbum', schemaFotoAlbum);
var FotoAlbum = mongoose.model('FotoAlbum');

/**
 * Exports
 */
module.exports = FotoAlbum;