// Cole aqui as mesmas chaves do Supabase que você usará nos outros arquivos
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');

    // Verifica se já existe uma sessão ativa
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = './admin.html';
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';

        const email = event.target.email.value;
        const password = event.target.password.value;

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            errorMessageDiv.textContent = 'Email ou senha inválidos. Tente novamente.';
            errorMessageDiv.classList.remove('hidden');
            console.error('Erro no login:', error.message);
        } else {
            window.location.href = './admin.html';
        }
    });
});
