// components/layout/Footer.tsx
'use client';

import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-10 mt-auto border-t border-gray-700">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0 text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Eventos ICM
                        </h3>
                        <p className="text-gray-400 italic">Software de uso exclusivo</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-3">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-end space-x-2">
                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                                </svg>
                                <span className="text-gray-300 text-sm">ftravassos.icm@gmail.com</span>
                            </div>

                            <div className="flex items-center justify-end space-x-2">
                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.707 12.293a.999.999 0 0 0-1.414 0l-1.594 1.594c-.739-.22-2.118-.72-2.992-1.594s-1.374-2.253-1.594-2.992l1.594-1.594a.999.999 0 0 0 0-1.414l-4-4a.999.999 0 0 0-1.414 0L3.581 5.005c-.38.38-.594.902-.586 1.435.023 1.424.4 6.37 4.298 10.268s8.844 4.274 10.268 4.298c.533.008 1.055-.206 1.435-.586l2.712-2.712a.999.999 0 0 0 0-1.414l-4-4z" />
                                </svg>
                                <span className="text-gray-300 text-sm">+55 (91) 981763041</span>
                            </div>
                        </div>

                        <div className="text-center md:text-right pt-4 border-t border-gray-800 w-full">
                            <p className="text-gray-400 text-sm font-light">
                                © {currentYear} Felipe Travassos. Todos os direitos reservados.
                            </p>
                            <div className="flex items-center justify-end space-x-1 mt-1">
                                <span className="text-gray-500 text-xs">Desenvolvido com</span>
                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                <span className="text-gray-500 text-xs">para nossa área.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-8">
                    <div className="flex items-center space-x-2 text-gray-500 text-xs">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12zm-2.25 10.5H8.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5zm0-3H8.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5zm0-3H8.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5z" />
                        </svg>
                        <span>Sistema de Gestão de Eventos</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;