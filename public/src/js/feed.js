var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
const feedForm = document
  .querySelector("#create-post")
  .getElementsByTagName("form")[0];
const titleInput = document.querySelector("#title");
const locationInput = document.querySelector("#location");
const videoPlayer = document.querySelector('#player');
const captureButton = document.querySelector('#capture-btn');
const canvasElement = document.querySelector('#canvas');
const imagePicker = document.querySelector('#image-picker');
const imagePickArea = document.querySelector('#pick-image');
let picture;

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia tidak didukung di browser ini'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = 'block';

  }).catch((error) => {
    console.error('Error accessing camera:', error);

    imagePicker.style.display = 'block';
  }) 
}

captureButton.addEventListener('click', function (event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  const context = canvasElement.getContext('2d');

  context.drawImage(videoPlayer, 0, 0, canvasElement.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width))

  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop();
  })

  picture = dataURItoBlob(canvas.toDataURL());
})


function openCreatePostModal() {
  createPostArea.style.display = "block";
  initializeMedia();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
  videoPlayer.style.display = "none";
  imagePickArea.style.display = "none";
  canvasElement.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then(function (cache) {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url =
  "https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json";
var networkDataReceived = false;

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log("From web", data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  getAllData("posts").then((data) => {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

function sendData() {
  fetch(
    "https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json",
    {
      method: "POST",
      body: JSON.stringify({
        id: new Date(),
        title: titleInput.value,
        location: locationInput.value,
        image:
          "https://firebasestorage.googleapis.com/v0/b/pwa-learn-69738.firebasestorage.app/o/sf-boat.jpg?alt=media&token=2104cd34-857b-494e-9297-c61bf20725ff",
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  ).then(function (res) {
    console.log("Sent data", res);
    updateUI();
  });
}

feedForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Harap isi semua kolom");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    console.log('Sync Manager Supported')
    navigator.serviceWorker.ready.then((sw) => {
      const newData = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image: picture,
      };

      writeData("sync-posts", newData)
        .then(() => {
          return sw.sync.register("sync-new-posts");
        })
        .then(() => {
          const snackbarContainer = document.querySelector(
            "#confirmation-toast"
          );
          const data = { message: "Unggahan kamu berhasil di selaraskan" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log("BG Sync Error", err);
        });
    });
  } else {
    console.log("Service Worker not supported")
    sendData();
  }
});