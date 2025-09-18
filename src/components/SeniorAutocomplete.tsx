// components/SeniorAutocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const [searchTerm, setSearchTerm] = useState(selectedSenior?.name || '');
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualiza o searchTerm quando selectedSenior muda
  useEffect(() => {
    if (selectedSenior) {
      setSearchTerm(selectedSenior.name);
    }
  }, [selectedSenior]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função de busca com useCallback para evitar recriações desnecessárias
  const searchSeniors = useCallback(async (term: string) => {
    if (term.length < 3) {
      setSeniors([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/seniors?secretaryId=${secretaryId}&search=${encodeURIComponent(term)}`
      );

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const data = await response.json();
      setSeniors(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Erro ao buscar idosos:', error);
      setSeniors([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [secretaryId]);

  useEffect(() => {
    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchSeniors(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchSeniors]);

  const handleSelectSenior = (senior: Senior) => {
    onSeniorSelect(senior);
    setSearchTerm(senior.name);
    setShowDropdown(false);
    setSeniors([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Se limpar o input, limpa a seleção também
    if (value === '') {
      onSeniorSelect({} as Senior);
      setSeniors([]);
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 3 && seniors.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar Idoso Cadastrado
      </label>

      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder="Digite pelo menos 3 letras do nome..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="text-sm text-gray-600">
                  {senior.phone} • {senior.church}
                </div>
              </div>
            ))
          ) : searchTerm.length >= 3 ? (
            <div className="p-3 text-gray-500">
              Nenhum idoso encontrado. Verifique se o nome está correto.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}