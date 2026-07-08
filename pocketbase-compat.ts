import PocketBase from 'pocketbase';

// Initialize the Pocketbase client pointing to the same host that served the frontend
export const pb = new PocketBase(window.location.origin);

// --- APP MOCK ---
export function initializeApp() {
  return {};
}

// --- AUTH MOCK ---
class AuthMock {
  get currentUser() {
    const model = pb.authStore.model;
    if (!model) return null;
    return {
      uid: model.id,
      email: model.email,
      displayName: model.displayName || '',
      reload: async () => {
        // Refresh auth state in pocketbase
        try {
          await pb.collection('users').authRefresh();
        } catch (e) {
          console.warn("Auth refresh failed:", e);
        }
      },
    };
  }
}

export const auth = new AuthMock();

export function getAuth() {
  return auth;
}

export class GoogleAuthProvider {
  providerId = 'google.com';
}

export async function signInWithCustomToken(authObj: any, token: string) {
  // Decode JWT payload to extract user record details
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const user = payload.model;
    pb.authStore.save(token, user);
  } catch (e) {
    throw new Error("Failed to authenticate custom token: " + e);
  }
}

export async function signInWithEmailAndPassword(authObj: any, email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return {
      user: {
        uid: authData.record.id,
        email: authData.record.email,
        displayName: authData.record.displayName || '',
        reload: async () => {},
      }
    };
  } catch (e: any) {
    throw new Error(e.message || "Failed to sign in with password");
  }
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, password: string) {
  try {
    const record = await pb.collection('users').create({
      email: email,
      password: password,
      passwordConfirm: password,
      emailVisibility: true,
    });
    // Autologin after registration
    const authData = await pb.collection('users').authWithPassword(email, password);
    return {
      user: {
        uid: record.id,
        email: record.email,
        displayName: record.displayName || '',
        reload: async () => {},
      }
    };
  } catch (e: any) {
    throw new Error(e.message || "Failed to register user");
  }
}

export async function signInWithPopup(authObj: any, providerObj: any) {
  try {
    const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
    return {
      user: {
        uid: authData.record.id,
        email: authData.record.email,
        displayName: authData.record.displayName || '',
        reload: async () => {},
      }
    };
  } catch (e: any) {
    throw new Error(e.message || "Google OAuth2 sign-in failed");
  }
}

export async function signOut(authObj: any) {
  pb.authStore.clear();
}

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  // Trigger callback with initial state
  callback(auth.currentUser);
  
  // Register change listener in Pocketbase auth store
  const unsubscribe = pb.authStore.onChange((token, model) => {
    callback(auth.currentUser);
  });
  
  return unsubscribe;
}

export async function updateProfile(user: any, data: { displayName?: string }) {
  if (!pb.authStore.model) return;
  try {
    const record = await pb.collection('users').update(pb.authStore.model.id, {
      displayName: data.displayName
    });
    // Save updated record to authStore
    pb.authStore.save(pb.authStore.token, record);
  } catch (e: any) {
    throw new Error(e.message || "Failed to update profile");
  }
}

export function isSignInWithEmailLink(authObj: any, href: string) {
  return false; // Not used in OTP verify page anymore
}

export async function signInWithEmailLink(authObj: any, email: string, href: string) {
  throw new Error("signInWithEmailLink not supported; use OTP verification instead.");
}


// --- FIRESTORE MOCK ---
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
    const record = await pb.collection(docRef.collection).getOne(docRef.id);
    return {
      exists: () => true,
      data: () => ({ ...record, uid: record.id }),
      id: record.id,
    };
  } catch (e) {
    return {
      exists: () => false,
      data: () => null,
      id: docRef.id,
    };
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanFirebaseData(data);
  try {
    // If the doc exists, we update it
    await pb.collection(docRef.collection).getOne(docRef.id);
    await pb.collection(docRef.collection).update(docRef.id, cleaned);
  } catch (e) {
    // If not exists, we create it using the specific ID
    await pb.collection(docRef.collection).create({
      id: docRef.id,
      ...cleaned,
    });
  }
}

export async function addDoc(collectionRef: any, data: any) {
  const cleaned = cleanFirebaseData(data);
  const record = await pb.collection(collectionRef.name).create(cleaned);
  return {
    id: record.id,
    data: () => record,
  };
}

export async function updateDoc(docRef: any, data: any) {
  const cleaned = cleanFirebaseData(data);
  await pb.collection(docRef.collection).update(docRef.id, cleaned);
}

