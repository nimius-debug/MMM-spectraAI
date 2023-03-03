const test_prompt = "tell me a good coder/programmer joke ";
let stt = "";
Module.register("spectraAI", {
	defaults: {
		OPENAI_API_KEY: "",
		DEEPGRAM_API_KEY: "",
		DG_ENDPOINT: "wss://api.deepgram.com/v1/listen",
		//apiEndpoint: "https://api.openai.com/v1",
		
		updateInterval: 60 * 60 * 1000 // update every hour
	},

	start: function () {
		console.log("Starting module: " + this.name);
		this.loaded = false;
		this.message = "";
		this.mediaRecorder = null;
		this.audioData = "";
		this.prompt= "",
		// send the config to the node_helper
		

		//start listing for media device like mic or cam
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				if (stream) {
					this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
					
					console.log("MediaRecorder Test 1:", this.mediaRecorder);
					this.mediaRecorder.ondataavailable = (event) => {
						// Handle the recorded audio data
						this.audioData = event?.data;
						
						//console.log("Recorded audio data:", this.audioData);
						this.sendSocketNotification("TRANSCRIBE", { audio_data: this.audioData, mediaR: this.mediaRecorder });
					};
					
					
				}this.mediaRecorder.start(5000);
				
			})
			.catch((error) => {
				alert(`Error: ${error}. Please activate your microphone and refresh the page.`);
			});
	},

	getDom: function () {
		let wrapper = document.createElement("div");
		let human_question = document.createElement("h2");
		let chatGPT_answer = document.createElement("h2");

		if (!this.loaded) {
			chatGPT_answer.innerHTML = "Loading...";
			wrapper.appendChild(human_question);
			wrapper.appendChild(chatGPT_answer);
			return wrapper;
		}
		human_question.innerHTML = this.prompt;
		chatGPT_answer.innerHTML = this.message;
		wrapper.appendChild(human_question);
		wrapper.appendChild(chatGPT_answer);
		return wrapper;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "TEXT_RESPONSE") {
			console.log("stop")
			// this.MediaRecorder.stop()
			this.prompt = payload.transcript;
			console.log(this.prompt)
			this.sendSocketNotification("OPENAI_REQUEST", this.prompt);
			this.updateDom();
		}
		
		if (notification === "OPENAI_RESPONSE") {
			this.message = payload.message;
			this.updateDom();
			
			// setTimeout(() => {
			// 	this.sendSocketNotification("OPENAI_REQUEST", this.config);
			// }, this.config.updateInterval);
		}
		
		
		this.loaded = true;
		
	}
});
