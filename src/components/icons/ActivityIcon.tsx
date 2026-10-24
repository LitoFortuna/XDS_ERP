import React from 'react';
import { Icon } from './Icon';

export const ActivityIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4.5l2.25-6 4.5 12L16.5 12H21" />
    </svg>
  </Icon>
);
