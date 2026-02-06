import React, { useState, useEffect } from 'react';
import { Bell, Droplet, Utensils, Dumbbell, Trophy, Clock, BellOff, BellRing, CheckCircle, Info } from 'lucide-react';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  initializeNotifications,
} from '../services/notificationService';

const Notifications: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Initialize notifications on mount
    initializeNotifications();
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      initializeNotifications();
    }
  };

  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const Toggle = ({ active, onClick, disabled }: { active: boolean; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${active ? 'bg-nutri-500' : 'bg-gray-200'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );

  const TimeInput = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${disabled
          ? 'bg-gray-50 text-gray-400 border-gray-200'
          : 'bg-white text-gray-700 border-gray-300 hover:border-nutri-400 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100'
        }`}
    />
  );

  const isSupported = isNotificationSupported();
  const isEnabled = permission === 'granted';

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurar Notificações</h1>
        {showSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium animate-fade-in">
            <CheckCircle size={16} />
            Salvo!
          </div>
        )}
      </div>

      {/* Permission Banner */}
      {!isSupported ? (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
          <BellOff size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Notificações não suportadas</p>
            <p className="text-sm text-orange-700">
              Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
            </p>
          </div>
        </div>
      ) : permission === 'denied' ? (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <BellOff size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Notificações bloqueadas</p>
            <p className="text-sm text-red-700">
              Você bloqueou as notificações. Vá nas configurações do navegador para permitir.
            </p>
          </div>
        </div>
      ) : permission !== 'granted' ? (
        <div className="mb-6 p-4 bg-nutri-50 border border-nutri-200 rounded-2xl flex items-start gap-3">
          <BellRing size={24} className="text-nutri-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-nutri-800">Ative as notificações</p>
            <p className="text-sm text-nutri-700 mb-3">
              Receba lembretes para beber água, fazer refeições e treinar.
            </p>
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors"
            >
              Permitir Notificações
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
          <p className="text-green-800">
            <span className="font-semibold">Notificações ativadas!</span> Você receberá lembretes conforme configurado abaixo.
          </p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Water Reminder */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                <Droplet size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lembrete de Água</h3>
                <p className="text-sm text-gray-500">Hidrate-se regularmente</p>
              </div>
            </div>
            <Toggle
              active={settings.water.enabled}
              onClick={() => updateSettings({
                ...settings,
                water: { ...settings.water, enabled: !settings.water.enabled }
              })}
              disabled={!isEnabled}
            />
          </div>

          {settings.water.enabled && isEnabled && (
            <div className="ml-14 flex items-center gap-3">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">A cada</span>
              <select
                value={settings.water.intervalMinutes}
                onChange={(e) => updateSettings({
                  ...settings,
                  water: { ...settings.water, intervalMinutes: parseInt(e.target.value) }
                })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100"
              >
                <option value={60}>1 hora</option>
                <option value={90}>1h30</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>
          )}
        </div>

        {/* Meal Reminders */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Horário das Refeições</h3>
                <p className="text-sm text-gray-500">Café, Almoço e Jantar</p>
              </div>
            </div>
            <Toggle
              active={settings.meals.enabled}
              onClick={() => updateSettings({
                ...settings,
                meals: { ...settings.meals, enabled: !settings.meals.enabled }
              })}
              disabled={!isEnabled}
            />
          </div>

          {settings.meals.enabled && isEnabled && (
            <div className="ml-14 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-20">Café</span>
                <TimeInput
                  value={settings.meals.times[0] || '07:00'}
                  onChange={(v) => {
                    const times = [...settings.meals.times];
                    times[0] = v;
                    updateSettings({ ...settings, meals: { ...settings.meals, times } });
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-20">Almoço</span>
                <TimeInput
                  value={settings.meals.times[1] || '12:00'}
                  onChange={(v) => {
                    const times = [...settings.meals.times];
                    times[1] = v;
                    updateSettings({ ...settings, meals: { ...settings.meals, times } });
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-20">Jantar</span>
                <TimeInput
                  value={settings.meals.times[2] || '19:00'}
                  onChange={(v) => {
                    const times = [...settings.meals.times];
                    times[2] = v;
                    updateSettings({ ...settings, meals: { ...settings.meals, times } });
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Workout Reminder */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                <Dumbbell size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lembrete de Treino</h3>
                <p className="text-sm text-gray-500">Motivação diária para se exercitar</p>
              </div>
            </div>
            <Toggle
              active={settings.workout.enabled}
              onClick={() => updateSettings({
                ...settings,
                workout: { ...settings.workout, enabled: !settings.workout.enabled }
              })}
              disabled={!isEnabled}
            />
          </div>

          {settings.workout.enabled && isEnabled && (
            <div className="ml-14 flex items-center gap-3">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Horário do treino</span>
              <TimeInput
                value={settings.workout.time}
                onChange={(v) => updateSettings({
                  ...settings,
                  workout: { ...settings.workout, time: v }
                })}
              />
            </div>
          )}
        </div>

        {/* Achievement Celebrations */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Conquistas e Metas</h3>
                <p className="text-sm text-gray-500">Celebre quando bater suas metas</p>
              </div>
            </div>
            <Toggle
              active={settings.achievements}
              onClick={() => updateSettings({
                ...settings,
                achievements: !settings.achievements
              })}
              disabled={!isEnabled}
            />
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
        <Info size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Como funcionam as notificações?</p>
          <p>
            As notificações são enviadas pelo navegador mesmo quando você não está usando o NutriSmart.
            Certifique-se de que o navegador tem permissão para executar em segundo plano.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;