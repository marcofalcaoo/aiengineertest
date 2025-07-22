// Cole aqui as mesmas chaves do Supabase que você usará nos outros arquivos
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

// Inicializa o Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o usuário está logado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Se não estiver logado, redireciona para a página de login
        window.location.href = './login.html';
        return;
    }

    const tableBody = document.getElementById('submissions-table-body');
    const logoutButton = document.getElementById('logout-button');

    const formatBRL = (value) => {
        if (typeof value !== 'number') return 'N/A';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const fetchSubmissions = async () => {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .order('created_at', { ascending: false }); // Ordena pelas mais recentes

        if (error) {
            console.error('Erro ao buscar propostas:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-red-500">Erro ao carregar os dados. Tente novamente mais tarde.</td></tr>`;
            return;
        }

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-gray-500">Nenhuma proposta salva ainda.</td></tr>`;
            return;
        }

        tableBody.innerHTML = ''; // Limpa o estado de 'carregando'

        data.forEach(submission => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-5 py-4 border-b border-gray-200 text-sm">${formatDate(submission.created_at)}</td>
                <td class="px-5 py-4 border-b border-gray-200 text-sm">${submission.signer_name || 'N/A'}</td>
                <td class="px-5 py-4 border-b border-gray-200 text-sm">${formatBRL(submission.property_value)}</td>
                <td class="px-5 py-4 border-b border-gray-200 text-sm">${formatBRL(submission.loan_amount)}</td>
                <td class="px-5 py-4 border-b border-gray-200 text-sm font-medium text-green-600">${formatBRL(submission.monthly_payment)}</td>
            `;
            tableBody.appendChild(row);
        });
    };

    fetchSubmissions();

    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
        } else {
            // Redireciona para a página de login após o logout
            window.location.href = './login.html';
        }
    });
});
