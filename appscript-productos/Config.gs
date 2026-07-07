/**
 * ═══════════════════════════════════════════════════════════════════
 *  ROSTRO DORADO — Archivo de Configuración Global
 * ═══════════════════════════════════════════════════════════════════
 */

const CONFIG = {
  // ─── CONFIGURACIÓN DE GOOGLE SHEETS ───
  dbSheetName: "Productos DB",
  sourceSheetName: "Inventario",
  
  // ─── CONFIGURACIÓN DE GOOGLE DRIVE ───
  // ID de la carpeta raíz de imágenes (Si está vacío, buscará/creará por nombre)
  driveFolderId: "", 
  driveFolderName: "rostrodorado.com",
  subFolderName: "productos",

  // ─── CONFIGURACIÓN DE IA (ALEX) ───
  GEMINI_API_KEY: "AIzaSyD9PoyPsJZUFPc6yfnWw5dTHhbe3sGxy84",
  SERPAPI_API_KEY: "ce84ff78451594bf64ab3b5c252189ce00dce37c823752284e95c7c9115252b1",
  
  columns: [
    "ID",                 
    "PRODUCTO",           
    "Marca",              
    "Categoria Principal",
    "Subcategoria",       
    "Detalle Categoria",  
    "CANTIDAD",           
    "Precio Costo + IVA", 
    "Precio De Venta",    
    "Precio Base",        
    "Descripcion Corta",  
    "Descripcion Larga",  
    "Ingredientes",       
    "Modo Uso",           
    "Beneficios",         
    "Peso (kg)",          
    "Ancho (cm)",         
    "Alto (cm)",          
    "Largo (cm)",         
    "Imagen Principal",   
    "Galeria (URLs)",     
    "Ultima Actualizacion"
  ]
};
