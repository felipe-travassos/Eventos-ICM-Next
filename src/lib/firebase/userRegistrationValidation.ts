// lib/firebase/userRegistrationValidation.ts

import { User } from '@/types';
import { isUserDataComplete, validateUserData } from '@/lib/validation/userValidation';

/**
 * Verifica se um usuário pode se inscrever em eventos
 * @param userData - Dados do usuário
 * @returns {object} - Objeto com status de elegibilidade e mensagens de erro
 */
export const canUserRegisterForEvents = (userData: User | null): {
    canRegister: boolean;
    errors: string[];
    missingFields: string[];
} => {
    if (!userData) {
        return {
            canRegister: false,
            errors: ['Usuário não encontrado'],
            missingFields: []
        };
    }

    // Verifica se todos os dados obrigatórios estão preenchidos
    const isComplete = isUserDataComplete(userData);
    
    if (!isComplete) {
        const validationErrors = validateUserData(userData);
        
        return {
            canRegister: false,
            errors: validationErrors,
            missingFields: getMissingUserFields(userData)
        };
    }

    return {
        canRegister: true,
        errors: [],
        missingFields: []
    };
};

/**
 * Retorna os campos faltantes nos dados do usuário
 * @param userData - Dados do usuário
 * @returns {string[]} - Array com nomes dos campos faltantes
 */
const getMissingUserFields = (userData: User): string[] => {
    const missing: string[] = [];
    
    if (!userData.name?.trim()) missing.push('Nome');
    if (!userData.email?.trim()) missing.push('Email');
    if (!userData.cpf?.trim()) missing.push('CPF');
    if (!userData.phone?.trim()) missing.push('Telefone');
    if (!userData.churchId?.trim()) missing.push('Igreja');
    
    return missing;
};

/**
 * Gera mensagem de erro amigável para usuário que não pode se inscrever
 * @param errors - Array de erros de validação
 * @param missingFields - Array de campos faltantes
 * @returns {string} - Mensagem de erro formatada
 */
export const getRegistrationErrorMessage = (errors: string[], missingFields: string[]): string => {
    if (missingFields.length > 0) {
        return `Para se inscrever em eventos, você precisa completar os seguintes dados no seu perfil: ${missingFields.join(', ')}.`;
    }
    
    if (errors.length > 0) {
        return `Há problemas com seus dados: ${errors.join(', ')}. Por favor, atualize seu perfil antes de se inscrever.`;
    }
    
    return 'Não foi possível verificar seus dados. Tente novamente.';
};

/**
 * Hook personalizado para verificar elegibilidade de inscrição
 * @param userData - Dados do usuário
 * @returns {object} - Status de elegibilidade e funções auxiliares
 */
export const useRegistrationEligibility = (userData: User | null) => {
    const eligibility = canUserRegisterForEvents(userData);
    
    return {
        ...eligibility,
        errorMessage: getRegistrationErrorMessage(eligibility.errors, eligibility.missingFields),
        hasValidData: eligibility.canRegister
    };
};