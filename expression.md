# NanoTemplate Expression Support

The `{{#if}}` and `{{#unless}}` blocks now support expressions, not just simple variables!

## **Supported Expressions**

### 1. Simple Variables
```html
{{#if isLoggedIn}}
  <p>Welcome back!</p>
{{/if}}
```

### 2. Logical AND (&&)
```html
{{#if isLoggedIn && isAdmin}}
  <p>Admin panel</p>
{{/if}}
```

### 3. Logical OR (||)
```html
{{#if isAdmin || isModerator}}
  <p>Moderation tools</p>
{{/if}}
```

### 4. Logical NOT (!)
```html
{{#if !isBlocked}}
  <p>You can post</p>
{{/if}}
```

### 5. Equality (==)
```html
{{#if status == "active"}}
  <span class="badge-green">Active</span>
{{/if}}

{{#if count == 0}}
  <p>No items</p>
{{/if}}
```

### 6. Inequality (!=)
```html
{{#if role != "guest"}}
  <button>Edit</button>
{{/if}}
```

### 7. Comparisons (>, <, >=, <=)
```html
{{#if age >= 18}}
  <p>Adult content available</p>
{{/if}}

{{#if score > 100}}
  <p>High score!</p>
{{/if}}

{{#if items.length < 10}}
  <p>Few items remaining</p>
{{/if}}
```

### 8. Nested Properties
```html
{{#if user.profile.verified}}
  <span class="verified-badge">✓</span>
{{/if}}
```

### 9. Complex Combinations
```html
{{#if isLoggedIn && (isAdmin || isModerator)}}
  <p>You have moderation access</p>
{{/if}}

{{#if age >= 18 && !isBlocked}}
  <button>Purchase</button>
{{/if}}

{{#if status == "active" || status == "pending"}}
  <span>Processing...</span>
{{/if}}
```

## **Complete Examples**

### Example 1: User Profile
```javascript
const data = {
  user: {
    name: 'John',
    age: 25,
    isAdmin: true,
    verified: false
  }
};
```

```html
<div class="profile">
  <h2>{{user.name}}</h2>
  
  {{#if user.age >= 18}}
    <span>Adult</span>
  {{/if}}
  
  {{#if user.isAdmin && user.verified}}
    <span class="badge">Verified Admin</span>
  {{else}}
    {{#if user.isAdmin && !user.verified}}
      <span class="badge">Unverified Admin</span>
    {{/if}}
  {{/if}}
</div>
```

### Example 2: Shopping Cart
```javascript
const data = {
  items: [
    { name: 'Shirt', price: 25, inStock: true },
    { name: 'Pants', price: 50, inStock: false }
  ],
  total: 75,
  freeShippingThreshold: 50
};
```

```html
<div class="cart">
  {{#each items}}
    <div class="item">
      <span>{{name}} - ${{price}}</span>
      {{#if inStock && price < 30}}
        <span class="deal">Great Deal!</span>
      {{/if}}
      {{#if !inStock}}
        <span class="error">Out of Stock</span>
      {{/if}}
    </div>
  {{/each}}
  
  <div class="total">
    Total: ${{total}}
    {{#if total >= freeShippingThreshold}}
      <span class="success">Free Shipping!</span>
    {{/if}}
  </div>
</div>
```

### Example 3: Access Control
```javascript
const data = {
  user: {
    role: 'editor',
    status: 'active',
    permissions: ['read', 'write']
  }
};
```

```html
{{#if user.status == "active" && (user.role == "admin" || user.role == "editor")}}
  <div class="editor-panel">
    <button>Create Post</button>
    
    {{#if user.role == "admin"}}
      <button>Delete Post</button>
      <button>Manage Users</button>
    {{/if}}
  </div>
{{else}}
  {{#if user.status != "active"}}
    <p>Your account is not active</p>
  {{else}}
    <p>Insufficient permissions</p>
  {{/if}}
{{/if}}
```

### Example 4: Form Validation Display
```javascript
const data = {
  form: {
    username: 'john',
    email: '',
    age: 15
  },
  errors: {
    emailRequired: true,
    ageTooYoung: true
  }
};
```

