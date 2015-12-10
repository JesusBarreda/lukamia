/**
 * Constantes
 */
var MAX_FILE_SIZE = 300 * 1024;
var FORMATOS = ['image/gif', 'image/jpeg'];

/**
 * Módulos
 */
var _ = require('underscore'),
    fs = require('fs'),
    formidable = require('formidable'),
    seguridad = require('../modules/seguridad');

/**
 * Modelos
 */
var Album = require('../models/albumes');
var FotoAlbum = require('../models/albumes.fotos');

/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  /**
   * Presenta un formulario para publicar una nueva foto en el álbum indicado.
   */
  app.get('/albumes/:idAlbum/fotos/publicar', usuarioAdmin, function(req, res) {
    Album.obtener(req.params.idAlbum, function(album) {
      res.render('albumes/nuevaFoto', {album: album});
    });    
  });
  
  /**
   * Publica una foto.
   */
  app.post('/albumes/:idAlbum/fotos', usuarioAdmin, function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = app.get('RUTA_TEMP');
    
    form.parse(req, function(error, fields, files) {
      var size = files.foto.size;
      var type = files.foto.type;
      var fileUpload = './' + files.foto.path;
      var idAlbum = fields.idAlbum;
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
        var fotoAlbum = new FotoAlbum();
        fotoAlbum._idAlbum = idAlbum;
        fotoAlbum.extension = type.split('/')[1];
        fotoAlbum.img.data = fs.readFileSync(fileUpload);
        fotoAlbum.img.contentType = type;
        fotoAlbum.save(function() {
          Album.obtener(idAlbum, function(album) {
            album.fechaModificacion = new Date();
            album.grabar(function() {
              fs.unlink(fileUpload, function() {
                res.redirect('/albumes');
              });
            });
          });
        });
      }
      else {
        fs.unlink(fileUpload, function() {
          res.redirect('/albumes/' + idAlbum + '/fotos/publicar');
        });
      }
    });
  });
    
  /**
   * Obtiene todas las fotos del álbum (excluyendo las imágenes) y genera en el directorio temporal
   * (/public/temp) la primera foto del álbum en caso de que no haya sido generada con anterioridad.
   */
  app.get('/albumes/:idAlbum/fotos', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    Album.obtener(req.params.idAlbum, function(album) {
      FotoAlbum.obtenerFotosAlbum(album._id, function(fotos) {
        if(fotos.length > 0) {
          var primeraFoto = fotos[0];
          var pathPrimeraFoto = app.get('RUTA_TEMP') + primeraFoto._id + '.' + primeraFoto.extension;
          if(!fs.existsSync(pathPrimeraFoto)) {
            FotoAlbum.obtener(primeraFoto._id, function(primeraFoto) {
              fs.writeFileSync(pathPrimeraFoto, primeraFoto.img.data); 
            });
          }
        }
        res.render('albumes/fotosAlbum', {album: album, fotos: JSON.stringify(fotos)});
      });
    });
  });
  
  /**
   * Obtiene la foto indicada generándola en el directorio temporal (/public/temp) en caso de que no haya
   * sido generada con anterioridad.
   */
  app.get('/albumes/:idAlbum/fotos/:foto', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var pathFoto = app.get('RUTA_TEMP') + req.params.foto;
    var idFoto = req.params.foto.split('.')[0];
  
    FotoAlbum.obtener(idFoto, function(foto) {
      if(!fs.existsSync(pathFoto)) {
        fs.writeFile(pathFoto, foto.img.data, function(err) {
          res.send({foto: foto});
        });
      }
      else {
        res.send({foto: foto});
      }
    });
  });
  
  /**
   * Fija la foto indicada como foto de portada del álbum o la elimina como tal en función del
   * parámetro "accion".
   */
  app.put('/albumes/:idAlbum/fotos/portada/:foto', usuarioAdmin, function(req, res) {
    var accion = req.body.accion;
    
    Album.obtener(req.params.idAlbum, function(album) {
      if(accion == 'fijarFotoPortada') {
        album.fotoPortada = req.params.foto;
      }
      else {
        album.fotoPortada = undefined;
      }
    
      album.grabar(function() {
        res.send();
      });
    });
  });
  
  /**
   * Elimina una foto del álbum indicado.
   */
  app.delete('/albumes/:idAlbum/fotos/:idFoto.:extension', usuarioAdmin, function(req, res) {
    var foto = new FotoAlbum();
    foto._id = req.params.idFoto;
    foto._idAlbum = req.params.idAlbum;
    foto.extension = req.params.extension;

    foto.eliminar(function() {
      fs.unlink(app.get('RUTA_TEMP') + foto._id + '.' + foto.extension, function() {});
      Album.obtener(foto._idAlbum, function(album) {
        if(album.fotoPortada == foto._id + '.' + foto.extension) {
          album.fotoPortada = undefined;
        }
        album.fechaModificacion = new Date();
        album.grabar(function() {
          res.send();
        });
      });
    });
  });
  
  /**
   * Registra un comentario sobre la foto.
   */
  app.post('/albumes/:idAlbum/fotos/:idFoto/comentarios', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    FotoAlbum.registrarComentario(req.params.idFoto, req.session.usuario.id, req.body.comentario, function() {
      res.send();
    });
  });
  
  /**
   * Elimina el comentario sobre la foto.
   */
  app.delete('/albumes/:idAlbum/fotos/:idFoto/comentarios/:idComentario', usuarioAdmin, function(req, res) {
    var fotoAlbum = new FotoAlbum();
    fotoAlbum._id = req.params.idFoto;
    fotoAlbum.eliminarComentario(req.params.idComentario, function() {
      res.send();
    });
  });

  /**
   * Obtiene los comentarios de la foto.
   */
  app.get('/albumes/:idAlbum/fotos/:idFoto/comentarios', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    FotoAlbum.obtenerComentarios(req.params.idFoto, function(comentarios) {
      res.send({comentarios: comentarios});
    });
  });
  
  /**
   * Sustituye una foto del álbum.
   */
  app.put('/albumes/:idAlbum/fotos/:idFoto/sustituir', usuarioAdmin, function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = app.get('RUTA_TEMP');
    
    form.parse(req, function(error, fields, files) {
      var size = files.fotoSustitucion.size;
      var type = files.fotoSustitucion.type;
      var fileUpload = './' + files.fotoSustitucion.path;
      var idAlbum = req.params.idAlbum;
      var idFoto = req.params.idFoto;
      var uploadOk = true;
      var msgWarning = null;

      if(size > MAX_FILE_SIZE) {
        uploadOk = false;
        msgWarning = 'El tama&ntilde;o m&aacute;ximo permitido de foto es de ' + (MAX_FILE_SIZE / 1024) + ' Kbytes';
      }
      else if(!_.include(FORMATOS, type)) {
        uploadOk = false;
        msgWarning = 'S&oacute;lo se admiten los formatos de foto: JPEG, JPG y GIF';
      }

      if(uploadOk) {
        // Obtenemos la foto original a sustituir.
        FotoAlbum.obtener(idFoto, function(foto) {
          var fotoOriginal = foto._id + '.' + foto.extension;        
          var img = {};
          img.data = fs.readFileSync(fileUpload);
          img.contentType = type;
          foto.img = img;
          foto.extension = type.split('/')[1];
          foto.comentarios = [];
          // Sustituimos la foto.
          foto.grabar(function() {
            // Eliminamos la foto original del directorio /public/temp.
            fs.unlink(app.get('RUTA_TEMP') + fotoOriginal, function() {
              // Renombramos la foto subida.
              fs.renameSync(fileUpload, app.get('RUTA_TEMP') + foto._id + '.' + foto.extension);
              // Modificamos la fecha de modificación del álbum y si la foto original era la portada
              // del álbum, fijamos como portada la foto que la sustituye.
              Album.obtener(idAlbum, function(album) {
                album.fechaModificacion = new Date();
                if(album.fotoPortada == fotoOriginal) {
                  album.fotoPortada = foto._id + '.' + foto.extension;
                }
                album.grabar(function() {
                  res.send({upload: true});
                });
              });
            });
          });
        });
      }
      else {
        fs.unlink(fileUpload, function() {
          res.send({upload: false, msgWarning: msgWarning});
        });
      }
    });
  });
}