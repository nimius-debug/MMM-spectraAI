
const NodeHelper = require("node_helper");
const { Configuration, OpenAIApi } = require("openai");
const WebSocket = require('ws');


module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.configuration = new Configuration({
            apiKey: "",
        });
        this.openai = new OpenAIApi(this.configuration);
        this.DG_ENDPOINT = 'wss://api.deepgram.com/v1/listen'
        //console.log(this.openai);
    },

    // Send a message to the chatGPT API and receive a response
    getResponse: function(prompt) {
        console.log("start function getREsponse call to chatGPT ");
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: prompt,
                    max_tokens: 256,
                    temperature: 0.7,
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

    //
    DG_Speech2Text: function() {
        console.log("Starting listening");
        global.navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            if (!MediaRecorder.isTypeSupported('audio/webm')) return alert('Browser not supported')
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    
            const socket = new WebSocket(this.DG_ENDPOINT, ['token', '0dbcf3bc16ffcbe6d8ed12354673eb5d2bef5a59']);
    
            socket.onopen = () => {
              mediaRecorder.addEventListener('dataavailable', async (event) => {
                if (event.data.size > 0 && socket.readyState == 1) {
                  socket.send(event.data);
                } 
              })
              mediaRecorder.start(250);
            }
    
            socket.onmessage = (message) => {
              const data = JSON.parse(message.data);
              console.log(data);
    
              const { channel, is_final } = data;
              const transcript = channel.alternatives[0].transcript;
    
              if (transcript && is_final) {
                // document.querySelector('p').textContent += ' ' + transcript
                console.log(transcript);
              }
            }
          })
        
        
    },


  // Handle socket notifications
  socketNotificationReceived: function(notification, payload) {
    if (notification === "OPENAI_REQUEST") {
      const prompt = payload.prompt;
     
      this.getResponse(prompt)
      .then(function(response) {
        const message = response.data.choices[0].text;
        this.sendSocketNotification("OPENAI_RESPONSE", { message: message });
      }.bind(this)).catch(function(error) {
        console.error(error);
      });

    } else if(notification === "SPEECH_TEXT") {
        console.log("calling speech to text")
        const url = 'wss://api.deepgram.com/v1/listen';
        const token = '';
        const socket = new WebSocket(url, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
        socket.onopen = () => {
            console.log('WebSocket connection established.');
            this.MediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0 && socket.readyState == 1) {
                  socket.send(event.data);
                }
              })
          }
          
          socket.onmessage = (message) => {
            console.log({ event: 'onmessage', message });
          }
          
          socket.onclose = () => {
            console.log({ event: 'onclose' });
          }
          
          socket.onerror = (error) => {
            console.log({ event: 'onerror', error });
          }
        //this.DG_Speech2Text();
    }

  },
});