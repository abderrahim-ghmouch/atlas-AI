import { db, isFirebaseConfigured } from "./firebase";
import fs from "fs";
import path from "path";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  updateDoc
} from "firebase/firestore";

const LOCAL_DB_PATH = path.join(process.cwd(), "data", "db.json");

interface LocalDbSchema {
  users: any[];
  sessions: any[];
  discussions: any[];
  documents: any[];
  studyContexts: any[];
}

const emptyDb: LocalDbSchema = {
  users: [],
  sessions: [],
  discussions: [],
  documents: [],
  studyContexts: [],
};

function readLocalDb(): LocalDbSchema {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const dir = path.dirname(LOCAL_DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read local DB:", error);
    return emptyDb;
  }
}

function writeLocalDb(data: LocalDbSchema): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write local DB:", error);
  }
}

export async function findUserByEmail(email: string) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const firstDoc = snapshot.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as any;
    } catch (e) {
      console.warn("Firestore query failed, falling back to local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const user = local.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
}

export async function findUserById(id: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as any;
      }
      return null;
    } catch (e) {
      console.warn("Firestore fetch failed, falling back to local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const user = local.users.find(u => u.id === id);
  return user || null;
}

export async function createUser(id: string, name: string, email: string, passwordHash: string) {
  const data = {
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", id);
      await setDoc(docRef, data);
      return { id, ...data };
    } catch (e) {
      console.warn("Firestore save failed, writing to local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const newUser = { id, ...data };
  local.users.push(newUser);
  writeLocalDb(local);
  return newUser;
}

export async function createSession(token: string, userId: string, expiresAt: string) {
  const data = {
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "sessions", token);
      await setDoc(docRef, data);
      return { token, ...data };
    } catch (e) {
      console.warn("Firestore save failed, writing to local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const newSession = { token, ...data };
  local.sessions.push(newSession);
  writeLocalDb(local);
  return newSession;
}

export async function getSession(token: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "sessions", token);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (new Date(data.expiresAt) < new Date()) {
          await deleteDoc(docRef);
          return null;
        }
        return { token, ...data } as any;
      }
    } catch (e) {
      console.warn("Firestore fetch failed, checking local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const index = local.sessions.findIndex(s => s.token === token);
  if (index === -1) return null;
  const session = local.sessions[index];
  if (new Date(session.expiresAt) < new Date()) {
    local.sessions.splice(index, 1);
    writeLocalDb(local);
    return null;
  }
  return session;
}

export async function deleteSession(token: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "sessions", token);
      await deleteDoc(docRef);
      return;
    } catch (e) {
      console.warn("Firestore delete failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  local.sessions = local.sessions.filter(s => s.token !== token);
  writeLocalDb(local);
}

export async function getUserDiscussions(userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "discussions"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return list.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (e) {
      console.warn("Firestore list failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const list = local.discussions.filter(d => d.userId === userId);
  return list.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function saveDiscussion(userId: string, id: string, discussion: any) {
  const data = {
    userId,
    title: discussion.title,
    subjectId: discussion.subjectId,
    messages: discussion.messages,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "discussions", id);
      await setDoc(docRef, data, { merge: true });
      return { id, ...data };
    } catch (e) {
      console.warn("Firestore save failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const index = local.discussions.findIndex(d => d.id === id && d.userId === userId);
  const updated = { id, ...data };
  if (index === -1) {
    local.discussions.push(updated);
  } else {
    local.discussions[index] = updated;
  }
  writeLocalDb(local);
  return updated;
}

export async function deleteDiscussion(id: string, userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "discussions", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === userId) {
        await deleteDoc(docRef);
      }
      return;
    } catch (e) {
      console.warn("Firestore delete failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  local.discussions = local.discussions.filter(d => !(d.id === id && d.userId === userId));
  writeLocalDb(local);
}

export async function getUserDocuments(userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "documents"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn("Firestore list failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const list = local.documents.filter(doc => doc.userId === userId);
  return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addDocument(userId: string, id: string, docData: any) {
  const data = {
    userId,
    name: docData.name,
    size: docData.size,
    toggled: docData.toggled,
    content: docData.content,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "documents", id);
      await setDoc(docRef, data);
      return { id, ...data };
    } catch (e) {
      console.warn("Firestore save failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const newDoc = { id, ...data };
  local.documents.push(newDoc);
  writeLocalDb(local);
  return newDoc;
}

export async function toggleDocument(id: string, toggled: boolean, userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "documents", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === userId) {
        await updateDoc(docRef, { toggled });
      }
      return;
    } catch (e) {
      console.warn("Firestore update failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const docItem = local.documents.find(d => d.id === id && d.userId === userId);
  if (docItem) {
    docItem.toggled = toggled;
    writeLocalDb(local);
  }
}

export async function deleteDocument(id: string, userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "documents", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === userId) {
        await deleteDoc(docRef);
      }
      return;
    } catch (e) {
      console.warn("Firestore delete failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  local.documents = local.documents.filter(d => !(d.id === id && d.userId === userId));
  writeLocalDb(local);
}

export async function saveStudyContext(userId: string, studyContext: any) {
  const data = {
    ...studyContext,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "studyContexts", userId);
      await setDoc(docRef, data);
      return;
    } catch (e) {
      console.warn("Firestore save failed, using local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const index = local.studyContexts.findIndex(sc => sc.userId === userId);
  const updated = { userId, ...data };
  if (index === -1) {
    local.studyContexts.push(updated);
  } else {
    local.studyContexts[index] = updated;
  }
  writeLocalDb(local);
}

export async function getStudyContext(userId: string) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "studyContexts", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (e) {
      console.warn("Firestore fetch failed, checking local DB:", e);
    }
  }
  
  const local = readLocalDb();
  const context = local.studyContexts.find(sc => sc.userId === userId);
  return context || null;
}
