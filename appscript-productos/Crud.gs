/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Funciones CRUD para la Web App
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── INICIALIZAR HOJA DE CÁLCULO (DB) ─────────────────────────────────────────
function inicializarHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.dbSheetName);
  
  if (!sheet) sheet = ss.insertSheet(CONFIG.dbSheetName);
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CONFIG.columns.length)
         .setValues([CONFIG.columns])
         .setBackground("#111111")
         .setFontColor("#C6A87C")
         .setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, CONFIG.columns.length);
  }
}

// ─── OBTENER Y GUARDAR (WEB APP) ──────────────────────────────────────────────
function obtenerProductos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.dbSheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var productos = [];
  
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      // Convertir Fechas a String para evitar que google.script.run falle y devuelva null
      if (val instanceof Date) {
        val = val.toLocaleString();
      }
      obj[headers[j]] = val;
    }
    productos.push(obj);
  }
  return productos.reverse();
}

function guardarProducto(producto) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.dbSheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  if (!producto.ID) producto.ID = Utilities.getUuid();
  producto["Ultima Actualizacion"] = new Date().toLocaleString();
  
  var rowData = [];
  for (var i = 0; i < headers.length; i++) {
    rowData.push(producto[headers[i]] !== undefined ? producto[headers[i]] : "");
  }
  
  var rowIndex = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === producto.ID) { rowIndex = r + 1; break; }
  }
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { success: true, action: "updated", product: producto };
  } else {
    sheet.appendRow(rowData);
    return { success: true, action: "created", product: producto };
  }
}

function eliminarProducto(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.dbSheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  throw new Error("Producto no encontrado");
}
