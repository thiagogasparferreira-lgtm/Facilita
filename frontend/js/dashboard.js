/* ==========================================================================
   FACILITA - DASHBOARD CONTROLLER (DASHBOARD.JS)
   Controle de Abas, Sessão, Favoritos Dinâmicos e Métricas do Admin.
   ========================================================================== */

// API_BASE_URL já é importada globalmente via auth.js
const ADMIN_API_URL = `${API_BASE_URL}/api/v1/admin`;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. SEGURANÇA E LEITURA DE SESSÃO
    const isPageAdmin = window.location.pathname.includes('/admin/');
    const requiredRole = isPageAdmin ? 'admin' : null;
    const user = checkAuth(requiredRole);
    
    if (!user) return; // Se redirecionou, encerra execução

    // Atualizar dados de exibição do usuário na Sidebar
    const avatarInitials = document.getElementById('user-avatar-initials');
    const userDispName = document.getElementById('user-display-name');
    const userDispPlan = document.getElementById('user-display-plan');
    
    const userName = user.name || user.email || "Usuário";
    const userAvatar = user.avatar || userName.substring(0,2).toUpperCase();
    const userPlan = user.plan || "FREE";

    if (avatarInitials) avatarInitials.textContent = userAvatar;
    if (userDispName) userDispName.textContent = userName;
    
    const greetingTitle = document.getElementById('greeting-title');
    if (greetingTitle) greetingTitle.textContent = `Olá, ${userName} 👋`;

    if (userDispPlan) {
      userDispPlan.textContent = userPlan === 'PRO' ? 'Plano PRO' : 'Plano Gratuito';
      userDispPlan.className = `status-badge ${userPlan === 'PRO' ? 'status-success' : 'status-pending'}`;
    }

    // Auto-atualizar os dados do usuário (caso admin tenha mudado o plano)
    fetch(`${API_BASE_URL}/api/v1/auth/me?token=${user.token}`)
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          const isPro = data.is_pro;
          const currentPlan = isPro ? 'PRO' : 'FREE';
          
          if (user.plan !== currentPlan || user.is_pro !== isPro || data.new_token) {
            user.plan = currentPlan;
            user.is_pro = isPro;
            if (data.new_token) {
                user.token = data.new_token; // Atualiza o token imutável
            }
            
            localStorage.setItem('facilita_user_session', JSON.stringify(user));
            
            if (userDispPlan) {
              userDispPlan.textContent = isPro ? 'Plano PRO' : 'Plano Gratuito';
              userDispPlan.className = `status-badge ${isPro ? 'status-success' : 'status-pending'}`;
            }
            if (typeof setupUserUpgradeFlow === 'function') {
              setupUserUpgradeFlow(user);
            }
          }
        }
      })
      .catch(e => console.error("Erro ao auto-atualizar sessão:", e));

    // 2. CONTROLE DE NAVEGAÇÃO ENTRE ABAS
    const sidebarLinks = document.querySelectorAll('.sidebar-item-link');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        const tabId = link.getAttribute('data-tab');
        if (!tabId) return; // Ignora se não houver data-tab definido
        
        // Remover classe active das sidebars
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Mudar aba visível
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

  // Botão de Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // 3. FLUXOS EXCLUSIVOS DO PAINEL DO USUÁRIO
  if (!isPageAdmin) {
    // Definir saudação de boas-vindas
    const welcomeTitle = document.getElementById('welcome-title');
    if (welcomeTitle) welcomeTitle.textContent = `Olá, ${user.name}!`;

    // Atualizar métricas simples baseadas no plano
    const statsPlanType = document.getElementById('stats-plan-type');
    if (statsPlanType) statsPlanType.textContent = user.plan;

    // Carregar Favoritos Reais
    loadUserFavorites();

    // Carregar Mocks de Histórico e Arquivos
    loadUserHistoryAndFiles(user.name);

    // Sistema de Upgrade de Plano PRO
    setupUserUpgradeFlow(user);

    // Salvar configurações de formulário
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      document.getElementById('config-name').value = user.name;
      document.getElementById('config-email').value = user.email;
      
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        user.name = document.getElementById('config-name').value;
        user.email = document.getElementById('config-email').value;
        user.avatar = user.name.substring(0, 2).toUpperCase();
        
        localStorage.setItem('facilita_user_session', JSON.stringify(user));
        alert('Configurações salvas com sucesso!');
        location.reload();
      });
    }
  }

  // Carregar dados reais se estiver no painel do usuário
  if (!isPageAdmin) {
    loadUserDashboard(user.token);
  }

  // 4. FLUXOS EXCLUSIVOS DO PAINEL DO ADMINISTRADOR
  if (isPageAdmin) {
    loadAdminStats(user.token);
    loadAdminToolsTable();
    loadAdminUsersTable(user.token);
    loadAdminSubsTable();
    startAdminLogsSimulation(user.token);
    
    // Toggle de manutenção
    const adminSettingsForm = document.getElementById('admin-settings-form');
    if (adminSettingsForm) {
      adminSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
      });
    }
    
    // Controle de abas do admin
    const adminSidebarLinks = document.querySelectorAll('.sidebar-item-link');
    adminSidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        if (!tabId) return;
        
        // Estilizar botões (ativo)
        adminSidebarLinks.forEach(l => {
          l.classList.remove('active');
          l.style.color = 'var(--gray-400)';
          l.style.backgroundColor = 'transparent';
        });
        link.classList.add('active');
        link.style.color = 'white';
        link.style.backgroundColor = 'rgba(255,255,255,0.1)';
        
        // Mostrar aba correspondente
        document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.style.display = 'block';
        
        // Se abrir aba de usuários, carregar dados
        if (tabId === 'tab-users') {
          loadAdminUsers(user.token);
        }
      });
    });
  }
  
  // Inicializa ícones dinâmicos nas abas
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  } catch (e) {
    console.error("Erro na inicialização da dashboard:", e);
  }
});

