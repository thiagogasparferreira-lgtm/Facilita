/* ==========================================================================
   FACILITA - AUTHENTICATION CLIENT (AUTH.JS)
   Comunicação com o Backend FastAPI para Login, Cadastro e Validação JWT.
   ========================================================================== */

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "https://facilita-api-backend.onrender.com";
const API_AUTH_URL = `${API_BASE_URL}/api/v1/auth`;

// Auto-redirect se já estiver logado (evita mostrar form de login para quem já tem sessão)
(function autoRedirectIfLoggedIn() {
  const urlParams = new URLSearchParams(window.location.search);
  const googleToken = urlParams.get('google_token');
  
  if (googleToken) {
    // Buscar os dados do usuário a partir do token
    fetch(`${API_BASE_URL}/api/v1/auth/me?token=${googleToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          const userData = {
            token: data.new_token || googleToken,
            email: data.email,
            name: data.name,
            avatar: data.avatar_url,
            plan: data.is_pro ? 'PRO' : 'FREE',
            role: data.is_admin ? 'admin' : 'user'
          };
          localStorage.setItem('facilita_user_session', JSON.stringify(userData));
          if (userData.role === 'admin') {
            window.location.replace('../admin/index.html');
          } else {
            window.location.replace('../dashboard/index.html');
          }
        }
      });
    return;
  }

  const isAuthPage = window.location.pathname.includes('/auth/login.html') || window.location.pathname.includes('/auth/cadastro.html');
  if (isAuthPage) {
    const sessionData = localStorage.getItem('facilita_user_session');
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        if (user && user.token) {
          if (user.role === 'admin') {
            window.location.replace('../admin/index.html');
          } else {
            window.location.replace('../dashboard/index.html');
          }
        }
      } catch (e) {}
    }
  }
})();

// Exibe mensagem de erro no formulário
function showAuthError(formId, message) {
  const form = document.getElementById(formId);
  let errorDiv = form.querySelector('.auth-error-msg');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error-msg';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.padding = '10px';
    errorDiv.style.backgroundColor = '#fee2e2';
    errorDiv.style.borderRadius = '6px';
    form.insertBefore(errorDiv, form.querySelector('button[type="submit"]'));
  }
  errorDiv.textContent = message;
  
  // Limpa o botão loading se houver
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.innerHTML = btn.dataset.originalText;
}

function setBtnLoading(btn) {
  if(!btn.dataset.originalText) {
    btn.dataset.originalText = btn.innerHTML;
  }
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spin" style="width: 16px; height: 16px; animation: spin 2s linear infinite;"></i> Aguarde...`;
  if(window.lucide) window.lucide.createIcons();
}

// Configurações do Form de Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    setBtnLoading(btn);

    try {
      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Sucesso: Salva o token JWT e dados do usuário
        const userName = (data.user && data.user.name) ? data.user.name : email.split('@')[0];
        const userSession = {
          name: userName,
          email: email,
          role: (data.user && data.user.is_admin) ? "admin" : "user",
          avatar: userName.substring(0, 2).toUpperCase(),
          plan: (data.user && data.user.is_pro) ? "PRO" : "FREE",
          token: data.access_token
        };
        localStorage.setItem('facilita_user_session', JSON.stringify(userSession));
        
        // Redireciona
        if (userSession.role === 'admin') {
          window.location.href = '../admin/index.html';
        } else {
          window.location.href = '../dashboard/index.html';
        }
      } else {
        // Erro de API (ex: Senha incorreta)
        showAuthError('login-form', data.detail || "Erro ao fazer login. Tente novamente.");
      }
    } catch (error) {
      showAuthError('login-form', "Falha de conexão com o servidor.");
    }
  });
}

// Configurações do Form de Cadastro
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = registerForm.querySelector('button[type="submit"]');
    setBtnLoading(btn);

    try {
      const response = await fetch(`${API_AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Faz o login automático após o registro
        const loginResponse = await fetch(`${API_AUTH_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (loginResponse.ok) {
           const loginData = await loginResponse.json();
           const role = (email.toLowerCase() === 'admin@facilita.com' || email.toLowerCase() === 'facilita.app.contato@gmail.com') ? "admin" : "user";
           const userSession = {
             name: name,
             email: email,
             role: role,
             avatar: name.substring(0, 2).toUpperCase(),
             plan: "FREE",
             token: loginData.access_token
           };
           localStorage.setItem('facilita_user_session', JSON.stringify(userSession));
           
           if (role === 'admin') {
             window.location.href = '../admin/index.html';
           } else {
             window.location.href = '../dashboard/index.html';
           }
        } else {
           window.location.href = '../auth/login.html';
        }
      } else {
        showAuthError('register-form', data.detail || "Erro ao criar conta.");
      }
    } catch (error) {
      showAuthError('register-form', "Falha de conexão com o servidor de registro.");
    }
  });
}

// Login de Terceiros (Google Placeholder)
const googleLoginBtn = document.getElementById('google-login-btn');
const googleRegisterBtn = document.getElementById('google-register-btn');

function handleGoogleMock() {
  alert("O Login com Google será implementado na Fase 3 do projeto.");
}

if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleMock);
if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleMock);

// Função auxiliar para verificar sessão (Segurança de Rotas Frontend)
function checkAuth(requiredRole = null) {
  if (window.location.search.includes('google_token=')) {
    return { name: "Carregando...", role: "user", email: "..." };
  }

  const sessionData = localStorage.getItem('facilita_user_session');
  if (!sessionData) {
    window.location.href = '../auth/login.html';
    return null;
  }
  
  const user = JSON.parse(sessionData);
  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'admin' && user.role === 'user') {
      window.location.href = '../dashboard/index.html';
    } else {
      window.location.href = '../auth/login.html';
    }
    return null;
  }
  
  return user;
}

// Deslogar Usuário
function logout(e) {
  if (e && e.preventDefault) e.preventDefault();
  localStorage.removeItem('facilita_user_session');
  window.location.href = '../index.html';
}

// CSS embutido para animação de loading no JS
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin { 100% { transform: rotate(360deg); } }
.lucide-spin { animation: spin 1.5s linear infinite; }
`;
document.head.appendChild(style);
