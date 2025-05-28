import type { User } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where, // Added where for querying
  orderBy,
  limit,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// AppSettings Interface
export interface AppSettings {
  attendanceGoal: number;
  gpaGoal: number;
  marksPerCredit: number;
}

// Get user-specific collection reference
export const getUserCollection = (user: User, collectionName: string) => {
  return collection(db, `users/${user.uid}/${collectionName}`);
};

// Get user-specific documents
export const getUserDocuments = async (user: User, collectionName: string) => {
  try {
    const userCollection = getUserCollection(user, collectionName);
    const querySnapshot = await getDocs(userCollection);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Error fetching user ${collectionName}:`, error);
    return [];
  }
};

// Delete attendance history for a specific subject
export const deleteAttendanceHistoryForSubject = async (
  user: User,
  subjectId: string
) => {
  try {
    const attendanceHistoryCollection = getUserCollection(
      user,
      "attendanceHistory"
    );
    const q = query(
      attendanceHistoryCollection,
      where("subjectId", "==", subjectId)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteUserDocument(user, "attendanceHistory", docSnapshot.id)
    );
    await Promise.all(deletePromises);
    console.log(
      `Successfully deleted attendance history for subject ${subjectId}`
    );
  } catch (error) {
    console.error(
      `Error deleting attendance history for subject ${subjectId}:`,
      error
    );
    throw error; // Re-throw the error for further handling if necessary
  }
};

// Delete marks history for a specific subject
export const deleteMarksHistoryForSubject = async (
  user: User,
  subjectId: string
) => {
  try {
    const marksHistoryCollection = getUserCollection(user, "marksHistory");
    const q = query(
      marksHistoryCollection,
      where("subjectId", "==", subjectId)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteUserDocument(user, "marksHistory", docSnapshot.id)
    );
    await Promise.all(deletePromises);
    console.log(`Successfully deleted marks history for subject ${subjectId}`);
  } catch (error) {
    console.error(
      `Error deleting marks history for subject ${subjectId}:`,
      error
    );
    throw error; // Re-throw the error for further handling if necessary
  }
};

// Get attendance history
export const getAttendanceHistory = async (user: User) => {
  try {
    const historyCollection = collection(
      db,
      `users/${user.uid}/attendanceHistory`
    );
    const q = query(historyCollection, orderBy("date", "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    console.log("HIHIHIIHI", querySnapshot);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return [];
  }
};

// Get marks history
export const getMarksHistory = async (user: User) => {
  try {
    const historyCollection = collection(db, `users/${user.uid}/marksHistory`);
    const q = query(historyCollection, orderBy("date", "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching marks history:", error);
    return [];
  }
};

// Add attendance history entry
export const addAttendanceHistory = async (
  user: User,
  subjectId: string,
  subjectName: string,
  attended: boolean,
  happened = true
) => {
  try {
    const historyCollection = collection(
      db,
      `users/${user.uid}/attendanceHistory`
    );
    await addDoc(historyCollection, {
      subjectId,
      subjectName,
      attended,
      happened,
      date: new Date().toISOString(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error adding attendance history:", error);
  }
};

// Add marks history entry
export const addMarksHistory = async (
  user: User,
  subjectId: string,
  subjectName: string,
  examName: string,
  scoredMarks: number,
  totalMarks: number
) => {
  try {
    const historyCollection = collection(db, `users/${user.uid}/marksHistory`);
    await addDoc(historyCollection, {
      subjectId,
      subjectName,
      examName,
      scoredMarks,
      totalMarks,
      percentage: (scoredMarks / totalMarks) * 100,
      date: new Date().toISOString(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error adding marks history:", error);
  }
};

// Add document to user-specific collection
export const addUserDocument = async (
  user: User,
  collectionName: string,
  data: any
) => {
  try {
    const userCollection = getUserCollection(user, collectionName);
    const docRef = await addDoc(userCollection, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef;
  } catch (error) {
    console.error(`Error adding user ${collectionName}:`, error);
    throw error;
  }
};

// Get user settings
export const getUserSettings = async (
  user: User
): Promise<AppSettings | null> => {
  if (!user) return null;
  const settingsDocRef = doc(db, `users/${user.uid}/config/appSettings`);
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      console.log("No user settings document found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
    // Depending on desired error handling, you might throw error or return null
    throw error;
  }
};

// Update user settings
export const updateUserSettings = async (
  user: User,
  settings: Partial<AppSettings>
): Promise<void> => {
  if (!user) throw new Error("User not provided for updating settings.");
  const settingsDocRef = doc(db, `users/${user.uid}/config/appSettings`);
  try {
    await setDoc(settingsDocRef, settings, { merge: true });
    console.log("User settings updated successfully.");
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

// Delete user-specific document
export const deleteUserDocument = async (
  user: User,
  collectionName: string,
  docId: string
) => {
  try {
    const docRef = doc(db, `users/${user.uid}/${collectionName}`, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Update user-specific document
export const updateUserDocument = async (
  user: User,
  collectionName: string,
  docId: string,
  data: any
) => {
  try {
    const docRef = doc(db, `users/${user.uid}/${collectionName}`, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error updating user ${collectionName}:`, error);
    throw error;
  }
};
