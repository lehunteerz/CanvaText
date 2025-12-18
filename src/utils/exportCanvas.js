/**
 * Utilitários para exportar o canvas de desenho como imagem
 */

/**
 * Exporta o canvas como imagem PNG
 * @param {HTMLElement} canvasElement - Elemento do canvas
 * @param {string} filename - Nome do arquivo
 * @param {number} scale - Escala da imagem (padrão: 2 para melhor qualidade)
 */
export const exportCanvasAsPNG = async (canvasElement, filename = 'drawing.png', scale = 2) => {
  try {
    // Encontrar todos os elementos SVG e divs do canvas
    const svgElements = canvasElement.querySelectorAll('svg');
    const divElements = canvasElement.querySelectorAll('div[style*="position: absolute"]');
    
    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    const rect = canvasElement.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    
    // Fundo branco ou transparente baseado no tema
    ctx.fillStyle = '#1a1a1a'; // Fundo escuro padrão
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar elementos SVG
    for (const svg of svgElements) {
      const svgRect = svg.getBoundingClientRect();
      const canvasRect = canvasElement.getBoundingClientRect();
      
      const x = (svgRect.left - canvasRect.left) * scale;
      const y = (svgRect.top - canvasRect.top) * scale;
      
      // Converter SVG para imagem
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, x, y, svgRect.width * scale, svgRect.height * scale);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    }
    
    // Renderizar elementos div (formas)
    for (const div of divElements) {
      const divRect = div.getBoundingClientRect();
      const canvasRect = canvasElement.getBoundingClientRect();
      
      const x = (divRect.left - canvasRect.left) * scale;
      const y = (divRect.top - canvasRect.top) * scale;
      const width = divRect.width * scale;
      const height = divRect.height * scale;
      
      const style = window.getComputedStyle(div);
      const bgColor = style.backgroundColor;
      const borderColor = style.borderColor;
      const borderWidth = parseFloat(style.borderWidth) * scale;
      const borderRadius = parseFloat(style.borderRadius) * scale;
      
      ctx.save();
      
      // Desenhar fundo
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        if (borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, width, height);
        }
      }
      
      // Desenhar borda
      if (borderColor && borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        if (borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, borderRadius);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, width, height);
        }
      }
      
      ctx.restore();
    }
    
    // Converter para blob e baixar
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar canvas:', error);
    return false;
  }
};

/**
 * Exporta o canvas como SVG
 * @param {HTMLElement} canvasElement - Elemento do canvas
 * @param {string} filename - Nome do arquivo
 */
export const exportCanvasAsSVG = (canvasElement, filename = 'drawing.svg') => {
  try {
    const rect = canvasElement.getBoundingClientRect();
    
    // Criar SVG raiz
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', rect.width.toString());
    svg.setAttribute('height', rect.height.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Copiar todos os elementos SVG do canvas
    const svgElements = canvasElement.querySelectorAll('svg');
    svgElements.forEach((el) => {
      const cloned = el.cloneNode(true);
      svg.appendChild(cloned);
    });
    
    // Converter elementos div para SVG
    const divElements = canvasElement.querySelectorAll('div[style*="position: absolute"]');
    divElements.forEach((div) => {
      const divRect = div.getBoundingClientRect();
      const canvasRect = canvasElement.getBoundingClientRect();
      
      const x = divRect.left - canvasRect.left;
      const y = divRect.top - canvasRect.top;
      const width = divRect.width;
      const height = divRect.height;
      
      const style = window.getComputedStyle(div);
      const bgColor = style.backgroundColor;
      const borderColor = style.borderColor;
      const borderWidth = style.borderWidth;
      const borderRadius = style.borderRadius;
      
      // Criar elemento SVG equivalente
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', x.toString());
      rectEl.setAttribute('y', y.toString());
      rectEl.setAttribute('width', width.toString());
      rectEl.setAttribute('height', height.toString());
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        rectEl.setAttribute('fill', bgColor);
      } else {
        rectEl.setAttribute('fill', 'none');
      }
      
      if (borderColor && borderWidth !== '0px') {
        rectEl.setAttribute('stroke', borderColor);
        rectEl.setAttribute('stroke-width', borderWidth);
      }
      
      if (borderRadius !== '0px') {
        rectEl.setAttribute('rx', borderRadius);
        rectEl.setAttribute('ry', borderRadius);
      }
      
      svg.appendChild(rectEl);
    });
    
    // Converter para string e baixar
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar SVG:', error);
    return false;
  }
};

