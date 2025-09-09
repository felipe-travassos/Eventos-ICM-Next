// components/layout/Layout.tsx
'use client';

import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    showContainer?: boolean;
}

const Layout = ({ children, showContainer = false }: LayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            <main className={`flex-grow ${showContainer ? 'container mx-auto p-4' : ''}`}>
                {children}
            </main>
        </div>
    );
};

export default Layout;