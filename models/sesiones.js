/**
 * Módulos
 */
var Mongo = require('mongodb');

/**
 * Elimina las sesiones registradas en base de datos.
 */
module.exports.eliminar = function(host, port, database, user, password) {
  var db = new Mongo.Db(database, new Mongo.Server(host, port, {}), {safe: false});
  
  function eliminarSesiones() {
    db.collection('sessions', function(err, sesiones) {
      sesiones.remove(function() {
        db.close();
      });
    });
  }
  
  db.open(function(err, db) {
    if(user == '' && password == '') {
      eliminarSesiones();
    }
    else {
      db.authenticate(user, password, function(err, res) {
        eliminarSesiones();
      });
    }
  });
}