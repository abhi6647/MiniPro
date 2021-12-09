const imageUpload = document.getElementById("imageUpload");

Promise.all([faceapi.nets.faceRecognitionNet.loadFromUri("/models"), faceapi.nets.faceLandmark68Net.loadFromUri("/models"), faceapi.nets.ssdMobilenetv1.loadFromUri("/models")]).then(start);

async function start() {
  const container = document.createElement("div");
  container.style.position = "relative";
  document.body.append(container);
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  let image;
  let canvas;
  document.body.append("Loaded");
  imageUpload.addEventListener("change", async () => {
    if (image) image.remove();
    if (canvas) canvas.remove();
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      console.log(result.toString());
      sendSMS("9100206547", "Child" + result.toString() + " is present.");
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    });
  });
}

function loadLabeledImages() {
  const labels = ["19-5B1", "19-5B0", "19-5A8"];
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 4; i++) {
        const imgUrl = `https://raw.githubusercontent.com/abhi6647/MiniPro/main/labeled_images/${label}/${i}.jpg`;
        const img = await faceapi.fetchImage(imgUrl);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

function sendSMS(phone, message) {
  user = {
    phone,
    message
  };
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(user)
  };
  let fetchRes = fetch("https://ElementaryLimegreenPublishers.abhi6647.repl.co/sms", options);
  fetchRes
    .then(res => res.json())
    .then(d => {
      console.log(d);
    });
}
