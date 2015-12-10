/**
 * Módulos
 */
var moment = require('moment'),
    _ = require('underscore'),
    seguridad = require('../modules/seguridad'),
    fechaHora = require('../modules/fechaHora');
    
/**
 * Modelos
 */
var Gasto = require('../models/gastos'); 

/**
 * Rutas
 */
module.exports = function(app) {
  var usuarioAdmin = [seguridad.roleVerificado, seguridad.usuarioIdentificado, seguridad.roleRequerido('ADMIN')];
  
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  /**
   * Todas las rutas de acceso a este módulo requiren que el usuario tenga el role ADMIN.
   */
  app.all('/gastos*', usuarioAdmin, function(req, res, next) {
    next();
  });
  
  /**
   * Obtiene el mes actual y redirige la petición a la obtención de los gastos.
   */
  app.get('/gastos', function(req, res) {
    req.session.usuario.menu = 'gastos';
    res.redirect('/gastos/' + moment(new Date()).format('MM-YYYY'));
  });
  
  /**
   * Obtiene los gastos del mes indicado.
   */
  app.get('/gastos/:mes', function(req, res) {
    var mesAnyo = req.params.mes.split('-');
    var mes = '';
    var anyo = '';
  
    if(mesAnyo.length == 1) {
      anyo = mesAnyo[0];    
    }
    else {
      mes = mesAnyo[0];
      anyo = mesAnyo[1];
    }
  
    Gasto.obtenerGastosMes(req.params.mes, function(gastos) {
      var gastosFinales = null;
      if(mes == '') {
        var gastosAgregados = [];
        for(var i = 0; i < gastos.length; i++) {
          var gasto = gastos[i];
          var gastoAgregado = gastosAgregados[gasto.concepto];
          if(!gastoAgregado) {
            gastoAgregado = new Gasto();
            gastoAgregado.concepto = gasto.concepto;
            gastoAgregado.coste = gasto.coste;
            gastosAgregados[gastoAgregado.concepto] = gastoAgregado;
          }
          else {
            gastoAgregado.coste += gasto.coste;
          }
        }
      
        gastosFinales = [];
        for(var i in gastosAgregados) {
          gastosFinales.push(gastosAgregados[i]);
        }
      }
      else {
        gastosFinales = gastos;
      }
    
      var anyoActual = new Date().getFullYear();
      var fechaDesdeHistorico = '01-' + anyoActual;
      var fechaHastaHistorico = '12-' + anyoActual;
    
      res.render('gastos', {
                 mes: mes,
                 anyo: anyo,
                 meses: fechaHora.obtenerMeses(),
                 gastos: gastosFinales,
                 fechaDesdeHistorico: fechaDesdeHistorico,
                 fechaHastaHistorico: fechaHastaHistorico
      });
    });
  });
  
  /**
   * Añade un gasto al mes.
   */
  app.post('/gastos/:mes', function(req, res) {
    var gasto = new Gasto();
    gasto.mes = req.params.mes;
    gasto.concepto = req.body.concepto;
    gasto.coste = new Number(req.body.coste);
    gasto.grabar(function() {
      res.redirect('/gastos/' + gasto.mes);
    });
  });
  
  /**
   * Actualiza el coste de un gasto.
   */
  app.put('/gastos/:mes', function(req, res) {
    Gasto.actualizar(req.body.idGasto, req.body.coste, function() {
      res.send();
    });
  });
  
  /**
   * Elimina un gasto.
   */
  app.delete('/gastos/:mes', function(req, res) {
    var gasto = new Gasto();
    gasto._id = req.body.idGasto;
    gasto.eliminar(function() {
      res.redirect('/gastos/' + req.params.mes);
    });
  });
  
  /**
   * Devuelve los conceptos que coinciden con el criterio indicado.
   */
  app.get('/gastos/conceptos/:criterio', function(req, res) {
    Gasto.obtenerConceptos(function(conceptos) {
      var criterio = escapeRegExp(req.params.criterio);
      var re = new RegExp(criterio, 'gi');
      var matches = [];
      for(var i in conceptos) {
        if(conceptos[i].match(re)) {
          matches.push(conceptos[i]);
        }
      }
    
      res.send(matches);
    });
  });
  
  /**
   * Devuelve los gastos comprendidos entre las fechas indicadas para generar el gráfico histórico.
   */
  app.get('/gastos/historico/:desde/:hasta/:tipoGrafico', function(req, res) {
    // Desglosamos las fechas
    var fechaDesde = req.params.desde.split('-');
    var fechaHasta = req.params.hasta.split('-');
    var mesDesde = '';
    var anyoDesde = '';
    var mesHasta = '';
    var anyoHasta = '';
    
    if(fechaDesde.length == 1) {
      anyoDesde = fechaDesde[0];
    }
    else {
      mesDesde = fechaDesde[0];
      anyoDesde = fechaDesde[1];
    }

    if(fechaHasta.length == 1) {
      anyoHasta = fechaHasta[0];
    }
    else {
      mesHasta = fechaHasta[0];
      anyoHasta = fechaHasta[1];
    }
  
    // Obtenemos todas las fechas comprendidas en el período indicado
    var fechas = null;
    if(fechaDesde.length == 1) {
      fechas = fechaHora.obtenerFechasPeriodoAnyos(anyoDesde, anyoHasta);
    }
    else {
      fechas = fechaHora.obtenerFechasPeriodoMeses(mesDesde, anyoDesde, mesHasta, anyoHasta);
    }
  
    // Se crea un hashtable: hashGastos[fecha] = 0.0
    var hashGastos = [];
    for(var i = 0; i < fechas.length; i++) {
      hashGastos[fechas[i]] = 0.0;
    }
  
    Gasto.obtenerGastosPeriodo(req.params.desde, req.params.hasta, function(gastos) {
      // Se contabilizan los gastos
      for(var i = 0; i < gastos.length; i++) {
        if(fechaDesde.length == 1) {
          var fechaGasto = gastos[i].mes.split('-');
          hashGastos[fechaGasto[1]] += gastos[i].coste;
        }
        else {
          hashGastos[gastos[i].mes] += gastos[i].coste;
        }
      }
    
      // Se obtienen tres arrays: uno con los gastos, otro con las fechas y otro con los tooltips.
      var gastosOrdenados = [];
      var fechasOrdenadas = [];
      var tooltipsOrdenados = [];
    
      for(var i in hashGastos) {
        gastosOrdenados.push(hashGastos[i]);
        fechasOrdenadas.push(i);
        tooltipsOrdenados.push(i + ': ' + hashGastos[i].toFixed(2) + ' €');
      }
    
      res.render('gastos/historico', {
        gastos: JSON.stringify(gastosOrdenados),
        fechas: JSON.stringify(fechasOrdenadas),
        tooltips: JSON.stringify(tooltipsOrdenados),
        mesDesde: mesDesde,
        anyoDesde: anyoDesde,
        mesHasta: mesHasta,
        anyoHasta: anyoHasta,
        tipoGrafico: req.params.tipoGrafico,
        meses: fechaHora.obtenerMeses()
      });
    });
  });
}