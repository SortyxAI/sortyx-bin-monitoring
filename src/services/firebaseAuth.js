import { initializeApp } from 'firebase/app';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

import { auth } from '../config/firebase';
// import { register } from 'module';

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

export const firebaseAuth = {
    async login(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const token = await result.user.getIdToken(true);
            return { token, user: {email, uid:result.user.uid }};
        } catch (error) {
            console.error("Firebase login error: ",error.code, error.message);
            throw new Error(error.message ||'Firebase login failed');
        }
    },

    async register(email, password) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const token = await result.user.getIdToken(true);
            return { token, user: {email, uid: result.user.uid}};
        } catch (error) {
            console.error('Firebase register error: ', error);
            throw new Error('Firebase registration failed');
        }
    },

    async logout(){
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Firebase logout error: ', error);
        }
    }
};