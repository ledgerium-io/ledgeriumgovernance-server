const express   = require('express');
const router    = express.Router();
const logger    = require('../logger')
const fs        = require('fs');

const Web3      = require('../components/Web3')
const web3      = new Web3()
const Istanbul  = require('../components/Istanbul')
const istanbul  = new Istanbul(web3)

const successResponse = (response, message = null, data = null) => {
  response.status(200).send({
    success: true,
    timestamp: Date.now(),
    message,
    data
  })
}

const errorResponse = (response, message, status = 403) => {
  response.status(status).send({
    success: false,
    timestamp: Date.now(),
    message
  })
}

router.get('/ping', (request, response) => {
  return successResponse(response, 'pong')
})

router.get('/state', (request, response) => {
  istanbul.getPayload()
    .then(data=> {
      return successResponse(response, 'Got current state', data)
    })
    .catch(error => {
      return errorResponse(response, error.message || error)
    })
})

router.get('/snapshot', (request, response) => {
  istanbul.getSnapshot()
    .then(data=> {
      return successResponse(response, 'Got snapshot', data)
    })
    .catch(error => {
      return errorResponse(response, error.message || error)
    })
})

router.post('/start-propose', (request, response) => {
  const {proposal, sender, vote} = request.body
  if(typeof proposal !== 'boolean' || typeof sender !== 'string' || typeof vote !== 'string') return errorResponse(response, 'Wrong type for parameter(s)')
  

})

router.post('/istanbul-propose', (request, response) => {

})

module.exports = router;
