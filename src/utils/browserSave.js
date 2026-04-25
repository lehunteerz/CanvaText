/** Salvar HTML no navegador (sem Electron) */
export function downloadEditorHtmlFile(htmlBody, filename = 'nota-editor.html') {
  const doc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CanvaText export</title>
</head>
<body>
${htmlBody}
</body>
</html>`;
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
