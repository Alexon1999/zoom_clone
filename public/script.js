//+  path dans le quel le socket tourne
const socket = io('/'); // root path
// const myPeer = new Peer(undefined, { host: '/', port: '5001' });
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: PORT,
});

const videoGrid = document.getElementById('video-grid');
const form = document.querySelector('form');
const messages = document.querySelector('.messages');

const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myVideoStream = stream;
    // stream = audio + video
    addVideoStream(myVideo, stream);

    // + receive call
    myPeer.on('call', (call) => {
      call.answer(stream);

      const video = document.createElement('video');

      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    //+ when new user is on the same room
    socket.on('user-connected', (userId) => {
      connectToUser(userId, stream);
    });

    socket.on('user-disconnected', (userId) => {
      console.log(userId);
      if (peers[userId]) return peers[userId].close();
    });
  });

// + have an peer server id for me
myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
};

const connectToUser = (userId, stream) => {
  //+ send our stream
  const call = myPeer.call(userId, stream);

  const video = document.createElement('video');
  // put the other user stream in browser
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  // end the call
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
};

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = form.chat.value;
  socket.emit('message', message);
  form.chat.value = '';

  // ScrollBottom();
});

socket.on('createMessage', (message) => {
  const p = document.createElement('p');
  p.innerText = message;
  messages.append(p);
});

// play and stop our video
const stoplay__btn = document.querySelector('.stoplay');
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    stoplay__btn.innerText = 'Play';
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    stoplay__btn.innerText = 'Stop';
  }
};

// mute and unMute our video
const muteUnmute__btn = document.querySelector('.muteUnmute');
const muteUnmute = () => {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    muteUnmute__btn.innerText = 'Unmute';
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    muteUnmute__btn.innerText = 'Mute';
  }
};

function getMessages() {
  // Prior to getting your messages.
  // + clientHeight : la taille de div qui est (50vh)
  // + scrollTop : valeur ( position du scroll bar de top )
  // +  scrollHeight : la taill avec le scroll (il peut augmenter)
  shouldScroll =
    messages.scrollTop + messages.clientHeight === messages.scrollHeight;
  /*
   * Get your messages, we'll just simulate it by appending a new one syncronously.
   */
  // After getting your messages.
  if (!shouldScroll) {
    ScrollBottom();
  }
}
const ScrollBottom = () => {
  messages.scrollTop = messages.scrollHeight;
};

let id = setInterval(getMessages, 850);

// messages.addEventListener('scroll', (e) => {
//   messages.scrollTop = e.target.scrollTop = e.target.scrollHeight;
// });

// window.addEventListener('scroll', (e) => {
//   console.dir(window);
//   console.log(document.documentElement.scrollHeight);
//   console.log(document.documentElement.clientHeight);
// });
