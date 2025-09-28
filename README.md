# NanoTemplate

## JS

`NanoTemplate.render(template, dataSource = null, targetElementId = 'app', viewPath = '/page/', templateExtension = '.html')`

- `template`: full url starting with "http", or local file name under `viewPath`
- `dataSource`: remote api url to get json data if it is a string, otherwise, pass it directly as tempalte data. If not set, it will just render static page of `template` without any data
- `targetElementId`: id of dom element to put the rendered content, default is `"app"`
- `viewPath`: path of local template file, default is `"/page/"`
- `templateExtension`: file extension for template file, default is `".html"`

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
