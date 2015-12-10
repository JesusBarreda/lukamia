/**
 * Módulos
 */
var _ = require('underscore'),
    fs = require('fs'),
    seguridad = require('../modules/seguridad'),
    fechaHora = require('../modules/fechaHora');

/**
 * Modelos
 */
var Album = require('../models/albumes'),
    FotoAlbum = require('../models/albumes.fotos');
    
/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  /**
   * Obtiene los álbumes ordenados por fecha de creación.
   */
  app.get('/albumes', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    req.session.usuario.menu = 'fotos';
    res.redirect('/albumes/orden/fechaCreacion');
  });
  
  /**
   * Obtiene los álbumes ordenados de acuerdo al criterio "orden".
   */
  app.get('/albumes/orden/:orden', seguridad.roleVerificado, seguridad.usuarioIdentificado, function(req, res) {
    var idFotosPortada = [];
    Album.obtenerTodos(req.params.orden, function(albumes) {
      _.each(albumes, function(album) {
        if(album.fotoPortada) {
          idFotosPortada.push(album.fotoPortada.split('.')[0]);
        }
      });
      FotoAlbum.obtenerFotosArray(idFotosPortada, function(fotos) {
        _.each(fotos, function(foto) {
          var pathFoto = app.get('RUTA_TEMP') + foto._id + '.' + foto.extension;
          if(!fs.existsSync(pathFoto)) {
            fs.writeFileSync(pathFoto, foto.img.data);
          }
        });
        res.render('albumes', {albumes: albumes, orden: req.params.orden, fechaHora: fechaHora});
      });
    });
  });
  
  /**
   * Presenta el formulario para crear un nuevo álbum.
   */
   app.get('/albumes/crear', usuarioAdmin, function(req, res) {
     res.render('albumes/nuevoAlbum');
   });
   
   /**
    * Crea un nuevo álbum.
    */
   app.post('/albumes', usuarioAdmin, function(req, res) {
     var album = new Album();
     album.titulo = req.body.titulo;
     album.grabar(function() {
       res.redirect('/albumes');
     });
   });
   
   /**
    * Presenta un formulario para modificar el título del álbum.
    */
   app.get('/albumes/:idAlbum', usuarioAdmin, function(req, res) {
     Album.obtener(req.params.idAlbum, function(album) {
       res.render('albumes/editarAlbum', {album: album});
     });
   });
   
   /**
    * Modifica el título del álbum.
    */
   app.put('/albumes/:idAlbum', usuarioAdmin, function(req, res) {
     Album.obtener(req.params.idAlbum, function(album) {
       album.titulo = req.body.titulo;
       album.grabar(function() {
         res.redirect('/albumes');
       });
     });
   });
   
   /**
    * Elimina un álbum.
    */
   app.delete('/albumes/:idAlbum', usuarioAdmin, function(req, res) {
     var album = new Album();
     album._id = req.params.idAlbum;
     FotoAlbum.numFotosAlbum(album._id, function(numFotos) {
       if(numFotos == 0) {
         album.eliminar(function() {
           res.send({numFotos: numFotos});
         });
       }
       else {
         res.send({numFotos: numFotos});
       }
     });
   });
   
   /**
    * Incluimos el recurso albumes.fotos.
    */
   require('./albumes.fotos')(app);
}