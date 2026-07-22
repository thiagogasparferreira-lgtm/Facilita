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
