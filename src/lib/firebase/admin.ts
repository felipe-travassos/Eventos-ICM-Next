// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
    try {
        console.log('Inicializando Firebase Admin...')

        if (!process.env.FIREBASE_PROJECT_ID ||
            !process.env.FIREBASE_CLIENT_EMAIL ||
            !process.env.FIREBASE_PRIVATE_KEY) {
            throw new Error('Variáveis do Firebase Admin não encontradas')
        }

        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        })

        console.log('Firebase Admin inicializado com sucesso')
    } catch (error) {
        console.error('Erro ao inicializar Firebase Admin:', error)
    }
}

export const adminDb = admin.firestore()
export default admin