// ==========================================
// FUNÇÕES DE ADMIN
// ==========================================

function loadAdminUsers(token) {
  const tbody = document.getElementById('admin-users-table');
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--gray-400);"><i data-lucide="loader-2" class="lucide-spin" style="margin:auto;"></i> Carregando...</td></tr>`;
  if(window.lucide) window.lucide.createIcons();

  fetch(`${ADMIN_API_URL}/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error("Falha ao carregar usuários");
    return res.json();
  })
  .then(data => {
    if (data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--gray-400);">Nenhum usuário encontrado.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--gray-100); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--gray-600);">
              ${u.email.substring(0,2).toUpperCase()}
            </div>
            <span style="font-size: 14px; color: var(--gray-800);">${u.email}</span>
          </div>
        </td>
        <td style="font-size: 14px; color: var(--gray-800);">${u.name || '--'}</td>
        <td>
          ${u.is_pro 
            ? '<span style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">PRO</span>'
            : '<span style="background: rgba(147, 51, 234, 0.1); color: #9333EA; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">FREE</span>'
          }
        </td>
        <td>
          ${u.is_admin 
            ? '<span style="background: rgba(239, 68, 68, 0.1); color: #EF4444; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Admin</span>'
            : '<span style="color: var(--gray-500); font-size: 13px;">Usuário</span>'
          }
        </td>
        <td style="font-size: 13px; color: var(--gray-500);">
          ${new Date(u.created_at).toLocaleDateString('pt-BR')}
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button onclick="toggleUserPlan(${u.id}, ${u.is_pro})" style="background: transparent; border: none; cursor: pointer; color: ${u.is_pro ? '#F59E0B' : 'var(--gray-400)'};" title="Alternar Plano">
              <i data-lucide="star" style="width: 18px; height: 18px; ${u.is_pro ? 'fill: currentColor;' : ''}"></i>
            </button>
            <button onclick="deleteUser(${u.id})" style="background: transparent; border: none; cursor: pointer; color: #EF4444;" title="Excluir Usuário">
              <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    if(window.lucide) window.lucide.createIcons();
  })
  .catch(err => {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #EF4444;">Erro ao carregar lista de usuários.</td></tr>`;
  });
}

