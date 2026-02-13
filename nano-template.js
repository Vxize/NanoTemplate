class NanoTemplate {
  // Track loaded scripts and event listeners per target element
  static _loadedScripts = new WeakMap();
  static _eventListeners = new WeakMap();

  static async render(template, dataSource = null, fetchOption = {}, targetElementId = 'app', viewPath = '/page/', templateExtension = '.html') {
    const targetElement = document.getElementById(targetElementId);

    // Validate target element exists
    if (!targetElement) {
      console.error(`Target element with id "${targetElementId}" not found`);
      return;
    }

    // Clean up previous event listeners for this element
    this._cleanupEventListeners(targetElement);

    const templateUrl = template.startsWith('http') ? template : viewPath + template.replace('.', '/') + templateExtension;

    try {
      // Fetch template with error handling
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }
      const templateContent = await response.text();

      // If no data source, render static template
      if (!dataSource) {
        targetElement.innerHTML = templateContent;
        await this.loadScript(targetElement);
        return;
      }

      // Load data
      let data;
      if (typeof dataSource === 'string') {
        const apiResponse = await fetch(dataSource, fetchOption);
        if (!apiResponse.ok) {
          throw new Error(`Error loading data: ${apiResponse.status} ${apiResponse.statusText}`);
        }
        data = await apiResponse.json();
      } else {
        data = dataSource;
      }

      // Process and render template
      const processed = this.processTemplate(templateContent, data);
      targetElement.innerHTML = processed;
      await this.loadScript(targetElement);

    } catch (error) {
      console.error('Template rendering failed:', error);
      targetElement.innerHTML = `<p>Error loading content: ${this.escapeHtml(error.message)}</p>`;
    }
  }

  static async loadScript(targetElement) {
    const scripts = targetElement.querySelectorAll('script');
    const loadedScripts = this._loadedScripts.get(targetElement) || new Set();

    for (const oldScript of scripts) {
      const scriptId = this._getScriptIdentifier(oldScript);

      // Skip if already loaded (for external scripts)
      if (oldScript.src && loadedScripts.has(scriptId)) {
        console.log(`Script already loaded: ${scriptId}`);
        continue;
      }

      await this.executeScript(oldScript);

      if (oldScript.src) {
        loadedScripts.add(scriptId);
      }
    }

    this._loadedScripts.set(targetElement, loadedScripts);
  }

  /**
   * Generate unique identifier for a script
   */
  static _getScriptIdentifier(script) {
    if (script.src) {
      return script.src;
    }
    // For inline scripts, create hash from content
    const content = script.textContent.trim();
    return `inline:${this._simpleHash(content)}`;
  }

  /**
   * Simple hash function for script content
   */
  static _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clean up event listeners registered for this element
   */
  static _cleanupEventListeners(targetElement) {
    const listeners = this._eventListeners.get(targetElement);
    if (listeners) {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this._eventListeners.delete(targetElement);
    }
  }

  /**
   * Register an event listener for tracking and cleanup
   */
  static registerEventListener(targetElement, element, event, handler, options) {
    if (!this._eventListeners.has(targetElement)) {
      this._eventListeners.set(targetElement, []);
    }
    this._eventListeners.get(targetElement).push({ element, event, handler, options });
    element.addEventListener(event, handler, options);
  }

  static executeScript(oldScript) {
    if (!oldScript) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const newScript = document.createElement('script');

        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        if (oldScript.src) {
          // External script
          newScript.src = oldScript.src;
          newScript.onload = resolve;
          newScript.onerror = (error) => {
            console.error(`Failed to load script: ${oldScript.src}`, error);
            reject(new Error(`Script load failed: ${oldScript.src}`));
          };

          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          } else {
            console.error('Script has no parent node');
            reject(new Error('Script has no parent node'));
          }
        } else {
          // Inline script - validate before executing
          const scriptContent = oldScript.textContent || oldScript.text || '';

          // Check for common syntax errors
          if (!scriptContent.trim()) {
            // Empty script, just resolve
            resolve();
            return;
          }

          // Check for unclosed tags that might cause issues
          if (this._hasUnclosesTags(scriptContent)) {
            console.warn('Warning: Script may contain unclosed HTML tags:', scriptContent.substring(0, 100));
          }

          // Validate syntax by attempting to create a function
          try {
            new Function(scriptContent);
          } catch (syntaxError) {
            console.error('Syntax error in inline script:', syntaxError);
            console.error('Script content:', scriptContent);
            reject(new Error(`Syntax error in inline script: ${syntaxError.message}`));
            return;
          }

          newScript.textContent = scriptContent;

          if (oldScript.parentNode) {
            try {
              oldScript.parentNode.replaceChild(newScript, oldScript);
              setTimeout(resolve, 0);
            } catch (replaceError) {
              console.error('Error replacing script node:', replaceError);
              console.error('Script content:', scriptContent);
              reject(replaceError);
            }
          } else {
            console.error('Script has no parent node');
            reject(new Error('Script has no parent node'));
          }
        }
      } catch (error) {
        console.error('Error in executeScript:', error);
        reject(error);
      }
    });
  }

  /**
   * Check if script content has unclosed HTML-like tags that might cause issues
   */
  static _hasUnclosesTags(content) {
    // Simple check for common problematic patterns
    const openScriptTags = (content.match(/<script/gi) || []).length;
    const closeScriptTags = (content.match(/<\/script>/gi) || []).length;
    return openScriptTags !== closeScriptTags;
  }

  static processTemplate(template, data) {
    return this.processBlocks(template, data);
  }

  static processBlocks(template, data, depth = 0) {
    // Prevent infinite recursion
    if (depth > 100) {
      throw new Error('Maximum template nesting depth exceeded');
    }

    let output = '';
    let pos = 0;

    while (pos < template.length) {
      // Handle escaped braces
      if (template.startsWith('\\{{', pos)) {
        output += '{{';
        pos += 3;
        continue;
      }

      // Find next block or placeholder
      const blockStart = template.indexOf('{{', pos);

      if (blockStart === -1) {
        // Append remaining text
        output += template.slice(pos);
        break;
      }

      // Append text before block
      output += template.slice(pos, blockStart);

      // Check for triple braces (unescaped) or double braces (escaped)
      const isTripleBrace = template.startsWith('{{{', blockStart);
      const openBraceLength = isTripleBrace ? 3 : 2;
      const closeBrace = isTripleBrace ? '}}}' : '}}';

      // Find the closing tag
      const tagEnd = template.indexOf(closeBrace, blockStart + openBraceLength);
      if (tagEnd === -1) {
        throw new Error(`Unclosed tag at position ${blockStart}`);
      }

      const tagContent = template.slice(blockStart + openBraceLength, tagEnd).trim();
      pos = tagEnd + closeBrace.length;

      if (tagContent.startsWith('#')) {
        // Block handler (#each, #if, #unless)
        if (isTripleBrace) {
          throw new Error(`Block tag "${tagContent}" must use double braces, not triple`);
        }

        const spaceIndex = tagContent.indexOf(' ');
        const blockType = spaceIndex === -1
          ? tagContent.slice(1)
          : tagContent.slice(1, spaceIndex);
        const expression = spaceIndex === -1
          ? ''
          : tagContent.slice(spaceIndex + 1).trim();

        // Find matching closing tag using proper nesting count
        const closeTag = `{{/${blockType}}}`;
        const { content: innerContent, endPos } = this.findMatchingClose(
          template,
          pos,
          `{{#${blockType}`,
          closeTag
        );

        if (endPos === -1) {
          throw new Error(`Unclosed ${blockType} block at position ${blockStart}`);
        }

        pos = endPos;

        // Process block based on type
        switch (blockType) {
          case 'each':
            output += this.processEachBlock(innerContent, expression, data, depth);
            break;
          case 'if':
            output += this.processIfBlock(innerContent, expression, data, true, depth);
            break;
          case 'unless':
            output += this.processIfBlock(innerContent, expression, data, false, depth);
            break;
          default:
            throw new Error(`Unknown block type: ${blockType}`);
        }
      } else if (tagContent.startsWith('/')) {
        // Closing tag (shouldn't appear here)
        if (isTripleBrace) {
          throw new Error(`Closing tag "${tagContent}" must use double braces, not triple`);
        }
        throw new Error(`Unexpected closing tag at position ${blockStart}`);
      } else if (tagContent === 'else') {
        // Else tag (should be handled within block processing)
        if (isTripleBrace) {
          throw new Error('Else tag must use double braces, not triple');
        }
        throw new Error(`Unexpected {{else}} tag at position ${blockStart}`);
      } else {
        // Simple placeholder
        const value = this.getNestedValue(data, tagContent);
        if (isTripleBrace) {
          // Triple braces - unescaped output (WARNING: potential XSS)
          output += value !== undefined && value !== null ? String(value) : '';
        } else {
          // Double braces - escaped output
          output += value !== undefined && value !== null ? this.escapeHtml(String(value)) : '';
        }
      }
    }
    return output;
  }

  /**
   * Find matching closing tag with proper nesting support
   */
  static findMatchingClose(template, startPos, openTag, closeTag) {
    let depth = 1;
    let pos = startPos;

    while (pos < template.length && depth > 0) {
      const nextOpen = template.indexOf(openTag, pos);
      const nextClose = template.indexOf(closeTag, pos);

      if (nextClose === -1) {
        return { content: '', endPos: -1 };
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Found nested opening tag
        depth++;
        pos = nextOpen + openTag.length;
      } else {
        // Found closing tag
        depth--;
        if (depth === 0) {
          return {
            content: template.slice(startPos, nextClose),
            endPos: nextClose + closeTag.length
          };
        }
        pos = nextClose + closeTag.length;
      }
    }

    return { content: '', endPos: -1 };
  }

  static processEachBlock(template, expression, data, depth) {
    if (!expression) {
      throw new Error('#each block requires an expression');
    }

    const dataList = this.getNestedValue(data, expression);

    // Split content at {{else}} tag
    const { main: mainContent, else: elseContent } = this.splitAtElse(template);

    let entries;
    if (Array.isArray(dataList) && dataList.length > 0) {
      entries = dataList.map((item, index) => [index, item]);
    } else if (typeof dataList === 'object' && dataList !== null && Object.keys(dataList).length > 0) {
      entries = Object.entries(dataList);
    } else {
      return this.processBlocks(elseContent, data, depth + 1);
    }

    return entries.map(([key, value], index) => {
      const context = {
        '@index': index,
        '@key': key,
        '@first': index === 0,
        '@last': index === entries.length - 1,
        ...(value && typeof value === 'object' ? value : { value: value })
      };
      return this.processBlocks(mainContent, context, depth + 1);
    }).join('');
  }

  static processIfBlock(template, expression, data, condition, depth) {
    if (!expression) {
      throw new Error('#if block requires an expression');
    }

    const value = this.getNestedValue(data, expression);
    const shouldRender = condition ? !!value : !value;

    // Split content at {{else}} tag
    const { main: mainContent, else: elseContent } = this.splitAtElse(template);

    if (shouldRender) {
      return this.processBlocks(mainContent, data, depth + 1);
    } else {
      return this.processBlocks(elseContent, data, depth + 1);
    }
  }

  /**
   * Split template at {{else}} tag, handling nesting properly
   */
  static splitAtElse(template) {
    let depth = 0;
    let pos = 0;

    while (pos < template.length) {
      // Check for opening blocks
      if (template.startsWith('{{#', pos)) {
        depth++;
        pos += 3;
        continue;
      }

      // Check for closing blocks
      if (template.startsWith('{{/', pos)) {
        depth--;
        pos += 3;
        continue;
      }

      // Check for {{else}} at depth 0
      if (depth === 0 && template.startsWith('{{else}}', pos)) {
        return {
          main: template.slice(0, pos),
          else: template.slice(pos + 8)
        };
      }

      pos++;
    }

    return {
      main: template,
      else: ''
    };
  }

  static getNestedValue(obj, path) {
    if (!path) return obj;

    return path.split('.').reduce((o, key) => {
      if (o === null || o === undefined) return undefined;
      return o[key];
    }, obj);
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

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NanoTemplate;
}
