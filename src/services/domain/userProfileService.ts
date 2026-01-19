
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile, UserRole } from '../../../types';

const COLLECTION_NAME = 'userProfiles';

// Hardcoded role assignments
const ROLE_ASSIGNMENTS: { [email: string]: UserRole } = {
    'raulfdz3@gmail.com': 'SuperAdmin',
    'info@xendance.space': 'Admin'
};

/**
 * Gets or creates a user profile
 */
export const getUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }

    // Create new profile with assigned role
    const role = ROLE_ASSIGNMENTS[email] || 'Admin';
    const newProfile: UserProfile = {
        uid,
        email,
        role,
        name: email.split('@')[0]
    };

    await setDoc(docRef, newProfile);
    console.log('[UserProfile] Created new profile:', email, 'as', role);
    return newProfile;
};

/**
 * Updates user profile
 */
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, updates, { merge: true });
};

/**
 * Gets the role for a user by email
 */
export const getUserRole = (email: string): UserRole => {
    return ROLE_ASSIGNMENTS[email] || 'Admin';
};
