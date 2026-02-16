# Data Loading Callbacks

NanoTemplate now supports lifecycle callbacks for showing/hiding loading indicators when fetching data from remote APIs.

## **New Options**

```javascript
await NanoTemplate.render(template, dataSource, fetchOption, {
  onDataLoading: () => {
    // Called BEFORE fetching data from API
    // Show loading spinner, disable buttons, etc.
  },
  onDataLoaded: (data, error) => {
    // Called AFTER data is fetched (or on error)
    // Hide loading spinner, enable buttons, etc.
    // data: the fetched data (or null if error)
    // error: the error object (or undefined if success)
  },
  debug: true  // Shows data in console
});
```

---

## **Basic Example: Loading Spinner**

### HTML
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .loading-spinner {
      display: none;
      text-align: center;
      padding: 20px;
    }
    .loading-spinner.active {
      display: block;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading" class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
  
  <div id="app"></div>
  
  <script src="NanoTemplate.js"></script>
  <script>
    const loadingEl = document.getElementById('loading');
    
    NanoTemplate.render(
      'users',
      'https://api.example.com/users',  // API URL
      {},
      {
        onDataLoading: () => {
          loadingEl.classList.add('active');
        },
        onDataLoaded: (data, error) => {
          loadingEl.classList.remove('active');
          
          if (error) {
            console.error('Failed to load data:', error);
          }
        }
      }
    );
  </script>
</body>
</html>
```

---

## **Example 2: Progress Bar with Status**

```html
<div id="status" style="display:none;">
  <div class="progress-bar">
    <div class="progress"></div>
  </div>
  <p id="status-text">Loading...</p>
</div>

<div id="app"></div>

<script>
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  
  NanoTemplate.render(
    'dashboard',
    '/api/dashboard',
    {},
    {
      onDataLoading: () => {
        statusEl.style.display = 'block';
        statusText.textContent = 'Fetching dashboard data...';
      },
      onDataLoaded: (data, error) => {
        if (error) {
          statusText.textContent = 'Error: ' + error.message;
          setTimeout(() => {
            statusEl.style.display = 'none';
          }, 3000);
        } else {
          statusText.textContent = 'Data loaded successfully!';
          setTimeout(() => {
            statusEl.style.display = 'none';
          }, 500);
        }
      },
      debug: true  // Console will show fetched data
    }
  );
</script>
```

---

## **Example 3: Disable/Enable Buttons**

```html
<nav>
  <button id="btn-home" onclick="loadPage('home')">Home</button>
  <button id="btn-users" onclick="loadPage('users')">Users</button>
  <button id="btn-settings" onclick="loadPage('settings')">Settings</button>
</nav>

<div id="loading-overlay" style="display:none;">Loading...</div>
<div id="app"></div>

<script>
  function disableNavigation() {
    document.querySelectorAll('nav button').forEach(btn => {
      btn.disabled = true;
    });
    document.getElementById('loading-overlay').style.display = 'block';
  }
  
  function enableNavigation() {
    document.querySelectorAll('nav button').forEach(btn => {
      btn.disabled = false;
    });
    document.getElementById('loading-overlay').style.display = 'none';
  }
  
  async function loadPage(page) {
    await NanoTemplate.render(
      page,
      `/api/${page}`,
      {},
      {
        onDataLoading: disableNavigation,
        onDataLoaded: enableNavigation
      }
    );
  }
  
  // Initial load
  loadPage('home');
</script>
```

---

## **Example 4: Toast Notifications**

```html
<div id="toast" class="toast"></div>
<div id="app"></div>

<script>
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }
  
  NanoTemplate.render(
    'products',
    '/api/products',
    {},
    {
      onDataLoading: () => {
        showToast('Loading products...', 'info');
      },
      onDataLoaded: (data, error) => {
        if (error) {
          showToast('Failed to load products: ' + error.message, 'error');
        } else {
          showToast(`Loaded ${data.length} products`, 'success');
        }
      }
    }
  );
</script>
```

---

## **Example 5: Analytics Tracking**

```javascript
NanoTemplate.render(
  'report',
  '/api/report/monthly',
  {},
  {
    onDataLoading: () => {
      // Track when user starts loading data
      analytics.track('report_load_started', {
        type: 'monthly',
        timestamp: Date.now()
      });
    },
    onDataLoaded: (data, error) => {
      if (error) {
        // Track loading failures
        analytics.track('report_load_failed', {
          type: 'monthly',
          error: error.message
        });
      } else {
        // Track successful loads
        analytics.track('report_load_completed', {
          type: 'monthly',
          recordCount: data.records.length,
          loadTime: Date.now() - startTime
        });
      }
    }
  }
);
```

---

## **Example 6: Multiple Loading States**

```html
<div id="app">
  <div id="skeleton-loader">
    <!-- Skeleton placeholders -->
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  </div>
</div>

<script>
  NanoTemplate.render(
    'articles',
    '/api/articles',
    {},
    {
      onDataLoading: () => {
        // Show skeleton loader (already in #app)
        // No need to do anything - skeleton is already visible
        console.log('Loading articles...');
      },
      onDataLoaded: (data, error) => {
        // Skeleton will be replaced by actual content automatically
        if (error) {
          // Show error state
          document.getElementById('app').innerHTML = `
            <div class="error">
              <p>Failed to load articles</p>
              <button onclick="location.reload()">Retry</button>
            </div>
          `;
        }
      }
    }
  );
