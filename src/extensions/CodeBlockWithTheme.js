import CodeBlock from '@tiptap/extension-code-block';

/**
 * Extensão customizada do CodeBlock com suporte a temas
 */
const CodeBlockWithTheme = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      theme: {
        default: null,
        parseHTML: element => {
          // Priorizar atributo data-code-theme
          const dataTheme = element.getAttribute('data-code-theme');
          if (dataTheme) {
            return dataTheme;
          }
          
          // Buscar na classe CSS
          const classTheme = Array.from(element.classList).find(c => c.startsWith('code-theme-'));
          if (classTheme) {
            return classTheme;
          }
          
          return null;
        },
        renderHTML: ({ node }) => {
          if (!node || !node.attrs) {
            return {};
          }
          const theme = node.attrs.theme;
          if (theme) {
            return {
              'data-code-theme': theme,
            };
          }
          return {};
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    if (!node || !node.attrs) {
      return ['pre', HTMLAttributes, ['code', 0]];
    }
    const attrs = node.attrs || {};
    const theme = attrs.theme;
    
    // Preparar classes
    const existingClasses = HTMLAttributes.class ? HTMLAttributes.class.split(' ').filter(Boolean) : [];
    
    // Remover classes de tema antigas
    const themeClasses = ['code-theme-horizon', 'code-theme-nord', 'code-theme-dracula', 'code-theme-onedark'];
    const filteredClasses = existingClasses.filter(c => !themeClasses.includes(c));
    
    // Adicionar novo tema se existir
    if (theme) {
      if (!filteredClasses.includes(theme)) {
        filteredClasses.push(theme);
      }
      HTMLAttributes.class = filteredClasses.join(' ');
      HTMLAttributes['data-code-theme'] = theme;
    } else {
      HTMLAttributes.class = filteredClasses.join(' ');
    }
    
    return ['pre', HTMLAttributes, ['code', 0]];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCodeBlockTheme: (theme) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        
        let codeBlockPos = null;
        let codeBlockNode = null;
        
        // Buscar o codeBlock na hierarquia
        let depth = $from.depth;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === 'codeBlock') {
            codeBlockPos = $from.before(depth);
            codeBlockNode = node;
            break;
          }
          depth--;
        }

        if (codeBlockPos !== null && codeBlockNode && dispatch) {
          // Atualizar atributos do node
          tr.setNodeMarkup(codeBlockPos, undefined, {
            ...codeBlockNode.attrs,
            theme: theme,
          });
          
          dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});

export default CodeBlockWithTheme;
