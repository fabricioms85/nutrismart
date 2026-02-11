import React from 'react';

const TermsOfUseContent: React.FC = () => (
    <div className="space-y-5">
        <p className="text-gray-500 text-xs">Última atualização: Fevereiro de 2026</p>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
            <p>
                Ao acessar ou utilizar o NutriSmart, você concorda com estes Termos de Uso.
                Se não concordar, não utilize o aplicativo.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">2. Natureza do Serviço</h3>
            <p>
                O NutriSmart é uma <strong>ferramenta de apoio</strong> para acompanhamento nutricional e
                bem-estar. O aplicativo <strong>não substitui orientação médica, nutricional ou de
                qualquer profissional de saúde</strong>.
            </p>
            <p className="mt-2">
                As informações fornecidas pelo aplicativo, incluindo análises de refeições,
                cálculos nutricionais e sugestões do assistente de inteligência artificial,
                são de caráter informativo e educacional.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">3. Uso de Inteligência Artificial</h3>
            <p>
                O NutriSmart utiliza o serviço Google Gemini para análise de imagens de alimentos,
                sugestões nutricionais e interações com o assistente virtual. As respostas geradas
                por IA <strong>podem conter imprecisões</strong> e não devem ser interpretadas como
                aconselhamento médico ou nutricional profissional.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">4. Dados de Terceiros</h3>
            <p>
                Informações nutricionais de produtos consultados por código de barras são obtidas
                do <strong>Open Food Facts</strong>, um banco de dados colaborativo. O NutriSmart não
                garante a acurácia, completude ou atualidade desses dados.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">5. Conta e Responsabilidades</h3>
            <p>
                Você é responsável por manter a segurança de suas credenciais de acesso.
                Os dados inseridos no aplicativo (refeições, peso, exercícios) são de sua responsabilidade.
                O NutriSmart não se responsabiliza por decisões tomadas com base nas informações do aplicativo.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">6. Propriedade Intelectual</h3>
            <p>
                O NutriSmart, incluindo sua interface, design, código e conteúdo, é protegido por
                direitos de propriedade intelectual. É proibida a reprodução, distribuição ou
                modificação sem autorização prévia.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">7. Limitação de Responsabilidade</h3>
            <p>
                Na máxima extensão permitida por lei, o NutriSmart não será responsável por
                danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou
                impossibilidade de uso do aplicativo.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">8. Modificações</h3>
            <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento.
                Alterações significativas serão comunicadas através do aplicativo.
                O uso continuado após modificações constitui aceitação dos novos termos.
            </p>
        </section>

        <section>
            <h3 className="font-bold text-gray-900 mb-2">9. Contato</h3>
            <p>
                Para dúvidas sobre estes termos, utilize o formulário de suporte disponível
                no aplicativo ou entre em contato pelo e-mail informado na seção de ajuda.
            </p>
        </section>
    </div>
);

export default TermsOfUseContent;
