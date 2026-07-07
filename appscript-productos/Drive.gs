/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Integración con Google Drive (Imágenes)
 * ═══════════════════════════════════════════════════════════════════
 */

function subirImagenDrive(base64Data, mimeType, fileName) {
  try {
    // 1. Buscar o crear carpeta principal "rostrodorado.com"
    var rootFolder;
    var rootFolders = DriveApp.getFoldersByName("rostrodorado.com");
    if (rootFolders.hasNext()) {
      rootFolder = rootFolders.next();
    } else {
      rootFolder = DriveApp.createFolder("rostrodorado.com");
    }
    
    // 2. Buscar o crear subcarpeta "productos"
    var productosFolder;
    var subFolders = rootFolder.getFoldersByName("productos");
    if (subFolders.hasNext()) {
      productosFolder = subFolders.next();
    } else {
      productosFolder = rootFolder.createFolder("productos");
    }
    
    // 3. Decodificar el archivo base64
    // Limpiamos el data:image/png;base64, si lo tiene
    var cleanBase64 = base64Data;
    if (base64Data.indexOf("base64,") !== -1) {
      cleanBase64 = base64Data.split("base64,")[1];
    }
    
    var blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, fileName);
    
    // 4. Crear el archivo en la carpeta
    var file = productosFolder.createFile(blob);
    
    // 5. Asignar permisos públicos de lectura (Cualquiera con el enlace)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // 6. Retornar URL directa
    var fileId = file.getId();
    var downloadUrl = "https://drive.google.com/uc?id=" + fileId;
    
    return { success: true, url: downloadUrl };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
