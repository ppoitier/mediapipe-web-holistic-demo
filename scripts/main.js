import {PoseExtractor} from './pose_extractor.js'
import {wait_for_event} from './utils.js'
import {DrawingUtils, HolisticLandmarker} from '@mediapipe/tasks-vision'

/**
 * @param {HTMLVideoElement} video
 * @returns {Promise<MediaStream>}
 */
async function load_webcam(video) {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'user',
            frameRate: 30,
        }
    })
    video.srcObject = stream
    await wait_for_event(video, 'loadedmetadata', 20000)
    console.log('Webcam loaded.')
    return stream
}

function prepare_canvas(video) {
    const overlay = document.querySelector('.webcam-overlay')
    const canvas = document.createElement('canvas')
    overlay.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    canvas.style.max_width = '100%'
    canvas.style.height = '100%'
    canvas.style.aspectRatio = (video.videoWidth / video.videoHeight).toString()
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    return ctx
}

function draw_pose(ctx, drawing_utils, result) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    draw_body(drawing_utils, result.poseLandmarks)
    draw_hand(drawing_utils, result.rightHandLandmarks)
    draw_hand(drawing_utils, result.leftHandLandmarks)
    draw_face(drawing_utils, result.faceLandmarks)
}

function draw_hand(drawing_utils, all_landmarks) {
    for (const landmarks of all_landmarks) {
        drawing_utils.drawLandmarks(landmarks, {color: '#FF0000', lineWidth: 2})
        drawing_utils.drawConnectors(landmarks, HolisticLandmarker.HAND_CONNECTIONS,
            {color: '#FF0000', lineWidth: 3})
    }
}

function draw_body(drawing_utils, all_landmarks) {
    for (const landmarks of all_landmarks) {
        drawing_utils.drawLandmarks(landmarks, {color: '#FF0000', lineWidth: 2})
        drawing_utils.drawConnectors(landmarks, HolisticLandmarker.POSE_CONNECTIONS,
            {color: '#FFFFFF', lineWidth: 3})
    }
}

function draw_face(drawing_utils, all_landmarks) {
    for (const landmarks of all_landmarks) {
        drawing_utils.drawConnectors(landmarks, HolisticLandmarker.FACE_LANDMARKS_CONTOURS, {
            color: '#00FF00',
            lineWidth: 2,
        })
    }
}

async function main() {
    const video = document.querySelector('video.webcam')
    if (!video) {
        console.error('Could not find webcam video element.')
        return
    }
    await load_webcam(video)

    const ctx = prepare_canvas(video)
    const drawing_utils = new DrawingUtils(ctx)

    const extractor = new PoseExtractor()
    await extractor.initialize()
    await extractor.run_pose_extraction_loop(video, 24)
    extractor.addEventListener('extracted_pose', (event) => {
        draw_pose(ctx, drawing_utils, event.detail.result)
    })
}

main().then()
