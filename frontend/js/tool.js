/* ==========================================================================
   FACILITA - DYNAMIC TOOL RENDERER & ACTIONS (TOOL.JS)
   Roteamento dinâmico no frontend, metadados SEO automáticos e chamadas ao backend FastAPI.
   ========================================================================== */

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "https://facilita-api-backend.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  // 1. CARREGAMENTO DOS METADADOS DA FERRAMENTA
  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('tool');

  if (!toolId) {
    window.location.href = '../index.html';
    return;
  }

  // Fallback de dados locais caso o fetch seja bloqueado pelo protocolo file:// (CORS local)
  const fallbackTools = [
    {
      "id": "pdf-word",
      "nome": "PDF para Word",
      "categoria": "PDF",
      "icone": "file-text",
      "descricao": "Converta seus arquivos PDF para documentos Word editáveis com máxima precisão.",
      "rota": "ferramentas/index.html?tool=pdf-word",
      "popular": true,
      "seo": {
        "title": "Converter PDF para Word Online e Grátis | Facilita",
        "description": "Converta seus arquivos PDF em documentos editáveis do Word (.docx) em segundos sem perder a formatação original.",
        "schemaType": "WebApplication"
      }
    },
    {
      "id": "remover-fundo",
      "nome": "Remover Fundo",
      "categoria": "Imagens",
      "icone": "image",
      "descricao": "Remova o fundo de qualquer imagem de forma automática com nossa IA avançada.",
      "rota": "ferramentas/index.html?tool=remover-fundo",
      "popular": true,
      "seo": {
        "title": "Remover Fundo de Imagem Online Grátis | Facilita",
        "description": "Remova fundos de imagens instantaneamente usando Inteligência Artificial. Perfeito para fotos de produtos, retratos e designs.",
        "schemaType": "WebApplication"
      }
    },
    {
      "id": "qr-code",
      "nome": "Gerador de QR Code",
      "categoria": "Utilidades",
      "icone": "qr-code",
      "descricao": "Crie QR Codes personalizados para links, Wi-Fi, WhatsApp ou PIX gratuitamente.",
      "rota": "ferramentas/index.html?tool=qr-code",
      "popular": true,
      "seo": {
        "title": "Gerador de QR Code Personalizado Grátis | Facilita",
        "description": "Crie e baixe QR codes customizados com cores e logos em alta resolução para seus links, PIX, Wi-Fi e textos.",
        "schemaType": "WebApplication"
      }
    },
    {
      "id": "sorteador",
      "nome": "Sorteador Online",
      "categoria": "Utilidades",
      "icone": "dices",
      "descricao": "Faça sorteios justos de números ou nomes para promoções e eventos.",
      "rota": "ferramentas/index.html?tool=sorteador",
      "popular": true,
      "seo": { "title": "Sorteador de Nomes e Números Online | Facilita", "description": "Sorteie nomes ou números de forma aleatória, segura e gratuita.", "schemaType": "WebApplication" }
    },
    {
      "id": "contador-palavras",
      "nome": "Contador de Palavras",
      "categoria": "Texto",
      "icone": "type",
      "descricao": "Conte instantaneamente palavras e caracteres de qualquer texto.",
      "rota": "ferramentas/index.html?tool=contador-palavras",
      "popular": true,
      "seo": { "title": "Contador de Palavras e Caracteres Online | Facilita", "description": "Descubra o número exato de palavras e letras do seu texto online.", "schemaType": "WebApplication" }
    },
    {
      "id": "conversor-texto",
      "nome": "Conversor de Texto",
      "categoria": "Texto",
      "icone": "case-sensitive",
      "descricao": "Converta textos para MAIÚSCULAS, minúsculas ou Primeira Letra Maiúscula.",
      "rota": "ferramentas/index.html?tool=conversor-texto",
      "popular": false,
      "seo": { "title": "Conversor de Maiúsculas e Minúsculas | Facilita", "description": "Altere a capitalização do seu texto instantaneamente.", "schemaType": "WebApplication" }
    },
    {
      "id": "lorem-ipsum",
      "nome": "Gerador de Lorem Ipsum",
      "categoria": "Texto",
      "icone": "align-left",
      "descricao": "Gere textos de preenchimento (Lorem Ipsum) perfeitos para seus designs.",
      "rota": "ferramentas/index.html?tool=lorem-ipsum",
      "popular": false,
      "seo": { "title": "Gerador de Texto Lorem Ipsum | Facilita", "description": "Crie parágrafos de Lorem Ipsum para mockups e wireframes.", "schemaType": "WebApplication" }
    },
    {
      "id": "gerador-curriculo",
      "nome": "Criador de Currículo",
      "categoria": "Profissional",
      "icone": "briefcase",
      "descricao": "Crie um currículo com design premium em tempo real e baixe em PDF.",
      "rota": "ferramentas/index.html?tool=gerador-curriculo",
      "popular": true,
      "seo": { "title": "Criador de Currículo Premium Online | Facilita", "description": "Gere seu currículo profissional em minutos. Layout premium e moderno, exportação direto para PDF.", "schemaType": "WebApplication" }
    }
  ];

  fetch('../tools.json')
    .then(res => res.json())
    .then(tools => {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) {
        window.location.href = '../index.html';
        return;
      }
      applyToolData(tool);
    })
    .catch(err => {
      console.warn('Erro ao carregar tools.json (provavelmente restrição CORS do protocolo file://). Usando ferramentas locais...');
      const tool = fallbackTools.find(t => t.id === toolId);
      if (tool) {
        applyToolData(tool);
      } else {
        window.location.href = '../index.html';
      }
    });

  // Ajuste Visual do Header para usuários logados
  const userStr = localStorage.getItem('facilita_user_session');
  if (userStr) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      Array.from(headerActions.children).forEach(child => {
        if (!child.classList.contains('lang-selector-wrapper')) child.style.display = 'none';
      });
      const dbBtn = document.createElement('a');
      dbBtn.href = '../dashboard/index.html';
      dbBtn.className = 'btn btn-primary';
      dbBtn.innerHTML = '<i data-lucide="layout-dashboard"></i> Meu Painel';
      headerActions.appendChild(dbBtn);
    }
  }
});

function applyToolData(tool) {
  // Aplicar dados da ferramenta na UI
  document.getElementById('tool-name-text').textContent = tool.nome;
  document.getElementById('tool-category-badge').textContent = tool.categoria;
  document.getElementById('tool-desc-text').textContent = tool.descricao;

  // Aplicar metadados de SEO dinamicamente no DOM
  if (tool.seo) {
    document.title = tool.seo.title;
    document.getElementById('seo-title').textContent = tool.seo.title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', tool.seo.description);
    
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', tool.seo.title);
    
    const ogDesc = document.getElementById('og-description');
    if (ogDesc) ogDesc.setAttribute('content', tool.seo.description);

    // Atualizar Schema.org JSON-LD no Head
    const schemaScript = document.getElementById('seo-schema');
    if (schemaScript) {
      const schemaData = {
        "@context": "https://schema.org",
        "@type": tool.seo.schemaType || "WebApplication",
        "name": tool.nome,
        "url": window.location.href,
        "description": tool.seo.description,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires HTML5 and JavaScript"
      };
      schemaScript.textContent = JSON.stringify(schemaData, null, 2);
    }
  }

  // Configurar favoritos para esta ferramenta
  setupFavoriteToggle(tool.id);

  // Injetar área de trabalho interativa correspondente
  injectWorkspace(tool);
}

/* ==========================================================================
   SISTEMA DE FAVORITOS DINÂMICOS
   ========================================================================== */
