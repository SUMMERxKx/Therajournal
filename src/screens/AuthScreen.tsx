import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { signUp, signIn, setupKeys } from '../auth/auth';
import { SignUp, SignIn, KeySetup } from '../data/schemas';
import logger from '../utils/logger';

export default function AuthScreen() {
  const { login } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'keys'>('auth');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Key setup state
  const [useDeviceKeystore, setUseDeviceKeystore] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        const signUpData: SignUp = { email, password };
        result = await signUp(signUpData);
      } else {
        const signInData: SignIn = { email, password };
        result = await signIn(signInData);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        setStep('keys');
      }
    } catch (error) {
      logger.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!useDeviceKeystore) {
        if (passphrase !== confirmPassphrase) {
          setError('Passphrases do not match');
          setIsLoading(false);
          return;
        }
        if (passphrase.length < 8) {
          setError('Passphrase must be at least 8 characters');
          setIsLoading(false);
          return;
        }
      }

      const keySetup: KeySetup = {
        useDeviceKeystore,
        passphrase: useDeviceKeystore ? undefined : passphrase,
      };

      const result = await setupKeys(keySetup);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Get the user from the previous auth step
        const { user } = await signIn({ email, password });
        if (user) {
          await login(user);
        }
      }
    } catch (error) {
      logger.error('Key setup error:', error);
      setError('Failed to set up encryption keys');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'keys') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up encryption
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your journal entries are encrypted on your device before being stored
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <form className="space-y-6" onSubmit={handleKeySetup}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose encryption method:
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useDeviceKeystore}
                      onChange={() => setUseDeviceKeystore(true)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Device-based (simpler, but data tied to this browser)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useDeviceKeystore}
                      onChange={() => setUseDeviceKeystore(false)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Passphrase-based (more secure, works across devices)
                    </span>
                  </label>
                </div>
              </div>

              {!useDeviceKeystore && (
                <>
                  <div>
                    <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700">
                      Encryption passphrase
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="passphrase"
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="input pr-10"
                        placeholder="Enter a strong passphrase"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                      >
                        {showPassphrase ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassphrase" className="block text-sm font-medium text-gray-700">
                      Confirm passphrase
                    </label>
                    <input
                      id="confirmPassphrase"
                      type="password"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      className="input"
                      placeholder="Confirm your passphrase"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Lock className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Start your privacy-first journaling journey' : 'Welcome back to TheraJournal'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your email"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}