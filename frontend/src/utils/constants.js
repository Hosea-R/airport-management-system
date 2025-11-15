/**
 * Statuts des vols
 */
export const FLIGHT_STATUSES = {
  scheduled: {
    label: 'Prévu',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  boarding: {
    label: 'Embarquement',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200'
  },
  departed: {
    label: 'Décollé',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200'
  },
  in_air: {
    label: 'En vol',
    color: 'cyan',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200'
  },
  landed: {
    label: 'Atterri',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  delayed: {
    label: 'Retardé',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200'
  },
  cancelled: {
    label: 'Annulé',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200'
  }
};

/**
 * Types de vol
 */
export const FLIGHT_TYPES = {
  departure: {
    label: 'Départ',
    icon: '🛫'
  },
  arrival: {
    label: 'Arrivée',
    icon: '🛬'
  }
};

/**
 * Obtenir le style d'un statut
 */
export const getStatusStyle = (status) => {
  return FLIGHT_STATUSES[status] || FLIGHT_STATUSES.scheduled;
};

/**
 * Obtenir le label d'un statut
 */
export const getStatusLabel = (status) => {
  return FLIGHT_STATUSES[status]?.label || status;
};

/**
 * Obtenir toutes les options de statuts pour un select
 */
export const getStatusOptions = () => {
  return Object.keys(FLIGHT_STATUSES).map(key => ({
    value: key,
    label: FLIGHT_STATUSES[key].label
  }));
};