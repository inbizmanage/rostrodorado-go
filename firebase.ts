import { 
  initializeApp, 
  getAuth, 
  GoogleAuthProvider, 
  getFirestore, 
  getStorage, 
  getFunctions 
} from "./pocketbase-compat";

const app = initializeApp();
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore();
export const storage = getStorage();
export const functions = getFunctions();

export * from "./pocketbase-compat";
export { app };
