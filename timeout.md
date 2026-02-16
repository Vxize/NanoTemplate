# Request Timeout Configuration

NanoTemplate now supports automatic timeout for API requests.

---

## **Quick Answer**

### Where to Set Timeout

Put the `timeout` option in the **4th parameter (options)**:

```javascript
await NanoTemplate.render(
  'template',
  '/api/data',
  {},           // fetchOption
  {
    timeout: 15000  // 15 seconds (in milliseconds)
  }
);
```

### Which Callback Triggers on Timeout

**`onDataLoaded`** is called with an error when timeout occurs:

```javascript
await NanoTemplate.render(
  'template',
  '/api/data',
  {},
  {
    timeout: 15000,  // 15 seconds
    onDataLoaded: (data, error, el) => {
      if (error) {
        if (error.isTimeout) {
          console.log('Request timed out!');
        } else {
          console.log('Other error:', error.message);
        }
      }
    }
  }
);
```

---

## **Complete Examples**

### Example 1: Basic Timeout

```javascript
NanoTemplate.render(
  'users',
  '/api/users',
  {},
  {
    timeout: 15000,  // 15 seconds in milliseconds
    
    onBeforeRender: (el) => {
      el.innerHTML = '<p>Loading...</p>';
    },
    
    onDataLoaded: (data, error, el) => {
      if (error) {
        // Check if it was a timeout
        if (error.isTimeout) {
          el.innerHTML = '<p class="error">Request timed out. Please try again.</p>';
        } else {
          el.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
        }
      }
      // If successful, template is rendered automatically
    }
  }
);
```

---

### Example 2: Timeout with Retry

```html
<div id="app"></div>
<button id="retryBtn" style="display:none;">Retry</button>

<script>
  let retryCount = 0;
  const maxRetries = 3;
  
  async function loadData() {
    await NanoTemplate.render(
      'dashboard',
      '/api/dashboard',
      {},
      {
        timeout: 10000,  // 10 seconds
        
        onBeforeRender: (el) => {
          el.innerHTML = '<p>Loading dashboard...</p>';
          document.getElementById('retryBtn').style.display = 'none';
        },
        
        onDataLoaded: (data, error, el) => {
          if (error) {
            if (error.isTimeout) {
              console.log('Timeout occurred');
              
              if (retryCount < maxRetries) {
                retryCount++;
                el.innerHTML = `<p>Timeout. Retrying (${retryCount}/${maxRetries})...</p>`;
                setTimeout(() => loadData(), 1000);
              } else {
                el.innerHTML = '<p class="error">Request timed out after multiple attempts.</p>';
                document.getElementById('retryBtn').style.display = 'block';
              }
            } else {
              el.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
              document.getElementById('retryBtn').style.display = 'block';
            }
          } else {
            retryCount = 0;  // Reset on success
          }
        }
      }
    );
  }
  
  document.getElementById('retryBtn').addEventListener('click', () => {
    retryCount = 0;
    loadData();
  });
  
  loadData();
</script>
```

---

### Example 3: Different Timeouts for Different Endpoints

```javascript
// Fast endpoint - short timeout
async function loadQuickData() {
  await NanoTemplate.render('widget', '/api/quick-data', {}, {
    timeout: 5000  // 5 seconds
  });
}

// Slow endpoint - longer timeout
async function loadSlowData() {
  await NanoTemplate.render('report', '/api/slow-report', {}, {
    timeout: 30000  // 30 seconds
  });
}

// Critical data - no timeout
async function loadCriticalData() {
  await NanoTemplate.render('critical', '/api/critical', {}, {
    timeout: 0  // No timeout (waits forever)
  });
}
```

---

### Example 4: Progress Indicator with Timeout

