let path = window.location.href.split("/")[4]
let information = null

fetch("http://localhost:5000/getproperty?id="+path)
    .then(response => response.json())
    .then(data => {
        if(data == null) {
            window.location.href = "/"
        } else {
            document.querySelector("a").textContent = data.result.address
            information = data.result.information
        }
        document.querySelector(".loading").style.display = "none"
    })

document.querySelector(".sendBtn").addEventListener("click", (e) => {
    let message = document.querySelector(".messageInput").value
    if(message != "") {
        let newMessage = document.createElement("div")
        newMessage.className = "message"
        let newH3 = document.createElement("h3")
        newH3.textContent = message
        newMessage.appendChild(newH3)
        document.querySelector(".messageDiv").appendChild(newMessage)
        document.querySelector(".messageInput").value = ""
        document.querySelector(".messageInput").disabled = "true"
        document.querySelector(".messageInput").placeholder = "Response is loading..."

        let request = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                information: information,
                message: message
            })
        }

        fetch("http://localhost:5000/respond", request)
            .then(response => response.json())
            .then(data => {
                let newMessage = document.createElement("div")
                newMessage.className = "message"
                let newH2 = document.createElement("h2")
                newH2.textContent = data
                newMessage.appendChild(newH2)
                document.querySelector(".messageDiv").appendChild(newMessage)
                document.querySelector(".messageInput").disabled = false
                document.querySelector(".messageInput").placeholder = "Type your message here..."
            })
    }
})