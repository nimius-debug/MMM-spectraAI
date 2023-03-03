const NodeHelper = require("node_helper");
const { Configuration, OpenAIApi } = require("openai");
const { Deepgram } = require("@deepgram/sdk");
const WebSocket = require("ws");

// const fetch = require("cross-fetch");
// const model = 'general';
// const lang = 'en-US';

// const DG_ENDPOINT = "wss://api.deepgram.com/v1/listen";
const deepgramApiKey = "";
// const deepgram = new Deepgram(deepgramApiKey);
// const deepgramLive = deepgram.transcription.live({
// 	punctuate: false,
// 	interim_results: false,
// 	language: "en-GB"
// });
let stt = "";

module.exports = NodeHelper.create({
	start: function () {
		console.log("Starting node helper for: " + this.name);
		this.configuration = new Configuration({
			apiKey: ""
		});
		this.openai = new OpenAIApi(this.configuration);
		//console.log(this.openai);
		// console.log("Starting transcription...");
		// when the connection is established, send the configuration message
	},

	// Send a message to the chatGPT API and receive a response
	getResponse: function (prompt) {
		console.log("start function getREsponse call to chatGPT ",prompt);
		return new Promise(async (resolve, reject) => {
			try {
				const response = await this.openai.createCompletion({
					model: "text-davinci-003",
					prompt: prompt,
					max_tokens: 256,
					temperature: 0.1
				});
				// console.log("Received response from API: ", response);
				console.log("Received response from API: ",);
				resolve(response);
			} catch (error) {
				console.log("Error in getResponse: ", error);
				reject(error);
			}
		});
	},

	// Handle socket notifications
	socketNotificationReceived: function (notification, payload) {
		switch (notification) {
			case "OPENAI_REQUEST":
				console.log(payload)
				const prompt = payload;
				this.getResponse(prompt)
					.then(
						function (response) {
							const message = response.data.choices[0].text;
							console.log(message)
							this.sendSocketNotification("OPENAI_RESPONSE", { message: message });
						}.bind(this)
					)
					.catch(function (error) {
						console.error(error);
					});
				return;

			case "TRANSCRIBE":
				// var socket = null;
				console.log("Audio", payload.audio_data);
				console.log("Media", payload.mediaR)	
				console.log("Establishing connection.");
				// Configure the websocket connection.
				// This requires ws installed using 'npm i ws'.
				socket = new WebSocket("wss://api.deepgram.com/v1/listen", {
					// Replace with your Deepgram project's API Key.
					headers: {
						Authorization: `Token ${deepgramApiKey}`
					}
				});

				//socket open
				socket.onopen = () => {
					console.log("Socket opened!");

					// Grab an audio file.
					var audio = payload.audio_data;
					console.log(socket.readyState);
					// Send the audio to the Deepgram API all at once (works if audio is relatively short).
					// socket.send(contents);
					if (socket.readyState == 1) {
						console.log("sending Audio Blob to DG");
						socket.send(audio);
					}
				};

				socket.onmessage = (m) => {
					//console.log({ event: 'onmessage', m });

					const received = JSON.parse(m.data);
					// Log the received message.
					//console.log(m);
					if (received.hasOwnProperty("channel") && received.is_final) {
						const transcript = received.channel?.alternatives[0]?.transcript;
						console.log(transcript);
						stt += " " + transcript
						// transcript.forEach((t, index) => {
						// 	index !== 0 ? (stt += t.word) : (t += " " + transcript.word);
						//   });
						// console.log(stt)

						
						
					}
					
				};
				// if (typeof stt !== "undefined" && stt.length > 0) {
				// 	this.sendSocketNotification("OPENAI_REQUEST", {
				// 	  prompt: stt
				// 	});
				// }
					
				socket.onclose = (event) => {
					
					console.log({ event: "onclose", code: event.code });
				};

				socket.onerror = (error) => {
					console.log({ event: "onerror", error });
				};
				socket.on("upgrade", function message(data) {
					console.log(data.headers["dg-request-id"]);
				});

				if (typeof stt !== "undefined" && stt.length > 0){
					this.sendSocketNotification("TEXT_RESPONSE", { transcript: stt });
				}
				return;

			default:
				return;
		}
	}
});