async function toggleUserPlan(userId, isPro) {
  const token = JSON.parse(localStorage.getItem('facilita_user_session')).token;
  if (!confirm(`Deseja ${isPro ? 'rebaixar' : 'promover'} este usuário?`)) return;
  
  try {
    const res = await fetch(`${ADMIN_API_URL}/users/${userId}/plan`, {
      method: 'PATCH',
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      alert("Sucesso: " + data.message);
      loadAdminUsers(token);
    } else {
      alert("Erro: " + data.detail);
    }
  } catch (e) {
    alert("Erro de comunicação com o servidor.");
  }
}

async function deleteUser(userId) {
  const token = JSON.parse(localStorage.getItem('facilita_user_session')).token;
  if (!confirm("Tem certeza que deseja excluir este usuário permanentemente? Todas as conversões dele serão perdidas!")) return;
  
  try {
    const res = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      alert("Sucesso: " + data.message);
      loadAdminUsers(token);
    } else {
      alert("Erro: " + data.detail);
    }
  } catch (e) {
    alert("Erro de comunicação com o servidor.");
  }
}/* ==========================================================================
   FUNÇÕES AUXILIARES - PAINEL DO USUÁRIO
   ========================================================================== */

function loadUserFavorites() {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  const favoriteIds = JSON.parse(localStorage.getItem('facilita_favorites') || '[]');
  
  if (favoriteIds.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #fff; border: 1px solid var(--gray-200); border-radius: 12px; color: var(--gray-400);">
        <i data-lucide="star-off" style="width: 48px; height: 48px; margin: 0 auto 16px auto;"></i>
        <p style="font-weight: 600;">Nenhuma ferramenta favoritada ainda.</p>
        <p style="font-size: 13px;">Clique na estrela dentro das ferramentas para marcá-las como favoritas.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Buscar lista de ferramentas
  fetch('../tools.json')
    .then(res => res.json())
    .then(tools => {
      const favTools = tools.filter(t => favoriteIds.includes(t.id));
      container.innerHTML = '';
      
      favTools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = `
          <div class="tool-card-top">
            <div class="tool-icon"><i data-lucide="${tool.icone}"></i></div>
            <div class="tool-card-info">
              <h3>${tool.nome}</h3>
              <p>${tool.descricao}</p>
            </div>
          </div>
          <div class="tool-card-action">
            <span class="tool-tag">${tool.categoria}</span>
            <a href="../${tool.rota}" class="btn btn-secondary btn-sm" style="padding: 6px 16px; font-size: 13px;">
              Abrir <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
            </a>
          </div>
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    });
}

function loadUserHistoryAndFiles(userName) {
  // Histórico
  const historyBody = document.getElementById('history-table-body');
  if (historyBody) {
    const historyData = [
      { tool: "Remover Fundo", date: "Hoje, 14:32", status: "Concluído" },
      { tool: "Gerador de QR Code", date: "Ontem, 18:12", status: "Concluído" },
      { tool: "PDF para Word", date: "04 Jul 2026, 09:45", status: "Concluído" }
    ];
    
    historyBody.innerHTML = historyData.map(h => `
      <tr>
        <td style="font-weight:700;">${h.tool}</td>
        <td>${h.date}</td>
        <td><span class="status-badge status-success">${h.status}</span></td>
        <td><i data-lucide="external-link" class="action-icon-btn" title="Abrir Ferramenta"></i></td>
      </tr>
    `).join('');
    
    document.getElementById('stats-total-tasks').textContent = historyData.length + 11; // Adiciona offset fictício
  }

  // Arquivos
  const filesBody = document.getElementById('files-table-body');
  if (filesBody) {
    const filesData = [
      { name: "foto_perfil_sem_fundo.png", size: "1.4 MB", date: "Hoje, 14:32" },
      { name: "menu_restaurante_qr.png", size: "245 KB", date: "Ontem, 18:12" },
      { name: "contrato_servicos_assinado.pdf", size: "480 KB", date: "03 Jul 2026, 11:20" }
    ];

    filesBody.innerHTML = filesData.map(f => `
      <tr>
        <td style="font-weight: 700;"><i data-lucide="file" style="width:14px; height:14px; margin-right:6px; color:var(--primary-blue);"></i>${f.name}</td>
        <td>${f.size}</td>
        <td>${f.date}</td>
        <td style="display:flex; gap:12px;">
          <i data-lucide="download" class="action-icon-btn" title="Download"></i>
          <i data-lucide="trash-2" class="action-icon-btn" style="color:#ef4444;" title="Excluir"></i>
        </td>
      </tr>
    `).join('');

    document.getElementById('stats-total-files').textContent = filesData.length;
  }
  lucide.createIcons();
}

function setupUserUpgradeFlow(user) {
  const currentPlanStrong = document.getElementById('current-plan-strong');
  const proBadgeStatus = document.getElementById('pro-badge-status');
  const upgradeBtn = document.getElementById('upgrade-plan-btn');
  const statsPlanType = document.getElementById('stats-plan-type');
  
  if (user.is_pro || user.plan === 'PRO') {
    if (currentPlanStrong) currentPlanStrong.textContent = "Plano PRO (Acesso Ilimitado)";
    if (proBadgeStatus) {
      proBadgeStatus.textContent = "ATIVO";
      proBadgeStatus.className = "pro-badge status-success";
    }
    if (upgradeBtn) {
      upgradeBtn.textContent = "Você já é PRO!";
      upgradeBtn.className = "btn btn-secondary";
      upgradeBtn.disabled = true;
      upgradeBtn.style.backgroundColor = "transparent";
      upgradeBtn.style.color = "#10B981";
      upgradeBtn.style.borderColor = "#10B981";
    }
  }

  if (upgradeBtn && (!user.is_pro || user.plan === 'FREE')) {
    upgradeBtn.addEventListener('click', async () => {
      const modal = document.getElementById('checkout-modal');
      const loadingDiv = document.getElementById('checkout-loading');
      const qrDiv = document.getElementById('checkout-qr');
      const successDiv = document.getElementById('checkout-success');
      const qrImage = document.getElementById('pix-qr-image');
      const copyBtn = document.getElementById('copy-pix-btn');
      const closeBtn = document.getElementById('close-checkout');
      const finishBtn = document.getElementById('finish-checkout-btn');

      if (!modal) return;
      
      // Setup initial modal state
      modal.style.display = 'flex';
      loadingDiv.style.display = 'block';
      qrDiv.style.display = 'none';
      successDiv.style.display = 'none';

      // Close logic
      const closeModal = () => { modal.style.display = 'none'; };
      closeBtn.onclick = closeModal;
      finishBtn.onclick = () => location.reload();

      try {
        // Gera o PIX
        const res = await fetch(`${API_BASE_URL}/api/v1/payments/pix/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ plan_name: "PRO_MONTHLY" })
        });
        const data = await res.json();
        
        if (data.success) {
          loadingDiv.style.display = 'none';
          qrDiv.style.display = 'block';
          
          // Set image
          if (data.pix_base64) {
            qrImage.src = `data:image/png;base64,${data.pix_base64}`;
          }

          // Copy button
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(data.pix_qrcode_data);
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Copiado!';
            if (window.lucide) lucide.createIcons();
            setTimeout(() => {
              copyBtn.innerHTML = originalHtml;
              if (window.lucide) lucide.createIcons();
            }, 2000);
          };

          if (window.lucide) lucide.createIcons();

          // Polling
          let polling = true;
          closeBtn.addEventListener('click', () => { polling = false; }, {once: true});

          // Se for o PIX Mockado (sem chave MP configurada), simula a aprovação em 10 segundos
          if (data.pix_qrcode_data.includes("Facilita PRO")) {
            setTimeout(async () => {
              if (polling) {
                await fetch(`${API_BASE_URL}/api/v1/payments/webhook/mock`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ transaction_id: data.transaction_id, status: "approved" })
                });
              }
            }, 8000);
          }

          const pollInterval = setInterval(async () => {
            if (!polling) {
              clearInterval(pollInterval);
              return;
            }
            try {
              const statusRes = await fetch(`${API_BASE_URL}/api/v1/payments/${data.transaction_id}/status`, {
                headers: { "Authorization": `Bearer ${user.token}` }
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.status === 'approved') {
                  clearInterval(pollInterval);
                  qrDiv.style.display = 'none';
                  successDiv.style.display = 'block';
                  
                  // Simulate webhook local update just in case
                  user.is_pro = true;
                  user.plan = 'PRO';
                  localStorage.setItem('facilita_user_session', JSON.stringify(user));
                }
              }
            } catch (e) {
              console.error("Polling error", e);
            }
          }, 5000);

        } else {
          alert("Erro ao gerar PIX: " + data.detail);
          closeModal();
        }
      } catch (error) {
        console.error("Erro no pagamento", error);
        alert("Falha na conexão com o sistema de pagamento.");
        closeModal();
      }
      upgradeBtn.disabled = false;
    });
  }
}

