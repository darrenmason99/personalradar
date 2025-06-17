import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        {!isAuthenticated ? (
          <GoogleLogin
            onSuccess={credentialResponse => {
              if (credentialResponse.credential) {
                login(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.error('Google login failed');
            }}
          />
        ) : (
          <div className="text-center">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.full_name}
                className="w-16 h-16 mx-auto mb-4 rounded-full"
              />
            )}
            <h2 className="mb-2 text-xl font-semibold">{user?.full_name}</h2>
            <p className="mb-4 text-gray-600">{user?.email}</p>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 