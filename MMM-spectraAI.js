const test_prompt = "tell me a good coder/programmer joke ";
Module.register("spectraAI", {
	defaults: {
		OPENAI_API_KEY: "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",
		DEEPGRAM_API_KEY: "0f2fda6a67bf83de50485a9d51db22bdd94a38b9",
		DG_ENDPOINT: "wss://api.deepgram.com/v1/listen",
		//apiEndpoint: "https://api.openai.com/v1",
		prompt: test_prompt,
		updateInterval: 60 * 60 * 1000 // update every hour
	},

	start: function () {
		console.log("Starting module: " + this.name);
		this.loaded = false;
		this.message = "";
		console.log("work please");
		this.sendSocketNotification("OPENAI_REQUEST", this.config);
// needs to be fired on a fixed timer
    setTimeout(() => {
      navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				if (stream) {
					const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
					mediaRecorder.start(5000);
					console.log("Test 1:", mediaRecorder);
					mediaRecorder.ondataavailable = (event) => {
						// Handle the recorded audio data
						const audioData = event?.data;
						console.log("Recorded audio data:", audioData);
						this.sendSocketNotification("TRANSCRIBE", audioData);
					};
				}
			})
			.catch((error) => {
				alert(`Error: ${error}. Please activate your microphone and refresh the page.`);
			});
    }, 5000);		

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
		human_question.innerHTML = test_prompt;
		chatGPT_answer.innerHTML = this.message;
		wrapper.appendChild(human_question);
		wrapper.appendChild(chatGPT_answer);
		return wrapper;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "OPENAI_RESPONSE") {
			this.message = payload.message;
			this.loaded = true;
			this.updateDom();
			setTimeout(() => {
				this.sendSocketNotification("OPENAI_REQUEST", this.config);
			}, 1000);
		}
	}
});