```html
<form>
  <div>
    <label>Username</label>
    <input value="{{form.username}}">
    {{#if form.username.length >= 3}}
      <span class="success">✓</span>
    {{/if}}
  </div>
  
  <div>
    <label>Email</label>
    <input value="{{form.email}}">
    {{#if errors.emailRequired && form.email == ""}}
      <span class="error">Email is required</span>
    {{/if}}
  </div>
  
  <div>
    <label>Age</label>
    <input value="{{form.age}}">
    {{#if form.age < 18}}
      <span class="warning">Must be 18 or older</span>
    {{/if}}
  </div>
</form>
```

## **Operator Precedence**

Operators are evaluated in this order (highest to lowest):

1. **NOT (!)** - `!variable`
2. **Comparisons** - `>`, `<`, `>=`, `<=`, `==`, `!=`
3. **AND (&&)** - All conditions must be true
4. **OR (||)** - At least one condition must be true

### Example with Precedence
```html
<!-- This: !isBlocked && isActive || isAdmin -->
<!-- Evaluates as: ((!isBlocked) && isActive) || isAdmin -->

{{#if !isBlocked && isActive || isAdmin}}
  <button>Post Comment</button>
{{/if}}
```

## **Supported Value Types**

### Variables
```html
{{#if username}}...{{/if}}
{{#if user.profile.verified}}...{{/if}}
```

### Strings
```html
{{#if status == "active"}}...{{/if}}
{{#if name == 'John'}}...{{/if}}
```

### Numbers
```html
{{#if age >= 18}}...{{/if}}
{{#if count == 0}}...{{/if}}
{{#if price < 100.50}}...{{/if}}
```

### Booleans
```html
{{#if isActive == true}}...{{/if}}
{{#if !false}}...{{/if}}
```

## **Limitations**

### ❌ Not Supported (Yet)
- Parentheses for grouping: `(a || b) && c`
- Math operations: `age + 5 > 18`
- Function calls: `username.length()`
- Regular expressions: `/pattern/.test(value)`
- Ternary operator: `a ? b : c`

### ✅ Workarounds

**Instead of math in template:**
```javascript
// ❌ In template: {{#if age + 5 > 18}}

// ✅ In data:
const data = {
  age: 15,
  ageInFiveYears: 15 + 5,
  canDrinkInFiveYears: (15 + 5) >= 21
};
```
```html
{{#if canDrinkInFiveYears}}
  <p>You'll be able to drink in 5 years</p>
{{/if}}
```

**Instead of parentheses:**
```javascript
// ❌ In template: {{#if (isAdmin || isMod) && isActive}}

// ✅ In data:
const data = {
  isAdmin: true,
  isMod: false,
  isActive: true,
  canModerate: (true || false) && true
};
```
```html
{{#if canModerate}}
  <button>Moderate</button>
{{/if}}
```

## **Best Practices**

### ✅ DO: Keep expressions simple
```html
<!-- Good -->
{{#if isLoggedIn && isActive}}
  ...
{{/if}}
```

### ❌ DON'T: Create overly complex expressions
```html
<!-- Too complex -->
{{#if role == "admin" || role == "mod" || role == "editor" && status == "active" && !banned}}
  ...
{{/if}}
```

### ✅ DO: Pre-compute complex logic
```javascript
// In your data
const data = {
  canEdit: (role === 'admin' || role === 'mod' || role === 'editor') 
           && status === 'active' 
           && !banned
};
```
```html
<!-- In template -->
{{#if canEdit}}
  <button>Edit</button>
{{/if}}
```

## **Testing Expressions**

You can test expressions directly:

```javascript
const data = {
  age: 25,
  isAdmin: true,
  status: 'active'
};

// Test with processTemplate
const template = `
  {{#if age >= 18 && isAdmin}}
    <p>Adult Admin</p>
  {{/if}}
`;

const result = NanoTemplate.processTemplate(template, data);
console.log(result); // <p>Adult Admin</p>
```
