import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
      <img
        src="/logo_polycliniques.jpg"
        alt="Logo Polyclinique des Apôtres"
        className="h-16 mb-2"
      />
      <div className="text-lg font-semibold text-primary-600 mb-2">Polyclinique des Apôtres</div>
      {children}
    </div>
  </div>
);

export default AuthLayout; 