# simonholm.github.io

Static personal site content hosted with GitHub Pages.

## WebMCP experiment

The WebMCP experiment is hosted at <https://simonholm.github.io/webmcp/>.

It was tested successfully with Chrome 151 on Android with the "WebMCP for testing" flag enabled. The page uses the current `document.modelContext` WebMCP Imperative API.

The `hello_world` tool demonstrates `registerTool()`, discovery through `getTools()`, and invocation through `executeTool()`.

The `search_projects` tool demonstrates a required `query` argument with a JSON input schema, passing JSON arguments through `executeTool()`, searching page-local JavaScript data, and returning dynamic results.

The experiment is entirely static and hosted on GitHub Pages. It requires no MCP server, backend, framework, or external API.

WebMCP is experimental, and browser support is currently limited and browser-dependent.
