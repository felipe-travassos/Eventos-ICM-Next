// components/SeniorAutocomplete.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface Senior {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf: string;
  church: string;
  pastor: string;
}

interface SeniorAutocompleteProps {
  onSeniorSelect: (senior: Senior) => void;
  selectedSenior?: Senior | null;
  secretaryId: string;
}

export default function SeniorAutocomplete({ 
  onSeniorSelect, 
  selectedSenior, 
  secretaryId 
}: SeniorAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchSeniors(searchTerm);
    }
  }, [searchTerm]);

  const searchSeniors = async (term: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/seniors?secretaryId=${secretaryId}&search=${encodeURIComponent(term)}`
      );
      const data = await response.json();
      setSeniors(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Erro ao buscar idosos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSenior = (senior: Senior) => {
    onSeniorSelect(senior);
    setSearchTerm(senior.name);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar Idoso Cadastrado
      </label>
      
      <input
        type="text"
        value={selectedSenior ? selectedSenior.name : searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Digite o nome do idoso..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">Buscando...</div>
          ) : seniors.length > 0 ? (
            seniors.map((senior) => (
              <div
                key={senior.id}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                onClick={() => handleSelectSenior(senior)}
              >
                <div className="font-medium">{senior.name}</div>
                <div className="text-sm text-gray-600">{senior.phone} • {senior.church}</div>
              </div>
            ))
          ) : searchTerm ? (
            <div className="p-3 text-gray-500">
              Nenhum idoso encontrado. Cadastre um novo.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}