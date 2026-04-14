import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  ...props 
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-block' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}