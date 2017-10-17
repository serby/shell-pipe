const express = require('express')
const hat = require('hat')
const levelup = require('levelup')
const leveldown = require('leveldown')
const concat = require('concat-stream')
const app = express()
const db = levelup(leveldown('./db'))

app.get('/:name', async (req, res) => {
  try {
    const packet = JSON.parse((await db.get(req.params.name)))
    console.log(packet)
    res.send(packet.data)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.put('/:name', (req, res) => {
  const id = hat()
  const stream = concat(async data => {
    try {
      const packet = { id, name: req.params.name, data: data.toString() }
      await db.put(id, JSON.stringify(packet))
      console.log('written', packet)
    } catch (e) {
      console.error('Something bad happened', e)
    }
  })
  req.pipe(stream).on('finish', () => {
    res.send(id)
  })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

