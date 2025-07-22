// Substitua pelas suas variáveis de ambiente ou cole as chaves diretamente para teste
const SUPABASE_URL = 'https://opxrwwqugnjmwmftfyct.supabase.co'; // Ex: https://seusite.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9weHJ3d3F1Z25qbXdtZnRmeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTYxNjEsImV4cCI6MjA2ODc5MjE2MX0.DVp2kgLhumoiaN_3mcXXe_1HvjWVG2xZ6Jur6_vLBUU'; // Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Inicializa o Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Formulário
    const simulationForm = document.getElementById('simulation-form');
    const propertyValueInput = document.getElementById('property-value');
    const downPaymentInput = document.getElementById('down-payment');
    const loanTermSelect = document.getElementById('loan-term');
    const resultsDiv = document.getElementById('results');
    
    // Elementos de Erro
    const downPaymentMinError = document.getElementById('down-payment-min-error');
    const downPaymentMaxError = document.getElementById('down-payment-max-error');

    // Elementos do Modal e PDF
    const signatureModal = document.getElementById('signature-modal');
    const generateProposalBtn = document.getElementById('generate-proposal');
    const cancelSignatureBtn = document.getElementById('cancel-signature');
    const confirmSignatureBtn = document.getElementById('confirm-signature');
    const signerNameInput = document.getElementById('signer-name');

    // Variável para armazenar os dados da simulação atual
    let currentSimulationData = null;



    // Função para formatar o valor como moeda brasileira (BRL)
    const formatCurrency = (input) => {
        let value = input.value.replace(/\D/g, '');
        if (value === '') {
            input.value = '';
            return;
        }
        value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        input.value = value;
    };

    // Função para obter o valor numérico de um campo de moeda
    const getNumericValue = (input) => {
        const value = input.value.replace(/\D/g, '');
        return value ? parseFloat(value) / 100 : 0;
    };

    // Validação da entrada mínima (20%)
    const validateDownPayment = () => {
        const propertyValue = getNumericValue(propertyValueInput);
        const downPayment = getNumericValue(downPaymentInput);

        if (propertyValue > 0 && downPayment > 0) {
            // Valida se a entrada é maior que o imóvel
            if (downPayment > propertyValue) {
                downPaymentMaxError.classList.remove('hidden');
            } else {
                downPaymentMaxError.classList.add('hidden');
            }

            // Valida a entrada mínima de 20%
            const minDownPayment = propertyValue * 0.20;
            if (downPayment < minDownPayment) {
                downPaymentMinError.classList.remove('hidden');
            } else {
                downPaymentMinError.classList.add('hidden');
            }
        } else {
            // Esconde os erros se os campos estiverem vazios
            downPaymentMinError.classList.add('hidden');
            downPaymentMaxError.classList.add('hidden');
        }
    };

    // Adiciona os event listeners para formatação e validação
    propertyValueInput.addEventListener('input', () => {
        formatCurrency(propertyValueInput);
        validateDownPayment();
    });

    downPaymentInput.addEventListener('input', () => {
        formatCurrency(downPaymentInput);
        validateDownPayment();
    });

    // Lógica de cálculo e submissão do formulário
        // Função para gerar o PDF
    // Função para salvar a submissão no Supabase
    const saveSubmission = async (submissionData) => {
        const { error } = await supabase
            .from('submissions')
            .insert([submissionData]);

        if (error) {
            console.error('Erro ao salvar no Supabase:', error);
            throw error;
        }

        console.log('Dados salvos com sucesso no Supabase!');
    };

    const generatePDF = (data, signerName) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Cabeçalho
        doc.setFontSize(18);
        doc.text('Proposta de Simulação de Financiamento', 105, 20, { align: 'center' });

        // Detalhes
        doc.setFontSize(12);
        doc.text(`Data da Proposta: ${new Date().toLocaleDateString('pt-BR')}`, 14, 40);
        doc.line(14, 45, 196, 45);
        doc.text(`Valor do Imóvel: ${formatBRL(data.propertyValue)}`, 14, 55);
        doc.text(`Valor da Entrada: ${formatBRL(data.downPayment)}`, 14, 63);
        doc.text(`Valor Financiado: ${formatBRL(data.loanAmount)}`, 14, 71);
        doc.text(`Prazo: ${data.loanTerm} meses (${data.loanTerm / 12} anos)`, 14, 79);
        doc.text(`Taxa de Juros Anual: 12.00% (Tabela Price)`, 14, 87);
        doc.line(14, 95, 196, 95);

        // Resultados
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Valor da Parcela Mensal: ${formatBRL(data.monthlyPayment)}`, 14, 105);
        doc.text(`Custo Efetivo Total: ${formatBRL(data.totalCost)}`, 14, 113);
        doc.setFont('helvetica', 'normal');
        doc.line(14, 125, 196, 125);

        // Assinatura
        doc.setFontSize(10);
        doc.text('Declaro que li e concordo com os termos e valores apresentados nesta simulação.', 14, 135);
        doc.line(40, 160, 170, 160); 
        doc.setFontSize(12);
        doc.text(signerName, 105, 158, { align: 'center' });
        doc.setFontSize(8);
        doc.text('(Assinatura Digital)', 105, 165, { align: 'center' });

        doc.save('proposta-financiamento.pdf');
    };

    // Event Listeners do Modal
    generateProposalBtn.addEventListener('click', () => {
        if (currentSimulationData) {
            signatureModal.classList.remove('hidden');
        }
    });

    cancelSignatureBtn.addEventListener('click', () => {
        signatureModal.classList.add('hidden');
        signerNameInput.value = '';
    });

    confirmSignatureBtn.addEventListener('click', () => {
        const signerName = signerNameInput.value.trim();
        if (signerName === '') {
            alert('Por favor, digite seu nome completo para assinar.');
            return;
        }
                // Prepara os dados para o Supabase (nomes das colunas devem corresponder)
        const submissionData = {
            signer_name: signerName,
            property_value: currentSimulationData.propertyValue,
            down_payment: currentSimulationData.downPayment,
            loan_amount: currentSimulationData.loanAmount,
            loan_term: currentSimulationData.loanTerm,
            monthly_payment: currentSimulationData.monthlyPayment,
            total_cost: currentSimulationData.totalCost
        };

        // Salva no Supabase e depois gera o PDF
        saveSubmission(submissionData)
            .then(() => {
                generatePDF(currentSimulationData, signerName);
                alert('Proposta assinada e salva com sucesso!');
            })
            .catch(error => {
                alert('Ocorreu um erro ao salvar sua proposta. Por favor, tente novamente.');
            })
            .finally(() => {
                signatureModal.classList.add('hidden');
                signerNameInput.value = '';
            });
    });

    // Lógica de cálculo e submissão do formulário
    simulationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const propertyValue = getNumericValue(propertyValueInput);
        const downPayment = getNumericValue(downPaymentInput);
        const loanTerm = parseInt(loanTermSelect.value, 10);
        const resultsDiv = document.getElementById('results');

        // Validações finais antes do cálculo
        const minDownPayment = propertyValue * 0.20;
        if (downPayment < minDownPayment || downPayment > propertyValue || propertyValue <= 0) {
            alert('Por favor, corrija os valores do formulário antes de simular.');
            resultsDiv.classList.add('hidden'); // Garante que resultados antigos sejam escondidos
            return;
        }

        // Cálculo do Financiamento (Tabela Price)
        const loanAmount = propertyValue - downPayment;
        const annualInterestRate = 0.12;
        const monthlyInterestRate = annualInterestRate / 12;
        
        const numerator = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm);
        const denominator = Math.pow(1 + monthlyInterestRate, loanTerm) - 1;
        const monthlyPayment = numerator / denominator;

        const totalCost = monthlyPayment * loanTerm;

        // Exibição dos resultados
        document.getElementById('monthly-payment').textContent = monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('total-cost').textContent = totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        resultsDiv.classList.remove('hidden');

        // Armazena os dados para o PDF
        currentSimulationData = {
            propertyValue,
            downPayment,
            loanAmount,
            loanTerm,
            monthlyPayment,
            totalCost
        };
    });
});
