const chalk = require('chalk')
const GameState = require('../models/GameState')
const GAME_SETTINGS = require('../settings')

class Game {
	constructor() {
		this._clients = []
		this._isCalculatingState = false
		this._loopIntervalId = undefined	
		this._gameState = null
	}

	join(client) {
		if(this._clients.length > GAME_SETTINGS.MAX_AMOUNT_OF_CLIENTS)
			return

		if(this._clients.includes(client))
			return

		const usedColors = this._clients.map((client)=>{
			return client.getPlayer().getColor()
		})
		
		for(let color of GAME_SETTINGS.PLAYER_COLORS) {
			if(!usedColors.includes(color)) {
				client.getPlayer().setColor(color)
				break
			} 	
		}
		
		console.log(`Client ${ chalk.blue(client.getUID()) } joined game`)
		this._clients.push(client)
	}

	start(client) {
		if(this._clients.length < GAME_SETTINGS.MIN_AMOUNT_OF_CLIENTS)
			return
		
		if(this._gameState)
			return 

		this._gameState = new GameState()

		console.log(`Client ${ chalk.blue(client.getUID()) } started the game`)
		this._loopIntervalId = setInterval(this._loop.bind(this), GAME_SETTINGS.LOOP_INTERVAL_TIME)
	}

	stop(client) {
		console.log(`Client ${ chalk.blue(client.getUID()) } stopped the game`)
		clearInterval(this._loopIntervalId)
		this._gameState = null
	}

	kickClient(uID) {
		this._clients = this._clients.filter( client => client.getUID() !== uID )
	}

	_broadcoast(type, payload) {
		this._clients.forEach( (client) => {
			client.send({
				type: type,
				payload: payload
			})
		})
	}

	_loop() {
		if(!this._gameState) 
			return 

		if(this._gameState.getIsCalculating()) 
			return 

		this._gameState.calculate(this._clients.map(client => client.getPlayer())).then((state) => {
			this._broadcoast('state', state)
		}).catch((error) => {
			console.log(chalk.red('Error while calculating state'), error)
		})
	}
}

module.exports = Game
