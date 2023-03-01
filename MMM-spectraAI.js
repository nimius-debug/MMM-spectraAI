
const test_prompt = "give a list of workouts "
Module.register("MMM-spectraAI",{
  
    defaults: {
        OPENAI_API_KEY: "",
        DEEPGRAM_API_KEY: "",
        DG_ENDPOINT: 'wss://api.deepgram.com/v1/listen',
        //apiEndpoint: "https://api.openai.com/v1",
        prompt: test_prompt,
        updateInterval: 60 * 60 * 1000, // update every hour
  },

  start: function() {
        console.log("Starting module: " + this.name);
        this.loaded = false;
        this.message = "";
        console.log("work coNaso")
        this.sendSocketNotification("OPENAI_REQUEST", this.config);
    //   this.sendSocketNotification("SPEECH_TEXT", this.config);
        // Request permission to access the user's microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            console.log({ stream })
          // Create a new MediaRecorder object to capture audio
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            // Start recording when the MediaRecorder is ready
            mediaRecorder.ondataavailable = (event) => {
                // Handle the recorded audio data
                
                const audioData = event.data
                console.log('Recorded audio data:', audioData)
          }
          mediaRecorder.start(10000)
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error)
        })
    
    
    },
  
    getDom: function() {
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
  
    socketNotificationReceived: function(notification, payload) {
      if (notification === "OPENAI_RESPONSE") {
        this.message = payload.message;
        this.loaded = true;
        this.updateDom();
        setTimeout(() => {
          this.sendSocketNotification("OPENAI_REQUEST", this.config);
        }, this.config.updateInterval);
      }
    }
  });