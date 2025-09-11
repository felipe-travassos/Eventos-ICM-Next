// components/DebugAuth.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DebugAuth() {
    const { currentUser, userData, loading } = useAuth();

    return (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50 text-xs">
            <h3 className="font-bold mb-2">Debug Auth:</h3>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>CurrentUser: {currentUser ? 'Logged In' : 'Not Logged In'}</p>
            <p>UserData: {userData ? 'Exists' : 'Null'}</p>
            <p>User ID: {currentUser?.uid || 'None'}</p>
        </div>
    );
}