</script>
```

---

## **Example 7: Refresh with Loading State**

```html
<button id="refreshBtn">Refresh Data</button>
<div id="app"></div>

<script>
  let isLoading = false;
  const refreshBtn = document.getElementById('refreshBtn');
  
  async function loadData() {
    await NanoTemplate.render(
      'dashboard',
      '/api/dashboard',
      {},
      {
        onDataLoading: () => {
          isLoading = true;
          refreshBtn.disabled = true;
          refreshBtn.textContent = 'Loading...';
        },
        onDataLoaded: (data, error) => {
          isLoading = false;
          refreshBtn.disabled = false;
          refreshBtn.textContent = 'Refresh Data';
          
          if (error) {
            alert('Failed to load: ' + error.message);
          }
        },
        debug: true  // See data in console
      }
    );
  }
  
  refreshBtn.addEventListener('click', () => {
    if (!isLoading) {
      loadData();
    }
  });
  
  // Initial load
  loadData();
</script>
```

---

## **Example 8: Debug Mode**

```javascript
// Enable debug to see fetched data in console
NanoTemplate.render(
  'users',
  '/api/users',
  {},
  {
    debug: true,  // Will log:
                  // "[NanoTemplate] Calling onDataLoading callback"
                  // "[NanoTemplate] Fetching data from: /api/users"
                  // "[NanoTemplate] Data fetched successfully:"
                  // { users: [...] }
                  // "[NanoTemplate] Calling onDataLoaded callback"
    
    onDataLoading: () => {
      console.log('Custom: Starting to load');
    },
    onDataLoaded: (data, error) => {
      console.log('Custom: Finished loading', data);
    }
  }
);
```

---

## **Example 9: Global Loading Handler**

```javascript
// Create reusable loading handlers
const LoadingManager = {
  show() {
    document.body.classList.add('loading');
    document.getElementById('global-spinner').style.display = 'block';
  },
  hide() {
    document.body.classList.remove('loading');
    document.getElementById('global-spinner').style.display = 'none';
  }
};

// Use across all renders
async function renderWithLoading(template, dataSource) {
  return NanoTemplate.render(
    template,
    dataSource,
    {},
    {
      onDataLoading: LoadingManager.show,
      onDataLoaded: LoadingManager.hide
    }
  );
}

// Usage
renderWithLoading('users', '/api/users');
renderWithLoading('posts', '/api/posts');
```

---

## **Example 10: Error Handling with Retry**

```html
<div id="app"></div>
<div id="error-panel" style="display:none;">
  <p id="error-message"></p>
  <button id="retryBtn">Retry</button>
</div>

<script>
  let currentTemplate = null;
  let currentDataSource = null;
  
  async function loadData(template, dataSource) {
    currentTemplate = template;
    currentDataSource = dataSource;
    
    document.getElementById('error-panel').style.display = 'none';
    
    await NanoTemplate.render(
      template,
      dataSource,
      {},
      {
        onDataLoading: () => {
          document.getElementById('app').innerHTML = '<p>Loading...</p>';
        },
        onDataLoaded: (data, error) => {
          if (error) {
            document.getElementById('error-message').textContent = 
              'Error: ' + error.message;
            document.getElementById('error-panel').style.display = 'block';
            document.getElementById('app').innerHTML = '';
          }
        }
      }
    );
  }
  
  document.getElementById('retryBtn').addEventListener('click', () => {
    if (currentTemplate && currentDataSource) {
      loadData(currentTemplate, currentDataSource);
    }
  });
  
  // Initial load
  loadData('products', '/api/products');
</script>
```

---

## **API Reference**

### onDataLoading()
- **When called**: Before `fetch()` starts
- **Parameters**: None
- **Use for**: Show spinners, disable UI, show progress bars

### onDataLoaded(data, error)
- **When called**: After `fetch()` completes (success or error)
- **Parameters**:
  - `data`: Fetched data (or `null` if error)
  - `error`: Error object (or `undefined` if success)
- **Use for**: Hide spinners, enable UI, show notifications

### debug: true
- **Effect**: Logs to console:
  - When callbacks are called
  - The API URL being fetched
  - The fetched data (or error)
- **Use for**: Development and debugging

---

## **Important Notes**

1. **Callbacks only run for remote data** (when `dataSource` is a string URL)
2. **onDataLoaded always runs** - even on error (so you can hide loading indicators)
3. **Error parameter** - Check `if (error)` in onDataLoaded to handle failures
4. **Synchronous data** - If `dataSource` is an object, callbacks don't run

---

## **Best Practices**

### ✅ DO: Handle errors in onDataLoaded
```javascript
onDataLoaded: (data, error) => {
  hideSpinner();
  if (error) {
    showError(error.message);
  }
}
```

### ✅ DO: Keep callbacks simple
```javascript
onDataLoading: () => showSpinner(),
onDataLoaded: () => hideSpinner()
```

### ❌ DON'T: Make async calls in callbacks
```javascript
// ❌ Bad
onDataLoaded: async (data) => {
  await someAsyncFunction();  // Don't do this
}

// ✅ Good
onDataLoaded: (data) => {
  someAsyncFunction();  // Fire and forget, or handle separately
}
```

### ✅ DO: Use debug mode during development
```javascript
NanoTemplate.render(template, dataSource, {}, {
  debug: true,  // Remove in production
  onDataLoading: showSpinner,
  onDataLoaded: hideSpinner
});
```
