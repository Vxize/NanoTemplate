# Event Handling in NanoTemplate

There are **two ways** to handle events in NanoTemplate templates:

## **Option 1: NanoTemplateHelper (Recommended for Simple Cases)**

### What is it?
A helper class that adds **event delegation** support, allowing you to use simple `data-*` attributes instead of writing JavaScript.

### Setup
Include both files:
```html
<script src="NanoTemplate.js"></script>
<script src="NanoTemplateHelper.js"></script>
```

### Usage

#### Method A: Inline code with `data-onclick`
```html
<button data-onclick="alert('Hello!')">
  Click Me
</button>

<div data-onclick="console.log('Clicked item:', element.dataset.id)" data-id="123">
  Item 123
</div>
```

**Available variables:**
- `event` - The click event
- `element` - The clicked element

#### Method B: Function reference with `data-click`
```html
<button data-click="handleClick">Click Me</button>

<script>
  window.handleClick = function(event, element) {
    console.log('Button clicked!');
  };
</script>
```

### Rendering with NanoTemplateHelper
```javascript
// Use NanoTemplateHelper.render() instead of NanoTemplate.render()
await NanoTemplateHelper.render('template', data);

// With options
await NanoTemplateHelper.render('template', data, {}, {
  targetElementId: 'content',
  debug: true
});
```

### ✅ Advantages
- **No cleanup needed** - Uses event delegation
- **Simple syntax** - Just add data attributes
- **Survives re-renders** - No duplicate listeners
- **Great for simple handlers** - Clicks, toggles, etc.

### ❌ Limitations
- **Only handles click events** - Can't do `mouseover`, `keypress`, etc.
- **No event options** - Can't use `once`, `capture`, etc.
- **Inline code can be messy** - For complex logic

---

## **Option 2: registerEventListener (Full Control)**

### What is it?
A method that registers event listeners with **automatic cleanup** when templates are re-rendered.

### Usage

```html
<button id="myButton">Click Me</button>

<script>
  (function() {
    const targetElement = document.getElementById('app');  // The container
    const button = document.getElementById('myButton');    // The button
    
    NanoTemplate.registerEventListener(
      targetElement,  // Container being re-rendered
      button,         // Element to attach listener to
      'click',        // Event type
      function() {    // Handler
        alert('Clicked!');
      }
    );
  })();
</script>
```

### Why the first parameter?

The `targetElement` (first parameter) is the **container that's being re-rendered**. This is needed for automatic cleanup:

1. **Before re-render**: NanoTemplate removes all listeners registered for this container
2. **After re-render**: Template scripts run again and register fresh listeners
3. **No duplicates**: Old listeners are gone, new ones are added

**Example:**
```javascript
// First render - adds 1 listener
await NanoTemplate.render('template', data);

// Second render - removes old listener, adds new one (still 1 total)
await NanoTemplate.render('template', data);
```

### Full API

```javascript
NanoTemplate.registerEventListener(
  targetElement,  // Required: Container being re-rendered
  element,        // Required: Element to attach listener to  
  eventType,      // Required: 'click', 'mouseover', 'keypress', etc.
  handler,        // Required: Event handler function
  options         // Optional: { once: true, capture: true, etc. }
);
```

### ✅ Advantages
- **Any event type** - Not just clicks
- **Event options** - Use `once`, `capture`, `passive`, etc.
- **More control** - Better for complex interactions
- **TypeScript-friendly** - Proper typing support

### ❌ Limitations
- **More verbose** - Requires script tags
- **Need targetElement** - Must track the container
- **Manual registration** - More code than data attributes

---

## **Which Should I Use?**

### Use **NanoTemplateHelper** (data attributes) when:
- ✅ You only need click events
- ✅ Simple handlers (alerts, console.logs, function calls)
- ✅ Want minimal code
- ✅ Prefer declarative HTML

### Use **registerEventListener** when:
- ✅ Need non-click events (`mouseover`, `keypress`, `change`, etc.)
- ✅ Need event options (`once`, `capture`, `passive`)
- ✅ Complex event handling logic
- ✅ Want TypeScript support

