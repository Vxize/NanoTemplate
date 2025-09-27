class NanoTemplate {
  static async render(template, apiUrl = null, targetElementId = 'app', viewPath = '/page/', templateExtension = '.html') {
    const targetElement = document.getElementById(targetElementId);
    const templateUrl = template.startsWith('http') ? template : viewPath + template.replace('.', '/') + templateExtension;
    try {
      if (! apiUrl) {
        const content = await fetch(templateUrl);
        const html = await content.text();
        targetElement.innerHTML = html;
        return;
      }
      const [template, data] = await Promise.all([
        fetch(templateUrl).then(res => res.text()),
        fetch(apiUrl).then(res => res.json())
      ]);
      const processed = this.processTemplate(template, data);
      targetElement.innerHTML = processed;
    } catch (error) {
      console.error('Template rendering failed:', error);
      targetElement.innerHTML = `<p>Error loading content. ${error.message}</p>`;
    }
  }

  static processTemplate(template, data) {
    return this.processBlocks(template, data);
  }

  static processBlocks(template, data) {
    let output = '';
    let pos = 0;

    while (pos < template.length) {
      // Find next block or placeholder
      const blockStart = template.indexOf('{{', pos);

      if (blockStart === -1) {
        // Append remaining text
        output += template.slice(pos);
        break;
      }

      // Append text before block
      output += template.slice(pos, blockStart);

      // Parse block type
      const tagEnd = template.indexOf('}}', blockStart);
      if (tagEnd === -1) throw new Error('Unclosed tag');

      const tagContent = template.slice(blockStart + 2, tagEnd).trim();
      pos = tagEnd + 2;

      if (tagContent.startsWith('#')) {
        // Block handler (#each, #if, #unless)
        const blockType = tagContent.slice(1).split(' ')[0];
        const expression = tagContent.slice(1 + blockType.length).trim();

        // Find matching closing tag
        const closeTag = `{{/${blockType}}}`;
        const closeStart = template.indexOf(closeTag, pos);
        if (closeStart === -1) throw new Error(`Unclosed ${blockType} block`);

        const innerContent = template.slice(pos, closeStart);
        pos = closeStart + closeTag.length;

        // Process block based on type
        switch (blockType) {
          case 'each':
            output += this.processEachBlock(innerContent, expression, data);
            break;
          case 'if':
            output += this.processIfBlock(innerContent, expression, data, true);
            break;
          case 'unless':
            output += this.processIfBlock(innerContent, expression, data, false);
            break;
          default:
            throw new Error(`Unknown block type: ${blockType}`);
        }
      } else if (tagContent.startsWith('/')) {
        // Closing tag (shouldn't appear here)
        throw new Error('Unexpected closing tag');
      } else if (tagContent === 'else') {
        // Else tag (should be handled within block processing)
        throw new Error('Unexpected {{else}} tag');
      } else {
        // Simple placeholder
        const value = this.getNestedValue(data, tagContent);
        output += value !== undefined ? this.escapeHtml(value) : '';
      }
    }

    return output;
  }

  static processEachBlock(template, expression, data) {
    const array = this.getNestedValue(data, expression);

    // Split content at {{else}} tag
    const elseIndex = template.indexOf('{{else}}');
    const mainContent = elseIndex === -1 ? template : template.slice(0, elseIndex);
    const elseContent = elseIndex === -1 ? '' : template.slice(elseIndex + '{{else}}'.length);

    if (Array.isArray(array) && array.length > 0) {
      return array.map(item => {
        return this.processBlocks(mainContent, item);
      }).join('');
    } else {
      return this.processBlocks(elseContent, data);
    }
  }

  static processIfBlock(template, expression, data, condition) {
    const value = this.getNestedValue(data, expression);
    const shouldRender = condition ? !!value : !value;

    // Split content at {{else}} tag
    const elseIndex = template.indexOf('{{else}}');
    const mainContent = elseIndex === -1 ? template : template.slice(0, elseIndex);
    const elseContent = elseIndex === -1 ? '' : template.slice(elseIndex + '{{else}}'.length);

    if (shouldRender) {
      return this.processBlocks(mainContent, data);
    } else {
      return this.processBlocks(elseContent, data);
    }
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((o, key) => 
      (o && o[key] !== undefined) ? o[key] : undefined, obj);
  }

  static escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
