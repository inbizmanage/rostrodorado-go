// ─── CONFIGURACIÓN DE CONEXIÓN A TURSO ────────────────────────────────────────
const TURSO_URL = "https://rostrodorado-db-rostrodoradoclinic.aws-us-east-1.turso.io/v2/pipeline";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJkYWI3ZDNhOC0yNmEzLTRiMmUtOTk0MS05MWQzNjhmY2I2NjkiLCJpYXQiOjE3ODM4Mjg4ODEsImtpZCI6ImxkMW5CQUp6blVuM3Vpc0ViWFZKTWtybHIybWEtakExZkkwVjFBWWZUSWsiLCJyaWQiOiI5MWUzNTk3YS0zY2QxLTQ1Y2QtOWRmZS0xNjM3YjQ3YTIwZjkifQ.__tFme0WATv1iGb0gpZ1wvzscS_YW2kJnAIW3D6rULfcC2SMc8VoqUA_woyLfWUIJ4DFpBeJMmPlM6kQo8PUAg";

// Helper de escape básico para SQL en SQLite
function escapeString(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Limpiador recursivo de datos para compatibilidad de tipos con Firebase
// También elimina campos sintéticos que se inyectan al leer (uid) pero no existen como columnas en Turso
const SYNTHETIC_FIELDS = new Set(['uid']);

function cleanFirebaseData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (data.__type === 'increment') return data.value;
  if (data instanceof Timestamp) return data.toDate().toISOString();

  const cleaned: any = Array.isArray(data) ? [] : {};
  for (const key in data) {
    if (SYNTHETIC_FIELDS.has(key)) continue; // ← omitir campos sintéticos
    const val = data[key];
    if (val && typeof val === 'object' && val.__type === 'increment') {
      cleaned[key] = val.value;
    } else if (val instanceof Timestamp) {
      cleaned[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object') {
      cleaned[key] = cleanFirebaseData(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}


// Envía peticiones SQL por HTTP a la base de datos de Turso
async function runTursoQuery(sql: string) {
  const payload = {
    requests: [
      {
        type: "execute",
        stmt: { sql: sql }
      }
    ]
  };

  const response = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Error en la consulta de Turso: ${response.statusText}`);
  }

  const result = await response.json();
  const executionResult = result.results[0];
  if (executionResult.type === "error") {
    throw new Error(`Error de SQL de Turso: ${executionResult.error.message}`);
  }

  const responseData = executionResult.response.result;
  const cols = responseData.cols.map((c: any) => c.name);
  const rows = responseData.rows.map((r: any) => {
    const rowObj: any = {};
    r.forEach((val: any, i: number) => {
      let decodedVal = val.value;
      if (val.type === "integer") {
        decodedVal = parseInt(val.value, 10);
      } else if (val.type === "float") {
        decodedVal = parseFloat(val.value);
      } else if (val.type === "null") {
        decodedVal = null;
      }
      
      // Parsear automáticamente cadenas serializadas como JSON (ej. message logs, productos, etc)
      if (typeof decodedVal === 'string' && (decodedVal.startsWith('[') || decodedVal.startsWith('{'))) {
        try {
          decodedVal = JSON.parse(decodedVal);
        } catch (e) {
          // Mantener como string si falla
        }
      }
      rowObj[cols[i]] = decodedVal;
    });
    return rowObj;
  });

  return { cols, rows };
}

// ─── MOCKS CORE / INITIALIZATION ─────────────────────────────────────────────
export function initializeApp() {
  return {};
}

// ─── AUTH MOCK DIRECTO A TURSO ────────────────────────────────────────────────
class AuthMock {
  get currentUser() {
    const cached = localStorage.getItem('turso_auth_user');
    if (!cached) return null;
    try {
      const user = JSON.parse(cached);
      return {
        uid: user.id,
        email: user.email,
        displayName: user.displayName || '',
        reload: async () => {}
      };
    } catch (e) {
      return null;
    }
  }
}

export const auth = new AuthMock();

export function getAuth() {
  return auth;
}

export class GoogleAuthProvider {
  providerId = 'google.com';
}

export async function signInWithEmailAndPassword(authObj: any, email: string, password: string) {
  const querySql = `SELECT * FROM users WHERE LOWER(email) = LOWER(${escapeString(email)})`;
  const { rows } = await runTursoQuery(querySql);
  
  if (rows.length === 0) {
    throw new Error("Usuario no registrado en la base de datos.");
  }
  
  const user = rows[0];
  const cleanUserPass = String(user.password || '').replace(/\s+/g, '');
  const cleanInputPass = String(password || '').replace(/\s+/g, '');
  if (cleanUserPass !== cleanInputPass) {
    throw new Error("Contraseña incorrecta.");
  }
  
  localStorage.setItem('turso_auth_user', JSON.stringify(user));
  triggerAuthChange();
  
  return {
    user: {
      uid: user.id,
      email: user.email,
      displayName: user.displayName || '',
      reload: async () => {}
    }
  };
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, password: string) {
  const id = 'user_' + Math.random().toString(36).substr(2, 9);
  const displayName = email.split('@')[0];
  const querySql = `INSERT INTO users (id, email, password, displayName, role) VALUES (
    ${escapeString(id)}, 
    ${escapeString(email)}, 
    ${escapeString(password)}, 
    ${escapeString(displayName)}, 
    'customer'
  )`;
  
  await runTursoQuery(querySql);
  
  const newUser = { id, email, displayName, role: 'customer' };
  localStorage.setItem('turso_auth_user', JSON.stringify(newUser));
  triggerAuthChange();
  
  return {
    user: {
      uid: id,
      email: email,
      displayName: displayName,
      reload: async () => {}
    }
  };
}

export async function signInWithPopup(authObj: any, providerObj: any) {
  // OAuth2 mock utilizando una cuenta demo rápida en local
  const id = 'google_user_demo';
  const email = 'demo.google@gmail.com';
  const displayName = 'Google Demo User';
  
  // Registrar si no existe
  const checkSql = `SELECT id FROM users WHERE id = '${id}'`;
  const { rows } = await runTursoQuery(checkSql);
  if (rows.length === 0) {
    const querySql = `INSERT INTO users (id, email, displayName, role) VALUES ('${id}', '${email}', '${displayName}', 'customer')`;
    await runTursoQuery(querySql);
  }
  
  const user = { id, email, displayName, role: 'customer' };
  localStorage.setItem('turso_auth_user', JSON.stringify(user));
  triggerAuthChange();
  
  return {
    user: {
      uid: id,
      email: email,
      displayName: displayName,
      reload: async () => {}
    }
  };
}

export async function signOut(authObj: any) {
  localStorage.removeItem('turso_auth_user');
  triggerAuthChange();
}

const authListeners: ((user: any) => void)[] = [];

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  authListeners.push(callback);
  callback(auth.currentUser);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

function triggerAuthChange() {
  const user = auth.currentUser;
  authListeners.forEach(cb => cb(user));
}

export async function updateProfile(user: any, data: { displayName?: string }) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const querySql = `UPDATE users SET displayName = ${escapeString(data.displayName)} WHERE id = ${escapeString(currentUser.uid)}`;
  await runTursoQuery(querySql);
  
  const cached = localStorage.getItem('turso_auth_user');
  if (cached) {
    const parsed = JSON.parse(cached);
    parsed.displayName = data.displayName;
    localStorage.setItem('turso_auth_user', JSON.stringify(parsed));
  }
  triggerAuthChange();
}

export function isSignInWithEmailLink(authObj: any, href: string) {
  return false;
}

export async function signInWithEmailLink(authObj: any, email: string, href: string) {
  throw new Error("Suscripción por correo no soportada en este entorno.");
}

// ─── FIRESTORE MOCK DIRECTO A TURSO ──────────────────────────────────────────
export function getFirestore() {
  return {};
}

export function collection(db: any, collectionName: string) {
  return { type: 'collection', name: collectionName };
}

export function doc(parent: any, ...paths: string[]) {
  if (parent.type === 'collection') {
    return { type: 'doc', collection: parent.name, id: paths[0] };
  }
  if (paths.length === 2) {
    return { type: 'doc', collection: paths[0], id: paths[1] };
  }
  const parts = paths[0].split('/');
  return { type: 'doc', collection: parts[0], id: parts[1] };
}

export async function getDoc(docRef: any) {
  try {
    const querySql = `SELECT * FROM ${docRef.collection} WHERE id = ${escapeString(docRef.id)}`;
    const { rows } = await runTursoQuery(querySql);
    if (rows.length === 0) {
      return {
        exists: () => false,
        data: () => null,
        id: docRef.id
      };
    }
    return {
      exists: () => true,
      data: () => wrapTimestamps({ ...rows[0], uid: rows[0].id }),
      id: docRef.id
    };
  } catch (e) {
    return {
      exists: () => false,
      data: () => null,
      id: docRef.id
    };
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanFirebaseData(data);
  const fields = Object.keys(cleaned);
  
  const checkSql = `SELECT id FROM ${docRef.collection} WHERE id = ${escapeString(docRef.id)}`;
  const { rows } = await runTursoQuery(checkSql);
  
  if (rows.length > 0) {
    // UPDATE
    const setClauses = fields.map(field => {
      let val = cleaned[field];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      return `${field} = ${escapeString(val)}`;
    }).join(', ');
    const querySql = `UPDATE ${docRef.collection} SET ${setClauses} WHERE id = ${escapeString(docRef.id)}`;
    await runTursoQuery(querySql);
  } else {
    // INSERT
    const allFields = ['id', ...fields];
    const allValues = [
      escapeString(docRef.id), 
      ...fields.map(field => {
        let val = cleaned[field];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        return escapeString(val);
      })
    ];
    const querySql = `INSERT INTO ${docRef.collection} (${allFields.join(', ')}) VALUES (${allValues.join(', ')})`;
    await runTursoQuery(querySql);
  }
}

export async function addDoc(collectionRef: any, data: any) {
  const id = 'doc_' + Math.random().toString(36).substr(2, 9);
  const docRef = { type: 'doc', collection: collectionRef.name, id };
  await setDoc(docRef, data);
  return {
    id: id,
    data: () => ({ id, ...data })
  };
}

export async function updateDoc(docRef: any, data: any) {
  await setDoc(docRef, data);
}

export async function deleteDoc(docRef: any) {
  const querySql = `DELETE FROM ${docRef.collection} WHERE id = ${escapeString(docRef.id)}`;
  await runTursoQuery(querySql);
}

export function query(collectionRef: any, ...clauses: any[]) {
  return {
    type: 'query',
    collection: collectionRef.name,
    clauses
  };
}

export function where(field: string, op: string, val: any) {
  return { type: 'where', field, op, val };
}

export function limit(n: number) {
  return { type: 'limit', value: n };
}

export function orderBy(field: string, direction: string = 'asc') {
  return { type: 'orderBy', field, direction };
}

export async function getDocs(ref: any) {
  const collectionName = ref.type === 'query' ? ref.collection : ref.name;
  
  let sql = `SELECT * FROM ${collectionName}`;
  
  if (ref.type === 'query') {
    const wheres: string[] = [];
    let limitVal: number | null = null;
    let orderClause = '';
    
    ref.clauses.forEach((clause: any) => {
      if (clause.type === 'where') {
        let op = clause.op;
        if (op === '==') op = '=';
        
        let val = clause.val;
        wheres.push(`${clause.field} ${op} ${escapeString(val)}`);
      } else if (clause.type === 'limit') {
        limitVal = clause.value;
      } else if (clause.type === 'orderBy') {
        orderClause = ` ORDER BY ${clause.field} ${clause.direction.toUpperCase()}`;
      }
    });
    
    if (wheres.length > 0) {
      sql += ` WHERE ${wheres.join(' AND ')}`;
    }
    
    sql += orderClause;
    
    if (limitVal !== null) {
      sql += ` LIMIT ${limitVal}`;
    }
  }
  
  try {
    const { rows } = await runTursoQuery(sql);
    return {
      empty: rows.length === 0,
      docs: rows.map(row => ({
        id: row.id,
        data: () => wrapTimestamps({ ...row, uid: row.id })
      }))
    };
  } catch (e) {
    return {
      empty: true,
      docs: []
    };
  }
}

export function onSnapshot(ref: any, next: (snapshot: any) => void) {
  // Carga inicial
  getDocs(ref).then(next).catch(console.error);
  
  // Consultas periódicas en segundo plano cada 5 segundos para simular tiempo real
  const intervalId = setInterval(() => {
    getDocs(ref).then(next).catch(console.error);
  }, 5000);
  
  return () => {
    clearInterval(intervalId);
  };
}

export function writeBatch() {
  const operations: (() => Promise<void>)[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push(() => setDoc(docRef, data));
    },
    update: (docRef: any, data: any) => {
      operations.push(() => updateDoc(docRef, data));
    },
    delete: (docRef: any) => {
      operations.push(() => deleteDoc(docRef));
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    }
  };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function increment(n: number) {
  return { __type: 'increment', value: n };
}

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
  static fromDate(date: Date) {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }
}

function wrapTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const wrapped: any = Array.isArray(data) ? [] : {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        wrapped[key] = Timestamp.fromDate(new Date(val));
      } else if (val && typeof val === 'object') {
        wrapped[key] = wrapTimestamps(val);
      } else {
        wrapped[key] = val;
      }
    }
  }
  return wrapped;
}

// ─── FUNCTIONS MOCK ──────────────────────────────────────────────────────────
export function getFunctions() {
  return {};
}

export function httpsCallable(functionsInstance: any, name: string) {
  return async (data: any) => {
    console.log(`[Cloud Function Mock] Ejecutando: ${name}`, data);
    
    // Simular respuestas de funciones de envío y pasarela de pago para pruebas
    if (name === "calculateShipping" || name === "getShippingQuotes") {
      return {
        success: true,
        quotes: [
          { carrier: "Coordinadora", cost: 15500, time: "2-3 días hábiles" },
          { carrier: "Interrapidisimo", cost: 17200, time: "1-2 días hábiles" }
        ],
        shippingCost: 15500
      };
    }
    
    if (name === "createWompiTransaction") {
      return {
        success: true,
        transactionId: "wmp_tx_" + Math.random().toString(36).substr(2, 9),
        redirectUrl: "https://sandbox.wompi.co/v1/payment"
      };
    }

    if (name === "generateBarcode") {
      return {
        success: true,
        barcodeUrl: "https://bwipjs-api.metafloor.com/?bcid=code128&text=RD-TEST-ORDER"
      };
    }
    
    // Por defecto, intentar fetch de fallbacks del servidor
    try {
      const response = await fetch(`/api/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Ignorar fallo y devolver mock genérico
    }
    
    return { success: true, message: "Operación simulada con éxito." };
  };
}

// ─── STORAGE MOCK (IMÁGENES EN BASE64 GUARDADAS EN SQL) ──────────────────────
export function getStorage() {
  return {};
}

export function ref(storageInstance: any, path: string) {
  return { type: 'storage-ref', path };
}

export function uploadBytesResumable(storageRef: any, file: File) {
  let progressCallback: ((snapshot: any) => void) | null = null;
  let successCallback: (() => void) | null = null;
  let errorCallback: ((error: any) => void) | null = null;

  const snapshot = {
    bytesTransferred: 0,
    totalBytes: file.size,
    ref: { path: storageRef.path, downloadURL: '' }
  };

  const uploadTask = {
    snapshot,
    on: (
      event: string,
      progressFn: (snapshot: any) => void,
      errorFn: (error: any) => void,
      successFn: () => void
    ) => {
      progressCallback = progressFn;
      errorCallback = errorFn;
      successCallback = successFn;
      executeUpload();
    }
  };

  function convertToWebP(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_DIM = 1920;
        let { width, height } = img;

        // Reescalar si supera 1920px en cualquier dimensión
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIM);
            width = MAX_DIM;
          } else {
            width = Math.round((width / height) * MAX_DIM);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }

        // Fondo blanco para imágenes con transparencia (PNG, etc.)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Primer intento: calidad alta 0.82
        let webpData = canvas.toDataURL('image/webp', 0.82);

        // Si aún pesa más de 400 KB, recomprimir con calidad 0.65
        const approxKB = Math.round((webpData.length * 3) / 4 / 1024);
        if (approxKB > 400) {
          webpData = canvas.toDataURL('image/webp', 0.65);
        }

        // Si el navegador no soporta WebP, caer de vuelta al original
        if (webpData.startsWith('data:image/webp')) {
          resolve(webpData);
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
  }

  function executeUpload() {
    const reader = new FileReader();
    reader.onerror = (e) => {
      if (errorCallback) errorCallback(e);
    };
    reader.onload = async () => {
      try {
        const originalData = reader.result as string;

        // Convertir a WebP comprimido antes de guardar
        const base64Data = await convertToWebP(originalData);

        const mediaId = 'media_' + Math.random().toString(36).substr(2, 9);
        const querySql = `INSERT INTO media (id, file) VALUES (${escapeString(mediaId)}, ${escapeString(base64Data)})`;
        await runTursoQuery(querySql);

        snapshot.ref.downloadURL = base64Data;
        snapshot.bytesTransferred = file.size;

        if (progressCallback) progressCallback(snapshot);
        if (successCallback) successCallback();
      } catch (err) {
        if (errorCallback) errorCallback(err);
      }
    };
    reader.readAsDataURL(file);
  }

  return uploadTask;
}

export async function getDownloadURL(refObj: any) {
  return refObj.downloadURL || '';
}

export async function signInWithCustomToken(authObj: any, token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const user = payload.model || payload;
    localStorage.setItem('turso_auth_user', JSON.stringify(user));
    triggerAuthChange();
  } catch (e) {
    throw new Error("Failed to authenticate custom token: " + e);
  }
}
