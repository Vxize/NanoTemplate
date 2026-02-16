# NanoTemplate - Complete API Documentation

**Version 2.0**

A lightweight JavaScript templating engine with Handlebars-like syntax, event management, and expression support.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Template Syntax](#template-syntax)
5. [Expression Support](#expression-support)
6. [Event Handling](#event-handling)
7. [Loading Callbacks](#loading-callbacks)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Installation

### Include in HTML

```html
<!-- Core library -->
<script src="NanoTemplate.js"></script>

<!-- Optional: Event delegation helper -->
<script src="NanoTemplateHelper.js"></script>
```

---

## Quick Start

### Static Template

```javascript
// Renders /page/home.html into #app
await NanoTemplate.render('home');
```

### With Data

```javascript
const data = { name: 'John', age: 30 };
await NanoTemplate.render('profile', data);
```

### From API

```javascript
await NanoTemplate.render('users', '/api/users');
```

---

## API Reference

### `NanoTemplate.render(template, dataSource, fetchOption, options)`

Main method to render templates.

#### Parameters

**1. `template`** (string, required)
- Template name or full URL
- If not a URL, constructs as: `viewPath + template + templateExtension`
- Example: `'home'` → `/page/home.html`

**2. `dataSource`** (string | object | null, optional, default: `null`)
- `null` - Render template without data
- `string` - URL to fetch JSON data from
- `object` - Data object to use directly

**3. `fetchOption`** (object, optional, default: `{}`)
- Options passed to `fetch()` when loading data
- Example: `{ method: 'POST', headers: { ... } }`

**4. `options`** (object, optional, default: `{}`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetElementId` | string | `'app'` | ID of DOM element to render into |
| `viewPath` | string | `'/page/'` | Base path for template files |
| `templateExtension` | string | `'.html'` | File extension for templates |
| `skipScripts` | boolean | `false` | If `true`, don't execute scripts in templates |
| `debug` | boolean | `false` | If `true`, show debug logs in console |
| `onBeforeRender` | function | `null` | Called before fetching template |
| `onDataLoading` | function | `null` | Called before fetching data |
| `onDataLoaded` | function | `null` | Called after data is fetched |

#### Returns

`Promise<void>`

#### Examples

```javascript
// Basic
await NanoTemplate.render('home');

// With data object
await NanoTemplate.render('profile', { name: 'John', age: 30 });

// From API
await NanoTemplate.render('users', '/api/users');

// Custom options
await NanoTemplate.render('dashboard', '/api/dashboard', {}, {
  targetElementId: 'main',
  viewPath: '/templates/',
  debug: true,
  onBeforeRender: (el) => el.innerHTML = 'Loading...',
  onDataLoaded: (data, error) => {
    if (error) console.error(error);
  }
});

// With POST request
await NanoTemplate.render('results', '/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'test' })
});
```

---

### `NanoTemplate.registerEventListener(element, event, handler, options, targetElementId)`

Register an event listener that's automatically cleaned up on re-render.

#### Parameters

- `element` (Element | string) - Element object or selector (e.g., `'#myBtn'`, `'.button'`)
- `event` (string) - Event type (e.g., `'click'`, `'mouseover'`)
- `handler` (Function) - Event handler function
- `options` (Object, optional) - Event listener options (e.g., `{ once: true }`)
- `targetElementId` (string, optional, default: `'app'`) - Container ID for cleanup tracking

#### Returns

`void`

#### Examples

```javascript
// Simple - uses default targetElementId: 'app'
NanoTemplate.registerEventListener('#myButton', 'click', () => {
  alert('Clicked!');
});

// With element object
const button = document.getElementById('myButton');
NanoTemplate.registerEventListener(button, 'click', handler);

// With options
NanoTemplate.registerEventListener('#myButton', 'click', handler, { once: true });

// Custom container
NanoTemplate.registerEventListener('#sidebarBtn', 'click', handler, null, 'sidebar');

// Multiple events on same element
NanoTemplate.registerEventListener('#input', 'focus', onFocus);
NanoTemplate.registerEventListener('#input', 'blur', onBlur);
NanoTemplate.registerEventListener('#input', 'keypress', onKeyPress);
```

---

### `NanoTemplate.processTemplate(template, data)`

Process a template string with data without rendering to DOM.

#### Parameters

- `template` (string) - Template HTML string
- `data` (object) - Data object

#### Returns

`string` - Processed HTML

#### Example

```javascript
const template = '<p>Hello {{name}}</p>';
const data = { name: 'John' };
const html = NanoTemplate.processTemplate(template, data);
console.log(html); // <p>Hello John</p>
```

---

## Template Syntax

### Variables

```html
<!-- Escaped output (safe, default) -->
<p>{{username}}</p>

<!-- Unescaped output (use with caution!) -->
<div>{{{htmlContent}}}</div>

<!-- Nested properties -->
<p>{{user.profile.email}}</p>

<!-- Array access -->
<p>{{items.0.name}}</p>
```

### Conditionals

#### Basic If/Else

```html
{{#if isLoggedIn}}
  <p>Welcome back!</p>
{{else}}
  <p>Please log in</p>
{{/if}}
```

#### Unless (Opposite of If)

```html
{{#unless isBlocked}}
  <p>You can post comments</p>
{{else}}
  <p>You are blocked</p>
{{/unless}}
```

#### Nested Conditions

```html
{{#if user}}
  {{#if user.isAdmin}}
    <p>Admin Panel</p>
  {{else}}
    <p>User Dashboard</p>
  {{/if}}
{{else}}
  <p>Not logged in</p>
{{/if}}
```

### Loops

#### Array Loop

```html
{{#each items}}
  <li>{{@index}}: {{name}}</li>
{{else}}
  <p>No items found</p>
{{/each}}
```

#### Object Loop

```html
{{#each user}}
  <p>{{@key}}: {{value}}</p>
{{/each}}
```

#### Loop Variables

Available in `{{#each}}` blocks:

- `@index` - Current iteration index (0-based)
- `@key` - Array index or object key
- `@first` - `true` for first item
- `@last` - `true` for last item
- `value` - For primitive values in arrays

```html
{{#each items}}
  <li class="{{#if @first}}first{{/if}} {{#if @last}}last{{/if}}">
    Item {{@index}}: {{name}}
  </li>
{{/each}}
```

### Escaped Braces

```html
<!-- Use \{{ for literal braces -->
<p>Use \{{ and \}} for template syntax</p>
<!-- Output: Use {{ and }} for template syntax -->
```

---

## Expression Support

The `{{#if}}` and `{{#unless}}` blocks support expressions, not just simple variables.

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `&&` | Logical AND | `{{#if a && b}}` |
| `\|\|` | Logical OR | `{{#if a \|\| b}}` |
| `!` | Logical NOT | `{{#if !a}}` |
| `==` | Equality | `{{#if status == "active"}}` |
| `!=` | Inequality | `{{#if role != "guest"}}` |
| `>` | Greater than | `{{#if age > 18}}` |
| `<` | Less than | `{{#if count < 10}}` |
| `>=` | Greater or equal | `{{#if score >= 100}}` |
| `<=` | Less or equal | `{{#if age <= 65}}` |

### Expression Examples

```html
<!-- AND -->
{{#if isLoggedIn && isAdmin}}
  <button>Admin Panel</button>
{{/if}}

<!-- OR -->
{{#if isAdmin || isModerator}}
  <button>Moderate</button>
{{/if}}

<!-- NOT -->
{{#if !isBlocked}}
  <button>Post Comment</button>
{{/if}}

<!-- Comparisons -->
{{#if age >= 18}}
  <p>Adult content available</p>
{{/if}}

{{#if status == "active"}}
  <span class="badge-green">Active</span>
{{/if}}

<!-- Complex expressions -->
{{#if age >= 18 && !isBlocked}}
  <button>Purchase</button>
{{/if}}

{{#if role == "admin" || role == "moderator"}}
  <button>Manage Users</button>
{{/if}}
```

### Supported Value Types

```html
<!-- Variables -->
{{#if username}}...{{/if}}

<!-- Strings -->
{{#if status == "active"}}...{{/if}}
{{#if name == 'John'}}...{{/if}}

<!-- Numbers -->
{{#if age >= 18}}...{{/if}}
{{#if count == 0}}...{{/if}}
{{#if price < 100.50}}...{{/if}}

<!-- Booleans -->
{{#if isActive == true}}...{{/if}}
{{#if verified != false}}...{{/if}}
```

### Operator Precedence

1. **NOT (!)** - Highest
2. **Comparisons** - `>`, `<`, `>=`, `<=`, `==`, `!=`
3. **AND (&&)**
4. **OR (||)** - Lowest

```html
<!-- Evaluated as: ((!isBlocked) && isActive) || isAdmin -->
{{#if !isBlocked && isActive || isAdmin}}
  <button>Post</button>
{{/if}}
```

---

## Event Handling

### Method 1: registerEventListener (Full Control)

```html
<button id="myButton">Click Me</button>

<script>
  (function() {
    // Simple - defaults to #app container
    NanoTemplate.registerEventListener('#myButton', 'click', () => {
      alert('Clicked!');
    });
  })();
</script>
```

**Advantages:**
- Works with any event type
- Supports event options (`once`, `capture`, etc.)
- Automatic cleanup on re-render
- Full control

### Method 2: NanoTemplateHelper (Event Delegation)

Include `NanoTemplateHelper.js` for easier event handling.

```html
<!-- Inline code -->
<button data-onclick="alert('Hello!')">Click Me</button>

<!-- Function reference -->
<button data-click="handleClick">Click Me</button>

<script>
  window.handleClick = function(event, element) {
    console.log('Clicked!', element);
  };
</script>
```

**Render with NanoTemplateHelper:**

```javascript
await NanoTemplateHelper.render('template', data);
```

**Advantages:**
- Declarative (HTML-based)
- No manual cleanup needed
- Simple for click handlers

**Limitations:**
- Only handles click events
- Can't use event options

### When to Use Each

| Use Case | Method |
|----------|--------|
| Simple clicks | `NanoTemplateHelper` (data attributes) |
| Multiple event types | `registerEventListener` |
| Need event options | `registerEventListener` |
| Complex interactions | `registerEventListener` |

---

## Loading Callbacks

Control the UI during data fetching from remote APIs.

### Callback Timeline

```
onBeforeRender    → Before fetching template (show loading)
    ↓
Fetch template
    ↓
onDataLoading     → Before fetching data (update progress)
    ↓
Fetch data
    ↓
onDataLoaded      → After data fetch (hide loading, handle errors)
    ↓
Render template
```

### onBeforeRender(targetElement)

Called **first**, before fetching anything.

```javascript
NanoTemplate.render('users', '/api/users', {}, {
  onBeforeRender: (el) => {
    el.innerHTML = '<div class="spinner">Loading...</div>';
  }
});
```

**Use for:**
- Show loading UI immediately
- Replace content before anything loads

### onDataLoading(targetElement)

Called after template is fetched, before data fetch.

```javascript
NanoTemplate.render('users', '/api/users', {}, {
  onDataLoading: (el) => {
    console.log('Fetching data from API...');
  }
});
```

**Use for:**
- Track/log when data fetching starts
- Update progress indicators
- Analytics

### onDataLoaded(data, error, targetElement)

Called after data is fetched (success or error).

```javascript
NanoTemplate.render('users', '/api/users', {}, {
  onDataLoaded: (data, error, el) => {
    if (error) {
      console.error('Failed to load:', error);
      el.innerHTML = '<p>Error loading data</p>';
    } else {
      console.log('Data loaded:', data);
    }
  }
});
```

**Use for:**
- Hide loading indicators
- Handle errors
- Track completion
- Post-processing

### Complete Example

```javascript
const spinner = document.getElementById('loading');

NanoTemplate.render(
  'dashboard',
  '/api/dashboard',
  {},
  {
    onBeforeRender: (el) => {
      spinner.style.display = 'block';
      el.innerHTML = '<p>Initializing...</p>';
    },
    
    onDataLoading: (el) => {
      el.innerHTML = '<p>Loading data...</p>';
    },
    
    onDataLoaded: (data, error, el) => {
      spinner.style.display = 'none';
      
      if (error) {
        el.innerHTML = `<p class="error">Error: ${error.message}</p>`;
      }
      // Template is rendered automatically after this
    },
    
    debug: true  // See data in console
  }
);
```

---

## Examples

### Example 1: User Profile

**Data:**
```javascript
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isAdmin: true,
  verified: true
};
```

**Template (profile.html):**
```html
<div class="profile">
  <h2>{{name}}</h2>
  <p>{{email}}</p>
  
  {{#if age >= 18}}
    <span class="badge">Adult</span>
  {{/if}}
  
  {{#if isAdmin && verified}}
    <button id="adminBtn">Admin Panel</button>
  {{/if}}
</div>

<script>
  (function() {
    {{#if isAdmin}}
      NanoTemplate.registerEventListener('#adminBtn', 'click', () => {
        alert('Opening admin panel...');
      });
    {{/if}}
  })();
</script>
```

**Render:**
```javascript
await NanoTemplate.render('profile', user);
```

---

### Example 2: Todo List with API

**Template (todos.html):**
```html
<div class="todos">
  <h2>My Tasks</h2>
  
  <input type="text" id="newTodo" placeholder="New task...">
  <button id="addBtn">Add</button>
  
  <ul>
    {{#each todos}}
      <li class="{{#if completed}}completed{{/if}}">
        <span>{{text}}</span>
        <button class="delete-btn" data-id="{{@index}}">Delete</button>
      </li>
    {{else}}
      <p>No todos yet!</p>
    {{/each}}
  </ul>
</div>

<script>
  (function() {
    const input = document.getElementById('newTodo');
    const addBtn = document.getElementById('addBtn');
    
    NanoTemplate.registerEventListener(addBtn, 'click', () => {
      if (input.value.trim()) {
        // Add todo logic
        input.value = '';
      }
    });
  })();
</script>
```

**Render:**
```javascript
await NanoTemplate.render('todos', '/api/todos', {}, {
  onBeforeRender: (el) => {
    el.innerHTML = '<p>Loading todos...</p>';
  },
  onDataLoaded: (data, error) => {
    if (error) {
      alert('Failed to load todos: ' + error.message);
    }
  },
  debug: true
});
```

---

### Example 3: Dashboard with Loading

**HTML:**
```html
<div id="loading-overlay" style="display:none;">
  <div class="spinner"></div>
</div>
<div id="app"></div>
```

**JavaScript:**
```javascript
const overlay = document.getElementById('loading-overlay');

async function loadDashboard() {
  await NanoTemplate.render(
    'dashboard',
    '/api/dashboard/stats',
    {},
    {
      onBeforeRender: () => {
        overlay.style.display = 'flex';
      },
      onDataLoaded: (data, error) => {
        overlay.style.display = 'none';
        
        if (error) {
          console.error('Dashboard error:', error);
        } else {
          console.log('Stats loaded:', data);
        }
      },
      debug: true
    }
  );
}

loadDashboard();
```

---

### Example 4: Form with Validation

**Template:**
```html
<form id="signupForm">
  <input type="text" id="username" placeholder="Username">
  <input type="email" id="email" placeholder="Email">
  <input type="number" id="age" placeholder="Age">
  
  <button type="submit">Sign Up</button>
</form>

<script>
  (function() {
    const form = document.getElementById('signupForm');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const age = document.getElementById('age');
    
    NanoTemplate.registerEventListener(form, 'submit', (e) => {
      e.preventDefault();
      
      // Validation
      if (username.value.length < 3) {
        alert('Username too short');
        return;
      }
      
      if (!email.value.includes('@')) {
        alert('Invalid email');
        return;
      }
      
      if (parseInt(age.value) < 18) {
        alert('Must be 18 or older');
        return;
      }
      
      // Submit
      console.log('Form submitted!');
    });
    
    // Real-time validation
    NanoTemplate.registerEventListener(age, 'input', function() {
      if (parseInt(this.value) < 18) {
        this.classList.add('invalid');
      } else {
        this.classList.remove('invalid');
      }
    });
  })();
</script>
```

---

## Best Practices

### 1. Always Escape User Input

```html
<!-- ✅ Good - Escaped by default -->
<p>{{userInput}}</p>

<!-- ❌ Dangerous - Only for trusted HTML -->
<div>{{{trustedHTML}}}</div>
```

### 2. Use IIFE in Template Scripts

```html
<script>
  (function() {
    // Your code here - won't pollute global scope
  })();
</script>
```

### 3. Pre-compute Complex Logic

```javascript
// ❌ Bad - Complex logic in template
{{#if (role == "admin" || role == "mod") && status == "active" && !banned}}

// ✅ Good - Pre-compute in data
const data = {
  role: 'admin',
  status: 'active',
  banned: false,
  canModerate: (role === 'admin' || role === 'mod') && status === 'active' && !banned
};
```

```html
{{#if canModerate}}
  <button>Moderate</button>
{{/if}}
```

### 4. Use registerEventListener in Templates

```html
<!-- ❌ Bad - Creates duplicates on re-render -->
<script>
  document.getElementById('btn').addEventListener('click', handler);
</script>

<!-- ✅ Good - Auto cleanup -->
<script>
  (function() {
    NanoTemplate.registerEventListener('#btn', 'click', handler);
  })();
</script>
```

### 5. Handle Errors in Callbacks

```javascript
await NanoTemplate.render('page', '/api/data', {}, {
  onDataLoaded: (data, error) => {
    hideSpinner();
    
    if (error) {
      showError(error.message);
      return;
    }
    
    // Process data
  }
});
```

### 6. Use Debug Mode During Development

```javascript
// Development
await NanoTemplate.render('page', '/api/data', {}, {
  debug: true  // Remove in production
});
```

### 7. Keep Templates Simple

```html
<!-- ✅ Good - Simple and readable -->
{{#each items}}
  <li>{{name}}</li>
{{/each}}

<!-- ❌ Bad - Too complex -->
{{#each items}}
  {{#if @index > 0 && @index < items.length - 1}}
    {{#if type == "special" && status != "hidden"}}
      ...
    {{/if}}
  {{/if}}
{{/each}}
```

### 8. Organize Your Code

```
/
├── index.html
├── js/
│   ├── NanoTemplate.js
│   ├── NanoTemplateHelper.js
│   └── app.js
└── page/
    ├── home.html
    ├── profile.html
    └── settings.html
```

---

## Common Issues

### Scripts Not Executing

**Problem:** Scripts in templates don't run

**Solution:**
- Check `skipScripts` option is `false` (default)
- Enable `debug: true` to see what's happening
- Ensure scripts are inside `<script>` tags

### Event Listeners Duplicating

**Problem:** Click handlers fire multiple times

**Solution:**
- Use `registerEventListener` instead of direct `addEventListener`
- Wrap in IIFE to avoid global variables

### Template Not Found

**Problem:** 404 error when loading template

**Solution:**
- Check `viewPath` and `templateExtension` options
- Enable `debug: true` to see constructed URL
- Verify file exists at the path

### Loading Indicator Not Showing

**Problem:** Loading message doesn't appear

**Solution:**
- Use `onBeforeRender` instead of `onDataLoading`
- Set innerHTML before calling render

### Data Not Updating

**Problem:** Template shows old data

**Solution:**
- Ensure you're passing new data object
- Check if template is being re-rendered
- Verify data is actually changing

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Requirements:**
- ES6 support
- `fetch` API
- Promises
- Template literals

---

## License

MIT License - Use freely in personal and commercial projects.

---

## Additional Resources

- **EXPRESSION_SUPPORT.md** - Complete guide to expressions
- **EVENT_HANDLING_GUIDE.md** - Event handling patterns
- **CALLBACK_USAGE_GUIDE.md** - Loading callback examples
- **DATA_LOADING_CALLBACKS.md** - API data loading guide

---

## Quick Reference Card

```javascript
// Basic render
await NanoTemplate.render('template');

// With data
await NanoTemplate.render('template', { key: 'value' });

// From API
await NanoTemplate.render('template', '/api/data');

// Full options
await NanoTemplate.render('template', '/api/data', {}, {
  targetElementId: 'app',
  debug: true,
  onBeforeRender: (el) => showLoading(el),
  onDataLoaded: (data, error) => hideLoading()
});

// Event listener
NanoTemplate.registerEventListener('#btn', 'click', handler);

// Process template
const html = NanoTemplate.processTemplate(template, data);
```

---

**Last Updated:** February 2026
**Version:** 2.0
