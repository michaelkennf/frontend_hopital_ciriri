import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuthStore } from '../stores/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(email, password);
      // Après connexion réussie, rediriger selon le rôle
      const user = useAuthStore.getState().user;
      if (user) {
        const role = user.role;
        let redirectPath = '/dashboard';
        
        switch (role) {
          case 'ADMIN':
            redirectPath = '/admin';
            break;
          case 'PDG':
            redirectPath = '/pdg';
            break;
          case 'RH':
            redirectPath = '/rh';
            break;
          case 'CAISSIER':
            redirectPath = '/caissier';
            break;
          case 'LOGISTICIEN':
            redirectPath = '/logisticien';
            break;
          case 'MEDECIN':
            redirectPath = '/medecin';
            break;
          case 'HOSPITALISATION':
            redirectPath = '/hospitalisation';
            break;
          case 'LABORANTIN':
            redirectPath = '/laborantin';
            break;
          case 'MATERNITE':
            redirectPath = '/maternite';
            break;
          default:
            redirectPath = '/dashboard';
        }
        
        navigate(redirectPath);
      }
    } catch (err) {
      // L'erreur est déjà gérée dans le store
      // Ne pas vider les champs en cas d'erreur pour permettre à l'utilisateur de corriger
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Bienvenue</h1>
      <p className="text-gray-500 mb-6 text-center">Connectez-vous à votre compte</p>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Entrez votre email"
            className="input-field"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError(); // Effacer l'erreur quand l'utilisateur tape
            }}
            required
          />
        </div>
        <div className="mb-2">
          <label className="block text-gray-700 mb-1" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Entrez votre mot de passe"
              className="input-field pr-10"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError(); // Effacer l'erreur quand l'utilisateur tape
              }}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center text-gray-400"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center text-sm text-gray-600">
            <input type="checkbox" className="mr-2" />
            Se souvenir de moi
          </label>
          <button
            type="button"
            className="text-sm text-primary-600 hover:underline bg-transparent border-0 p-0"
            onClick={() => setShowForgotMsg(true)}
          >
            Mot de passe oublié ?
          </button>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur de connexion</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('Email ou mot de passe incorrect') && (
                    <p className="mt-1 text-xs">
                      💡 Vérifiez que votre email et mot de passe sont corrects
                    </p>
                  )}
                  {error.includes('connexion internet') && (
                    <p className="mt-1 text-xs">
                      💡 Vérifiez votre connexion internet et réessayez
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full btn-primary text-white text-lg py-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connexion en cours...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
      {showForgotMsg && (
        <div className="mt-6 text-center text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded p-3">
          Contactez votre administrateur système pour la restauration de votre mot de passe
        </div>
      )}
    </AuthLayout>
  );
};

export default Login; 