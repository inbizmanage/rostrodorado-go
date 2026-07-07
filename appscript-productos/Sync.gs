/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Lógica de Sincronización Automática
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── TRIGGER AUTOMÁTICO AL EDITAR ─────────────────────────────────────────────
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  
  if (sheet.getName() === CONFIG.sourceSheetName) {
    sincronizarInventario(true); 
  }
}

// ─── LÓGICA PRINCIPAL DE SINCRONIZACIÓN ───────────────────────────────────────
function sincronizarInventario(silencioso) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName(CONFIG.sourceSheetName);
  var dbSheet = ss.getSheetByName(CONFIG.dbSheetName);
  
  if (!dbSheet) {
    inicializarHoja();
    dbSheet = ss.getSheetByName(CONFIG.dbSheetName);
  }
  
  if (!sourceSheet) {
    if (!silencioso) SpreadsheetApp.getUi().alert('❌ Hoja principal "' + CONFIG.sourceSheetName + '" no encontrada.');
    return;
  }
  
  var sourceData = sourceSheet.getDataRange().getValues();
  var dbData = dbSheet.getDataRange().getValues();
  
  if (sourceData.length < 2) return;
  
  var srcHeaders = sourceData[0].map(function(h) { return String(h).trim().toLowerCase() });
  var colSrc = {
    producto: findHeader(srcHeaders, ["producto", "nombre"]),
    marca:    findHeader(srcHeaders, ["marca", "brand"]),
    cantidad: findHeader(srcHeaders, ["cantidad", "stock"]),
    costo:    findHeader(srcHeaders, ["costo", "precio costo + iva"]),
    venta:    findHeader(srcHeaders, ["venta", "precio de venta"])
  };
  
  if (colSrc.producto === -1) return;
  
  var dbMap = {}; 
  for (var r = 1; r < dbData.length; r++) {
    var nombreDB = String(dbData[r][1] || "").trim().toLowerCase();
    if (nombreDB) dbMap[nombreDB] = r; 
  }
  
  // Buscar índices en DB dinámicamente
  var dbHeaders = dbData[0].map(function(h) { return String(h).trim(); });
  var idxDB = {
    marca: dbHeaders.indexOf("Marca"),
    cantidad: dbHeaders.indexOf("CANTIDAD"),
    costo: dbHeaders.indexOf("Precio Costo + IVA"),
    venta: dbHeaders.indexOf("Precio De Venta"),
    base: dbHeaders.indexOf("Precio Base"),
    updateTime: dbHeaders.indexOf("Ultima Actualizacion"),
    peso: dbHeaders.indexOf("Peso (kg)"),
    ancho: dbHeaders.indexOf("Ancho (cm)"),
    alto: dbHeaders.indexOf("Alto (cm)"),
    largo: dbHeaders.indexOf("Largo (cm)")
  };
  
  // Validar si encontramos los básicos, sino asumimos el arreglo completo falló
  if (idxDB.cantidad === -1 || idxDB.updateTime === -1) {
    if (!silencioso) SpreadsheetApp.getUi().alert('❌ Faltan columnas clave en "Productos DB". Por favor recrea la hoja.');
    return;
  }
  
  var productosProcesados = {};
  var creados = 0, actualizados = 0, agotados = 0;
  var huboCambios = false;
  var newDataToAppend = [];
  
  for (var i = 1; i < sourceData.length; i++) {
    var row = sourceData[i];
    var rawNombre = String(row[colSrc.producto] || "").trim();
    if (!rawNombre) continue;
    
    var nombreKey = rawNombre.toLowerCase();
    var cant = colSrc.cantidad >= 0 ? Number(row[colSrc.cantidad] || 0) : 0;
    var csto = colSrc.costo >= 0    ? Number(row[colSrc.costo] || 0) : 0;
    var vnta = colSrc.venta >= 0    ? Number(row[colSrc.venta] || 0) : 0;
    var mrca = colSrc.marca >= 0    ? String(row[colSrc.marca] || "").trim() : "";
    
    productosProcesados[nombreKey] = true;
    
    if (dbMap[nombreKey] !== undefined) {
      var dbRow = dbData[dbMap[nombreKey]];
      if (dbRow[idxDB.cantidad] !== cant || dbRow[idxDB.costo] !== csto || dbRow[idxDB.venta] !== vnta || (idxDB.marca > -1 && dbRow[idxDB.marca] !== mrca)) {
        if (idxDB.marca > -1) dbRow[idxDB.marca] = mrca;  
        dbRow[idxDB.cantidad] = cant;  
        dbRow[idxDB.costo] = csto;  
        dbRow[idxDB.venta] = vnta;  
        if (idxDB.base > -1) dbRow[idxDB.base] = vnta;  
        dbRow[idxDB.updateTime] = new Date().toLocaleString(); 
        huboCambios = true;
        actualizados++;
      }
    } else {
      var newRow = new Array(CONFIG.columns.length).fill("");
      newRow[0] = Utilities.getUuid(); 
      newRow[1] = rawNombre;           
      newRow[CONFIG.columns.indexOf("Marca")] = mrca;                
      newRow[CONFIG.columns.indexOf("CANTIDAD")] = cant;                
      newRow[CONFIG.columns.indexOf("Precio Costo + IVA")] = csto;                
      newRow[CONFIG.columns.indexOf("Precio De Venta")] = vnta;                
      newRow[CONFIG.columns.indexOf("Precio Base")] = vnta;                
      newRow[CONFIG.columns.indexOf("Peso (kg)")] = 1;                  
      newRow[CONFIG.columns.indexOf("Ancho (cm)")] = 10;                 
      newRow[CONFIG.columns.indexOf("Alto (cm)")] = 10;                 
      newRow[CONFIG.columns.indexOf("Largo (cm)")] = 10;                 
      newRow[CONFIG.columns.indexOf("Ultima Actualizacion")] = new Date().toLocaleString();
      
      newDataToAppend.push(newRow);
      creados++;
      huboCambios = true;
    }
  }
  
  for (var key in dbMap) {
    if (!productosProcesados[key]) {
      var dbRow = dbData[dbMap[key]];
      if (dbRow[idxDB.cantidad] !== 0) {
        dbRow[idxDB.cantidad] = 0; 
        dbRow[idxDB.updateTime] = new Date().toLocaleString();
        huboCambios = true;
        agotados++;
      }
    }
  }
  
  if (huboCambios) {
    dbSheet.getRange(1, 1, dbData.length, dbData[0].length).setValues(dbData);
    if (newDataToAppend.length > 0) {
      dbSheet.getRange(dbData.length + 1, 1, newDataToAppend.length, newDataToAppend[0].length).setValues(newDataToAppend);
    }
  }
  
  if (!silencioso) {
    SpreadsheetApp.getUi().alert(
      huboCambios ? 
      "✅ Sincronización exitosa:\n\n• Nuevos: " + creados + "\n• Actualizados: " + actualizados + "\n• Agotados: " + agotados
      : "ℹ️ No había cambios nuevos que sincronizar."
    );
  }
  
  return { success: true, stats: { creados: creados, actualizados: actualizados, agotados: agotados } };
}

function findHeader(headers, keywords) {
  for (var i = 0; i < headers.length; i++) {
    for (var k = 0; k < keywords.length; k++) {
      if (headers[i].indexOf(keywords[k]) !== -1) return i;
    }
  }
  return -1;
}
