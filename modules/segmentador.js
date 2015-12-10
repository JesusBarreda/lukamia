/**
 * Segmenta la lista de elementos en un array de arrays de numItemsSegmento elementos cada uno.
 */
module.exports = function(lista, numItemsSegmento) {
  var segmentos = new Array();
  var segmento = null;
  var numItems = 0;
  
  for(var i in lista) {
    if(numItems == 0) {
      segmento = new Array();
      segmentos.push(segmento);
    }
    
    segmento.push(lista[i]);
    numItems++;
    
    if(numItems == numItemsSegmento) {
      numItems = 0;
    }
  }
  
  return segmentos;
}