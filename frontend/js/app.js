/* ==========================================================================
   FACILITA - FRONTEND CONTROLLER (APP.JS)
   Controle de dados, busca dinâmica, categoria e contadores animados.
   ========================================================================== */

let toolsData = [];
let activeCategoryFilter = null;

// Carregar as ferramentas a partir de tools.json
async function fetchTools() {
  try {
    const response = await fetch('tools.json');
    if (!response.ok) throw new Error('Não foi possível obter a lista de ferramentas.');
    toolsData = await response.json();
    renderTools(toolsData);
    animateCounters();
  } catch (error) {
    console.error('Erro ao ler base tools.json:', error);
    // Dados de fallback para garantir funcionamento offline
    toolsData = [
      {
        "id": "pdf-word",
        "nome": "PDF para Word",
        "categoria": "PDF",
        "icone": "file-text",
        "descricao": "Converta seus arquivos PDF para documentos Word editáveis com máxima precisão.",
        "rota": "ferramentas/index.html?tool=pdf-word",
        "popular": true
      },
      {
        "id": "remover-fundo",
        "nome": "Remover Fundo",
        "categoria": "Imagens",
        "icone": "image",
        "descricao": "Remova o fundo de qualquer imagem de forma automática com nossa IA avançada.",
        "rota": "ferramentas/index.html?tool=remover-fundo",
        "popular": true
      },
      {
        "id": "qr-code",
        "nome": "Gerador de QR Code",
        "categoria": "Utilidades",
        "icone": "qr-code",
        "descricao": "Crie QR Codes personalizados para links, Wi-Fi, WhatsApp ou PIX gratuitamente.",
        "rota": "ferramentas/index.html?tool=qr-code",
        "popular": true
      }
    ];
    renderTools(toolsData);
  }
}

// Renderizar cards de ferramentas no grid
function renderTools(tools) {
  const container = document.getElementById('tools-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (tools.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--gray-400);">
        <i data-lucide="info" style="width: 48px; height: 48px; margin: 0 auto 16px auto; color: var(--gray-400);"></i>
        <p style="font-weight: 600; font-size: 16px;">Nenhuma ferramenta encontrada.</p>
        <p style="font-size: 14px;">Tente buscar por termos diferentes ou navegue pelas categorias.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  tools.forEach(tool => {
    // Obter idioma atual para traduções
    const currentLang = localStorage.getItem('facilita_lang') || 'pt';
    const isEn = currentLang === 'en';
    const isEs = currentLang === 'es';
    
    // Mapeamento simples de tradução de botões
    let openText = "Abrir";
    if (isEn) openText = "Open";
    if (isEs) openText = "Abrir";

    const card = document.createElement('div');
    card.className = 'tool-card';
    card.setAttribute('data-id', tool.id);
    card.style.cursor = 'pointer';
    card.onclick = () => { window.location.href = tool.rota; };
    
    card.innerHTML = `
      <div class="tool-card-top">
        <div class="tool-icon">
          <i data-lucide="${tool.icone || 'tool'}"></i>
        </div>
        <div class="tool-card-info">
          <h3>${tool.nome}</h3>
          <p>${tool.descricao}</p>
        </div>
      </div>
      <div class="tool-card-action">
        <span class="tool-tag">${tool.categoria}</span>
        <a href="${tool.rota || '#'}" class="btn btn-secondary btn-sm" style="padding: 6px 16px; font-size: 13px;">
          ${openText} <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </a>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Renderizar ícones do Lucide
  lucide.createIcons();
}

// Filtro de Busca Instantânea e Categoria
function filterTools() {
  const searchInput = document.getElementById('main-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const filtered = toolsData.filter(tool => {
    const matchesSearch = tool.nome.toLowerCase().includes(query) || 
                          tool.descricao.toLowerCase().includes(query) ||
                          tool.categoria.toLowerCase().includes(query);
                          
    const matchesCategory = !activeCategoryFilter || tool.categoria.toLowerCase() === activeCategoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });
  
  renderTools(filtered);
}

// Animador de Contadores Numéricos
function animateCounters() {
  const animate = (id, target, speed) => {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let current = 0;
    const increment = Math.ceil(target / (speed / 16)); // ~60fps
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      // Formatação adequada dos números
      if (target >= 1000) {
        obj.textContent = '+' + current.toLocaleString('pt-BR');
      } else {
        obj.textContent = '+' + current;
      }
    }, 16);
  };

  animate('counter-tools-val', 150, 1000);  // 150 ferramentas
  animate('counter-tasks-val', 50000, 1500); // 50.000 tarefas
}

// Configurar ouvintes de eventos da home page
document.addEventListener('DOMContentLoaded', () => {
  fetchTools();
  
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // Remover filtro ativo de categoria visual ao digitar
      if (activeCategoryFilter) {
        document.querySelectorAll('.category-card').forEach(card => card.classList.remove('active'));
        activeCategoryFilter = null;
      }
      filterTools();
    });
  }
  
  // Ouvinte de Cliques nas Categorias
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      
      categoryCards.forEach(c => c.classList.remove('active'));
      
      if (activeCategoryFilter === category) {
        // Se clicar na mesma categoria, limpa o filtro
        activeCategoryFilter = null;
      } else {
        card.classList.add('active');
        activeCategoryFilter = category;
        
        // Scroll suave até o container de ferramentas
        const target = document.getElementById('catalogo');
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
      
      // Limpar campo de busca ao filtrar por categoria
      if (searchInput) searchInput.value = '';
      
      filterTools();
    });
  });
  
  // Ouvinte para os Chips de Sugestão
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const searchTerm = chip.getAttribute('data-search');
      if (searchInput) {
        searchInput.value = searchTerm;
        
        // Scroll suave para a seção de ferramentas
        const target = document.getElementById('catalogo');
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth'
          });
        }
        
        // Disparar evento de input manualmente
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
      }
    });
  });
  
  // Re-aplicar traduções dinâmicas das ferramentas se o idioma mudar
  document.addEventListener('languageChanged', () => {
    filterTools();
  });

  // Ajuste Visual do Header para usuários logados na Home
  const userStr = localStorage.getItem('facilita_user_session');
  if (userStr) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      Array.from(headerActions.children).forEach(child => {
        if (!child.classList.contains('lang-selector-wrapper')) child.style.display = 'none';
      });
      const dbBtn = document.createElement('a');
      dbBtn.href = 'dashboard/index.html';
      dbBtn.className = 'btn btn-primary';
      dbBtn.innerHTML = '<i data-lucide="layout-dashboard"></i> Meu Painel';
      headerActions.appendChild(dbBtn);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
});
