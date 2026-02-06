import React, { useState, useEffect } from 'react';
import { Watch, Smartphone, Link2, Link2Off, RefreshCw, Activity, Footprints, Flame, Heart, Loader2, Check, AlertCircle } from 'lucide-react';
import {
    WearablePlatform,
    HealthData,
    WearableConnection,
    getAvailablePlatforms,
    getConnectionStatus,
    isWearableSupported,
    connectGoogleFit,
    disconnectWearable,
    syncWearableData,
} from '../services/wearableService';

interface WearableConnectProps {
    onDataSync?: (data: HealthData) => void;
}

const WearableConnect: React.FC<WearableConnectProps> = ({ onDataSync }) => {
    const [connections, setConnections] = useState<Map<WearablePlatform, WearableConnection | null>>(new Map());
    const [syncing, setSyncing] = useState(false);
    const [lastSyncData, setLastSyncData] = useState<HealthData | null>(null);
    const [error, setError] = useState<string>('');

    const platforms = getAvailablePlatforms();

    // Load connection statuses on mount
    useEffect(() => {
        const loadConnections = () => {
            const newConnections = new Map<WearablePlatform, WearableConnection | null>();
            platforms.forEach(({ platform }) => {
                newConnections.set(platform, getConnectionStatus(platform));
            });
            setConnections(newConnections);
        };

        loadConnections();
    }, []);

    const handleConnect = async (platform: WearablePlatform) => {
        setError('');

        switch (platform) {
            case 'google-fit':
                connectGoogleFit();
                break;
            case 'apple-health':
                setError('Apple Health só está disponível no aplicativo iOS');
                break;
            case 'fitbit':
            case 'samsung-health':
                setError('Esta integração estará disponível em breve');
                break;
        }
    };

    const handleDisconnect = (platform: WearablePlatform) => {
        disconnectWearable(platform);
        setConnections(prev => {
            const newMap = new Map(prev);
            newMap.set(platform, null);
            return newMap;
        });
        if (lastSyncData) {
            setLastSyncData(null);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError('');

        try {
            const data = await syncWearableData();
            if (data) {
                setLastSyncData(data);
                onDataSync?.(data);
            } else {
                setError('Nenhum dado disponível para sincronizar');
            }
        } catch (err) {
            setError('Erro ao sincronizar dados');
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
        }
    };

    const getPlatformIcon = (platform: WearablePlatform) => {
        switch (platform) {
            case 'google-fit':
                return <Activity size={24} className="text-green-500" />;
            case 'apple-health':
                return <Heart size={24} className="text-red-500" />;
            case 'fitbit':
                return <Watch size={24} className="text-blue-500" />;
            case 'samsung-health':
                return <Smartphone size={24} className="text-blue-600" />;
            default:
                return <Watch size={24} />;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Watch size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Dispositivos Conectados</h2>
                        <p className="text-white/80 text-sm">Sincronize dados de atividade</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Available Platforms */}
                <div className="space-y-3">
                    {platforms.map(({ platform, name }) => {
                        const connection = connections.get(platform);
                        const isConnected = connection?.connected;
                        const isSupported = isWearableSupported(platform);

                        return (
                            <div
                                key={platform}
                                className={`p-4 rounded-xl border transition-all ${isConnected
                                        ? 'border-green-200 bg-green-50'
                                        : isSupported
                                            ? 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                                            : 'border-gray-100 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getPlatformIcon(platform)}
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{name}</h3>
                                            {isConnected && connection?.lastSync && (
                                                <p className="text-xs text-gray-500">
                                                    Última sync: {new Date(connection.lastSync).toLocaleString('pt-BR')}
                                                </p>
                                            )}
                                            {!isSupported && (
                                                <p className="text-xs text-gray-400">Não disponível</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isConnected ? (
                                            <>
                                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium px-2 py-1 bg-green-100 rounded-lg">
                                                    <Check size={14} /> Conectado
                                                </span>
                                                <button
                                                    onClick={() => handleDisconnect(platform)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Desconectar"
                                                >
                                                    <Link2Off size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect(platform)}
                                                disabled={!isSupported}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSupported
                                                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Link2 size={16} />
                                                Conectar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sync Button */}
                {Array.from(connections.values()).some(c => c?.connected) && (
                    <div className="mt-6">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {syncing ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <RefreshCw size={20} />
                            )}
                            {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                        </button>
                    </div>
                )}

                {/* Last Sync Data */}
                {lastSyncData && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-semibold text-gray-800 mb-3">Dados de Hoje</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <Footprints size={20} className="mx-auto text-blue-500 mb-1" />
                                <p className="text-lg font-bold text-gray-900">{lastSyncData.steps.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Passos</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <Flame size={20} className="mx-auto text-orange-500 mb-1" />
                                <p className="text-lg font-bold text-gray-900">{lastSyncData.caloriesBurned}</p>
                                <p className="text-xs text-gray-500">kcal</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <Activity size={20} className="mx-auto text-green-500 mb-1" />
                                <p className="text-lg font-bold text-gray-900">{lastSyncData.activeMinutes}</p>
                                <p className="text-xs text-gray-500">min ativos</p>
                            </div>
                            {lastSyncData.heartRate && (
                                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                    <Heart size={20} className="mx-auto text-red-500 mb-1" />
                                    <p className="text-lg font-bold text-gray-900">{lastSyncData.heartRate.average}</p>
                                    <p className="text-xs text-gray-500">bpm médio</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WearableConnect;
