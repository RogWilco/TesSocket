import * as _ from 'lodash'
import fetch from 'node-fetch'
import * as WebSocket from 'ws'

export type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export default class API {
    private static readonly CLIENT_ID = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384'
    private static readonly CLIENT_SECRET = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3'
    private static readonly URL_ROOT = 'https://owner-api.teslamotors.com'
    private static readonly URL_AUTH = `${API.URL_ROOT}/oauth`
    private static readonly URL_BASE = `${API.URL_ROOT}/api/1`

    private email: string
    private password: string

    private auth: string = ''

    /**
     * Initializes a new API client using the specified credentials.
     *
     * @param email the login email to be used
     * @param password the associated password
     */
    constructor(email: string, password: string) {
        this.email = email
        this.password = password
    }

    /**
     * Authenticates the current session, obtaining the required auth tokens for
     * subsequent requests.
     */
    private async authenticate(): Promise<string> {
        if(this.auth === '' || this.auth === undefined) {
            // Token (POST https://owner-api.teslamotors.com/oauth/token)
            const response = await fetch(`${API.URL_AUTH}/token`, {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                },
                'body': `grant_type=password&client_id=${API.CLIENT_ID}&client_secret=${API.CLIENT_SECRET}&email=${this.email}&password=${this.password}`
            })
            const body = await response.json()

            this.auth = `${_.capitalize(body.token_type)} ${body.access_token}`
        }

        return this.auth
    }

    /**
     * Makes an API request to the specified endpoint path.
     *
     * @param method the HTTP request method to be used
     * @param path the path of the endpoint, relative to the base URL
     *
     * @returns the response body
     */
    async request(method: RequestMethod, path: string): Promise<any> {
        await this.authenticate()

        const res = await fetch(
            `${API.URL_BASE}${path}`,
            {
                method,
                headers: {
                    Authorization: this.auth
                }
            }
        )

        const body = await res.json()

        return body.response
    }

    /**
     * Retrieves all vehicles on the account.
     *
     * @returns an array of vehicles
     */
    async getVehicles() {
        return this.request('GET', '/vehicles')
    }

    /**
     * Retrieves a vehicle with the specified VIN. Must be associated with the
     * authenticated account.
     *
     * @param vin the target vehicle's VIN
     *
     * @return the corresponding vehicle
     */
    async getVehicle(vin: string) {
        const vehicles = await this.getVehicles()

        for(let i = 0; i < vehicles.length; i++) {
            if(vehicles[i].vin === vin) {
                return vehicles[i]
            }
        }

        throw new Error(`Vehicle with VIN "${vin}" not found.`)
    }

    /**
     * Retrieves all available data for the specified vehicle.
     *
     * @param vin the target vehicle's VIN
     *
     * @return the requested vehicle data
     */
    async getVehicleData(vin: string) {
        const vehicle = await this.getVehicle(vin)

        return this.request('GET', `/vehicles/${vehicle.id_s}/vehicle_data`)
    }

    /**
     * Retrieves the required WebSocket tokents for use with summon, smart-summon, etc.
     *
     * @param vin the target vehicle's VIN
     *
     * @return the requested WebSocket tokens
     */
    async getWsTokens(vin: string) {
        const vehicle = await this.getVehicle(vin)

        return vehicle.tokens
    }

    /**
     * Opens a new WebSocket connection to Tesla for the specified target vehicle.
     *
     * @param vin the target vehicle's VIN
     *
     * @return the opened WebSocket connection
     */
    async openWsConnection(vin: string) {
        const vehicle = await this.getVehicleData(vin)

        return new WebSocket(
            `wss://streaming.vn.teslamotors.com/connect/${vehicle.vehicle_id}`,
            {
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${this.email}:${vehicle.tokens[0]}`).toString('base64')
                }
            }
        )
    }
}