import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Existe' : '❌ Faltando',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Existe' : '❌ Faltando',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Existe' : '❌ Faltando',
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
        privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20),
        privateKeyEnd: process.env.FIREBASE_PRIVATE_KEY?.substring(-20)
    })
}