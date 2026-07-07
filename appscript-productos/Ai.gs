/**
 * ═══════════════════════════════════════════════════════════════════
 *  LÓGICA DEL ASISTENTE IA (ALEX) - GEMINI
 * ═══════════════════════════════════════════════════════════════════
 */

function askAlex(messages, productName) {
  // Manejo defensivo: Si se ejecuta manualmente desde el editor de Apps Script
  if (!messages || !messages.length) {
    return { error: "Alex requiere mensajes para funcionar. Ejecuta esto desde la Web App." };
  }

  var geminiApiKey = CONFIG.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return { error: "La API Key de Gemini no está configurada en Config.gs." };
  }

  var serpApiKey = CONFIG.SERPAPI_API_KEY;
  var context = "";

  if (serpApiKey && productName && messages.length <= 3) {
     try {
       // Búsqueda de información e imágenes en una sola consulta web
       var query = productName + " producto belleza caracteristicas ingredientes beneficios";
       var searchUrl = "https://serpapi.com/search.json?q=" + encodeURIComponent(query) + "&api_key=" + serpApiKey + "&hl=es&gl=co";
       var res = UrlFetchApp.fetch(searchUrl, {muteHttpExceptions: true});
       var data = JSON.parse(res.getContentText());
       
       var snippets = [];
       if (data.organic_results) {
         data.organic_results.slice(0, 5).forEach(function(r) { 
           if (r.snippet) snippets.push("- " + r.snippet); 
         });
       }
       
       var imageUrls = [];
       if (data.inline_images) {
         data.inline_images.slice(0, 3).forEach(function(img) {
           if (img.link) imageUrls.push("- " + img.link);
           else if (img.original) imageUrls.push("- " + img.original);
         });
       }
       
       if (snippets.length > 0) {
         context = "\n\n[SISTEMA: Búsqueda web automática completada. Información encontrada:\n" + snippets.join("\n");
         if (imageUrls.length > 0) {
           context += "\n\nURLs de imágenes sugeridas para el producto (usa una de estas para el campo 'Imagen Principal'):\n" + imageUrls.join("\n");
         }
         context += "\n]";
       }
     } catch (e) {
       console.error("Error en SerpAPI: " + e.toString());
     }
  }

  // Inyectar el contexto web en el último mensaje del usuario
  var lastMessage = messages[messages.length - 1];
  if (context && lastMessage.role === "user") {
    lastMessage.content += context;
  }

  // --- Mapear Formato de Mensajes a Gemini ---
  var systemInstruction = "";
  var geminiContents = [];

  messages.forEach(function(msg) {
    if (msg.role === "system") {
      // Gemini maneja el system prompt de forma separada
      systemInstruction += msg.content + "\n";
    } else {
      // Convertir assistant a model, user a user
      var geminiRole = (msg.role === "assistant") ? "model" : "user";
      geminiContents.push({
        role: geminiRole,
        parts: [{ text: msg.content }]
      });
    }
  });

  // El modelo solicitado: gemini-flash-lite-latest
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + geminiApiKey;

  var payload = {
    contents: geminiContents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingLevel: "MINIMAL" } 
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    var json = JSON.parse(responseText);
    
    if (statusCode !== 200) {
      // Intentar fallback a gemini-1.5-flash si falla
      if (json.error && json.error.message && json.error.message.includes("model")) {
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
        response = UrlFetchApp.fetch(url, options);
        responseText = response.getContentText();
        json = JSON.parse(responseText);
      } else {
        return { error: "Error Gemini: " + (json.error?.message || responseText) };
      }
    }
    
    if (json.error) {
      return { error: json.error.message || "Error desconocido en Gemini." };
    }
    
    if (json.candidates && json.candidates.length > 0) {
      var outputText = json.candidates[0].content.parts[0].text;
      return {
        success: true,
        content: outputText
      };
    } else {
      return { error: "Respuesta vacía de Gemini." };
    }

  } catch (e) {
    return { error: "Error de ejecución con Gemini: " + e.toString() };
  }
}
