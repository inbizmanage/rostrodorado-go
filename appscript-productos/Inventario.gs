/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Lógica del Popup de Inventario
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── ABRIR EL POPUP ───────────────────────────────────────────────────────────
function abrirPopupInventario() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getName() !== CONFIG.sourceSheetName) {
    ui.alert("Por favor, abre la hoja de '" + CONFIG.sourceSheetName + "' para usar esta función.");
    return;
  }
  
  var html = HtmlService.createTemplateFromFile('PopupInventario').evaluate()
    .setWidth(450)
    .setHeight(600)
    .setTitle("Gestor Rápido de Producto");
    
  ui.showModalDialog(html, "Gestor Rápido de Producto");
}

// ─── OBTENER LISTA DE PRODUCTOS ───────────────────────────────────────────────
function getProductosInventario() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getName() !== CONFIG.sourceSheetName) {
    throw new Error("No estás en la hoja de Inventario.");
  }
  
  var maxCols = sheet.getLastColumn();
  var maxRows = sheet.getLastRow();
  
  if (maxCols === 0 || maxRows < 2) {
    throw new Error("La hoja de inventario está vacía o no tiene productos.");
  }
  
  var data = sheet.getRange(1, 1, maxRows, maxCols).getValues();
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  
  var colProducto = headers.findIndex(function(h) { return h.indexOf("producto") > -1 || h.indexOf("nombre") > -1; });
  var colMarca = headers.findIndex(function(h) { return h.indexOf("marca") > -1 || h.indexOf("brand") > -1; });
  var colCantidad = headers.findIndex(function(h) { return h.indexOf("cantidad") > -1 || h.indexOf("stock") > -1; });
  var colImagen = headers.findIndex(function(h) { return h.indexOf("imagen") > -1 || h.indexOf("foto") > -1; });
  
  if (colProducto === -1) {
    throw new Error("No se encontró la columna 'Producto'.");
  }
  
  var productos = [];
  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    var nombre = colProducto > -1 ? String(rowData[colProducto]).trim() : "";
    
    // Ignorar filas vacías
    if (!nombre) continue;
    
    productos.push({
      rowIndex: i + 1, // +1 porque la fila 1 son encabezados
      producto: nombre,
      marca: colMarca > -1 ? rowData[colMarca] : "",
      cantidad: colCantidad > -1 ? rowData[colCantidad] : 0,
      imagenUrl: colImagen > -1 ? rowData[colImagen] : ""
    });
  }
  
  return {
    colImagenIndex: colImagen > -1 ? colImagen + 1 : -1,
    productos: productos
  };
}

// ─── GUARDAR IMAGEN EN LA HOJA ────────────────────────────────────────────────
function guardarFilaInventario(rowIndex, colImagenIndex, imageUrl) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getName() !== CONFIG.sourceSheetName) {
    throw new Error("No estás en la hoja de Inventario.");
  }
  
  if (colImagenIndex === -1) {
    throw new Error("No existe la columna 'Imagen' en la hoja. Por favor agrégala en la fila 1.");
  }
  
  sheet.getRange(rowIndex, colImagenIndex).setValue(imageUrl);
  
  // Como cambiamos la hoja, disparamos la sincronización silenciosa (si onEdit no lo hace)
  sincronizarInventario(true);
  
  return { success: true };
}
