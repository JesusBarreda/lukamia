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
 * Variables
 */
var Schema = mongoose.Schema;

/**
 * Schema
 */
var schemaComentarioBlog = new Schema({
  usuario: String,  
  texto: String,
  fechaPublicacion: {type: Date, default: Date.now}
});

var schemaBlog = new Schema({
  fecha: {type: Date},
  titulo: String,
  texto: String,
  img: {data: Buffer, contentType: String},
  extension: String,
  comentarios: [schemaComentarioBlog]
}, {collection: 'blog'});

/**
 * Funciones
 */
function obtenerNotificacion(usuario, comentario, fechaBlog) {
  var notificacion = {};
  var fecha = new Date();
  notificacion.tipo = 'COMENTARIO_BLOG';
  notificacion.titulo = 'Comentario blog';
  notificacion.texto = 'Comentario sobre la entrada del blog del d&iacute;a <font style="color:#006699">' +
                       moment(fechaBlog).format('DD \\d\\e MMMM \\d\\e YYYY') + '</font> publicado el ' +
                       '<font style="color:#006699">' + moment(fecha).format('DD \\d\\e MMMM \\d\\e YYYY') + '</font> ' +
                       'a las <font style="color:#006699">' + moment(fecha).format('HH:mm') + '</font> por el usuario ' +
                       '<font style="color:brown">' + usuario + '</font>:<br/><br/>' +
                       '<font style="font-style:italic; color:#555555">"' + comentario + '"</font><br/><br/>' +
                       '<a href="' + DIR_WEB + '" style="color:#777777">La web de Luka &amp; Mia</a>';
  return notificacion;
}

/**
 * Obtiene la fecha de la publicación más reciente.
 */
schemaBlog.statics.obtenerFechaUltimaPublicacion = function(callback) {
  this.findOne({}).sort({fecha: 'descending'}).exec(function(err, publicacion) {
    if(publicacion) {
      callback(publicacion.fecha);
    }
    else {
      callback(null);
    }
  });
}

/**
 * Obtiene una tabla hash con la fecha como clave con las publicaciones que ha tenido el blog
 * en el intervalo de fechas indicado.
 */
schemaBlog.statics.obtenerPublicaciones = function(fechaDesde, fechaHasta, callback) {
  this.find({fecha: {$gte: fechaDesde, $lte: fechaHasta}}, function(err, publicaciones) {
    var hashPublicaciones = [];
    for(var i = 0; i < publicaciones.length; i++) {
      hashPublicaciones[moment(publicaciones[i].fecha).format('DD-MM-YYYY')] = publicaciones[i];
    }
    callback(hashPublicaciones);
  });
}

/**
 * Obtiene la publicación de la fecha indicada.
 */
schemaBlog.statics.obtenerPublicacion = function(fecha, callback) {
  this.findOne({fecha: fecha}, function(err, publicacion) {
    callback(publicacion);
  });
}

/**
 * Graba una publicación del blog.
 */
schemaBlog.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Actualiza el título y el texto de una publicación del blog.
 */
schemaBlog.statics.actualizarTexto = function(fechaBlog, titulo, texto, callback) {
  this.update({fecha: fechaBlog}, {titulo: titulo, texto: texto}, function(err) {
    callback();
  });
}

/**
 * Actualiza la foto de una publicación del blog.
 */
schemaBlog.statics.actualizarFoto = function(fechaBlog, extension, img, callback) {
  this.findOne({fecha: fechaBlog}, function(err, publicacion) {
    publicacion.extension = extension;
    publicacion.img.data = (img != null ? img.data : null);
    publicacion.img.contentType = (img != null ? img.contentType : null);
    publicacion.save(callback);
  });
}

/**
 * Elimina la publicación del blog.
 */
schemaBlog.statics.eliminar = function(fechaBlog, callback) {
  this.remove({fecha: fechaBlog}, function(err) {
    callback();
  });  
}

/**
 * Registra un comentario en la publicación.
 */
schemaBlog.statics.registrarComentario = function(fechaBlog, usuario, comentario, callback) {
  this.update({fecha: fechaBlog}, {$push: {comentarios: {usuario: usuario, texto: comentario}}}, function(err) {
    var notificacion = obtenerNotificacion(usuario, comentario, fechaBlog);
    notificador.notificar(notificacion.tipo, notificacion.titulo, notificacion.texto);
    callback();
  });
}

/**
 * Obtiene los comentarios realizados sobre la publicación.
 */
schemaBlog.statics.obtenerComentarios = function(fechaBlog, callback) {
  this.findOne({fecha: fechaBlog}, {comentarios: 1}, function(err, publicacion) {
    callback(publicacion.comentarios);
  });
}

/**
 * Elimina un comentario de la publicación.
 */
schemaBlog.statics.eliminarComentario = function(fechaBlog, idComentario, callback) {
  this.update({fecha: fechaBlog}, {$pull: {comentarios: {_id: idComentario}}}, function(err) {
    callback();
  });
}

mongoose.model('Blog', schemaBlog);
var Blog = mongoose.model('Blog');

/**
 * Exports
 */
module.exports = Blog;