```html
<div id="progress"></div>
<div id="app"></div>

<script>
  const progressEl = document.getElementById('progress');
  let progressInterval;
  let elapsedSeconds = 0;
  
  function startProgress() {
    elapsedSeconds = 0;
    progressEl.textContent = 'Loading... 0s';
    
    progressInterval = setInterval(() => {
      elapsedSeconds++;
      progressEl.textContent = `Loading... ${elapsedSeconds}s`;
      
      // Visual warning as we approach timeout
      if (elapsedSeconds > 12) {
        progressEl.classList.add('warning');
      }
    }, 1000);
  }
  
  function stopProgress() {
    clearInterval(progressInterval);
    progressEl.textContent = '';
    progressEl.classList.remove('warning');
  }
  
  NanoTemplate.render(
    'data',
    '/api/slow-endpoint',
    {},
    {
      timeout: 15000,  // 15 seconds
      
      onDataLoading: () => {
        startProgress();
      },
      
      onDataLoaded: (data, error) => {
        stopProgress();
        
        if (error && error.isTimeout) {
          progressEl.textContent = 'Timed out after 15 seconds';
          progressEl.classList.add('error');
        }
      }
    }
  );
</script>
```

---

### Example 5: User-Configurable Timeout

```html
<label>
  Timeout:
  <select id="timeoutSelect">
    <option value="5000">5 seconds</option>
    <option value="10000" selected>10 seconds</option>
    <option value="15000">15 seconds</option>
    <option value="30000">30 seconds</option>
    <option value="0">No timeout</option>
  </select>
</label>

<button onclick="loadWithTimeout()">Load Data</button>
<div id="app"></div>

<script>
  async function loadWithTimeout() {
    const timeout = parseInt(document.getElementById('timeoutSelect').value);
    
    await NanoTemplate.render(
      'data',
      '/api/data',
      {},
      {
        timeout: timeout,
        
        onDataLoaded: (data, error) => {
          if (error && error.isTimeout) {
            alert(`Request timed out after ${timeout / 1000} seconds`);
          }
        },
        
        debug: true
      }
    );
  }
</script>
```

---

### Example 6: Combine with Other fetchOptions

```javascript
// Timeout works alongside other fetch options
await NanoTemplate.render(
  'users',
  '/api/users',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    body: JSON.stringify({ filter: 'active' })
  },
  {
    timeout: 15000,  // 15 second timeout
    
    onDataLoaded: (data, error) => {
      if (error) {
        if (error.isTimeout) {
          console.log('POST request timed out');
        }
      }
    }
  }
);
```

---

### Example 7: Debug Mode with Timeout

```javascript
await NanoTemplate.render(
  'data',
  '/api/data',
  {},
  {
    timeout: 10000,
    debug: true  // See timeout info in console
  }
);

// Console output:
// [NanoTemplate] Fetching data from: /api/data
// [NanoTemplate] Timeout set to: 10000ms
// [NanoTemplate] Request timed out  (if timeout occurs)
```

---

### Example 8: Timeout with Loading States

```html
<div id="loading-status"></div>
<div id="app"></div>

<script>
  const status = document.getElementById('loading-status');
  
  NanoTemplate.render(
    'report',
    '/api/report',
    {},
    {
      timeout: 20000,  // 20 seconds
      
      onBeforeRender: () => {
        status.textContent = 'Preparing...';
        status.className = 'loading';
      },
      
      onDataLoading: () => {
        status.textContent = 'Loading data (max 20s)...';
      },
      
      onDataLoaded: (data, error) => {
        if (error) {
          if (error.isTimeout) {
            status.textContent = 'Timed out after 20 seconds';
            status.className = 'error';
          } else {
            status.textContent = 'Error: ' + error.message;
            status.className = 'error';
          }
        } else {
          status.textContent = 'Loaded successfully';
          status.className = 'success';
          
          setTimeout(() => {
            status.textContent = '';
          }, 2000);
        }
      }
    }
  );
</script>
```

---

## **Error Object Properties**

When a timeout occurs, the error object has these properties:

```javascript
onDataLoaded: (data, error) => {
  if (error) {
    console.log(error.name);       // 'Error'
    console.log(error.message);    // 'Request timeout: Failed to fetch data within 15000ms'
    console.log(error.isTimeout);  // true (only present on timeout errors)
  }
}
```

