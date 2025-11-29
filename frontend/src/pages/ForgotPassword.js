import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    // TODO: Implementar lógica de recuperación de contraseña
    toast.success('Se han enviado las instrucciones a tu email');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-primary-500 rounded-lg">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu email para recibir instrucciones
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Email inválido'
                }
              })}
              type="email"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="email@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Enviar Instrucciones
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              ← Volver al login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;