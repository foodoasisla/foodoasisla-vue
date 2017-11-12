const Vue = require('vue')
const server = require('express')()
//const renderer = require('vue-server-renderer').createRenderer()


const renderer = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync('./index.template.html', 'utf-8')
})

server.get('*', (req, res) => {
  const app = new Vue({
    data: {
      url: req.url
    },
    template: `<div>The visited URL is: {{ url }}</div>`
  })


  // renderer.renderToString(app, (err, html) => {
  //   console.log(html) // will be the full page with app content injected.
  // })
  renderer.renderToString(app, (err, html) => {
    if (err) {
      res.status(500).end('Internal Server Error')
      return
    }
    res.end(html)
  })
  // renderer.renderToString(app, (err, html) => {
  //   if (err) {
  //     res.status(500).end('Internal Server Error')
  //     return
  //   }
  //   res.end(`
  //     <!DOCTYPE html>
  //     <html lang="en">
  //       <head><title>Hello</title></head>
  //       <body>${html}</body>
  //     </html>
  //   `)
  // })
})

server.listen(8080)
