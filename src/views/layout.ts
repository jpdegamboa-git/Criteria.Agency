export function clientNav(active: string): string {
  const items = [
    { href: "/app/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/app/projects", label: "Proyectos", key: "projects" },
    { href: "/app/copilot", label: "Copilot", key: "copilot" },
    { href: "/app/content", label: "Contenido", key: "content" },
  ];
  return `
  <nav class="border-b border-criteria-border bg-criteria-dark sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <a href="/app/dashboard" class="flex items-center gap-2">
          <span class="text-criteria-accent font-bold text-lg tracking-tight">criteria.agency</span>
        </a>
        <div class="flex items-center gap-1 text-sm">
          ${items
            .map(
              (item) =>
                `<a href="${item.href}" class="px-4 py-2 rounded-lg font-medium transition-colors ${
                  active === item.key
                    ? "text-criteria-white bg-criteria-gray"
                    : "text-criteria-muted hover:text-criteria-light hover:bg-criteria-gray/50"
                }">${item.label}</a>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  </nav>`;
}

export function adminNav(active: string): string {
  const items = [
    { href: "/admin/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/admin/finances", label: "Finanzas", key: "finances" },
    { href: "/admin/agents", label: "Agentes", key: "agents" },
    { href: "/admin/canvas", label: "Canvas", key: "canvas" },
  ];
  return `
  <nav class="border-b border-criteria-border bg-criteria-dark sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <a href="/admin/dashboard" class="flex items-center gap-2">
          <span class="text-criteria-accent font-bold text-lg tracking-tight">criteria.agency</span>
          <span class="text-criteria-muted text-xs font-normal ml-1">admin</span>
        </a>
        <div class="flex items-center gap-1 text-sm">
          ${items
            .map(
              (item) =>
                `<a href="${item.href}" class="px-4 py-2 rounded-lg font-medium transition-colors ${
                  active === item.key
                    ? "text-criteria-white bg-criteria-gray"
                    : "text-criteria-muted hover:text-criteria-light hover:bg-criteria-gray/50"
                }">${item.label}</a>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  </nav>`;
}

export function layout(title: string, body: string, nav?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — criteria.agency</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            criteria: {
              black: '#0a0a0a',
              dark: '#141414',
              gray: '#1e1e1e',
              border: '#2a2a2a',
              muted: '#666666',
              text: '#a0a0a0',
              light: '#e0e0e0',
              white: '#fafafa',
              accent: '#f59e0b',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-criteria-black text-criteria-light min-h-screen">
  ${nav ?? ""}
  ${body}
  <div id="toast-container" class="fixed top-4 right-4 z-50 flex flex-col gap-2"></div>
  <script>
    function showToast(message, type) {
      type = type || 'info';
      var colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-criteria-accent',
        warning: 'bg-yellow-600'
      };
      var toast = document.createElement('div');
      toast.className = (colors[type] || colors.info) + ' text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm transition-opacity duration-300';
      toast.textContent = message;
      document.getElementById('toast-container').appendChild(toast);
      setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 4000);
    }

    function showConfirm(message) {
      return new Promise(function(resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center';
        var box = document.createElement('div');
        box.className = 'bg-criteria-dark border border-criteria-border rounded-lg p-6 max-w-md mx-4';
        var p = document.createElement('p');
        p.className = 'text-criteria-light mb-6';
        p.textContent = message;
        var btns = document.createElement('div');
        btns.className = 'flex justify-end gap-3';
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 text-sm text-criteria-muted hover:text-criteria-light';
        cancelBtn.textContent = 'Cancelar';
        var okBtn = document.createElement('button');
        okBtn.className = 'px-4 py-2 text-sm bg-criteria-accent text-black rounded font-medium';
        okBtn.textContent = 'Confirmar';
        btns.appendChild(cancelBtn);
        btns.appendChild(okBtn);
        box.appendChild(p);
        box.appendChild(btns);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        okBtn.onclick = function() { overlay.remove(); resolve(true); };
        cancelBtn.onclick = function() { overlay.remove(); resolve(false); };
      });
    }
  </script>
</body>
</html>`;
}

export function errorPage(title: string, message: string): string {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMessage = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return layout(
    title,
    `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center max-w-md px-6">
        <h1 class="text-2xl font-bold text-criteria-white mb-4">${safeTitle}</h1>
        <p class="text-criteria-muted mb-8">${safeMessage}</p>
        <a href="/" class="text-criteria-accent hover:underline">Volver al inicio</a>
      </div>
    </div>
    `,
  );
}
