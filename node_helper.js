const NodeHelper = require("node_helper");
const { Configuration, OpenAIApi } = require("openai");
const { Deepgram } = require("@deepgram/sdk");
const WebSocket = require("ws");

// const fetch = require("cross-fetch");
// const model = 'general';
// const lang = 'en-US';

// const DG_ENDPOINT = "wss://api.deepgram.com/v1/listen";
const deepgramApiKey = "0f2fda6a67bf83de50485a9d51db22bdd94a38b9";
// const deepgram = new Deepgram(deepgramApiKey);
// const deepgramLive = deepgram.transcription.live({
// 	punctuate: false,
// 	interim_results: false,
// 	language: "en-GB"
// });

module.exports = NodeHelper.create({
	start: function () {
		console.log("Starting node helper for: " + this.name);
		this.configuration = new Configuration({
			apiKey: "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"
		});
		this.openai = new OpenAIApi(this.configuration);
		//console.log(this.openai);
		console.log("Starting transcription...");
		// when the connection is established, send the configuration message
	},

	// Send a message to the chatGPT API and receive a response
	getResponse: function (prompt) {
		console.log("start function getREsponse call to chatGPT ");
		return new Promise(async (resolve, reject) => {
			try {
				const response = await this.openai.createCompletion({
					model: "text-davinci-003",
					prompt: prompt,
					max_tokens: 256,
					temperature: 0.7
				});
				// console.log("Received response from API: ", response);
				console.log("Received response from API: ");
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
				const prompt = payload.prompt;
				this.getResponse(prompt)
					.then(
						function (response) {
							const message = response.data.choices[0].text;
							this.sendSocketNotification("OPENAI_RESPONSE", { message: message });
						}.bind(this)
					)
					.catch(function (error) {
						console.error(error);
					});
				return;

			case "TRANSCRIBE":
        var socket = null;
				console.log("Audio", payload);
				// Connect to the streaming endpoint.
				var establishConnection = function () {
					console.log("Establishing connection.");
					// Configure the websocket connection.
					// This requires ws installed using 'npm i ws'.
					socket = new WebSocket("wss://api.deepgram.com/v1/listen", {
						// Replace with your Deepgram project's API Key.
						headers: {
							Authorization: `Token ${deepgramApiKey}`
						}
					});
					socket.onopen = (m) => {
						console.log("Socket opened!");

						// Grab an audio file.
						var contents = payload;

						// Send the audio to the Deepgram API all at once (works if audio is relatively short).
						// socket.send(contents);

						// Send the audio to the Deepgram API in chunks of 1000 bytes.
						chunk_size = 1000;
						for (i = 0; i < contents.length; i += chunk_size) {
							slice = contents.slice(i, i + chunk_size);
							socket.send(slice);
						}

						// // Send the message to close the connection.
						// socket.send(
						// 	JSON.stringify({
						// 		type: "CloseStream"
						// 	})
						// );
					};
					// socket.onclose = (m) => {
					// 	console.log("Socket closed.");
					// };

					socket.onmessage = (m) => {
						m = JSON.parse(m.data);
						// Log the received message.
						console.log(m);

						// Log just the words from the received message.
						if (m.hasOwnProperty("channel")) {
							let words = m.channel.alternatives[0].words;
							console.log(words);
						}
					};
				};

				establishConnection();
				return;

			default:
				return;
		}
	}
});
