const express   = require('express');
const router    = express.Router();
const logger    = require('../logger')
const fs        = require('fs');

const Web3      = require('../components/Web3')
const Istanbul  = require('../components/Istanbul')

const web3      = new Web3()
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
      logger.error(error.message || error)
      return errorResponse(response, error.message || error)
    })
})

router.post('/start-propose', (request, response) => {
  const { address } = request.body
  if(typeof address !== 'string') return errorResponse(response, `Wrong type for parameter 'address' , got back '${typeof address}', was expecting 'string'`)
  if(!web3.isAddress(address)) return errorResponse(response, `Address '${address}' is an invalid Ledgerium address`)
  istanbul.startProposal(address)
    .then(data => {
      return successResponse(response, 'Got challenge', data)

    })
    .catch(error => {
      logger.error(error.message || error)
      return errorResponse(response, error.message || error)
    })

})

router.post('/istanbul-propose', (request, response) => {
  const { challenge, signature, votee, proposal } = request.body
  if(typeof challenge !== 'string') return errorResponse(response, `Wrong type for parameter 'challenge', got back '${typeof challenge}', was expecting 'string'`)
  if(typeof signature !== 'string') return errorResponse(response, `Wrong type for parameter 'signature', got back '${typeof signature}', was expecting 'string'`)
  if(typeof votee !== 'string') return errorResponse(response, `Wrong type for parameter 'votee', got back '${typeof votee}', was expecting 'string'`)
  if(typeof proposal !== 'boolean') return errorResponse(response, `Wrong type for parameter 'proposal', got back '${typeof proposal}', was expecting 'boolean'`)
  if(!web3.isAddress(votee)) return errorResponse(response, `Address '${votee}' is an invalid Ledgerium address`)
  istanbul.propose(challenge, signature, votee, proposal)
    .then(data => {
      if(data.error) {
        return errorResponse(response, data.error.message)
      } else {
        return successResponse(response, 'Vote response', data)
      }
    })
    .catch(error => {
      logger.error(error.message || error)
      return errorResponse(response, error.message || error)
    })

})

module.exports = router;