---

## **Examples**

### Example 1: Simple Button (NanoTemplateHelper)

```html
<!-- template.html -->
<div>
  <button data-onclick="alert('Hello!')">Say Hello</button>
  <button data-click="incrementCounter">Count: <span id="count">0</span></button>
</div>

<script>
  let count = 0;
  window.incrementCounter = function() {
    count++;
    document.getElementById('count').textContent = count;
  };
</script>
```

```javascript
// Render
await NanoTemplateHelper.render('template');
```

### Example 2: Complex Form (registerEventListener)

```html
<!-- form.html -->
<form id="myForm">
  <input type="text" id="username" placeholder="Username">
  <button type="submit">Submit</button>
</form>

<script>
  (function() {
    const targetElement = document.getElementById('app');
    const form = document.getElementById('myForm');
    const input = document.getElementById('username');
    
    // Submit handler
    NanoTemplate.registerEventListener(targetElement, form, 'submit', function(e) {
      e.preventDefault();
      console.log('Submitted:', input.value);
    });
    
    // Input validation on keypress
    NanoTemplate.registerEventListener(targetElement, input, 'keypress', function(e) {
      if (e.key === ' ') {
        e.preventDefault(); // No spaces allowed
      }
    });
    
    // Focus styling
    NanoTemplate.registerEventListener(targetElement, input, 'focus', function() {
      this.classList.add('focused');
    });
    
    NanoTemplate.registerEventListener(targetElement, input, 'blur', function() {
      this.classList.remove('focused');
    });
  })();
</script>
```

```javascript
// Render
await NanoTemplate.render('form');
```

### Example 3: Mixed Approach

```html
<!-- You can use BOTH in the same template! -->
<div>
  <!-- Simple buttons with NanoTemplateHelper -->
  <button data-click="saveData">Save</button>
  <button data-click="cancel">Cancel</button>
  
  <!-- Complex interactions with registerEventListener -->
  <div id="dragDrop">Drag files here</div>
</div>

<script>
  window.saveData = function() { /* ... */ };
  window.cancel = function() { /* ... */ };
  
  (function() {
    const targetElement = document.getElementById('app');
    const dropZone = document.getElementById('dragDrop');
    
    NanoTemplate.registerEventListener(targetElement, dropZone, 'dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });
    
    NanoTemplate.registerEventListener(targetElement, dropZone, 'drop', function(e) {
      e.preventDefault();
      const files = e.dataTransfer.files;
      console.log('Files dropped:', files);
    });
  })();
</script>
```

```javascript
// Render with BOTH approaches
await NanoTemplateHelper.render('template');
```

---

## **Quick Reference**

| Feature | NanoTemplateHelper | registerEventListener |
|---------|-------------------|----------------------|
| **Events** | Click only | Any event |
| **Cleanup** | Automatic | Automatic |
| **Code** | Minimal (HTML) | More (JavaScript) |
| **Options** | No | Yes (`once`, `capture`, etc.) |
| **TypeScript** | Limited | Full support |
| **Best for** | Simple clicks | Complex interactions |

---

## **Migration Guide**

### From plain addEventListener (WRONG ❌)

```javascript
// ❌ WRONG - Creates duplicates on re-render
document.getElementById('btn').addEventListener('click', handler);
```

### To NanoTemplateHelper (EASY ✅)

```html
<!-- ✅ EASY - No JavaScript needed -->
<button id="btn" data-onclick="handler()">Click</button>
```

### To registerEventListener (CONTROL ✅)

```javascript
// ✅ CONTROL - Automatic cleanup
const targetElement = document.getElementById('app');
const btn = document.getElementById('btn');
NanoTemplate.registerEventListener(targetElement, btn, 'click', handler);
```

---

## **Files You Need**

### Just NanoTemplate
```html
<script src="NanoTemplate.js"></script>
```

Use: `registerEventListener` approach

### NanoTemplate + Helper
```html
<script src="NanoTemplate.js"></script>
<script src="NanoTemplateHelper.js"></script>
```

Use: Both approaches (data attributes + registerEventListener)
