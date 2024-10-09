import {FilesetResolver, HolisticLandmarker} from '@mediapipe/tasks-vision'


export class PoseExtractor extends EventTarget {
    constructor() {
        super()
        this.last_timestamp = -1
        this.extraction_interval = 1000
        this.video = null
        this.landmarker = null
        this.stopping = false
    }

    /**
     * Initialize the pose extractor.
     * This must always be called before using the pose extractor.
     * Warning, the initialization process takes time and can freeze the main thread.
     * #TODO: improve the pose extraction by using multi-threading. Need to fix task-vision in MediaPipe...
     */
    async initialize() {
        const vision = await FilesetResolver.forVisionTasks(
            // 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            '/task-vision/wasm'
        )
        this.landmarker = await HolisticLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task`,
                    modelAssetPath: '/task-vision/holistic_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                minPosePresenceConfidence: 0.2,
                minHandLandmarksConfidence: 0.2,
                minPoseSuppressionThreshold: 0.2,
            }
        )
    }

    /**
     * Function that extract a pose for a given frame at a given timestamp.
     * Warning, this should ALWAYS be called by the requestAnimationFrame function and never manually.
     * @param {number} timestamp - current timestamp for the current frame.
     */
    #extract_pose(timestamp) {
        if (!this.video) {
            throw Error('Invalid video stream in the pose extraction process.')
        }
        if (!this.landmarker) {
            throw Error('You need to initialize the pose extractor before using it.')
        }

        if (!this.stopping) {
            requestAnimationFrame(this.#extract_pose.bind(this))
        } else {
            this.stopping = false
        }

        if (timestamp - this.last_timestamp < this.extraction_interval) {
            return
        }
        this.last_timestamp = timestamp
        const result = this.landmarker.detectForVideo(this.video, timestamp)
        const event = new CustomEvent("extracted_pose", {detail: {result, timestamp}})
        this.dispatchEvent(event)
    }

    /**
     * @param {HTMLVideoElement} video - Input video stream.
     * @param {number} rate - Pose extraction rate (per second). Default is 10.
     */
    async run_pose_extraction_loop(video, rate=10) {
        this.video = video
        this.extraction_interval = 1000 / rate
        requestAnimationFrame(this.#extract_pose.bind(this))
    }

    stop() {
        this.stopping = true
    }
}
