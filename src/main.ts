import * as WebSocket from 'ws'

import API from './api'

const AUTH_EMAIL = 'accounts.tesla@nickawilliams.com'
const AUTH_PASSWORD = 'tfa>6kZj;CAi34T7qZm>W=g8642PL2w6'
const VIN = '5YJ3E1EB7JF100436'
const direction = 'forward'

export default async function () {
    const api = new API(AUTH_EMAIL, AUTH_PASSWORD)

    const vehicle = await api.getVehicleData(VIN)
    console.log(vehicle)

    const ws = await api.openWsConnection(VIN)
    let heartbeatInterval: NodeJS.Timeout
    let heartbeatFrequency: number

    ws.on('error', err => {
      console.log('ERROR')
      console.log(err)
      clearInterval(heartbeatInterval)
    })

    ws.on('open', () => {
      console.log('CONNECTED')
      // ws.send('{"msg_type":"autopark:cmd_forward", "latitude":123.456, "longitude": 78.90}')
    })

    ws.on('close', () => {
      console.log('DISCONNECTED')
      clearInterval(heartbeatInterval)
    })

    ws.on('message', payload => {
      const message = JSON.parse(payload.toString())

      switch(message.msg_type) {
        case 'control:hello':
            heartbeatFrequency = message.autopark.heartbeat_frequency
            console.log(message)
          break

        case 'autopark:status':
          switch(message.autopark_state) {
            case 'ready':
              // Activate heartbeat
              heartbeatInterval = setInterval(() => {
                ws.send(JSON.stringify({
                  msg_type: 'autopark:heartbeat_app',
                  timestamp: new Date().getTime(),
                }))
              }, heartbeatFrequency)

              console.log(`-- SUMMONING: ${direction}`)

              // Send summon command
              ws.send(JSON.stringify({
                msg_type: `autopark:cmd_${direction}`,
                latitude: vehicle.drive_state.latitude,
                longitude: vehicle.drive_state.longitude,
              }))

              break
          }

        case 'control:goodbye':
        case 'autopark:error':
        case 'autopark:heartbeat_car':
        case 'autopark:style':
        case 'homelink:status':
        case 'autopark:smart_summon_viz':
        case 'vehicle_data:location':

        default:
          console.log(`MESSAGE: ${message.msg_type}\n---\n`)
          console.log(message)
          console.log()
      }
    })
}
