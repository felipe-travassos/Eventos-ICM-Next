/**
 * Sistema de logging centralizado com controle granular
 * Permite desabilitar logs específicos via variáveis de ambiente
 */

// Configurações de ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';
const isSyncLogsEnabled = process.env.NEXT_PUBLIC_ENABLE_SYNC_LOGS === 'true';

export const logger = {
  // Logs de informação (apenas em desenvolvimento se DEBUG_LOGS estiver habilitado)
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.log(message, ...args);
    }
  },

  // Logs de sincronização (controlados por ENABLE_SYNC_LOGS)
  syncingEvents: () => {
    if (isDevelopment && isSyncLogsEnabled) {
      console.log('🔄 Iniciando sincronização de eventos...');
    }
  },

  syncCompleted: () => {
    if (isDevelopment && isSyncLogsEnabled) {
      console.log('✅ Sincronização de eventos concluída');
    }
  },

  eventCorrected: (eventId: string, currentParticipants: number) => {
    if (isDevelopment && isSyncLogsEnabled) {
      console.log(`🔧 Evento ${eventId} corrigido: ${currentParticipants} participantes`);
    }
  },

  // Logs de carregamento de dados
  loadingEvents: () => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🔄 Carregando eventos...');
    }
  },

  eventsLoaded: (count: number) => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🎯 Eventos carregados:', count);
    }
  },

  eventsLoadedWithSync: (count: number) => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🎯 Eventos carregados com sincronização:', count);
    }
  },

  loadingUserRegistrations: (userId: string) => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🔄 Carregando inscrições para usuário:', userId);
    }
  },

  userRegistrationsLoaded: (registrations: unknown[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.log('📋 Inscrições carregadas:', registrations);
    }
  },

  userNotLoggedIn: () => {
    if (isDevelopment && isDebugEnabled) {
      console.log('👤 Usuário não logado, limpando inscrições');
    }
  },

  autoUpdatingEvents: () => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🔄 Atualizando eventos automaticamente...');
    }
  },

  registrationsUpdatedAfterEvent: (registrations: unknown[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.log('🔄 Inscrições atualizadas após registro:', registrations);
    }
  },

  // Logs de warning (sempre exibidos em desenvolvimento)
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  // Logs de erro (sempre exibidos)
  error: (message: string, ...args: unknown[]) => {
    console.error(message, ...args);
  },

  // Logs de debug específicos (apenas se DEBUG_LOGS estiver habilitado)
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Exportar também como default
export default logger;