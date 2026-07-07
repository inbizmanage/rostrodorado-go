/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Main Entry (Rutas y Menú)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── SERVIR LA APLICACIÓN WEB ─────────────────────────────────────────────────
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
      .setTitle('Rostro Dorado - Gestor de Productos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── FUNCIÓN PARA INYECTAR OTROS HTML (CSS/JS modulares) ──────────────────────
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── MENÚ PERSONALIZADO EN EXCEL ──────────────────────────────────────────────
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌟 Rostro Dorado')
    .addItem('Recrear Base de Datos (Productos DB)', 'recrearBaseDeDatos')
    .addItem('Sincronizar Todo Ahora', 'forzarSincronizacion')
    .addSeparator()
    .addItem("Subir Imagen a Inventario", "abrirPopupInventario")
    .addSeparator()
    .addItem("💻 Abrir Gestor Web", "mostrarUrlWebApp")
    .addToUi();
}

function recrearBaseDeDatos() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.alert('Atención', '¿Estás seguro que quieres eliminar y recrear la hoja Productos DB? Se sincronizará todo de nuevo.', ui.ButtonSet.YES_NO);
  
  if (res === ui.Button.YES) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.dbSheetName);
    
    // Si existe, la eliminamos
    if (sheet) {
      ss.deleteSheet(sheet);
    }
    
    // Sincronizar de cero (esto creará la hoja de nuevo automáticamente)
    sincronizarInventario(false);
    ui.alert('✅ ¡Listo! La hoja Productos DB ha sido recreada y sincronizada con las nuevas columnas.');
  }
}

function forzarSincronizacion() {
  sincronizarInventario(false);
  SpreadsheetApp.getUi().alert('✅ Sincronización forzada completada.');
}

function mostrarUrlWebApp() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput('<p>Haz clic en el enlace para abrir el Gestor de Productos:</p><a href="' + url + '" target="_blank" style="font-size:16px; color:#C6A87C; font-weight:bold;">Abrir Web App</a>')
    .setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Acceso a la Web App');
}
