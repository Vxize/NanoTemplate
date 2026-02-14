# NanoTemplate API Documentation

## Updated API (v2.0)

### `NanoTemplate.render(template, dataSource, fetchOption, options)`

Renders a template with optional data.

#### Parameters

1. **`template`** (string, required)
   - Template name or full URL
   - If not a URL, will be constructed as: `viewPath + template + templateExtension`
   - Example: `'event'` → `/page/event.html`

2. **`dataSource`** (string | object | null, optional, default: `null`)
   - `null`: Render template without data processing
   - `string`: URL to fetch JSON data from
   - `object`: Data object to use directly

3. **`fetchOption`** (object, optional, default: `{}`)
   - Options passed to `fetch()` when loading data
   - Example: `{ method: 'POST', headers: {...} }`

4. **`options`** (object, optional, default: `{}`)
   - **`targetElementId`** (string, default: `'app'`)
     - ID of the DOM element to render into
   - **`viewPath`** (string, default: `'/page/'`)
     - Base path for template files
   - **`templateExtension`** (string, default: `'.html'`)
     - File extension for templates
   - **`skipScripts`** (boolean, default: `false`)
     - If `true`, scripts in templates won't be executed
   - **`debug`** (boolean, default: `false`)
     - If `true`, shows `[NanoTemplate]` debug logs in console

---

## Usage Examples

### Basic Usage (Static Template)

```javascript
// Renders /page/event.html into #app
await NanoTemplate.render('event');
```

### With Data

```javascript
// From object
const data = { name: 'John', age: 30 };
await NanoTemplate.render('profile', data);

// From API
await NanoTemplate.render('profile', '/api/user/123');
```

### Custom Options

```javascript
// Custom target element
await NanoTemplate.render('event', null, {}, {
  targetElementId: 'content'
});

// Custom paths
await NanoTemplate.render('event', null, {}, {
  viewPath: '/templates/',
  templateExtension: '.tpl'
});
// Loads: /templates/event.tpl

// Skip script execution
await NanoTemplate.render('event', null, {}, {
  skipScripts: true
});

// Enable debug logging
await NanoTemplate.render('event', data, {}, {
  debug: true
});
```

### Complete Example

```javascript
await NanoTemplate.render(
  'dashboard',                    // template name
  '/api/dashboard/data',          // data source URL
  {                               // fetch options
    method: 'POST',
    headers: { 'Authorization': 'Bearer token' }
  },
  {                               // render options
    targetElementId: 'main',
    viewPath: '/views/',
    templateExtension: '.html',
    skipScripts: false,
    debug: true
  }
);
```

---

## Template Syntax

### Variables

```html
<!-- Escaped output (safe for HTML) -->
<p>{{username}}</p>

<!-- Unescaped output (use with caution!) -->
<div>{{{htmlContent}}}</div>

<!-- Nested properties -->
<p>{{user.profile.email}}</p>
```

### Conditionals

```html
<!-- If block -->
{{#if isLoggedIn}}
  <p>Welcome back!</p>
{{else}}
  <p>Please log in</p>
{{/if}}

<!-- Unless block (opposite of if) -->
{{#unless isAdmin}}
  <p>Access denied</p>
{{/unless}}
```

### Loops

```html
<!-- Loop over array -->
{{#each items}}
  <li>{{@index}}: {{name}}</li>
{{else}}
  <p>No items</p>
{{/each}}

<!-- Loop over object -->
{{#each user}}
  <p>{{@key}}: {{value}}</p>
{{/each}}

<!-- Special variables in loops -->
{{#each items}}
  <li class="{{#if @first}}first{{/if}} {{#if @last}}last{{/if}}">
    Item {{@index}}: {{name}}
  </li>
{{/each}}
```

**Available loop variables:**
- `@index` - Current iteration index (0-based)
- `@key` - Array index or object key
- `@first` - `true` for first item
- `@last` - `true` for last item

### Escaped Braces

```html
<!-- Literal braces (won't be processed) -->
<p>Use \{{ and \}} for literal braces</p>
```

---

## Event Listeners

### Method 1: `registerEventListener` (Recommended)

Automatically cleaned up on re-render:

```html
<button id="myButton">Click Me</button>

<script>
  (function() {
    const targetElement = document.getElementById('app');
    const button = document.getElementById('myButton');
    
    NanoTemplate.registerEventListener(
      targetElement,  // Container being re-rendered
      button,         // Element to attach to
      'click',        // Event type
      () => {         // Handler
        alert('Clicked!');
      }
    );
  })();
</script>
```

### Method 2: Event Delegation (Simplest)

Using `NanoTemplateHelper`:

```html
<button data-onclick="alert('Hello!')">Click Me</button>

<button data-click="handleClick">Click Me</button>

<script>
  window.handleClick = function(event, element) {
    console.log('Clicked!');
  };
</script>
```

Then use:
```javascript
await NanoTemplateHelper.render('template', data);
```

---

## Migration from Old API

### Old (v1.x)
```javascript
await NanoTemplate.render(
  'event',           // template
  null,              // dataSource
  {},                // fetchOption
  'app',             // targetElementId
  '/page/',          // viewPath
  '.html'            // templateExtension
);
```

### New (v2.0)
```javascript
await NanoTemplate.render(
  'event',           // template
  null,              // dataSource
  {},                // fetchOption
  {                  // options object
    targetElementId: 'app',
    viewPath: '/page/',
    templateExtension: '.html'
  }
);
```

### Simple cases (using defaults)
```javascript
// Old
await NanoTemplate.render('event', null, {}, 'app', '/page/', '.html');

// New (same result)
await NanoTemplate.render('event');
```

---

## Debugging

Enable debug mode to see detailed console logs:

```javascript
await NanoTemplate.render('event', data, {}, { debug: true });
```

Output:
```
[NanoTemplate] Found 2 script element(s)
[NanoTemplate] Processing script 1/2: ...
[NanoTemplate] Executing inline script (125 chars)
```

---

## Best Practices

1. **Always use escaped output by default**
   ```html
   <!-- Safe -->
   {{userInput}}
   
   <!-- Only for trusted HTML -->
   {{{trustedHTML}}}
   ```

2. **Use IIFE in template scripts**
   ```html
   <script>
     (function() {
       // Your code here
     })();
   </script>
   ```

3. **Pre-stringify complex objects**
   ```javascript
   const data = {
     user: { name: 'John' },
     userJSON: JSON.stringify({ name: 'John' })
   };
   ```
   ```html
   <script>
     const user = {{{userJSON}}};
   </script>
   ```

4. **Use appropriate development server**
   - Avoid live-server with auto-injection
   - Use: `python -m http.server` or `npx http-server`

---

## Common Issues

### Scripts not executing
- Check `skipScripts` option is `false` (default)
- Enable `debug: true` to see script processing

### Template not found
- Check `viewPath` and `templateExtension` options
- Enable `debug: true` to see constructed URL

### Event listeners duplicating
- Use `NanoTemplate.registerEventListener()` instead of direct `addEventListener()`
- Or use event delegation with data attributes

---

## Additional Methods

### `NanoTemplate.registerEventListener(targetElement, element, event, handler, options)`

Register an event listener that will be automatically cleaned up on re-render.

```javascript
NanoTemplate.registerEventListener(
  document.getElementById('app'),
  button,
  'click',
  handler,
  { once: true }
);
```

### `NanoTemplate.processTemplate(template, data)`

Process a template string with data (without rendering to DOM).

```javascript
const html = NanoTemplate.processTemplate('<p>{{name}}</p>', { name: 'John' });
console.log(html); // <p>John</p>
```
