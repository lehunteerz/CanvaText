import Blockquote from '@tiptap/extension-blockquote';

/**
 * Extensão customizada do Blockquote com suporte a cores via classes CSS
 * Abordagem mais confiável: usar classes CSS ao invés de estilos inline
 */
const BlockquoteWithColor = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: element => {
          // Buscar classe CSS ou atributo data-color
          const classList = element.classList;
          for (const className of classList) {
            if (className.startsWith('blockquote-color-')) {
              return className.replace('blockquote-color-', '');
            }
          }
          return element.getAttribute('data-color') || null;
        },
        renderHTML: attributes => {
          if (!attributes.color || !attributes.borderColor) {
            return {};
          }
          
          // Retornar classe CSS baseada na cor
          const colorClass = `blockquote-color-${attributes.color.replace('#', '')}`;
          return {
            class: colorClass,
            'data-color': attributes.color,
            'data-border-color': attributes.borderColor,
          };
        },
      },
      borderColor: {
        default: null,
        parseHTML: element => {
          return element.getAttribute('data-border-color') || null;
        },
        renderHTML: () => {
          // Já renderizado junto com color
          return {};
        },
      },
    };
  },

  // Sobrescrever renderHTML para aplicar classes CSS
  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs || {};
    const hasColor = attrs.color && attrs.borderColor;
    
    if (hasColor) {
      // Adicionar classe CSS baseada na cor
      const colorClass = `blockquote-color-${attrs.color.replace('#', '')}`;
      const existingClasses = HTMLAttributes.class ? HTMLAttributes.class.split(' ') : [];
      if (!existingClasses.includes(colorClass)) {
        existingClasses.push(colorClass);
      }
      HTMLAttributes.class = existingClasses.join(' ');
      HTMLAttributes['data-color'] = attrs.color;
      HTMLAttributes['data-border-color'] = attrs.borderColor;
    }
    
    return ['blockquote', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setBlockquoteColor: (color, borderColor) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        
        // Encontrar o blockquote que contém a seleção atual
        let blockquotePos = null;
        let blockquoteNode = null;
        
        let depth = $from.depth;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === 'blockquote') {
            blockquotePos = $from.before(depth);
            blockquoteNode = node;
            break;
          }
          depth--;
        }

        if (blockquotePos !== null && blockquoteNode && dispatch) {
          tr.setNodeMarkup(blockquotePos, undefined, {
            ...blockquoteNode.attrs,
            color: color,
            borderColor: borderColor,
          });
          dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});

export default BlockquoteWithColor;

