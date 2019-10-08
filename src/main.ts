import Message from './Message/index'
import * as WebSocket from 'ws'

import API from './api'
import { Stream } from 'stream'

const AUTH_EMAIL = ''
const AUTH_PASSWORD = ''

export default async function () {
    const VIN = '5YJ3E1EB7JF100436'
    const api = new API(AUTH_EMAIL, AUTH_PASSWORD)
    // const vehicle = await api.getVehicle(VIN)
    const vehicle = await api.getVehicleData(VIN)

    const ws = new WebSocket(
        `wss://streaming.vn.teslamotors.com/connect/${vehicle.vehicle_id}`,
        {
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${AUTH_EMAIL}:${vehicle.tokens[0]}`).toString('base64')
            }
        }
    )

    ws.on('error', err => {
      console.log('ERROR')
      console.log(err)
    })

    ws.on('open', () => {
      console.log('CONNECTED')
      // ws.send('{"msg_type":"autopark:cmd_forward", "latitude":123.456, "longitude": 78.90}')
    })

    ws.on('close', () => {
      console.log('DISCONNECTED')
    })

    ws.on('message', payload => {
      const message = JSON.parse(payload.toString())

      switch(message.msg_type) {
        case 'control:hello':
        case 'control:goodbye':
        case 'autopark:style':
        case 'autopark:status':
        case 'homelink:status':
        case 'vehicle_data:location':

        default:
          console.log(`MESSAGE: ${message.msg_type}\n---\n`)
          console.log(message)
          console.log()
      }
    })
}