function setupFavoriteToggle(id) {
  const favBtn = document.getElementById('favorite-toggle-btn');
  if (!favBtn) return;

  let favorites = JSON.parse(localStorage.getItem('facilita_favorites') || '[]');
  
  if (favorites.includes(id)) {
    favBtn.classList.add('active');
  }

  favBtn.addEventListener('click', () => {
    favorites = JSON.parse(localStorage.getItem('facilita_favorites') || '[]');
    
    if (favorites.includes(id)) {
      favorites = favorites.filter(favId => favId !== id);
      favBtn.classList.remove('active');
    } else {
      favorites.push(id);
      favBtn.classList.add('active');
    }
    
    localStorage.setItem('facilita_favorites', JSON.stringify(favorites));
  });
}

/* ==========================================================================
   INJEÇÃO E CONFIGURAÇÃO DA ÁREA DE TRABALHO
   ========================================================================== */
function injectWorkspace(tool) {
  const container = document.getElementById('tool-workspace-container');
  if (!container) return;

  container.innerHTML = ''; // Limpa loader

  // 1. PDF para Word (Funcional Real)
  if (tool.id === 'pdf-word') {
    container.innerHTML = `
      <div id="pdf-word-workspace">
        <div class="dropzone" id="file-dropzone-pdf">
          <i data-lucide="file-text" class="dropzone-icon"></i>
          <h3>Arraste e solte seu arquivo PDF aqui</h3>
          <p>Suporta apenas arquivos .pdf. Tamanho máximo: 10MB (FREE) ou 100MB (PRO).</p>
          <input type="file" id="file-input-pdf" accept=".pdf" style="display:none;">
          <button class="btn btn-secondary" onclick="document.getElementById('file-input-pdf').click()">Selecionar Arquivo PDF</button>
        </div>
        
        <!-- Bloco de Arquivo Selecionado -->
        <div class="selected-file-card" id="selected-file-card-pdf" style="display:none;">
          <div class="file-info">
            <i data-lucide="file-text" class="file-icon" style="color: #EF4444;"></i>
            <div class="file-details">
              <h5 id="selected-file-name-pdf">documento.pdf</h5>
              <span id="selected-file-size-pdf">2.4 MB</span>
            </div>
          </div>
          <i data-lucide="trash-2" class="btn-remove-file" id="btn-remove-file-pdf"></i>
        </div>
        
        <!-- Barra de Progresso Real do Upload -->
        <div class="progress-bar-container" id="process-progress-container-pdf" style="display:none; margin-top:24px; background-color:var(--gray-200); border-radius:999px; height:12px; overflow:hidden;">
          <div class="progress-bar-fill" id="process-progress-bar-pdf" style="background-color:var(--primary-blue); height:100%; width:0%; transition:width 0.1s ease;"></div>
          <div style="text-align: center; font-size: 12px; margin-top: 16px; font-weight: 600; color: var(--gray-500);" id="progress-percentage-pdf">Enviando: 0%</div>
        </div>

        <!-- Botão Converter -->
        <div class="action-button-wrapper" id="action-btn-wrapper-pdf" style="display:none; margin-top: 24px;">
          <button class="btn btn-primary btn-action-execute" id="btn-process-pdf" style="width: 100%;">
            <i data-lucide="zap"></i> Converter para Word (.docx)
          </button>
        </div>

        <!-- Tela de Resultados -->
        <div class="result-card" id="result-card-pdf" style="display:none; margin-top:24px;">
          <div class="result-card-header">
            <span class="result-card-title">Resultado da Conversão</span>
            <span class="status-badge status-success" id="result-time-pdf">⚡ 1.2s</span>
          </div>
          
          <div class="result-preview" style="background: var(--light-gray); padding: 32px; border-radius: var(--radius-sm); text-align: center; margin-bottom: 20px;">
            <div>
              <i data-lucide="file-check" style="width: 48px; height: 48px; color: #10B981; margin-bottom: 12px;"></i>
              <h4 style="margin-bottom: 4px;">PDF convertido para Word com sucesso!</h4>
              <p style="color: var(--gray-500); font-size: 13px;" id="result-file-details-pdf">arquivo.docx - 1.8 MB</p>
            </div>
          </div>
          
          <div class="result-actions" style="display:flex; gap:12px;">
            <a class="btn btn-primary" id="btn-download-pdf-result" href="#" target="_blank" style="flex:1;">
              <i data-lucide="download"></i> Baixar Arquivo (.docx)
            </a>
            <button class="btn btn-secondary" id="btn-reset-pdf" style="flex:1;">Converter Outro</button>
          </div>
        </div>
      </div>
    `;

    setupPdfWordLogic();
  } 
  
  // 2. Removedor de Fundo (IA/Real)
  else if (tool.id === 'remover-fundo') {
    container.innerHTML = `
      <div id="remover-fundo-workspace">
        <div class="dropzone" id="file-dropzone">
          <i data-lucide="image" class="dropzone-icon"></i>
          <h3>Arraste e solte sua foto aqui</h3>
          <p>Suporta JPG, PNG, WEBP. Tamanho máximo: 10MB (FREE) ou 100MB (PRO).</p>
          <input type="file" id="file-input" accept="image/*" style="display:none;">
          <button class="btn btn-secondary" onclick="document.getElementById('file-input').click()">Selecionar Arquivo</button>
        </div>
        
        <!-- Bloco de Arquivo Selecionado -->
        <div class="selected-file-card" id="selected-file-card" style="display:none;">
          <div class="file-info">
            <i data-lucide="file-image" class="file-icon"></i>
            <div class="file-details">
              <h5 id="selected-file-name">foto-perfil.jpg</h5>
              <span id="selected-file-size">1.2 MB</span>
            </div>
          </div>
          <i data-lucide="trash-2" class="btn-remove-file" id="btn-remove-file"></i>
        </div>
        
        <!-- Barra de Progresso -->
        <div class="progress-bar-container" id="process-progress-container" style="display:none; margin-top:24px; background-color:var(--gray-200); border-radius:999px; height:12px; overflow:hidden;">
          <div class="progress-bar-fill" id="process-progress-bar" style="background-color:var(--primary-blue); height:100%; width:0%;"></div>
          <div style="text-align: center; font-size: 12px; margin-top: 16px; font-weight: 600; color: var(--gray-500);" id="progress-percentage-bg">Processando imagem: 0%</div>
        </div>

        <div class="action-button-wrapper" id="action-btn-wrapper" style="display:none; margin-top:24px;">
          <button class="btn btn-primary btn-action-execute" id="btn-process-bg" style="width: 100%;">
            <i data-lucide="sparkles"></i> Remover Fundo com IA
          </button>
        </div>

        <!-- Tela de Resultados -->
        <div class="result-card" id="result-card-bg" style="display:none; margin-top:24px;">
          <div class="result-card-header">
            <span class="result-card-title">Resultado da IA (Fundo Removido)</span>
            <span class="status-badge status-success" id="result-time-bg">⚡ 1.8s</span>
          </div>
          
          <div class="result-preview" style="background: repeating-conic-gradient(#f8fafc 0% 25%, #fff 0% 50%) 50% / 20px 20px; padding: 32px; border-radius: var(--radius-sm); text-align: center; display: flex; justify-content: center; align-items: center; min-height: 200px;">
            <svg id="result-svg-preview" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 21a6 6 0 0 0-12 0"/>
              <circle cx="12" cy="10" r="4"/>
            </svg>
          </div>
          
          <div class="result-actions" style="display:flex; gap:12px;">
            <a class="btn btn-primary" id="btn-download-bg-result" href="#" target="_blank" style="flex:1;">
              <i data-lucide="download"></i> Baixar Imagem (PNG)
            </a>
            <button class="btn btn-secondary" id="btn-reset-bg" style="flex:1;">Remover Outro</button>
          </div>
        </div>
      </div>
    `;

    setupBackgroundRemoverLogic();
  } 
  
  // 3. Gerador de QR Code
  else if (tool.id === 'qr-code') {
    container.innerHTML = `
      <div id="qrcode-workspace">
        <div class="form-grid" style="gap: 16px;">
          <div class="option-group">
            <label class="option-label" for="qr-text">Texto ou Link do QR Code</label>
            <input type="text" id="qr-text" class="option-input" placeholder="https://exemplo.com.br" required>
          </div>
          
          <div class="options-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:16px;">
            <div class="option-group">
              <label class="option-label" for="qr-color">Cor Principal</label>
              <input type="color" id="qr-color" class="option-input" style="height:42px; padding:2px; cursor:pointer;" value="#0F172A">
            </div>
            
            <div class="option-group">
              <label class="option-label" for="qr-size">Tamanho (Resolução)</label>
              <select id="qr-size" class="option-select">
                <option value="150x150">150 x 150 px</option>
                <option value="250x250" selected>250 x 250 px</option>
                <option value="400x400">400 x 400 px</option>
              </select>
            </div>
          </div>
          
          <div class="action-button-wrapper" style="margin-top: 24px;">
            <button class="btn btn-primary btn-action-execute" id="btn-generate-qr" style="width: 100%;">
              <i data-lucide="qr-code"></i> Gerar QR Code
            </button>
          </div>
        </div>

        <!-- Tela de Resultados do QR Code -->
        <div class="result-card" id="result-card-qr" style="display:none; margin-top: 32px;">
          <div class="result-card-header">
            <span class="result-card-title">QR Code Gerado</span>
            <span class="status-badge status-success">Instantâneo</span>
          </div>
          
          <div class="result-preview" id="qrcode-canvas-wrapper" style="background:#fff; border: 1px solid var(--gray-200); border-radius: var(--radius-sm); padding:20px; display:flex; justify-content:center; align-items:center; min-height: 200px;">
            <img id="qrcode-result-img" src="" alt="QR Code Gerado" style="max-width: 100%; border-radius: 8px; max-height:240px;">
          </div>
          
          <div class="result-actions" style="display:flex; gap:12px; margin-top:20px;">
            <a class="btn btn-primary" id="btn-download-qr-png" href="#" target="_blank" style="flex:1;">
              <i data-lucide="download"></i> Baixar QR Code (PNG)
            </a>
            <button class="btn btn-secondary" onclick="alert('Link do QR Code copiado!')" style="flex:1;">
              <i data-lucide="copy"></i> Copiar Link
            </button>
          </div>
        </div>
      </div>
    `;

    setupQrCodeGeneratorLogic();
  } 
  
  
  // 4. Gerador de Senhas
  else if (tool.id === 'password-gen') {
    container.innerHTML = `
      <div id="password-workspace" class="form-grid" style="gap: 16px;">
        <div class="option-group">
          <label class="option-label">Tamanho da Senha</label>
          <input type="number" id="pass-length" class="option-input" value="16" min="8" max="64">
        </div>
        <div class="options-grid" style="display:flex; flex-wrap:wrap; gap:16px; margin-top:10px; color: var(--gray-800); font-size: 14px; font-weight: 500;">
          <label><input type="checkbox" id="pass-upper" checked> Maiúsculas</label>
          <label><input type="checkbox" id="pass-lower" checked> Minúsculas</label>
          <label><input type="checkbox" id="pass-numbers" checked> Números</label>
          <label><input type="checkbox" id="pass-symbols" checked> Símbolos</label>
        </div>
        <div class="action-button-wrapper" style="margin-top: 24px;">
          <button class="btn btn-primary btn-action-execute" id="btn-generate-pass" style="width: 100%;">Gerar Senha</button>
        </div>
        
        <div class="result-card" id="result-card-pass" style="display:none; margin-top: 24px; text-align:center;">
          <h2 id="pass-result-text" style="background:#f1f5f9; color: #0F172A; padding:20px; border-radius:8px; font-family:monospace; letter-spacing:2px; word-break: break-all;"></h2>
          <button class="btn btn-secondary" style="margin-top:15px; width:100%;" onclick="navigator.clipboard.writeText(document.getElementById('pass-result-text').innerText); alert('Senha copiada!')">Copiar Senha</button>
        </div>
      </div>
    `;
    setupPasswordGenLogic();
  }
  // 5. Sorteador Online
  else if (tool.id === 'sorteador') {
    container.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200);">
        <h3 style="margin-bottom: 16px;">Sorteador de Nomes ou Números</h3>
        <p style="margin-bottom: 16px; color: var(--gray-400);">Digite os nomes ou números abaixo (um por linha):</p>
        <textarea id="sorteador-input" class="option-input" style="height: 150px; resize: vertical; margin-bottom: 16px; font-size: 1rem;" placeholder="Ana\nCarlos\nBeatriz\nJoão..."></textarea>
        
        <div style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 8px; font-size: 0.875rem; color: var(--gray-400);">Quantos ganhadores?</label>
            <input type="number" id="sorteador-qtd" class="option-input" value="1" min="1">
          </div>
          <button id="btn-sortear" class="btn btn-primary" style="flex: 2;">
            <i data-lucide="dices"></i> Sortear Agora
          </button>
        </div>
        
        <div id="sorteador-result" style="display: none; padding: 24px; background: rgba(139, 92, 246, 0.1); border: 1px solid var(--primary-blue); border-radius: 8px; text-align: center;">
          <h4 style="color: var(--primary-blue); margin-bottom: 16px;">Ganhador(es)!</h4>
          <div id="sorteador-winners" style="font-size: 1.5rem; font-weight: bold; color: var(--dark-text);"></div>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    document.getElementById('btn-sortear').addEventListener('click', () => {
      const text = document.getElementById('sorteador-input').value.trim();
      const qtd = parseInt(document.getElementById('sorteador-qtd').value) || 1;
      
      if (!text) {
        alert("Por favor, insira pelo menos um nome ou número.");
        return;
      }
      
      const items = text.split('\n').map(i => i.trim()).filter(i => i);
      if (items.length === 0) return;
      if (qtd > items.length) {
        alert("A quantidade de ganhadores não pode ser maior que a lista.");
        return;
      }
      
      // Shuffle array (Fisher-Yates)
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const winners = shuffled.slice(0, qtd);
      
      const resDiv = document.getElementById('sorteador-result');
      const winnersDiv = document.getElementById('sorteador-winners');
      
      winnersDiv.innerHTML = winners.join('<br>');
      resDiv.style.display = 'block';
    });
  }
  // 6. Contador de Palavras
  else if (tool.id === 'contador-palavras') {
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-blue);" id="count-words">0</div>
            <div style="color: var(--gray-400); margin-top: 8px;">Palavras</div>
          </div>
          <div style="background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-blue);" id="count-chars">0</div>
            <div style="color: var(--gray-400); margin-top: 8px;">Caracteres</div>
          </div>
          <div style="background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-blue);" id="count-chars-no-space">0</div>
            <div style="color: var(--gray-400); margin-top: 8px;">S/ Espaços</div>
          </div>
        </div>
        
        <textarea id="contador-input" class="option-input" style="height: 300px; resize: vertical; font-size: 1rem; padding: 20px;" placeholder="Cole ou digite seu texto aqui para começar a contar..."></textarea>
      </div>
    `;
    lucide.createIcons();
    
    document.getElementById('contador-input').addEventListener('input', (e) => {
      const text = e.target.value;
      
      const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s+/g, '').length;
      
      document.getElementById('count-words').textContent = words;
      document.getElementById('count-chars').textContent = chars;
      document.getElementById('count-chars-no-space').textContent = charsNoSpace;
    });
  }
  // 7. Conversor de Texto
  else if (tool.id === 'conversor-texto') {
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200);">
        <textarea id="conversor-input" class="option-input" style="height: 250px; resize: vertical; margin-bottom: 24px; font-size: 1rem;" placeholder="Cole seu texto aqui..."></textarea>
        
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-maiusculas">MAIÚSCULAS</button>
          <button class="btn btn-secondary" id="btn-minusculas">minúsculas</button>
          <button class="btn btn-secondary" id="btn-primeira-letra">Primeira Letra</button>
          <button class="btn btn-secondary" id="btn-inverter">iNVERTER</button>
          <button class="btn btn-secondary" id="btn-copiar-conv" style="margin-left: auto;">
            <i data-lucide="copy"></i> Copiar
          </button>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    const textarea = document.getElementById('conversor-input');
    
    document.getElementById('btn-maiusculas').addEventListener('click', () => {
      textarea.value = textarea.value.toUpperCase();
    });
    
    document.getElementById('btn-minusculas').addEventListener('click', () => {
      textarea.value = textarea.value.toLowerCase();
    });
    
    document.getElementById('btn-primeira-letra').addEventListener('click', () => {
      textarea.value = textarea.value.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    });
    
    document.getElementById('btn-inverter').addEventListener('click', () => {
      let result = '';
      for (let i = 0; i < textarea.value.length; i++) {
        let char = textarea.value[i];
        if (char === char.toUpperCase()) {
          result += char.toLowerCase();
        } else {
          result += char.toUpperCase();
        }
      }
      textarea.value = result;
    });
    
    document.getElementById('btn-copiar-conv').addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value);
      const btn = document.getElementById('btn-copiar-conv');
      const original = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="check"></i> Copiado!';
      lucide.createIcons();
      setTimeout(() => { btn.innerHTML = original; lucide.createIcons(); }, 2000);
    });
  }
  // 8. Gerador de Lorem Ipsum
  else if (tool.id === 'lorem-ipsum') {
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200);">
        <div style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 8px; color: var(--gray-400);">Parágrafos</label>
            <input type="number" id="lorem-qtd" class="option-input" value="3" min="1" max="20">
          </div>
          <button id="btn-gerar-lorem" class="btn btn-primary" style="flex: 2;">
            <i data-lucide="align-left"></i> Gerar Lorem Ipsum
          </button>
        </div>
        
        <div style="position: relative;">
          <textarea id="lorem-result" class="option-input" style="height: 300px; resize: vertical; font-size: 1rem; padding: 20px;" readonly></textarea>
          <button id="btn-copiar-lorem" class="btn btn-secondary" style="position: absolute; top: 16px; right: 16px; padding: 8px 16px; font-size: 0.875rem;">
            <i data-lucide="copy"></i> Copiar
          </button>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    const baseLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    
    document.getElementById('btn-gerar-lorem').addEventListener('click', () => {
      const qtd = parseInt(document.getElementById('lorem-qtd').value) || 3;
      let result = [];
      for (let i = 0; i < qtd; i++) {
        result.push(baseLorem);
      }
      document.getElementById('lorem-result').value = result.join('\\n\\n');
    });
    
    // Gera inicial
    document.getElementById('btn-gerar-lorem').click();
    
    document.getElementById('btn-copiar-lorem').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('lorem-result').value);
      const btn = document.getElementById('btn-copiar-lorem');
      const original = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="check"></i> Copiado!';
      lucide.createIcons();
      setTimeout(() => { btn.innerHTML = original; lucide.createIcons(); }, 2000);
    });
  }
  // 9. Gerador de Currículo Premium
  else if (tool.id === 'gerador-curriculo') {
    // Inject html2pdf
    if (!document.getElementById('html2pdf-script')) {
      const script = document.createElement('script');
      script.id = 'html2pdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
    }
    
    // Check if user is PRO
    const userStr = localStorage.getItem('facilita_user_session');
    let isPro = false;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        isPro = user.is_pro === true || user.plan === 'PRO';
      } catch(e) {}
    }

    container.innerHTML = `
      <style>
        .cv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 900px) { .cv-grid { grid-template-columns: 1fr; } }
        .cv-form { background: var(--light-gray); padding: 24px; border-radius: 12px; border: 1px solid var(--gray-200); }
        .cv-form .form-group { margin-bottom: 16px; }
        .cv-form label { display: block; margin-bottom: 8px; color: var(--gray-400); font-size: 0.875rem; font-weight: 600; }
        .cv-preview-container { background: var(--light-gray); border: 1px solid var(--gray-200); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; }
        
        /* A4 Page styles */
        .cv-a4 { 
          --cv-sidebar-bg: #2D3748;
          background: white; 
          width: 100%; 
          min-width: 794px;
          aspect-ratio: 1 / 1.414; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
          font-family: 'Inter', sans-serif; 
          overflow: hidden; 
          position: relative; 
          text-align: left;
          display: flex;
        }
        
        /* Left Sidebar (Dark) */
        .cv-sidebar {
          width: 35%;
          background-color: var(--cv-sidebar-bg);
          color: white;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
        }
        .cv-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          margin: 0 auto 24px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: #E2E8F0;
          border: 4px solid rgba(255,255,255,0.3);
        }
        .cv-sidebar-title {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          margin-top: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 8px;
        }
        .cv-contact-item {
          font-size: 11px;
          color: rgba(255,255,255,0.9);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          word-break: break-all;
        }
        .cv-skill-tag {
          background: rgba(255,255,255,0.15);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          margin-bottom: 8px;
          display: inline-block;
          margin-right: 4px;
        }

        /* Right Content (Light) */
        .cv-main {
          width: 65%;
          background-color: #FFFFFF;
          padding: 40px 32px;
        }
        .cv-name { font-size: 32px; font-weight: 800; color: #1A202C; margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.1; }
        .cv-title { font-size: 16px; font-weight: 600; color: #8B5CF6; margin-bottom: 32px; }
        
        .cv-section { margin-bottom: 28px; }
        .cv-section-title { 
          font-size: 15px; 
          font-weight: 800; 
          color: var(--cv-sidebar-bg); 
          margin-bottom: 16px; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cv-section-title::after {
          content: '';
          flex: 1;
          height: 2px;
          background: #E2E8F0;
          margin-left: 8px;
        }
        
        .cv-text { font-size: 12px; color: #4A5568; line-height: 1.7; text-align: justify; }
        
        .cv-item { margin-bottom: 16px; position: relative; padding-left: 16px; border-left: 2px solid var(--cv-sidebar-bg); }
        .cv-item-title { font-weight: 800; color: #1A202C; font-size: 14px; }
        .cv-item-subtitle { font-weight: 600; color: #718096; font-size: 12px; margin-bottom: 6px; }
        
        .locked-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(4px); z-index: 10; text-align: center; }
      </style>
      
      <div class="cv-grid">
        <!-- FORMULÁRIO -->
        <div class="cv-form">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="color: var(--dark-text); display: flex; align-items: center; gap: 8px; margin: 0;"><i data-lucide="edit-3"></i> Seus Dados</h3>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="margin: 0; font-size: 12px;">Cor do Tema:</label>
              <input type="color" id="cv-in-color" value="#2D3748" style="width: 32px; height: 32px; padding: 0; border: none; border-radius: 4px; cursor: pointer; background: transparent;" oninput="updateCV()">
            </div>
          </div>
          
          <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" id="cv-in-name" class="option-input" value="João da Silva" oninput="updateCV()">
          </div>
          <div class="form-group">
            <label>Cargo Desejado</label>
            <input type="text" id="cv-in-title" class="option-input" value="Desenvolvedor Frontend Sênior" oninput="updateCV()">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="cv-in-email" class="option-input" value="joao@email.com" oninput="updateCV()">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="cv-in-phone" class="option-input" value="(11) 98765-4321" oninput="updateCV()">
            </div>
          </div>
          <div class="form-group">
            <label>Localização (Cidade/Estado)</label>
            <input type="text" id="cv-in-location" class="option-input" value="São Paulo, SP" oninput="updateCV()">
          </div>
          <div class="form-group">
            <label>Habilidades (separadas por vírgula)</label>
            <input type="text" id="cv-in-skills" class="option-input" value="JavaScript, React, CSS, HTML5, UI/UX" oninput="updateCV()">
          </div>
          
          <div class="form-group">
            <label>Resumo Profissional</label>
            <textarea id="cv-in-summary" class="option-input" style="height: 100px; resize: vertical;" oninput="updateCV()">Profissional com mais de 5 anos de experiência na criação de interfaces web. Apaixonado por usabilidade e performance, buscando sempre criar a melhor experiência para o usuário.</textarea>
          </div>
          
          <div id="cv-exp-container">
            <h4 style="color: var(--gray-500); margin: 24px 0 16px; font-size: 14px;">Experiência Profissional</h4>
            <div id="cv-exp-list">
              <div class="cv-exp-form-item" style="border-left: 2px solid var(--gray-200); padding-left: 12px; margin-bottom: 16px; position: relative;">
                <div class="form-group">
                  <label>Empresa | Período</label>
                  <input type="text" class="option-input exp-title" value="Tech Corp | 2020 - Atual" oninput="updateCV()">
                </div>
                <div class="form-group">
                  <label>Cargo na Experiência</label>
                  <input type="text" class="option-input exp-role" value="Desenvolvedor Pleno" oninput="updateCV()">
                </div>
                <div class="form-group">
                  <label>Descrição da Experiência</label>
                  <textarea class="option-input exp-desc" style="height: 80px; resize: vertical;" oninput="updateCV()">Liderei a migração do sistema legado para React, reduzindo o tempo de carregamento em 40% e aumentando a retenção de usuários.</textarea>
                </div>
              </div>
            </div>
            <button class="btn" style="background: transparent; border: 1px dashed var(--gray-300); color: var(--gray-500); width: 100%; padding: 8px; font-size: 12px;" onclick="addExp()">+ Adicionar Experiência</button>
          </div>
          
          <div id="cv-edu-container">
            <h4 style="color: var(--gray-500); margin: 24px 0 16px; font-size: 14px;">Formação Acadêmica</h4>
            <div id="cv-edu-list">
              <div class="cv-edu-form-item" style="border-left: 2px solid var(--gray-200); padding-left: 12px; margin-bottom: 16px; position: relative;">
                <div class="form-group">
                  <label>Curso - Instituição</label>
                  <input type="text" class="option-input edu-title" value="Bacharelado em Ciência da Computação - USP" oninput="updateCV()">
                </div>
                <div class="form-group">
                  <label>Status / Ano</label>
                  <input type="text" class="option-input edu-subtitle" value="Concluído em 2020" oninput="updateCV()">
                </div>
              </div>
            </div>
            <button class="btn" style="background: transparent; border: 1px dashed var(--gray-300); color: var(--gray-500); width: 100%; padding: 8px; font-size: 12px;" onclick="addEdu()">+ Adicionar Formação</button>
          </div>
        </div>
        
        <!-- PREVIEW A4 -->
        <div class="cv-preview-container">
          <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 16px; align-items: center;">
            <h3 style="color: var(--dark-text); margin: 0;">Prévia Premium</h3>
            <button id="btn-download-cv" class="btn btn-primary" style="font-size: 14px; padding: 8px 16px; ${!isPro ? 'background-color: var(--gray-200); color: var(--gray-500); cursor: not-allowed;' : ''}">
              ${isPro ? '<i data-lucide="download"></i> Baixar PDF (PRO)' : '<i data-lucide="lock"></i> Requer Plano PRO'}
            </button>
          </div>
          
          <div id="cv-a4-wrapper" style="position: relative; width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px;">
            <div id="cv-a4-preview" class="cv-a4">
              <!-- SIDEBAR -->
              <div class="cv-sidebar">
                <div class="cv-avatar" id="cv-out-initials">JS</div>
                
                <div class="cv-sidebar-title">Contato</div>
                <div class="cv-contact-item">
                  <span style="font-size: 14px;">✉</span>
                  <span id="cv-out-email">joao@email.com</span>
                </div>
                <div class="cv-contact-item">
                  <span style="font-size: 14px;">📱</span>
                  <span id="cv-out-phone">(11) 98765-4321</span>
                </div>
                <div class="cv-contact-item">
                  <span style="font-size: 14px;">📍</span>
                  <span id="cv-out-location">São Paulo, SP</span>
                </div>
                
                <div class="cv-sidebar-title">Habilidades</div>
                <div id="cv-out-skills">
                  <span class="cv-skill-tag">JavaScript</span>
                  <span class="cv-skill-tag">React</span>
                  <span class="cv-skill-tag">CSS</span>
                </div>
              </div>
              
              <!-- MAIN CONTENT -->
              <div class="cv-main">
                <div class="cv-name" id="cv-out-name">João da Silva</div>
                <div class="cv-title" id="cv-out-title">Desenvolvedor Frontend Sênior</div>
                
                <div class="cv-section">
                  <div class="cv-section-title">Perfil</div>
                  <div class="cv-text" id="cv-out-summary">Profissional com mais de 5 anos de experiência na criação de interfaces web. Apaixonado por usabilidade e performance, buscando sempre criar a melhor experiência para o usuário.</div>
                </div>
                
                <div class="cv-section">
                  <div class="cv-section-title">Experiência</div>
                  <div id="cv-out-exp-list">
                    <!-- Dynamic Experience -->
                  </div>
                </div>
                
                <div class="cv-section">
                  <div class="cv-section-title">Educação</div>
                  <div id="cv-out-edu-list">
                    <!-- Dynamic Education -->
                  </div>
                </div>
              </div>
            </div>
            
            ${!isPro ? `
            <div class="locked-overlay" id="cv-locked-overlay">
              <i data-lucide="crown" style="color: #eab308; width: 48px; height: 48px; margin-bottom: 16px;"></i>
              <h3 style="color: white; margin-bottom: 8px;">Recurso Premium</h3>
              <p style="color: var(--gray-400); text-align: center; max-width: 80%; margin-bottom: 24px; font-size: 14px;">
                Assine o plano PRO para remover esta trava e baixar seu currículo em PDF de Alta Resolução.
              </p>
              <a href="/#pro" class="btn btn-primary" style="background: linear-gradient(135deg, #eab308, #d97706); color: white; border: none; font-weight: bold;">Fazer Upgrade Agora</a>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    window.addExp = function() {
      const div = document.createElement('div');
      div.className = 'cv-exp-form-item';
      div.style.cssText = 'border-left: 2px solid var(--gray-200); padding-left: 12px; margin-bottom: 16px; position: relative;';
      div.innerHTML = `
        <button onclick="this.parentElement.remove(); updateCV()" style="position: absolute; right: 0; top: 0; background: transparent; border: none; color: #ef4444; cursor: pointer; font-weight: bold;">X</button>
        <div class="form-group">
          <label>Empresa | Período</label>
          <input type="text" class="option-input exp-title" value="Empresa | Ano - Ano" oninput="updateCV()">
        </div>
        <div class="form-group">
          <label>Cargo na Experiência</label>
          <input type="text" class="option-input exp-role" value="Cargo" oninput="updateCV()">
        </div>
        <div class="form-group">
          <label>Descrição da Experiência</label>
          <textarea class="option-input exp-desc" style="height: 80px; resize: vertical;" oninput="updateCV()">Descrição das atividades...</textarea>
        </div>
      `;
      document.getElementById('cv-exp-list').appendChild(div);
      updateCV();
    };

    window.addEdu = function() {
      const div = document.createElement('div');
      div.className = 'cv-edu-form-item';
      div.style.cssText = 'border-left: 2px solid var(--gray-200); padding-left: 12px; margin-bottom: 16px; position: relative;';
      div.innerHTML = `
        <button onclick="this.parentElement.remove(); updateCV()" style="position: absolute; right: 0; top: 0; background: transparent; border: none; color: #ef4444; cursor: pointer; font-weight: bold;">X</button>
        <div class="form-group">
          <label>Curso - Instituição</label>
          <input type="text" class="option-input edu-title" value="Curso - Instituição" oninput="updateCV()">
        </div>
        <div class="form-group">
          <label>Status / Ano</label>
          <input type="text" class="option-input edu-subtitle" value="Concluído / Cursando" oninput="updateCV()">
        </div>
      `;
      document.getElementById('cv-edu-list').appendChild(div);
      updateCV();
    };

    window.updateCV = function() {
      // Tema
      const themeColor = document.getElementById('cv-in-color').value || '#2D3748';
      document.getElementById('cv-a4-preview').style.setProperty('--cv-sidebar-bg', themeColor);

      const name = document.getElementById('cv-in-name').value || 'Seu Nome';
      document.getElementById('cv-out-name').textContent = name;
      
      // Calculate initials
      const parts = name.split(' ');
      let initials = parts[0].charAt(0).toUpperCase();
      if (parts.length > 1) {
        initials += parts[parts.length - 1].charAt(0).toUpperCase();
      }
      document.getElementById('cv-out-initials').textContent = initials;
      
      document.getElementById('cv-out-title').textContent = document.getElementById('cv-in-title').value || 'Seu Cargo';
      document.getElementById('cv-out-email').textContent = document.getElementById('cv-in-email').value || 'email@exemplo.com';
      document.getElementById('cv-out-phone').textContent = document.getElementById('cv-in-phone').value || '(00) 00000-0000';
      document.getElementById('cv-out-location').textContent = document.getElementById('cv-in-location').value || 'Sua Cidade';
      
      const skillsStr = document.getElementById('cv-in-skills').value || '';
      const skillsHtml = skillsStr.split(',').map(s => s.trim()).filter(s => s).map(s => `<span class="cv-skill-tag">${s}</span>`).join('');
      document.getElementById('cv-out-skills').innerHTML = skillsHtml || '<span class="cv-skill-tag">Suas Habilidades</span>';
      
      document.getElementById('cv-out-summary').textContent = document.getElementById('cv-in-summary').value || 'Seu resumo...';
      // Experiência Dinâmica
      let expHtml = '';
      document.querySelectorAll('.cv-exp-form-item').forEach(item => {
        const title = item.querySelector('.exp-title').value;
        const role = item.querySelector('.exp-role').value;
        const desc = item.querySelector('.exp-desc').value;
        if(title || role || desc) {
          expHtml += `
            <div class="cv-item">
              <div class="cv-item-title">${role}</div>
              <div class="cv-item-subtitle">${title}</div>
              <div class="cv-text">${desc}</div>
            </div>
          `;
        }
      });
      document.getElementById('cv-out-exp-list').innerHTML = expHtml || '<div class="cv-text">Nenhuma experiência informada.</div>';

      // Educação Dinâmica
      let eduHtml = '';
      document.querySelectorAll('.cv-edu-form-item').forEach(item => {
        const title = item.querySelector('.edu-title').value;
        const subtitle = item.querySelector('.edu-subtitle').value;
        if(title || subtitle) {
          eduHtml += `
            <div class="cv-item">
              <div class="cv-item-title">${title}</div>
              <div class="cv-item-subtitle">${subtitle}</div>
            </div>
          `;
        }
      });
      document.getElementById('cv-out-edu-list').innerHTML = eduHtml || '<div class="cv-text">Nenhuma formação informada.</div>';
    };
    
    document.getElementById('btn-download-cv').addEventListener('click', () => {
      if (!isPro) {
        window.location.href = '/#pro';
        return;
      }
      
      if (typeof html2pdf === 'undefined') {
        alert("Aguarde a biblioteca de PDF carregar e tente novamente.");
        return;
      }
      
      const element = document.getElementById('cv-a4-preview');
      const opt = {
        margin:       0,
        filename:     'Meu_Curriculo_Premium.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      const btn = document.getElementById('btn-download-cv');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Gerando PDF...';
      btn.disabled = true;
      
      // Remove zoom for PDF generation
      element.style.zoom = 1;
      
      html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
        scaleCV(); // Reapply zoom
      });
    });
    
    window.scaleCV = function() {
      const wrapper = document.getElementById('cv-a4-wrapper');
      const a4 = document.getElementById('cv-a4-preview');
      if (!wrapper || !a4) return;
      const wWidth = wrapper.clientWidth;
      if (wWidth < 794) {
        const scale = wWidth / 794;
        a4.style.zoom = scale;
      } else {
        a4.style.zoom = 1;
      }
    };
    window.addEventListener('resize', scaleCV);
    
    // Initial render
    setTimeout(() => {
      updateCV();
      scaleCV();
    }, 100);
  }
  // 5. Demais ferramentas (Baseadas em Arquivo com Parâmetro Opcional Dinâmico)
  else {
    let paramHtml = '';
    if (tool.id === 'pdf-splitter') {
      paramHtml = '<div class="option-group" style="margin-top:15px;"><label>Número da Página</label><input type="number" id="generic-param-input" class="option-input" value="1"></div>';
    } else if (tool.id === 'watermark') {
      paramHtml = '<div class="option-group" style="margin-top:15px;"><label>Texto da Marca d\'Água</label><input type="text" id="generic-param-input" class="option-input" value="Confidencial"></div>';
    } else if (tool.id === 'image-compress') {
      paramHtml = '<div class="option-group" style="margin-top:15px;"><label>Qualidade (10 a 100)</label><input type="number" id="generic-param-input" class="option-input" value="60"></div>';
    }

    container.innerHTML = `
      <div id="generic-workspace">
        <div class="dropzone" id="file-dropzone-generic">
          <i data-lucide="file-up" class="dropzone-icon"></i>
          <h3>Selecione seu arquivo para processamento</h3>
          <p>Limite: 10MB.</p>
          <input type="file" id="file-input-generic" style="display:none;">
          <button class="btn btn-secondary" onclick="document.getElementById('file-input-generic').click()">Selecionar do Computador</button>
        </div>
        <div class="selected-file-card" id="selected-file-card-generic" style="display:none;">
          <div class="file-info">
            <i data-lucide="file" class="file-icon"></i>
            <div class="file-details">
              <h5 id="selected-file-name-generic">documento.pdf</h5>
              <span id="selected-file-size-generic">3.5 MB</span>
            </div>
          </div>
          <i data-lucide="trash-2" class="btn-remove-file" id="btn-remove-file-generic"></i>
        </div>
        
        <div id="dynamic-params-container" style="display:none;">
          ${paramHtml}
        </div>

        <div class="progress-bar-container" id="process-progress-container-generic" style="display:none; margin-top:24px; background-color:var(--gray-200); border-radius:999px; height:12px; overflow:hidden;">
          <div class="progress-bar-fill" id="process-progress-bar-generic" style="background-color:var(--primary-blue); height:100%; width:0%;"></div>
        </div>

        <div class="action-button-wrapper" id="action-btn-wrapper-generic" style="display:none; margin-top:24px;">
          <button class="btn btn-primary btn-action-execute" id="btn-process-generic" style="width: 100%;" data-toolid="${tool.id}">
            <i data-lucide="zap"></i> Iniciar Processamento
          </button>
        </div>

        <div class="result-card" id="result-card-generic" style="display:none; margin-top:24px;">
          <div class="result-card-header">
            <span class="result-card-title">Resultado Processado</span>
            <span class="status-badge status-success" id="generic-time"></span>
          </div>
          <div style="text-align:center; padding: 24px; background:#fff; border: 1px solid var(--gray-200); border-radius: var(--radius-sm); margin-bottom:20px;">
            <i data-lucide="file-check" style="width:48px; height:48px; color:#10B981; margin-bottom:12px;"></i>
            <h4 style="margin-bottom:4px;">Arquivo Processado com Sucesso!</h4>
            <p style="color:var(--gray-500); font-size:13px;">Pronto para download.</p>
          </div>
          <div class="result-actions" style="display:flex; gap:12px;">
            <a class="btn btn-primary" id="btn-download-generic-result" href="#" target="_blank" style="flex:1;">Baixar Arquivo</a>
            <button class="btn btn-secondary" id="btn-reset-generic" style="flex:1;">Processar Outro</button>
          </div>
        </div>
      </div>
    `;
    setupGenericToolLogic();
  }

  lucide.createIcons();
}

/* ==========================================================================
   MÉTODOS DE SUPORTE A SESSÃO E ENVIO AJAX (REUTILIZÁVEL)
   ========================================================================== */

function getUserSessionHeaders() {
  const sessionData = localStorage.getItem('facilita_user_session');
  const headers = {};
  
  if (sessionData) {
    const user = JSON.parse(sessionData);
    headers["X-User-Email"] = user.email || "";
    headers["X-User-Plan"] = user.plan || "FREE";
    if (user.token) {
      headers["Authorization"] = "Bearer " + user.token;
    }
  } else {
    headers["X-User-Email"] = "anonymous@facilita.com";
    headers["X-User-Plan"] = "FREE";
  }
  return headers;
}

// Lógica para enviar arquivo via XHR

function setupPasswordGenLogic() {
  document.getElementById('btn-generate-pass').addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    const dummyBlob = new Blob([''], { type: 'text/plain' });
    formData.append("file", dummyBlob, "dummy.txt");
    
    const params = {
      length: document.getElementById('pass-length').value,
      uppercase: document.getElementById('pass-upper').checked,
      lowercase: document.getElementById('pass-lower').checked,
      numbers: document.getElementById('pass-numbers').checked,
      symbols: document.getElementById('pass-symbols').checked
    };
    formData.append("params_str", JSON.stringify(params));

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          document.getElementById('pass-result-text').innerText = response.result_text;
          document.getElementById('result-card-pass').style.display = 'block';
        } else alert("Erro: " + response.message);
      } catch (e) { alert("Erro de comunicação"); }
    };
    xhr.open("POST", `${API_BASE_URL}/api/v1/tools/password-gen`);
    const sessionHeaders = getUserSessionHeaders();
    for (const [key, value] of Object.entries(sessionHeaders)) xhr.setRequestHeader(key, value);
    xhr.send(formData);
  });
}

function sendGenericFileToBackend(toolName, file, paramValue, onProgress, onSuccess, onError) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);
  
  if (paramValue !== undefined && paramValue !== null && paramValue !== "") {
      let params = {};
      if (toolName === 'pdf-splitter') params = {page: paramValue};
      if (toolName === 'watermark') params = {text: paramValue};
      if (toolName === 'image-compress') params = {quality: paramValue};
      formData.append("params_str", JSON.stringify(params));
  }

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
  };
  xhr.onload = () => {
    try {
      const response = JSON.parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300 && response.success) onSuccess(response);
      else onError(response.message || "Erro.");
    } catch (e) { onError("Resposta inválida."); }
  };
  xhr.open("POST", `${API_BASE_URL}/api/v1/tools/${toolName}`);
  const headers = getUserSessionHeaders();
  for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
  xhr.send(formData);
}

function sendFileToBackend(toolName, file, onProgress, onSuccess, onError) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percentage = Math.round((e.loaded / e.total) * 100);
      onProgress(percentage);
    }
  };

  xhr.onload = () => {
    try {
      const response = JSON.parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300 && response.success) {
        onSuccess(response);
      } else {
        onError(response.message || "Erro durante o processamento do arquivo no servidor.");
      }
    } catch (e) {
      onError("Resposta inválida recebida do servidor.");
    }
  };

  xhr.onerror = () => {
    onError("Falha na conexão com o servidor do Facilita. Certifique-se de que o backend FastAPI está rodando.");
  };

  xhr.open("POST", `${API_BASE_URL}/api/v1/tools/${toolName}`);
  
  // Injeta cabeçalhos de autenticação/planos
  const sessionHeaders = getUserSessionHeaders();
  for (const [key, value] of Object.entries(sessionHeaders)) {
    xhr.setRequestHeader(key, value);
  }

  xhr.send(formData);
}

/* ==========================================================================
   LÓGICAS DE CONTROLE E CONVERSÃO DAS FERRAMENTAS
   ========================================================================== */

// 1. Lógica da ferramenta PDF para Word
function setupPdfWordLogic() {
  const dropzone = document.getElementById('file-dropzone-pdf');
  const fileInput = document.getElementById('file-input-pdf');
  const selectedFileCard = document.getElementById('selected-file-card-pdf');
  const btnRemoveFile = document.getElementById('btn-remove-file-pdf');
  const actionBtnWrapper = document.getElementById('action-btn-wrapper-pdf');
  const btnProcessPdf = document.getElementById('btn-process-pdf');
  const progressContainer = document.getElementById('process-progress-container-pdf');
  const progressBarFill = document.getElementById('process-progress-bar-pdf');
  const progressPercentage = document.getElementById('progress-percentage-pdf');
  const resultCard = document.getElementById('result-card-pdf');
  const btnResetPdf = document.getElementById('btn-reset-pdf');
  const btnDownloadPdfResult = document.getElementById('btn-download-pdf-result');

  let fileToUpload = null;

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Por favor, selecione apenas arquivos do tipo PDF.");
      return;
    }
    fileToUpload = file;
    document.getElementById('selected-file-name-pdf').textContent = file.name;
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';
    document.getElementById('selected-file-size-pdf').textContent = sizeStr;

    dropzone.style.display = 'none';
    selectedFileCard.style.display = 'flex';
    actionBtnWrapper.style.display = 'block';
    
    lucide.createIcons();
  }

  btnRemoveFile.addEventListener('click', resetWorkspace);
  btnResetPdf.addEventListener('click', resetWorkspace);

  function resetWorkspace() {
    fileToUpload = null;
    dropzone.style.display = 'flex';
    selectedFileCard.style.display = 'none';
    actionBtnWrapper.style.display = 'none';
    resultCard.style.display = 'none';
    progressContainer.style.display = 'none';
    progressBarFill.style.width = '0%';
  }

  btnProcessPdf.addEventListener('click', () => {
    if (!fileToUpload) return;
    
    actionBtnWrapper.style.display = 'none';
    selectedFileCard.style.display = 'none';
    progressContainer.style.display = 'block';

    sendFileToBackend(
      "pdf-word",
      fileToUpload,
      (percentage) => {
        progressBarFill.style.width = percentage + '%';
        progressPercentage.textContent = `Enviando PDF: ${percentage}%`;
        if (percentage >= 100) {
          progressPercentage.textContent = "Convertendo arquivo no backend... Por favor, aguarde.";
        }
      },
      (response) => {
        progressContainer.style.display = 'none';
        
        btnDownloadPdfResult.setAttribute("href", response.download_url);
        
        document.getElementById('result-time-pdf').textContent = `⚡ ${response.execution_time}s`;
        const sizeMb = (response.size / (1024 * 1024)).toFixed(2);
        document.getElementById('result-file-details-pdf').textContent = `convertido_word.docx - ${sizeMb} MB`;
        
        resultCard.style.display = 'block';
        lucide.createIcons();
      },
      (errorMsg) => {
        alert("Erro na conversão: " + errorMsg);
        resetWorkspace();
      }
    );
  });
}

// 2. Lógica do Removedor de Fundo
function setupBackgroundRemoverLogic() {
  const dropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-input');
  const selectedFileCard = document.getElementById('selected-file-card');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const actionBtnWrapper = document.getElementById('action-btn-wrapper');
  const btnProcessBg = document.getElementById('btn-process-bg');
  const progressContainer = document.getElementById('process-progress-container');
  const progressBarFill = document.getElementById('process-progress-bar');
  const progressPercentage = document.getElementById('progress-percentage-bg');
  const resultCard = document.getElementById('result-card-bg');
  const btnResetBg = document.getElementById('btn-reset-bg');
  const btnDownloadBgResult = document.getElementById('btn-download-bg-result');

  let fileToUpload = null;

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    fileToUpload = file;
    document.getElementById('selected-file-name').textContent = file.name;
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';
    document.getElementById('selected-file-size').textContent = sizeStr;

    dropzone.style.display = 'none';
    selectedFileCard.style.display = 'flex';
    actionBtnWrapper.style.display = 'block';
    
    lucide.createIcons();
  }

  btnRemoveFile.addEventListener('click', resetWorkspace);
  btnResetBg.addEventListener('click', resetWorkspace);

  function resetWorkspace() {
    fileToUpload = null;
    dropzone.style.display = 'flex';
    selectedFileCard.style.display = 'none';
    actionBtnWrapper.style.display = 'none';
    resultCard.style.display = 'none';
    progressContainer.style.display = 'none';
    progressBarFill.style.width = '0%';
  }

  btnProcessBg.addEventListener('click', () => {
    if (!fileToUpload) return;
    
    actionBtnWrapper.style.display = 'none';
    selectedFileCard.style.display = 'none';
    progressContainer.style.display = 'block';

    sendFileToBackend(
      "remover-fundo",
      fileToUpload,
      (percentage) => {
        progressBarFill.style.width = percentage + '%';
        progressPercentage.textContent = `Enviando imagem: ${percentage}%`;
        if (percentage >= 100) {
          progressPercentage.textContent = "Removendo o fundo via IA... Por favor, aguarde.";
        }
      },
      (response) => {
        progressContainer.style.display = 'none';
        btnDownloadBgResult.setAttribute("href", response.download_url);
        document.getElementById('result-time-bg').textContent = `⚡ ${response.execution_time}s`;
        resultCard.style.display = 'block';
        lucide.createIcons();
      },
      (errorMsg) => {
        alert("Erro na remoção de fundo: " + errorMsg);
        resetWorkspace();
      }
    );
  });
}

// 3. Lógica do Gerador de QR Code
function setupQrCodeGeneratorLogic() {
  const btnGenerateQr = document.getElementById('btn-generate-qr');
  const qrTextInput = document.getElementById('qr-text');
  const qrColorInput = document.getElementById('qr-color');
  const qrSizeSelect = document.getElementById('qr-size');
  const resultCard = document.getElementById('result-card-qr');
  const qrImg = document.getElementById('qrcode-result-img');
  const btnDownloadQrPng = document.getElementById('btn-download-qr-png');

  btnGenerateQr.addEventListener('click', () => {
    const text = qrTextInput.value.trim();
    if (!text) {
      alert('Por favor, insira um texto ou link válido para gerar o QR Code.');
      return;
    }

    const color = qrColorInput.value.replace('#', '');
    const size = qrSizeSelect.value;
    
    const qrUrl = `${API_BASE_URL}/api/v1/tools/qr-code`;
    
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    const dummyBlob = new Blob([text], { type: 'text/plain' });
    formData.append("file", dummyBlob, "qrcode.txt");
    formData.append("params_str", JSON.stringify({ text: text, color: color, size: size }));

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && response.success) {
          qrImg.src = response.download_url;
          qrImg.style.display = 'block';
          btnDownloadQrPng.setAttribute("href", response.download_url);
          resultCard.style.display = 'block';
        } else {
          alert("Erro ao gerar QR Code: " + response.message);
        }
      } catch (e) {
        alert("Erro ao gerar QR Code: Resposta inválida.");
      }
    };
    
    xhr.onerror = () => {
      alert("Erro ao conectar ao backend.");
    };

    xhr.open("POST", qrUrl);
    const sessionHeaders = getUserSessionHeaders();
    for (const [key, value] of Object.entries(sessionHeaders)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(formData);
  });
}

// 4. Lógica Genérica de Ferramenta
function setupGenericToolLogic() {
  const dropzone = document.getElementById('file-dropzone-generic');
  const fileInput = document.getElementById('file-input-generic');
  const selectedFileCard = document.getElementById('selected-file-card-generic');
  const btnRemoveFile = document.getElementById('btn-remove-file-generic');
  const actionBtnWrapper = document.getElementById('action-btn-wrapper-generic');
  const btnProcessGeneric = document.getElementById('btn-process-generic');
  const progressContainer = document.getElementById('process-progress-container-generic');
  const progressBarFill = document.getElementById('process-progress-bar-generic');
  const resultCard = document.getElementById('result-card-generic');
  const btnResetGeneric = document.getElementById('btn-reset-generic');
  const btnDownloadGenericResult = document.getElementById('btn-download-generic-result');

  let fileToUpload = null;

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    fileToUpload = file;
    document.getElementById('selected-file-name-generic').textContent = file.name;
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';
    document.getElementById('selected-file-size-generic').textContent = sizeStr;

    dropzone.style.display = 'none';
    selectedFileCard.style.display = 'flex';
    actionBtnWrapper.style.display = 'block';
    
    lucide.createIcons();
  }

  btnRemoveFile.addEventListener('click', resetWorkspace);
  btnResetGeneric.addEventListener('click', resetWorkspace);

  function resetWorkspace() {
    fileToUpload = null;
    dropzone.style.display = 'flex';
    selectedFileCard.style.display = 'none';
    actionBtnWrapper.style.display = 'none';
    resultCard.style.display = 'none';
    progressContainer.style.display = 'none';
    progressBarFill.style.width = '0%';
  }

  btnProcessGeneric.addEventListener('click', () => {
    if (!fileToUpload) return;
    
    actionBtnWrapper.style.display = 'none';
    selectedFileCard.style.display = 'none';
    progressContainer.style.display = 'block';

    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('tool');
    
    let paramValue = null;
    const paramInput = document.getElementById('generic-param-input');
    if (paramInput) {
      paramValue = paramInput.value;
    }

    sendGenericFileToBackend(
      toolId,
      fileToUpload,
      paramValue,
      (percentage) => {
        progressBarFill.style.width = percentage + '%';
      },
      (response) => {
        progressContainer.style.display = 'none';
        btnDownloadGenericResult.setAttribute("href", response.download_url);
        resultCard.style.display = 'block';
        lucide.createIcons();
      },
      (errorMsg) => {
        alert("Erro no processamento: " + errorMsg);
        resetWorkspace();
      }
    );
  });
}
