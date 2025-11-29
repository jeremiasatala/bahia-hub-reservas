import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Perfil = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register: registerPerfil, handleSubmit: handleSubmitPerfil, formState: { errors: errorsPerfil } } = useForm({
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
      telefono: user?.telefono || ''
    }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, reset: resetPassword } = useForm();

  const onSubmitPerfil = async (data) => {
    setLoading(true);
    const result = await updateProfile(data);
    setLoading(false);
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    const result = await changePassword(data);
    setLoading(false);
    if (result.success) {
      resetPassword();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'perfil'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cambiar Contraseña
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Información Personal */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleSubmitPerfil(onSubmitPerfil)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerPerfil('nombre', {
                        required: 'El nombre es requerido',
                        minLength: {
                          value: 2,
                          message: 'El nombre debe tener al menos 2 caracteres'
                        }
                      })}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  {errorsPerfil.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errorsPerfil.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerPerfil('email', {
                        required: 'El email es requerido',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Email inválido'
                        }
                      })}
                      type="email"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  {errorsPerfil.email && (
                    <p className="mt-1 text-sm text-red-600">{errorsPerfil.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerPerfil('telefono')}
                      type="tel"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="+54 291 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                      disabled
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Cambiar Contraseña */}
          {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="relative">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Contraseña Actual
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      {...registerPassword('currentPassword', {
                        required: 'La contraseña actual es requerida'
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errorsPassword.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nueva Contraseña
                  </label>
                  <input
                    {...registerPassword('newPassword', {
                      required: 'La nueva contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errorsPassword.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    {...registerPassword('confirmNewPassword', {
                      required: 'Confirma tu nueva contraseña',
                      validate: value => value === document.getElementById('newPassword')?.value || 'Las contraseñas no coinciden'
                    })}
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errorsPassword.confirmNewPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.confirmNewPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Información de la cuenta */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Cuenta</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado de la cuenta</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                {user?.estado || 'activo'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ID de usuario</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Última actualización</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date().toLocaleDateString('es-ES')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Perfil;