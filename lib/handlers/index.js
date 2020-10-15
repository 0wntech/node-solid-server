/* eslint-disable node/no-deprecated-api */

module.exports = handler

const path = require('path')
const debug = require('debug')('solid:index')
const Negotiator = require('negotiator')
const url = require('url')
const URI = require('urijs')

async function handler (req, res, next) {
  const indexFile = 'index.html'
  const ldp = req.app.locals.ldp
  const negotiator = new Negotiator(req)
  const requestedType = negotiator.mediaType()

  try {
    const { path: filename } = await ldp.resourceMapper.mapUrlToFile({ url: req })

    const stats = await ldp.stat(filename)
    if (!stats.isDirectory()) {
      return next()
    }

    // redirect to the right container if missing trailing /
    if (req.path.lastIndexOf('/') !== req.path.length - 1) {
      return res.redirect(301, URI.joinPaths(req.path, '/').toString())
    }

    if (requestedType && requestedType.indexOf('text/html') !== 0) {
      return next()
    }
  } catch (e) {
    // Ignore errors
  }
  next()
}
