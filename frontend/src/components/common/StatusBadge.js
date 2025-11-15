import React from 'react';
import { getStatusStyle } from '../../utils/constants';

const StatusBadge = ({ status, withIcon = false }) => {
  const style = getStatusStyle(status);

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bgColor} ${style.textColor}`}
    >
      {withIcon && (
        <span className="w-2 h-2 rounded-full bg-current"></span>
      )}
      {style.label}
    </span>
  );
};

export default StatusBadge;