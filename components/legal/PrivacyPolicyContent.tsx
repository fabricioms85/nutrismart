import React from 'react';

const PrivacyPolicyContent: React.FC = () => (
    <div className="space-y-5">
        <p className="text-gray-500 text-xs">Última atualização: Fevereiro de 2026</p>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">1. Dados Coletados</h3>
            <p>O NutriSmart coleta e processa os seguintes dados pessoais:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
                <li><strong>Dados de conta:</strong> nome, e-mail e senha (criptografada).</li>
                <li><strong>Dados de perfil:</strong> peso, altura, idade, sexo e objetivos de saúde.</li>
                <li><strong>Dados nutricionais:</strong> refeições registradas, ingredientes, calorias e macronutrientes.</li>
                <li><strong>Dados de atividade:</strong> exercícios físicos, consumo de água e histórico de peso.</li>
                <li><strong>Imagens de alimentos:</strong> fotos enviadas para análise nutricional por IA.</li>
                <li><strong>Conversas com o assistente:</strong> histórico de interações com o assistente de IA.</li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">2. Base Legal (LGPD)</h3>
            <p>Tratamos seus dados com as seguintes bases legais:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>
                    <strong>Execução de contrato (Art. 7º, V):</strong> dados de conta, perfil,
                    refeições, exercícios e histórico — necessários para a prestação do serviço.
                </li>
                <li>
                    <strong>Consentimento (Art. 7º, I):</strong> envio de imagens para análise por IA
                    e interações com o assistente virtual.
                </li>
                <li>
                    <strong>Legítimo interesse (Art. 7º, IX):</strong> métricas de uso e melhorias
                    do aplicativo.
                </li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">3. Compartilhamento de Dados</h3>
            <p>Seus dados podem ser compartilhados com os seguintes serviços:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>
                    <strong>Supabase:</strong> armazenamento seguro do banco de dados e autenticação.
                    Dados armazenados em servidores protegidos com criptografia.
                </li>
                <li>
                    <strong>Google Gemini (IA):</strong> imagens de alimentos e contexto nutricional
                    são enviados para análise. Dados processados conforme a política de privacidade do Google.
                </li>
                <li>
                    <strong>Open Food Facts:</strong> códigos de barras de produtos são consultados
                    nesta base pública. Nenhum dado pessoal é enviado nesta consulta.
                </li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">4. Armazenamento Local</h3>
            <p>
                O aplicativo pode armazenar dados localmente no seu dispositivo através de
                <strong> localStorage</strong> e <strong>Service Worker cache</strong> para funcionamento
                offline e melhor desempenho. Esses dados permanecem no seu dispositivo e podem ser
                limpos nas configurações do navegador.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">5. Seus Direitos (LGPD)</h3>
            <p>Conforme a Lei Geral de Proteção de Dados, você tem direito a:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
                <li><strong>Acesso:</strong> consultar todos os dados que temos sobre você.</li>
                <li><strong>Correção:</strong> atualizar dados imprecisos ou incompletos.</li>
                <li><strong>Exclusão:</strong> solicitar a remoção dos seus dados pessoais.</li>
                <li><strong>Portabilidade:</strong> exportar seus dados em formato estruturado (JSON).</li>
                <li><strong>Revogação:</strong> retirar consentimento a qualquer momento.</li>
            </ul>
            <p className="mt-2">
                Para exercer esses direitos, acesse a seção <strong>"Seus Dados"</strong> na página
                de Perfil do aplicativo.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">6. Retenção de Dados</h3>
            <p>
                Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão
                da conta, todos os dados pessoais serão permanentemente removidos em até 30 dias,
                incluindo imagens armazenadas.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">7. Segurança</h3>
            <p>
                Utilizamos medidas técnicas e organizacionais para proteger seus dados, incluindo
                criptografia em trânsito (HTTPS/TLS), autenticação segura, e políticas de acesso
                restrito por linha (Row Level Security) no banco de dados.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">8. Contato do Encarregado</h3>
            <p>
                Para questões relacionadas à proteção de dados pessoais, utilize o formulário de
                suporte disponível no aplicativo ou entre em contato pelo canal informado na seção de ajuda.
            </p>
        </section>
    </div>
);

export default PrivacyPolicyContent;
