'use client';

import { Toaster } from 'sonner';

export default function SonnerProvider() {
    return (
        <Toaster
            position="top-right"
            duration={4000}
            closeButton
            richColors
            theme="light"
            expand={false}
            visibleToasts={3}
            offset={16}
            toastOptions={{
                style: {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                },
                classNames: {
                    toast: '!border !shadow-lg',
                    success: '!bg-green-50 !text-green-800 !border-green-200',
                    error: '!bg-red-50 !text-red-800 !border-red-200',
                    warning: '!bg-yellow-50 !text-yellow-800 !border-yellow-200',
                    info: '!bg-blue-50 !text-blue-800 !border-blue-200',
                    loading: '!bg-gray-50 !text-gray-800 !border-gray-200',
                },
            }}
        />
    );
}