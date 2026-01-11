
import React from 'react';
import { Icon } from './Icon';

export const ClipboardCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.625 9H16.875A2.25 2.25 0 0014.625 11.25v7.5A2.25 2.25 0 0016.875 21h3.75A2.25 2.25 0 0022.875 18.75v-7.5A2.25 2.25 0 0020.625 9zM16.125 15h.008v.008h-.008V15zm0 3h.008v.008h-.008V18zm2.25-3h.008v.008H18.375V15zm0 3h.008v.008H18.375V18zm2.25-3h.008v.008H20.625V15zm0 3h.008v.008H20.625V18z" />
    </svg>
  </Icon>
);