/* ==========================================================================
   FUNÇÕES AUXILIARES - PAINEL DO ADMINISTRADOR
   ========================================================================== */

function loadAdminToolsTable() {
  const tableBody = document.getElementById('admin-tools-table-body');
  if (!tableBody) return;

  fetch('../tools.json')
    .then(res => res.json())
    .then(tools => {
      tableBody.innerHTML = tools.map((t, idx) => `
        <tr>
          <td style="font-weight:700;">
            <i data-lucide="${t.icone}" style="width:14px; height:14px; margin-right:6px; color:var(--primary-blue);"></i>${t.nome}
          </td>
          <td><span class="tool-tag">${t.categoria}</span></td>
          <td>${(idx + 1) * 324} reqs</td>
          <td><span class="status-badge status-success">Ativa</span></td>
          <td style="display:flex; gap:16px;">
            <button class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:11px;" onclick="alert('Funcionalidade de edição de SEO de API disponível no FastAPI.')">Editar SEO</button>
            <i data-lucide="toggle-left" class="action-icon-btn" title="Desativar ferramenta" style="font-size:20px; align-self:center;"></i>
          </td>
        </tr>
      `).join('');
      lucide.createIcons();
    });
}

function loadAdminStats(token) {
  fetch(`${ADMIN_API_URL}/stats`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error(`Erro ${res.status} ao carregar estatísticas`);
    return res.json();
  })
  .then(json => {
    // API retorna dados diretamente (sem wrapper success)
    const el = (id) => document.getElementById(id);
    if (el('admin-stats-users')) el('admin-stats-users').textContent = json.total_users ?? '--';
    if (el('admin-stats-pro')) el('admin-stats-pro').textContent = json.total_pro_users ?? '--';
    if (el('admin-stats-free')) el('admin-stats-free').textContent = (json.total_users - json.total_pro_users) ?? '--';
    if (el('admin-stats-logs')) el('admin-stats-logs').textContent = json.total_conversions ?? '--';
  })
  .catch(e => {
    console.error('Admin stats error:', e);
    const el = document.getElementById('admin-stats-users');
    if (el) el.closest('.admin-card')?.insertAdjacentHTML('beforeend',
      `<p style="color:#ef4444;font-size:12px;margin-top:8px;">⚠️ ${e.message}</p>`);
  });
}

