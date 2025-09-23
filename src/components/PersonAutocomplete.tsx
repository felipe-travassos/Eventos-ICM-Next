// components/PersonAutocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Senior } from '@/types';

interface PersonAutocompleteProps {
  onPersonSelect: (person: Senior) => void;
  selectedPerson?: Senior | null;
  secretaryId: string;
}

export default function PersonAutocomplete({
  onPersonSelect,
  selectedPerson,
  secretaryId
}: PersonAutocompleteProps) {
  // ✅ Inicializar com string vazia em vez de undefined
  const [searchTerm, setSearchTerm] = useState(selectedPerson?.name || '');
  const [people, setPeople] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualiza o searchTerm quando selectedPerson muda
  useEffect(() => {
    if (selectedPerson) {
      setSearchTerm(selectedPerson.name);
    } else {
      setSearchTerm(''); // ✅ Garantir que nunca fique undefined
    }
  }, [selectedPerson]);

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
  const searchPeople = useCallback(async (term: string) => {
    if (term.length < 3) {
      setPeople([]);
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
      const peopleData: Senior[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Mapeando os dados para a interface Senior
        peopleData.push({
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
      if (peopleData.length === 0) {
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
          peopleData.push({
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
      if (peopleData.length === 0) {
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
          peopleData.push({
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
      const uniquePeople = peopleData.filter((person, index, self) =>
        index === self.findIndex(p => p.id === person.id)
      );

      setPeople(uniquePeople);
      setShowDropdown(uniquePeople.length > 0);
    } catch (error) {
      console.error('Erro ao buscar pessoas no Firestore:', error);
      setPeople([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchPeople(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchPeople]);

  const handleSelectPerson = (person: Senior) => {
    // ✅ Garantir que a pessoa tem um ID válido
    if (!person.id) {
      console.error('Pessoa selecionada não possui ID válido:', person);
      alert('Erro: Pessoa selecionada é inválida.');
      return;
    }

    onPersonSelect(person);
    setSearchTerm(person.name);
    setShowDropdown(false);
    setPeople([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Se limpar o input, limpa a seleção também
    if (value === '') {
      onPersonSelect({} as Senior);
      setPeople([]);
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 3 && people.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar Pessoa Cadastrada
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
          ) : people.length > 0 ? (
            people.map((person) => (
              <div
                key={person.id}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                onClick={() => handleSelectPerson(person)}
              >
                <div className="font-medium">{person.name}</div>
                <div className="text-sm text-gray-600">
                  {person.phone} • {person.church}
                  {person.email && ` • ${person.email}`}
                </div>
              </div>
            ))
          ) : searchTerm.length >= 3 ? (
            <div className="p-3 text-gray-500">
              Nenhuma pessoa encontrada. Verifique se o nome está correto.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}