import { layout, clientNav } from "./layout.js";

export function renderCopilotChat(): string {
  const suggestedPrompts = [
    "Que deberia publicar esta semana?",
    "Como va mi proyecto?",
    "Genera un brief de campana",
  ];

  const promptChips = suggestedPrompts
    .map(
      (p) =>
        `<button class="prompt-chip px-4 py-2 bg-criteria-gray border border-criteria-border rounded-full text-sm text-criteria-light hover:border-criteria-accent hover:text-criteria-white transition-colors">${p}</button>`,
    )
    .join("");

  const body = `
  <div class="flex flex-col" style="height: calc(100vh - 64px);">

    <!-- Chat header -->
    <div class="border-b border-criteria-border bg-criteria-dark px-6 py-4 shrink-0">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-criteria-white">AI Copilot</h1>
          <p class="text-criteria-muted text-xs mt-0.5">Tu asistente para briefs, estrategia y contenido</p>
        </div>
        <button onclick="clearChat()" class="text-criteria-muted text-xs hover:text-criteria-light transition-colors">
          Nueva conversacion
        </button>
      </div>
    </div>

    <!-- Messages area -->
    <div id="chatMessages" class="flex-1 overflow-y-auto px-6 py-6">
      <div class="max-w-3xl mx-auto space-y-4" id="messagesInner">

        <!-- Welcome message -->
        <div class="flex gap-3">
          <div class="w-8 h-8 rounded-full bg-criteria-accent/20 border border-criteria-accent/30 flex items-center justify-center shrink-0">
            <span class="text-criteria-accent text-xs font-bold">AI</span>
          </div>
          <div class="flex-1 max-w-lg">
            <div class="bg-criteria-gray border border-criteria-border rounded-2xl rounded-tl-sm px-4 py-3">
              <p class="text-criteria-light text-sm">Hola! Soy tu Copilot de criteria.agency. Puedo ayudarte con briefs, estrategia de contenido, y responder preguntas sobre tus proyectos. En que puedo ayudarte hoy?</p>
            </div>
            <p class="text-criteria-muted text-xs mt-1 ml-2">Copilot</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Suggested prompts -->
    <div id="suggestedPrompts" class="px-6 py-3 border-t border-criteria-border bg-criteria-dark/50 shrink-0">
      <div class="max-w-3xl mx-auto">
        <p class="text-criteria-muted text-xs mb-2">Sugerencias:</p>
        <div class="flex flex-wrap gap-2">
          ${promptChips}
        </div>
      </div>
    </div>

    <!-- Input bar -->
    <div class="border-t border-criteria-border bg-criteria-dark px-6 py-4 shrink-0">
      <div class="max-w-3xl mx-auto">
        <div class="flex gap-3 items-end">
          <textarea
            id="chatInput"
            rows="1"
            placeholder="Escribe tu mensaje..."
            class="flex-1 bg-criteria-gray border border-criteria-border rounded-xl px-4 py-3 text-criteria-light placeholder-criteria-muted resize-none focus:outline-none focus:border-criteria-accent text-sm"
            style="max-height: 120px; overflow-y: auto;"
          ></textarea>
          <button id="sendBtn"
            onclick="sendMessage()"
            class="px-4 py-3 bg-criteria-accent text-black rounded-xl font-medium text-sm hover:bg-amber-400 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            Enviar
          </button>
        </div>
        <p class="text-criteria-muted text-xs mt-2 text-center">La IA genera. El criterio decide.</p>
      </div>
    </div>
  </div>

  <script>
    var sessionId = null;
    var isLoading = false;

    function makeAvatarEl() {
      var av = document.createElement('div');
      av.className = 'w-8 h-8 rounded-full bg-criteria-accent/20 border border-criteria-accent/30 flex items-center justify-center shrink-0';
      var sp = document.createElement('span');
      sp.className = 'text-criteria-accent text-xs font-bold';
      sp.textContent = 'AI';
      av.appendChild(sp);
      return av;
    }

    function appendMessage(role, text) {
      var inner = document.getElementById('messagesInner');
      var isUser = role === 'user';

      var wrapper = document.createElement('div');
      wrapper.className = 'flex gap-3' + (isUser ? ' justify-end' : '');

      if (!isUser) {
        wrapper.appendChild(makeAvatarEl());
      }

      var msgWrap = document.createElement('div');
      msgWrap.className = 'flex-1 max-w-lg' + (isUser ? ' flex flex-col items-end' : '');

      var bubble = document.createElement('div');
      bubble.className = isUser
        ? 'bg-criteria-accent/20 border border-criteria-accent/30 rounded-2xl rounded-tr-sm px-4 py-3'
        : 'bg-criteria-gray border border-criteria-border rounded-2xl rounded-tl-sm px-4 py-3';

      var p = document.createElement('p');
      p.className = 'text-criteria-light text-sm whitespace-pre-wrap';
      p.textContent = text;
      bubble.appendChild(p);

      var label = document.createElement('p');
      label.className = 'text-criteria-muted text-xs mt-1' + (isUser ? ' mr-2' : ' ml-2');
      label.textContent = isUser ? 'Tu' : 'Copilot';

      msgWrap.appendChild(bubble);
      msgWrap.appendChild(label);
      wrapper.appendChild(msgWrap);
      inner.appendChild(wrapper);

      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    function appendTypingIndicator() {
      var inner = document.getElementById('messagesInner');
      var wrapper = document.createElement('div');
      wrapper.className = 'flex gap-3';
      wrapper.id = 'typingIndicator';
      wrapper.appendChild(makeAvatarEl());

      var bubble = document.createElement('div');
      bubble.className = 'bg-criteria-gray border border-criteria-border rounded-2xl rounded-tl-sm px-4 py-3';

      var dots = document.createElement('div');
      dots.className = 'flex gap-1 items-center h-4';
      ['0ms', '150ms', '300ms'].forEach(function(delay) {
        var dot = document.createElement('div');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-criteria-muted animate-bounce';
        dot.style.animationDelay = delay;
        dots.appendChild(dot);
      });

      bubble.appendChild(dots);
      wrapper.appendChild(bubble);
      inner.appendChild(wrapper);
      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    function removeTypingIndicator() {
      var el = document.getElementById('typingIndicator');
      if (el) el.remove();
    }

    function buildWelcomeMessage() {
      var wrapper = document.createElement('div');
      wrapper.className = 'flex gap-3';
      wrapper.appendChild(makeAvatarEl());

      var msgWrap = document.createElement('div');
      msgWrap.className = 'flex-1 max-w-lg';

      var bubble = document.createElement('div');
      bubble.className = 'bg-criteria-gray border border-criteria-border rounded-2xl rounded-tl-sm px-4 py-3';
      var p = document.createElement('p');
      p.className = 'text-criteria-light text-sm';
      p.textContent = 'Hola! Soy tu Copilot de criteria.agency. En que puedo ayudarte hoy?';
      bubble.appendChild(p);

      var label = document.createElement('p');
      label.className = 'text-criteria-muted text-xs mt-1 ml-2';
      label.textContent = 'Copilot';

      msgWrap.appendChild(bubble);
      msgWrap.appendChild(label);
      wrapper.appendChild(msgWrap);
      return wrapper;
    }

    async function sendMessage() {
      if (isLoading) return;
      var input = document.getElementById('chatInput');
      var text = input.value.trim();
      if (!text) return;

      document.getElementById('suggestedPrompts').style.display = 'none';

      input.value = '';
      input.style.height = 'auto';
      isLoading = true;
      document.getElementById('sendBtn').disabled = true;

      appendMessage('user', text);
      appendTypingIndicator();

      try {
        if (!sessionId) {
          var initRes = await fetch('/api/copilot/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({})
          });
          var initData = await initRes.json();
          sessionId = initData.sessionId || initData.id || null;
        }

        var res = await fetch('/api/copilot/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ sessionId: sessionId, message: text })
        });
        var data = await res.json();
        removeTypingIndicator();

        if (!res.ok) {
          appendMessage('assistant', 'Lo siento, hubo un error: ' + (data.error || 'Error desconocido'));
        } else {
          var reply = data.message || data.reply || data.content || data.response || JSON.stringify(data);
          appendMessage('assistant', reply);
        }
      } catch(e) {
        removeTypingIndicator();
        appendMessage('assistant', 'Lo siento, no pude conectar con el servidor. Intenta de nuevo.');
      } finally {
        isLoading = false;
        document.getElementById('sendBtn').disabled = false;
        input.focus();
      }
    }

    function clearChat() {
      sessionId = null;
      var inner = document.getElementById('messagesInner');
      while (inner.firstChild) inner.removeChild(inner.firstChild);
      inner.appendChild(buildWelcomeMessage());
      document.getElementById('suggestedPrompts').style.display = '';
    }

    document.querySelectorAll('.prompt-chip').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.getElementById('chatInput').value = this.textContent;
        sendMessage();
      });
    });

    document.getElementById('chatInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    document.getElementById('chatInput').addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  </script>
  `;

  return layout("Copilot", body, clientNav("copilot"));
}
