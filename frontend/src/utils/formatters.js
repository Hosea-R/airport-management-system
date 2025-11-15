import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formater une date ISO en format lisible
 */
export const formatDate = (isoString, formatStr = 'dd/MM/yyyy') => {
  try {
    return format(parseISO(isoString), formatStr, { locale: fr });
  } catch (error) {
    return '-';
  }
};

/**
 * Formater une heure ISO
 */
export const formatTime = (isoString) => {
  try {
    return format(parseISO(isoString), 'HH:mm', { locale: fr });
  } catch (error) {
    return '-';
  }
};

/**
 * Formater une date et heure complète
 */
export const formatDateTime = (isoString) => {
  try {
    return format(parseISO(isoString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch (error) {
    return '-';
  }
};

/**
 * Distance à maintenant
 */
export const timeFromNow = (isoString) => {
  try {
    return formatDistanceToNow(parseISO(isoString), { 
      addSuffix: true, 
      locale: fr 
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Formater la durée d'un vol (en minutes)
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
  return `${mins}min`;
};

/**
 * Calculer la durée entre deux dates
 */
export const calculateDuration = (start, end) => {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  } catch (error) {
    return 0;
  }
};