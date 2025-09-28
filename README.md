# NanoTemplate

## JS

`NanoTemplate.render(template, apiUrl = null, targetElementId = 'app', viewPath = '/page/', templateExtension = '.html')`

- `template`: full url starting with "http" or local file name under `viewPath`
- `apiUrl`: remote api url to get json data, if not set, will just render static page of `template`
- `targetElementId`: id of dom element to put the rendered content, default is "app"
- `viewPath`: path of local template file, default is "/page/"
- `templateExtension`: file extension for template file, default is ".html"

## Template

```
// escaped
{{ variable }}

// unescaped
{{{ variable }}}

// if condition
{{#if variable}}
  variable is true
{{else}}
  variable is false
{{/if}}

// if not condition
{{#unless variable}}
  variable is false
{{else}}
  variable is true
{{/unless}}

// iteration of array
{{#each array}}
  {{@index}} iterate the array
{{else}}
  array is empty
{{/each}}

```