export async function deleteDoc(docRef: any) {
  await pb.collection(docRef.collection).delete(docRef.id);
}

export function query(collectionRef: any, ...clauses: any[]) {
  return {
    type: 'query',
    collection: collectionRef.name,
    clauses,
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
  
  let filter = '';
  let limitVal = 1000;
  let sort = '';

  if (ref.type === 'query') {
    const filters: string[] = [];
    for (const clause of ref.clauses) {
      if (clause.type === 'where') {
        let op = clause.op;
        if (op === '==') op = '=';
        
        let val = clause.val;
        if (typeof val === 'string') {
          val = `"${val}"`;
        }
        filters.push(`${clause.field} ${op} ${val}`);
      } else if (clause.type === 'limit') {
        limitVal = clause.value;
      } else if (clause.type === 'orderBy') {
        const prefix = clause.direction === 'desc' ? '-' : '';
        sort = `${prefix}${clause.field}`;
      }
    }
    if (filters.length > 0) {
      filter = filters.join(' && ');
    }
  }

  const options: any = {};
  if (filter) options.filter = filter;
  if (sort) options.sort = sort;

  try {
    const resultList = await pb.collection(collectionName).getList(1, limitVal, options);
    return {
      empty: resultList.items.length === 0,
      docs: resultList.items.map(item => ({
        id: item.id,
        data: () => ({ ...item, uid: item.id }),
      })),
    };
  } catch (e) {
    // Return empty snap if search fails or table doesn't exist
    return {
      empty: true,
      docs: [],
    };
  }
}

export function onSnapshot(ref: any, next: (snapshot: any) => void) {
  const collectionName = ref.type === 'query' ? ref.collection : ref.name;
  
  // Trigger initial list fetch
  getDocs(ref).then(next).catch(console.error);

  // Subscribe to changes in real-time
  pb.collection(collectionName).subscribe('*', async (e) => {
    try {
      const snapshot = await getDocs(ref);
      next(snapshot);
    } catch (err) {
      console.error("onSnapshot update error:", err);
    }
  });

  // Return unsubscribe handler
  return () => {
    pb.collection(collectionName).unsubscribe();
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

// Clean helper
function cleanFirebaseData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (data.__type === 'increment') return data.value;
  if (data instanceof Timestamp) return data.toDate().toISOString();

  const cleaned: any = Array.isArray(data) ? [] : {};
  for (const key in data) {
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


// --- FUNCTIONS MOCK ---
export function getFunctions() {
  return {};
}

export function httpsCallable(functionsInstance: any, name: string) {
  return async (data: any) => {
    // Route calculating and tracking functions directly to our Go REST endpoints
    const response = await fetch(`/api/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }
    
    const resData = await response.json();
    return resData;
  };
}


// --- STORAGE MOCK ---
export function getStorage() {
  return {};
}

export function ref(storageInstance: any, path: string) {
  return { type: 'storage-ref', path };
}

export function uploadBytesResumable(storageRef: any, file: File) {
  let progressCallback: ((snapshot: any) => void) | null = null;
  let errorCallback: ((error: any) => void) | null = null;
  let successCallback: (() => void) | null = null;

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
      
      // Start upload execution immediately after subscribing
      executeUpload();
    }
  };

  function executeUpload() {
    const xhr = new XMLHttpRequest();
    // Post to Pocketbase general upload collection 'media'
    xhr.open('POST', `${window.location.origin}/api/collections/media/records`);
    
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        snapshot.bytesTransferred = e.loaded;
        snapshot.totalBytes = e.total;
        if (progressCallback) progressCallback(snapshot);
      }
    };

    xhr.onerror = (e) => {
      if (errorCallback) errorCallback(e);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const record = JSON.parse(xhr.responseText);
        // Construct standard Pocketbase file public URL
        const fileUrl = `${window.location.origin}/api/files/media/${record.id}/${record.file}`;
        snapshot.ref.downloadURL = fileUrl;
        if (progressCallback) {
          snapshot.bytesTransferred = file.size;
          progressCallback(snapshot);
        }
        if (successCallback) successCallback();
      } else {
        if (errorCallback) errorCallback(new Error(`Upload failed: status ${xhr.status}`));
      }
    };

    xhr.send(formData);
  }

  return uploadTask;
}

export async function getDownloadURL(refObj: any) {
  return refObj.downloadURL || '';
}