function loadAdminUsersTable(token) {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  fetch(`${ADMIN_API_URL}/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error(`Erro ${res.status} ao carregar usuários`);
    return res.json();
  })
  .then(json => {
    // API retorna { total, users: [...] }
    const users = json.users || [];
    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Nenhum usuário encontrado.</td></tr>';
      return;
    }
    tableBody.innerHTML = users.map(u => `
      <tr>
        <td style="font-weight:700;">${u.name || '--'}</td>
        <td>${u.email}</td>
        <td><span class="status-badge ${u.is_pro ? 'status-success' : 'status-pending'}">${u.is_pro ? 'PRO' : 'FREE'}</span></td>
        <td><span class="status-badge status-success">Ativo</span></td>
        <td style="display:flex; gap:12px;">
          <button class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:11px; color:#ef4444; border-color:#fca5a5;" onclick="alert('Funcionalidade de bloqueio disponível em breve.')">Bloquear</button>
        </td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  })
  .catch(e => {
    console.error('Admin users error:', e);
    tableBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;text-align:center;">⚠️ ${e.message}</td></tr>`;
  });
}

function loadAdminSubsTable(token) {
  // Usa o endpoint de logs para buscar conversões recentes como histórico de atividade
  const tableBody = document.getElementById('admin-subs-table-body');
  if (!tableBody) return;

  // Mostra estado de carregamento
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Carregando...</td></tr>';

  fetch(`${ADMIN_API_URL}/logs`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error(`Erro ${res.status} ao carregar histórico`);
    return res.json();
  })
  .then(json => {
    // Usa as conversões recentes como proxy do histórico de transações
    const conversions = (json.conversions || []).slice(0, 10);
    if (conversions.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Nenhuma atividade registrada.</td></tr>';
      return;
    }
    tableBody.innerHTML = conversions.map(c => `
      <tr>
        <td style="font-family:monospace; font-weight:700;">#${c.id}</td>
        <td>${c.tool_id || '--'}</td>
        <td style="font-weight:700; color:var(--primary-blue);">--</td>
        <td>--</td>
        <td style="font-size:12px;">${c.created_at ? c.created_at.substring(0,16).replace('T',' ') : '--'}</td>
        <td><span class="status-badge ${c.status === 'success' ? 'status-success' : 'status-pending'}">${c.status || '--'}</span></td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  })
  .catch(e => {
    console.error('Admin subs error:', e);
    tableBody.innerHTML = `<tr><td colspan="6" style="color:#ef4444;text-align:center;">⚠️ ${e.message}</td></tr>`;
  });
}

let lastLogFetch = 0;
function startAdminLogsSimulation(token) {
  const logTerminal = document.getElementById('admin-logs-terminal');
  if (!logTerminal) return;

  function fetchLogs() {
    fetch(`${ADMIN_API_URL}/logs`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json();
    })
    .then(json => {
      // API retorna { conversions: [...], system_logs: [...] }
      logTerminal.innerHTML = '';
      const sysLogs = (json.system_logs || []).slice(0, 20);
      const convLogs = (json.conversions || []).slice(0, 10);

      if (sysLogs.length === 0 && convLogs.length === 0) {
        appendLog(logTerminal, 'Nenhum log registrado ainda.', 'info');
        return;
      }

      // Exibe logs de sistema
      sysLogs.forEach(log => {
        appendLog(logTerminal,
          `${(log.created_at || '').substring(0,19).replace('T',' ')} [${log.event_type}] ${log.description}`,
          log.event_type === 'error' ? 'error' : 'info'
        );
      });

      // Exibe conversões como logs de atividade
      const activityTable = document.getElementById('admin-recent-activity-table');
      if (activityTable) {
        if (convLogs.length === 0) {
          activityTable.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);">Nenhuma atividade recente.</td></tr>';
        } else {
          activityTable.innerHTML = convLogs.map(c => {
            const initial = c.user_email ? c.user_email.substring(0,1).toUpperCase() : '?';
            const emailDisp = c.user_email || 'Anônimo';
            const statusClass = c.status === 'success' ? 'status-success' : (c.status === 'failed' ? 'status-pending' : 'status-pending');
            const statusDisp = c.status === 'success' ? 'Sucesso' : (c.status === 'failed' ? 'Falhou' : 'Processando');
            
            // Calculando tempo relativo simples
            const diffMs = new Date() - new Date(c.created_at + 'Z');
            const diffMins = Math.floor(diffMs / 60000);
            const timeDisp = diffMins < 1 ? 'Agora' : (diffMins < 60 ? `${diffMins} min atrás` : `${Math.floor(diffMins/60)}h atrás`);

            return `
              <tr>
                <td><div style="display:flex; align-items:center; gap:8px;"><div style="width:24px; height:24px; border-radius:50%; background:#E2E8F0; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color: #1e293b;">${initial}</div> ${emailDisp}</div></td>
                <td>${c.tool_id || '--'}</td>
                <td><span class="status-badge ${statusClass}">${statusDisp}</span></td>
                <td>${timeDisp}</td>
              </tr>
            `;
          }).join('');
        }
      }

      convLogs.forEach(c => {
        appendLog(logTerminal,
          `${(c.created_at || '').substring(0,19).replace('T',' ')} [TOOL] ${c.tool_id} → ${c.status} (${c.original_filename || 'arquivo'})`,
          c.status === 'failed' ? 'error' : 'info'
        );
      });
    })
    .catch(e => {
      console.error('Logs fetch error:', e);
      logTerminal.innerHTML = `<div style="color:#ef4444;">⚠️ Falha ao carregar logs: ${e.message}</div>`;
    });
  }
  
  fetchLogs();
  setInterval(fetchLogs, 10000); // Atualiza a cada 10 segundos
}

function appendLog(terminal, message, typeStr) {
  const logLine = document.createElement('div');
  logLine.className = 'admin-log-line';
  
  let type = typeStr === "error" ? "ERROR" : "INFO";
  let color = typeStr === "error" ? "#EF4444" : "#10B981";

  logLine.innerHTML = `<span style="color:${color}; font-weight:700;">[${type}]</span> ${message}`;
  terminal.appendChild(logLine);
  
  // Auto scroll para o final
  terminal.scrollTop = terminal.scrollHeight;
  
  // Limitar número de linhas em tela
  if (terminal.childElementCount > 40) {
    terminal.removeChild(terminal.firstChild);
  }
}

/* ==========================================================================
   USER DASHBOARD DATA LOGIC
   ========================================================================== */
async function loadUserDashboard(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Erro ao carregar dashboard");
    
    const data = await res.json();
    const stats = data.stats;
    const plan = data.plan;
    const history = data.history;

    // 1. Atualiza os Cartões de Estatísticas
    const elTotalConversions = document.getElementById('user-total-conversions');
    const elTimeSaved = document.getElementById('user-time-saved');
    const elAccountStatus = document.getElementById('user-account-status');
    const elAccountLimit = document.getElementById('user-account-limit');
    
    if (elTotalConversions) elTotalConversions.textContent = stats.total_conversions || '0';
    if (elTimeSaved) {
      const minutes = Math.floor(stats.time_saved_seconds / 60);
      const seconds = Math.floor(stats.time_saved_seconds % 60);
      elTimeSaved.textContent = `${minutes}m ${seconds}s`;
    }
    
    if (elAccountStatus) {
      const isPro = plan.is_pro;
      elAccountStatus.textContent = isPro ? 'PRO' : 'Gratuito';
      elAccountStatus.style.color = isPro ? '#10B981' : '#F59E0B'; // Verde para PRO, Amarelo para Free
      
      const shieldIcon = elAccountStatus.parentElement.querySelector('[data-lucide="shield"]');
      if (shieldIcon) shieldIcon.style.color = isPro ? '#10B981' : '#F59E0B';
    }
    
    if (elAccountLimit) {
      elAccountLimit.textContent = plan.is_pro ? 'Sem limites diários' : 'Limite: 5 arquivos/dia';
    }

    // 2. Atualiza os dados da aba "Assinatura"
    const elBillingPlan = document.getElementById('user-billing-plan');
    const elBillingPrice = document.getElementById('user-billing-price');
    if (elBillingPlan) {
      elBillingPlan.textContent = `Plano Atual: ${plan.is_pro ? 'PRO' : 'Gratuito'}`;
    }
    if (elBillingPrice) {
      elBillingPrice.textContent = plan.is_pro ? 'R$ 29,90' : 'R$ 0,00';
    }

    // 3. Atualiza as Tabelas de Histórico
    const renderTableRows = (items, includeSize = false) => {
      if (!items || items.length === 0) {
        return `<tr><td colspan="${includeSize ? 5 : 5}" style="text-align: center; padding: 24px; color: var(--gray-400);">Nenhuma conversão encontrada.</td></tr>`;
      }
      return items.map(c => {
        const dateStr = new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const isSuccess = c.status === 'success';
        
        let row = `<tr>`;
        row += `<td>${c.tool}</td>`;
        row += `<td>${c.filename}</td>`;
        row += `<td>${dateStr}</td>`;
        if (includeSize) {
          row += `<td>--</td>`; // O endpoint /user/dashboard atual não retorna o result_size pra compor o tamanho, colocamos --
        } else {
          row += `<td><span class="status-badge ${isSuccess ? 'status-success' : 'status-pending'}">${isSuccess ? 'Concluído' : 'Falhou'}</span></td>`;
        }
        row += `<td><i data-lucide="download" class="action-icon-btn" style="${isSuccess ? '' : 'opacity: 0.5; cursor: not-allowed;'}"></i></td>`;
        row += `</tr>`;
        return row;
      }).join('');
    };

    const tbodyRecent = document.getElementById('user-recent-activity-table');
    const tbodyFull = document.getElementById('user-full-history-table');

    if (tbodyRecent) tbodyRecent.innerHTML = renderTableRows(history.slice(0, 5), false);
    if (tbodyFull) tbodyFull.innerHTML = renderTableRows(history, true);

    if (window.lucide) window.lucide.createIcons();

  } catch (error) {
    console.error(error);
  }
}
