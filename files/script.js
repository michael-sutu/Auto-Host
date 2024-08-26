function renderAuth() {
    if (localStorage.getItem("private")) {
        window.location = "./dashboard";
    } else {
        document.querySelector(".view").style.display = "block";
    }
}

function deleteProperty(property) {
    let toDelete = property.querySelectorAll("p")[1].textContent;
    const data = {
        private: localStorage.getItem("private"),
        address: toDelete
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    };

    fetch("./deleteproperty", requestOptions)
        .then(response => response.json())
        .then(data => {
            location.reload();
        });
}

if (window.location.pathname == "/") {
    renderAuth();
} else if (window.location.pathname == "/login") {
    renderAuth();

    document.getElementById("loginBtn").addEventListener("click", (e) => {
        const data = {
            email: document.getElementById("emailInput").value,
            password: document.getElementById("passwordInput").value
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        fetch("./login", requestOptions)
            .then(response => response.json())
            .then(data => {
                if (data != 401) {
                    localStorage.setItem("private", data);
                    window.location = "./dashboard";
                } else {
                    alert("Invalid login.");
                }
            });
    });
} else if (window.location.pathname == "/signup") {
    renderAuth();

    document.getElementById("signUpBtn").addEventListener("click", (e) => {
        const data = {
            email: document.getElementById("emailInput").value,
            password: document.getElementById("passwordInput").value,
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        fetch("./signup", requestOptions)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem("private", data.result);
                window.location = "./dashboard";
            });
    });
} else if (window.location.pathname == "/dashboard") {
    let current = {};
    console.log(localStorage.getItem("private"));
    fetch("./get", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                private: localStorage.getItem("private")
            })
        })
        .then(response => response.json())
        .then(data => {
            for (let i = 0; i < data.properties.length; i++) {
                if (document.querySelector(".list > p")) {
                    document.querySelector(".list > p").remove();
                }

                let newDiv = document.createElement("div");
                newDiv.className = "propertyDiv";

                if(i < data.properties.length - 1) {
                    newDiv.style.borderBottom = "1px solid #ddd" 
                }

                let name = document.createElement("p");
                name.textContent = data.properties[i].name;
                name.style.flex = "1"; 

                let address = document.createElement("p");
                address.textContent = data.properties[i].address;
                address.style.textAlign = "center";
                address.style.flex = "1"; 

                let iconContainer = document.createElement("div");
                iconContainer.style.flex = "1";
                iconContainer.style.textAlign = "right";

                const parsedUrl = new URL(window.location);
                iconContainer.innerHTML = `
                    <i class="fa-solid fa-eye" onclick="window.open('${parsedUrl.protocol}//${parsedUrl.host}/chat/${data.properties[i].id}')"></i>
                    <i class="fa-solid fa-copy" id="${data.properties[i].id}" 
                        onclick="navigator.clipboard.writeText('${parsedUrl.protocol}//${parsedUrl.host}/chat/${data.properties[i].id}')"></i>
                    <i class="fa-solid fa-trash" onclick='deleteProperty(this.parentElement.parentElement)'></i>
                `;

                newDiv.appendChild(name);
                newDiv.appendChild(address);
                newDiv.appendChild(iconContainer);
                document.querySelector(".list").appendChild(newDiv);

                let newOption = document.createElement("option");
                newOption.textContent = data.properties[i].name;
                document.querySelector("select").appendChild(newOption);
            }

            document.querySelector(".loading").style.display = "none";
        });

    if (localStorage.getItem("private") == null) {
        window.location = "./";
    } else {
        document.querySelector(".view").style.display = "block";
    }

    document.getElementById("pdfBtn").addEventListener("click", (e) => {
        document.getElementById("fileInput").click();
    });

    let uploaded = 0;
    let fileInput = document.getElementById("fileInput");
    let uploads = [];
    fileInput.addEventListener('change', () => {
        const selectedFile = fileInput.files[0];
        if (selectedFile) {
            const fileName = selectedFile.name;
            const fileReader = new FileReader();

            fileReader.onload = async function () {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                const numPages = pdf.numPages;
                let fullText = '';

                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }

                uploads.push(fullText);
                uploaded += 1;
                let newId = Math.floor(Math.random() * 1000);
                document.querySelector(".externalList").innerHTML += `<a id="${newId}">${fileName} X</a>`;
                document.querySelector(".externalList").style.display = "block"
                for (let i = 0; i < document.querySelector(".externalList").children.length; i++) {
                    document.querySelector(".externalList").children[i].addEventListener("click", (e) => {
                        e.target.remove();
                        if(document.querySelector(".externalList").children.length == 0) {
                            document.querySelector(".externalList").style.display = "none"
                        }
                    });
                }
            };

            fileReader.readAsArrayBuffer(selectedFile);
        }
    });

    document.getElementById("shadowBtn").addEventListener("click", (e) => {
        current.shadow = !current.shadow;
        if (e.target.style.backgroundColor == "red") {
            e.target.style.backgroundColor = "green";
        } else {
            e.target.style.backgroundColor = "red";
        }
        saveConversation();
    });

    document.querySelector("select").addEventListener("change", (e) => {
        if (e.target.value == "Unselected") {
            current.property = "";
        } else {
            current.property = e.target.value;
        }
        saveConversation();
    });

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        localStorage.removeItem("private");
        window.location = "./";
    });

    document.querySelector(".propertyBtn").addEventListener("click", (e) => {
        document.querySelector(".chatDiv").style.display = "none";
        document.querySelector(".propertiesDiv").style.display = "block";
        document.querySelector(".newProperty").style.display = "none";
    });

    document.getElementById("createBtn").addEventListener("click", (e) => {
        document.querySelector(".chatDiv").style.display = "none";
        document.querySelector(".propertiesDiv").style.display = "none";
        document.querySelector(".newProperty").style.display = "block";
    });

    document.getElementById("cancelBtn").addEventListener("click", (e) => {
        document.querySelector(".chatDiv").style.display = "none";
        document.querySelector(".propertiesDiv").style.display = "block";
        document.querySelector(".newProperty").style.display = "none";
    });

    document.getElementById("saveBtn").addEventListener("click", (e) => {
        let newInformation = "Hello, you are HospitalityAI. Your job is to assist land lords by answering questions that are sent to them by their tenants. Below will be information about the property that the tenant is staying at. If you are unable to confidentaly answer a question make sure to say so.";
        newInformation += document.getElementById("informationInput").value;
        for (let i = 0; i < uploads.length; i++) {
            newInformation += uploads[i];
        }
        const data = {
            name: document.getElementById("nameInput").value,
            address: document.getElementById("addressInput").value,
            information: newInformation,
            private: localStorage.getItem("private")
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        fetch("./save", requestOptions)
            .then(response => response.json())
            .then(data => {
                location.reload();
            });
    });
}
