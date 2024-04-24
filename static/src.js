/*
  Post-process with https://babeljs.io/repl and https://javascript-minifier.com/
*/

var canvas = document.getElementById("canvas");
const hasCanvas = canvas != null;

var socket = null;
const socketConnect = () => {
  socket = io();
  socket.on("air", (data) => {
    updateAir(data);
  });
  if (hasCanvas) {
    socket.on("led", (data) => {
      updateLed(data);
    });
  }
};

const updateAir = (data) => {
  const buf = new Uint8Array(data);
  for (var i = 0; i < 6; i++) {
    if (buf[i]) {
      document.getElementById("air" + i).setAttribute("data-active", "");
    } else {
      document.getElementById("air" + i).removeAttribute("data-active");
    }
  }
}

let updateLed;
if (hasCanvas) {
  var canvasCtx = canvas.getContext("2d");
  var canvasData = canvasCtx.getImageData(0, 0, 33, 1);
  const setupLed = () => {
    for (var i = 0; i < 33; i++) {
      canvasData.data[i * 4 + 3] = 255;
    }
  };
  setupLed();
  updateLed = (data) => {
    const buf = new Uint8Array(data);
    for (var i = 0; i < 32; i++) {
      canvasData.data[i * 4] = buf[(31 - i) * 3 + 1]; // r
      canvasData.data[i * 4 + 1] = buf[(31 - i) * 3 + 2]; // g
      canvasData.data[i * 4 + 2] = buf[(31 - i) * 3 + 0]; // b
    }
    // Copy from first led
    canvasData.data[128] = buf[94];
    canvasData.data[129] = buf[95];
    canvasData.data[130] = buf[93];
    canvasCtx.putImageData(canvasData, 0, 0);
  };
}

const readConfig = (config) => {
  var style = "";

  var bgColor = config.background_color || "rbga(0, 0, 0, 0.9)";
  if (!config.background_image) {
    style += `body {background: ${bgColor};} `;
  } else {
    style += `body {background: ${bgColor} url("${config.bgImage}") fixed center / cover!important; background-repeat: no-repeat;} `;
  }

  if (typeof config.led_opacity === "number") {
    if (config.led_opacity === 0) {
      style += `#canvas {display: none} `;
    } else {
      style += `#canvas {opacity: ${config.ledOpacity}} `;
    }
  }

  if (typeof config.key_border_color === "string") {
    style += `.key {border: 1px solid ${config.keyBorderColor};} `;
  }

  if (typeof config.air_key_active_color === "string") {
    style +=  `.key.air[data-active] {background-color: ${config.air_key_active_color};} `;
  }

  var styleRef = document.createElement("style");
  styleRef.innerHTML = style;
  document.head.appendChild(styleRef);
};

const requestConfig = () => {
  fetch("/config")
    .then((response) => response.json())
    .then((data) => readConfig(data));
}

// Initialize
const initialize = () => {
  requestConfig();
  socketConnect();
};
initialize();
