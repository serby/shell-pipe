const express = require('express')
const hat = require('hat')
const levelup = require('levelup')
const leveldown = require('leveldown')
const concat = require('concat-stream')
const app = express()
const db = levelup(leveldown('./db'))

const port = process.env.PORT || 3000
const host = process.env.HOST || 'localhost'

app.get('/kill', async (req, res) => {
  process.exit(1)
})

app.get('/list', async (req, res) => {
  db.createKeyStream().on('data', key => {
    res.write(key + '\n')
  }).on('end', () => res.end())
})

app.get('/:name', async (req, res) => {
  try {
    const packet = JSON.parse((await db.get(req.params.name)))
    console.log(packet)
    res.type('text/plain')
    res.send(packet.data)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.put('/:name', (req, res) => {
  const id = hat()
  const name = req.params.name
  const key = name + '-' + id
  const stream = concat(async data => {
    try {
      const packet = { id, name, data: data.toString() }
      await db.put(key, JSON.stringify(packet))
      console.log('written', packet)
    } catch (e) {
      console.error('Something bad happened', e)
    }
  })
  req.pipe(stream).on('finish', () => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl + '-' + id
    res.send(url + '\n')
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on http://${host}:${port}`)
})

