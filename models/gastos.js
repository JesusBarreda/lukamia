/**
 * Módulos
 */
var mongoose = require('mongoose'),
    moment = require('moment'),
    _ = require('underscore'),
    fechaHora = require('../modules/fechaHora');
    
/**
 * Variables
 */
var Schema = mongoose.Schema;

/**
 * Schema
 */
var schemaGasto = new Schema({
  mes: String,
  concepto: String,
  coste: Number
}, {collection: 'gastos'});

/**
 * Obtiene los gastos de un mes.
 */
schemaGasto.statics.obtenerGastosMes = function(mes, callback) {
  var re = new RegExp(mes, 'g');
  this.find({mes: re}).sort({concepto: 'ascending'}).exec(function(err, gastos) {
    callback(gastos);
  });
}

/**
 * Graba un nuevo concepto.
 */
schemaGasto.methods.grabar = function(callback) {
  this.save(callback);
}

/**
 * Actualiza el coste de un gasto.
 */
schemaGasto.statics.actualizar = function(idGasto, coste, callback) {
  this.update({_id: idGasto}, {coste: coste}, function(err) {
    callback();
  });
}

/**
 * Elimina el gasto.
 */
schemaGasto.methods.eliminar = function(callback) {
  this.remove(callback);
}

/**
 * Devuelve los conceptos existentes en la base de datos.
 */
schemaGasto.statics.obtenerConceptos = function(callback) {
  this.find().distinct('concepto', function(err, conceptos) {
    callback(conceptos);
  });
}

/**
 * Obtiene los gastos comprendidos entre las fechas dadas.
 * Las fechas pueden tener el formato MM-YYYY o YYYY pero ambas deben tener el mismo formato.
 */
schemaGasto.statics.obtenerGastosPeriodo = function(desde, hasta, callback) {
  var mesAnyoDesde = desde.split('-');
  var mesAnyoHasta = hasta.split('-');
  var mesDesde = '';
  var anyoDesde = '';
  var mesHasta = '';
  var anyoHasta = '';
  var periodoPorMeses = true;
  
  if(mesAnyoDesde.length == 1) {
    periodoPorMeses = false;
    anyoDesde = mesAnyoDesde[0];
  }
  else {
    mesDesde = mesAnyoDesde[0];
    anyoDesde = mesAnyoDesde[1];
  }

  if(mesAnyoHasta.length == 1) {
    periodoPorMeses = false;
    anyoHasta = mesAnyoHasta[0];
  }
  else {
    mesHasta = mesAnyoHasta[0];
    anyoHasta = mesAnyoHasta[1];
  }
  
  var fechasPeriodo = [];
  if(periodoPorMeses) {
    fechasPeriodo = fechaHora.obtenerFechasPeriodoMeses(mesDesde, anyoDesde, mesHasta, anyoHasta);
  }
  else {
    fechasPeriodo = fechaHora.obtenerFechasPeriodoAnyos(anyoDesde, anyoHasta);
  }
  
  var res = _.map(fechasPeriodo, function(fecha) { return new RegExp(fecha, 'g'); });
  this.find({mes: {$in: res}}, function(err, gastos) {
    callback(gastos);
  });
}

mongoose.model('Gasto', schemaGasto);
var Gasto = mongoose.model('Gasto');

/**
 * Exports
 */
module.exports = Gasto;