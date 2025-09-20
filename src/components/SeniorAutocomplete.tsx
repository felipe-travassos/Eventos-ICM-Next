// components/SeniorAutocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Senior } from '@/types';

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
  // ✅ Inicializar com string vazia em vez de undefined
  const [searchTerm, setSearchTerm] = useState(selectedSenior?.name || '');
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualiza o searchTerm quando selectedSenior muda
  useEffect(() => {
    if (selectedSenior) {
      setSearchTerm(selectedSenior.name);
    } else {
      setSearchTerm(''); // ✅ Garantir que nunca fique undefined
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

  // Função de busca direta no Firestore
  // Função de busca direta no Firestore
  const searchSeniors = useCallback(async (term: string) => {
    if (term.length < 3) {
      setSeniors([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const seniorsRef = collection(db, 'seniors');

      // ✅ Normalizar o termo de busca: primeira letra maiúscula + resto minúsculas
      const normalizedTerm = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();

      // ✅ Buscar por nome normalizado (case insensitive)
      const q = query(
        seniorsRef,
        where('name', '>=', normalizedTerm),
        where('name', '<=', normalizedTerm + '\uf8ff'),
        orderBy('name'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const seniorsData: Senior[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Mapeando os dados para a interface Senior
        seniorsData.push({
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          cpf: data.cpf || '',
          church: data.church || '',
          pastor: data.pastor || '',
          birthDate: data.birthDate || '',
          address: data.address || '',
          healthInfo: data.healthInfo || '',
          churchId: data.churchId || '',
          createdBy: data.createdBy || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      // ✅ Busca alternativa: também buscar em minúsculas
      if (seniorsData.length === 0) {
        const alternativeQuery = query(
          seniorsRef,
          where('name', '>=', term.toLowerCase()),
          where('name', '<=', term.toLowerCase() + '\uf8ff'),
          orderBy('name'),
          limit(10)
        );

        const alternativeSnapshot = await getDocs(alternativeQuery);
        alternativeSnapshot.forEach((doc) => {
          const data = doc.data();
          seniorsData.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            cpf: data.cpf || '',
            church: data.church || '',
            pastor: data.pastor || '',
            birthDate: data.birthDate || '',
            address: data.address || '',
            healthInfo: data.healthInfo || '',
            churchId: data.churchId || '',
            createdBy: data.createdBy || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
      }

      // ✅ Busca adicional: também buscar em maiúsculas
      if (seniorsData.length === 0) {
        const uppercaseQuery = query(
          seniorsRef,
          where('name', '>=', term.toUpperCase()),
          where('name', '<=', term.toUpperCase() + '\uf8ff'),
          orderBy('name'),
          limit(10)
        );

        const uppercaseSnapshot = await getDocs(uppercaseQuery);
        uppercaseSnapshot.forEach((doc) => {
          const data = doc.data();
          seniorsData.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            cpf: data.cpf || '',
            church: data.church || '',
            pastor: data.pastor || '',
            birthDate: data.birthDate || '',
            address: data.address || '',
            healthInfo: data.healthInfo || '',
            churchId: data.churchId || '',
            createdBy: data.createdBy || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
      }

      // ✅ Remover duplicatas (caso haja sobreposição nas buscas)
      const uniqueSeniors = seniorsData.filter((senior, index, self) =>
        index === self.findIndex(s => s.id === senior.id)
      );

      setSeniors(uniqueSeniors);
      setShowDropdown(uniqueSeniors.length > 0);
    } catch (error) {
      console.error('Erro ao buscar idosos no Firestore:', error);
      setSeniors([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchSeniors(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchSeniors]);

  const handleSelectSenior = (senior: Senior) => {
    // ✅ Garantir que o senior tem um ID válido
    if (!senior.id) {
      console.error('Idoso selecionado não possui ID válido:', senior);
      alert('Erro: Idoso selecionado é inválido.');
      return;
    }

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
        value={searchTerm} // ✅ Agora sempre será string, nunca undefined
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
                  {senior.email && ` • ${senior.email}`}
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