import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportAllUserData, downloadDataAsJson } from '../../services/lgpdService';

interface DataExportButtonProps {
    userId: string;
}

const DataExportButton: React.FC<DataExportButtonProps> = ({ userId }) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const data = await exportAllUserData(userId);
            downloadDataAsJson(data);
        } catch (err) {
            console.error('[LGPD] Erro ao exportar dados:', err);
            alert('Erro ao exportar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Exportando...' : 'Exportar Meus Dados'}
        </button>
    );
};

export default DataExportButton;
