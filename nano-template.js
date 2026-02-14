class NanoTemplate {
  // Track loaded scripts and event listeners per target element
  static _loadedScripts = new WeakMap();
  static _eventListeners = new WeakMap();

  static async render(template, dataSource = null, fetchOption = {}, options = {}) {
    // Default options
    const {
      targetElementId = 'app',
      viewPath = '/page/',
      templateExtension = '.html',
      skipScripts = false,
      debug = false
    } = options;

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

        // Skip script execution if requested
        if (!skipScripts) {
          await this.loadScript(targetElement, debug);
        }
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

      // Skip script execution if requested
      if (!skipScripts) {
        await this.loadScript(targetElement, debug);
      }

    } catch (error) {
      console.error('Template rendering failed:', error);
      console.error('Full error:', error.stack);
      targetElement.innerHTML = `<p>Error loading content: ${this.escapeHtml(error.message)}</p>`;
    }
  }

  static async loadScript(targetElement, debug = false) {
    const scripts = targetElement.querySelectorAll('script');
    const loadedScripts = this._loadedScripts.get(targetElement) || new Set();

    if (scripts.length === 0) {
      // No scripts found - this is normal for static HTML
      return;
    }

    if (debug) {
      console.log(`[NanoTemplate] Found ${scripts.length} script element(s)`);
    }

    for (let i = 0; i < scripts.length; i++) {
      const oldScript = scripts[i];
      const scriptId = this._getScriptIdentifier(oldScript);

      // Debug log each script
      if (debug) {
        console.log(`[NanoTemplate] Processing script ${i + 1}/${scripts.length}:`, {
          src: oldScript.src || '(inline)',
          textLength: (oldScript.textContent || '').length,
          outerHTML: oldScript.outerHTML.substring(0, 100) + '...'
        });
      }

      // Skip if already loaded (for external scripts)
      if (oldScript.src && loadedScripts.has(scriptId)) {
        if (debug) {
          console.log(`[NanoTemplate] Script already loaded: ${scriptId}`);
        }
        continue;
      }

      try {
        await this.executeScript(oldScript, debug);
      } catch (error) {
        // Add more context to the error
        const scriptPreview = oldScript.src
          ? `External: ${oldScript.src}`
          : `Inline (${oldScript.textContent.length} chars): ${oldScript.textContent.substring(0, 200)}...`;

        console.error('[NanoTemplate] Failed to execute script:', scriptPreview);
        console.error('[NanoTemplate] Script outerHTML:', oldScript.outerHTML);
        throw new Error(`Script execution failed: ${error.message}\nScript: ${scriptPreview}`);
      }

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

  static executeScript(oldScript, debug = false) {
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
            if (debug) {
              console.error(`[NanoTemplate] Failed to load external script: ${oldScript.src}`, error);
            }
            reject(new Error(`Script load failed: ${oldScript.src}`));
          };

          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          } else {
            if (debug) {
              console.error('[NanoTemplate] Script has no parent node');
            }
            reject(new Error('Script has no parent node'));
          }
        } else {
          // Inline script
          const scriptContent = oldScript.textContent || oldScript.text || '';

          // Check for empty scripts
          if (!scriptContent.trim()) {
            // Empty script - just remove it and resolve
            if (debug) {
              console.log('[NanoTemplate] Removing empty script tag');
            }
            if (oldScript.parentNode) {
              oldScript.parentNode.removeChild(oldScript);
            }
            resolve();
            return;
          }

          if (debug) {
            console.log(`[NanoTemplate] Executing inline script (${scriptContent.length} chars)`);
          }

          newScript.textContent = scriptContent;

          if (oldScript.parentNode) {
            try {
              oldScript.parentNode.replaceChild(newScript, oldScript);
              // Give it a moment to execute
              setTimeout(resolve, 0);
            } catch (replaceError) {
              if (debug) {
                console.error('[NanoTemplate] Error replacing script node:', replaceError);
                console.error('[NanoTemplate] Script content:', scriptContent.substring(0, 200));
              }
              reject(replaceError);
            }
          } else {
            if (debug) {
              console.error('[NanoTemplate] Script has no parent node');
            }
            reject(new Error('Script has no parent node'));
          }
        }
      } catch (error) {
        if (debug) {
          console.error('[NanoTemplate] Error in executeScript:', error);
        }
        reject(error);
      }
    });
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