---

## **How It Works**

1. **AbortController** is created when `timeout > 0`
2. **setTimeout** triggers abort after timeout duration
3. **fetch()** receives the abort signal
4. **On timeout**: `AbortError` is caught and converted to timeout error
5. **onDataLoaded** is called with `error.isTimeout = true`
6. **Error message** is displayed in the target element

---

## **Best Practices**

### ✅ DO: Set appropriate timeouts based on endpoint

```javascript
// Fast data
{ timeout: 5000 }   // 5 seconds

// Normal API calls
{ timeout: 15000 }  // 15 seconds

// Heavy reports
{ timeout: 30000 }  // 30 seconds

// No timeout for critical data
{ timeout: 0 }      // Waits forever
```

### ✅ DO: Handle timeout errors specifically

```javascript
onDataLoaded: (data, error) => {
  if (error) {
    if (error.isTimeout) {
      // Show retry option
      showRetryButton();
    } else {
      // Show generic error
      showError(error.message);
    }
  }
}
```

### ✅ DO: Use debug mode to find right timeout

```javascript
// Test to find appropriate timeout
await NanoTemplate.render('data', '/api/data', {}, {
  timeout: 10000,
  debug: true  // See how long requests actually take
});
```

### ❌ DON'T: Set timeout too short

```javascript
// ❌ Bad - Too aggressive
{ timeout: 1000 }  // 1 second might not be enough

// ✅ Good - Reasonable
{ timeout: 10000 }  // 10 seconds
```

### ❌ DON'T: Forget to hide loading indicators on timeout

```javascript
// ❌ Bad - Loading stays visible
onDataLoading: () => showSpinner()
// Missing onDataLoaded to hide spinner!

// ✅ Good - Always hide loading
onDataLoading: () => showSpinner(),
onDataLoaded: () => hideSpinner()  // Called on success AND timeout
```

---

## **Timeout Values Reference**

| Timeout | Use Case |
|---------|----------|
| 0 | No timeout (default) - waits indefinitely |
| 5000 | Fast APIs, simple queries (5s) |
| 10000 | Standard API calls (10s) |
| 15000 | Complex queries, medium data (15s) |
| 30000 | Heavy reports, large data (30s) |
| 60000 | File processing, exports (60s) |

---

## **FAQ**

### Q: What happens if I don't set a timeout?
**A:** Default is `0` (no timeout). Request waits indefinitely until server responds or browser times out.

### Q: Can I use timeout with POST requests?
**A:** Yes! Timeout works with any HTTP method (GET, POST, PUT, DELETE, etc.)

### Q: Does timeout apply to template fetching?
**A:** No, timeout only applies to the data API request. Template fetching uses default browser timeout.

### Q: Can I cancel a request manually?
**A:** Yes, you can use `AbortController` in `fetchOption`:

```javascript
const controller = new AbortController();

NanoTemplate.render('data', '/api/data', {
  signal: controller.signal
});

// Cancel manually
setTimeout(() => controller.abort(), 5000);
```

### Q: What if both timeout option AND signal are provided?
**A:** The timeout option will override any signal in fetchOption. Use one or the other.

---

## **Quick Reference**

```javascript
// Basic timeout
await NanoTemplate.render('template', '/api/data', {}, {
  timeout: 15000  // 15 seconds
});

// With error handling
await NanoTemplate.render('template', '/api/data', {}, {
  timeout: 15000,
  onDataLoaded: (data, error) => {
    if (error?.isTimeout) {
      console.log('Timed out!');
    }
  }
});

// With all callbacks
await NanoTemplate.render('template', '/api/data', {}, {
  timeout: 15000,
  onBeforeRender: (el) => el.innerHTML = 'Loading...',
  onDataLoading: (el) => console.log('Fetching...'),
  onDataLoaded: (data, error, el) => {
    if (error?.isTimeout) {
      el.innerHTML = 'Request timed out';
    }
  }
});
```
