"use client";

import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";

const GestureControl = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gesture, setGesture] = useState<string>("Waiting for gesture...");
  const [buttonColor, setButtonColor] = useState<string>("blue");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [model, setModel] = useState<any>(null);

  // Load the handpose model when the component mounts
  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      const handModel = await handpose.load();
      setModel(handModel);
      console.log("Handpose model loaded!");
    };
    loadModel();
  }, []);

  // Start the webcam and detect hand gestures
  useEffect(() => {
    if (model) {
      const startDetection = async () => {
        const video = videoRef.current;
        if (video) {
          // Get the user media (webcam)
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          // Assign the video stream to the video element
          video.srcObject = stream;

          // Wait for video to be playing before starting hand detection
          video.onloadedmetadata = () => {
            video.play();
            console.log("Video started playing");
          };

          // Ensure the video has valid dimensions
          video.onplaying = async () => {
            console.log("Video is playing and ready for hand detection!");
            const detectHands = async () => {
              const predictions = await model.estimateHands(video);
              if (predictions.length > 0) {
                const hand = predictions[0];
                console.log("Predictions:", predictions); // Debug log for predictions
                // Basic gesture detection based on hand movements
                if (hand.landmarks[8][0] < 100) {
                  setGesture("Swipe Left");
                  setButtonColor("red");
                } else if (hand.landmarks[8][0] > 200) {
                  setGesture("Swipe Right");
                  setButtonColor("green");
                } else if (hand.landmarks[8][1] < 100) {
                  setGesture("Raise Hand");
                  setButtonColor("yellow");
                }
              } else {
                setGesture("No hand detected");
                setButtonColor("blue");
              }
              requestAnimationFrame(detectHands);
            };

            detectHands();
          };
        }
      };

      startDetection();
    }
  }, [model]);

  return (
    <div>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ border: "1px solid black" }}
        autoPlay
      />
      <div>
        <h2>Gesture: {gesture}</h2>
        <button style={{ backgroundColor: buttonColor, padding: "20px" }}>
          Gesture-Controlled Button
        </button>
      </div>
    </div>
  );
};

export default GestureControl;
