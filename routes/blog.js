/**
 * Constantes
 */
var MAX_FILE_SIZE = 300 * 1024;
var FORMATOS = ['image/gif', 'image/jpeg'];

/**
 * Módulos
 */
var fs = require('fs'),
    moment = require('moment'),
    _ = require('underscore'),
    formidable = require('formidable'),
    seguridad = require('../modules/seguridad'),
    calendario = require('../modules/calendario'),
    fechaHora = require('../modules/fechaHora');
    
/**
 * Modelos
 */
var Blog = require('../models/blog');

/**
 * Funciones
 */
function ordenarComentariosDescendente(comentario1, comentario2) {
  return moment(comentario2.fechaPublicacion).format('YYYYMMDDHHmmssSSS') - moment(comentario1.fechaPublicacion).format('YYYYMMDDHHmmssSSS');
}

/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  /**
   * Obtiene la fecha sobre la que posicionar el calendario del blog.
   * En el caso de no existir publicaciones, la fecha será la del día en curso,
   * en caso contrario, la fecha será la de la publicación más reciente.
   */
  app.get('/blog', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    req.session.usuario.menu = 'blog';
    Blog.obtenerFechaUltimaPublicacion(function(fechaUltimaPublicacion) {
      var fechaBlog = fechaHora.getFecha();
      if(fechaUltimaPublicacion) {
        fechaBlog = fechaUltimaPublicacion;
      }
      res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
    });
  });
  
  /**
   * Obtiene el calendario del blog correspondiente a la fecha indicada.
   */
  app.get('/blog/:fecha', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    var fechaActual = fechaHora.getFecha();
    var publicacionFechaBlog = null;
  
    // Obtenemos las publicaciones desde el día 20 del mes anterior al de la fechaBlog hasta el día 10 del mes siguiente
    // para poder mostrar en el calendario las publicaciones que no pertenecen al mes de la fechaBlog pero que son
    // visibles en el calendario por estar publicadas en los últimos días del mes anterior o en los primeros días del
    // mes siguiente.
    var fechaDesdeCal = new Date(fechaBlog.getFullYear(), fechaBlog.getMonth() - 1, 20);
    var fechaHastaCal = new Date(fechaBlog.getFullYear(), fechaBlog.getMonth() + 1, 10);
  
    Blog.obtenerPublicaciones(fechaDesdeCal, fechaHastaCal, function(hashPublicaciones) {
      var cal = calendario.crear(fechaBlog.getMonth() + 1, fechaBlog.getFullYear(), fechaBlog.getMonth() + 1, fechaBlog.getFullYear());
    
      for(var i = 0; i < cal.length; i++) {
        var mes = cal[i];
        for(var j = 0; j < mes.calendario.length; j++) {
          var semana = mes.calendario[j];
          for(var k = 0; k < semana.length; k++) {
            var dia = semana[k];
            var publicacion = hashPublicaciones[moment(dia.fecha).format('DD-MM-YYYY')];

            dia.enlace = "irFecha('" + moment(dia.fecha).format('DD-MM-YYYY') + "')";
          
            if(moment(dia.fecha).format('DDMMYYYY') == moment(fechaActual).format('DDMMYYYY')) {
              dia.fechaActual = true;
            }
            else {
              dia.fechaActual = false;
            }
          
            if(publicacion) {
              dia.destacar = true;
              if(moment(fechaBlog).format('DDMMYYYY') == moment(publicacion.fecha).format('DDMMYYYY')) {
                publicacionFechaBlog = publicacion;
                var sortComentarios = publicacionFechaBlog.comentarios.sort(ordenarComentariosDescendente);
                publicacionFechaBlog.comentarios = sortComentarios;
              }
            }
            else {
              dia.destacar = false;
            }
          }
        }
      }
    
      // Si la publicación tiene foto, la generamos en el directorio temporal para poder servirla.
      if(publicacionFechaBlog && publicacionFechaBlog.img.data) {
        var pathFoto = app.get('RUTA_TEMP') + 'blog_' + moment(fechaBlog).format('DDMMYYYY') + '.' + publicacionFechaBlog.extension;
        if(!fs.existsSync(pathFoto)) {
          fs.writeFileSync(pathFoto, publicacionFechaBlog.img.data);
        }
      }
    
      res.render('blog', {
        fechaBlog: fechaBlog,
        calendario: cal,
        publicacion: publicacionFechaBlog,
        mesAnterior: moment(calendario.mesAnterior(fechaBlog)).format('DD-MM-YYYY'),
        mesSiguiente: moment(calendario.mesSiguiente(fechaBlog)).format('DD-MM-YYYY'),
        fechaHora: fechaHora
      });
    });
  });
  
  /**
   * Publica para la fecha indicada (:fecha) un texto.
   */
  app.post('/blog/:fecha/texto', usuarioAdmin, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    var titulo = req.body.titulo;
    var texto = req.body.texto || null;
    
    Blog.obtenerPublicacion(fechaBlog, function(publicacion) {
      if(publicacion) {
        Blog.actualizarTexto(fechaBlog, titulo, texto, function() {
          res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
        });
      }
      else {
        var publicacion = new Blog();
        publicacion.fecha = fechaBlog;
        publicacion.titulo = titulo;
        publicacion.texto = texto;
        publicacion.grabar(function() {
          res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
        });
      }
    });
  });
  
  /**
   * Publica para la fecha indicada (:fecha) una foto.
   */
  app.post('/blog/:fecha/foto', usuarioAdmin, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    
    var form = new formidable.IncomingForm();
    form.uploadDir = app.get('RUTA_TEMP');
    
    form.parse(req, function(error, fields, files) {
      var size = files.foto.size;
      var type = files.foto.type;
      var fileUpload = './' + files.foto.path;
      var uploadOk = true;
      
      if(size > MAX_FILE_SIZE) {
        uploadOk = false;
        req.session.warningMessage = 'El tamaño máximo permitido de foto es de ' + (MAX_FILE_SIZE / 1024) + ' Kbytes';
      }
      else if(!_.include(FORMATOS, type)) {
        uploadOk = false;
        req.session.warningMessage = 'Sólo se admiten los formatos de foto: JPEG, JPG y GIF';
      }
    
      if(uploadOk) {
        var img = {};
        var extension = type.split('/')[1];
      
        img.data = fs.readFileSync(fileUpload);
        img.contentType = type;
      
        Blog.obtenerPublicacion(fechaBlog, function(publicacion) {
          if(publicacion) {
            Blog.actualizarFoto(fechaBlog, extension, img, function() {
              var pathFoto = app.get('RUTA_TEMP') + 'blog_' + moment(fechaBlog).format('DDMMYYYY') + '.' + extension;
              fs.writeFileSync(pathFoto, img.data);
              fs.unlink(fileUpload, function() {
                res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
              });
            });
          }
          else {
            var publicacion = new Blog();
            publicacion.fecha = fechaBlog;
            publicacion.extension = extension;
            publicacion.img = img;
            publicacion.grabar(function() {
              var pathFoto = app.get('RUTA_TEMP') + 'blog_' + moment(fechaBlog).format('DDMMYYYY') + '.' + extension;
              fs.writeFileSync(pathFoto, img.data);
              fs.unlink(fileUpload, function() {
                res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
              });
            });
          }
        });
      }
      else {
        fs.unlink(fileUpload, function() {
          res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
        });
      }
    });
  });
  
  /**
   * Elimina el texto o la foto de la publicación (:fecha), dependiendo de lo que indique el parámetro "tipo".
   */
  app.delete('/blog/:fecha', usuarioAdmin, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    var tipo = req.body.tipo;
  
    Blog.obtenerPublicacion(fechaBlog, function(publicacion) {
      if(tipo == 'texto') {
        if(publicacion.img.data) {
          Blog.actualizarTexto(fechaBlog, null, null, function() {
            res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
          });
        }
        else {
          Blog.eliminar(fechaBlog, function() {
            res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
          });
        }
      }
      else if(tipo == 'foto') {
        var pathFoto = app.get('RUTA_TEMP') + 'blog_' + moment(fechaBlog).format('DDMMYYYY') + '.' + publicacion.extension;
        fs.unlink(pathFoto, function() {});
        if(publicacion.titulo) {
          Blog.actualizarFoto(fechaBlog, null, null, function() {
            res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
          });
        }
        else {
          Blog.eliminar(fechaBlog, function() {
            res.redirect('/blog/' + moment(fechaBlog).format('DD-MM-YYYY'));
          });
        }
      }
    });
  });
  
  /**
   * Registra un comentario sobre la publicación y lo devuelve para su visualización por pantalla.
   */
  app.post('/blog/:fecha/comentarios', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    var comentario = req.body.comentario;  
    Blog.registrarComentario(fechaBlog, req.session.usuario.id, comentario, function() {
      Blog.obtenerComentarios(fechaBlog, function(comentarios) {
        var sortComentarios = comentarios.sort(ordenarComentariosDescendente);
        res.send({comentarios: sortComentarios});
      });
    });
  });
  
  /**
   * Elimina un comentario sobre la publicación.
   */
  app.delete('/blog/:fecha/comentarios/:idComentario', usuarioAdmin, function(req, res) {
    var fechaBlog = fechaHora.stringToFecha(req.params.fecha, 'DD-MM-YYYY');
    Blog.eliminarComentario(fechaBlog, req.params.idComentario, function() {
      res.send();
    });
  });
}