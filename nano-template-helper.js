// Alternative approach: Event Delegation Helper
// This provides a simpler API for common use cases

class NanoTemplateHelper {
  /**
   * Setup event delegation for a target element
   * This is called automatically but can be called manually if needed
   */
  static setupEventDelegation(targetElement) {
    // Remove old delegated listener if exists
    if (targetElement._nanoEventHandler) {
      targetElement.removeEventListener('click', targetElement._nanoEventHandler);
    }

    // Create new delegated event handler
    targetElement._nanoEventHandler = function(event) {
      const target = event.target;
      
      // Check for data-onclick attribute
      const onclickAttr = target.getAttribute('data-onclick');
      if (onclickAttr) {
        event.preventDefault();
        try {
          // Create function from string and call it
          const fn = new Function('event', 'element', onclickAttr);
          fn.call(target, event, target);
        } catch (error) {
          console.error('Error in data-onclick handler:', error);
        }
      }

      // Check for data-click attribute (safer - just function name)
      const clickFn = target.getAttribute('data-click');
      if (clickFn && typeof window[clickFn] === 'function') {
        event.preventDefault();
        window[clickFn].call(target, event, target);
      }
    };

    targetElement.addEventListener('click', targetElement._nanoEventHandler);
  }

  /**
   * Enhanced render that sets up event delegation automatically
   */
  static async render(template, dataSource = null, fetchOption = {}, options = {}) {
    // Use NanoTemplate's render with new API
    await NanoTemplate.render(template, dataSource, fetchOption, options);
    
    // Setup event delegation
    const targetElementId = options.targetElementId || 'app';
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
      this.setupEventDelegation(targetElement);
    }
  }
}

// Example usage in templates:
/*

METHOD 1: Using data-onclick (inline code)
=====================================
<button data-onclick="alert('Clicked: ' + element.textContent)">
  Click Me
</button>

<div data-onclick="console.log('Item clicked:', element.dataset.id)" 
     data-id="123">
  Item 123
</div>


METHOD 2: Using data-click (function name)
==========================================
<button data-click="handleButtonClick">Click Me</button>

<script>
  window.handleButtonClick = function(event, element) {
    alert('Button clicked!');
  };
</script>


METHOD 3: Using NanoTemplate.registerEventListener (most control)
==================================================================
<div id="myButton">Click Me</div>

<script>
  const targetElement = document.getElementById('app');
  const button = document.getElementById('myButton');
  
  NanoTemplate.registerEventListener(
    targetElement, 
    button, 
    'click', 
    function() {
      alert('Clicked!');
    }
  );
</script>


COMPARISON:
===========

✅ data-onclick / data-click:
  - Simple, declarative
  - No manual cleanup needed
  - Works with event delegation
  - Survives re-renders automatically
  - Great for simple handlers

✅ registerEventListener:
  - More control
  - Can handle any event type (not just click)
  - Can pass options (capture, once, etc.)
  - Better for complex interactions
  - TypeScript-friendly

*/
