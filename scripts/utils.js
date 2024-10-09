
/** Asynchronous function that waits for a specific event on a specific target.
 * If a timeout is specified, the function will throw an error if the waited event does not occur before it.
 * @param {EventTarget} target - The specific target.
 * @param {string} event_type - The specific event.
 * @param {number|null} timeout - The optional timeout (in ms) before throwing an error.
 */
export function wait_for_event(target, event_type, timeout=null) {
    return new Promise((resolve, reject) => {
        let timer = null
        const callback = (event) => {
            if (timer) {
                clearTimeout(timer)
            }
            resolve(event)
        }
        if (timeout) {
            timer = setTimeout(() => {
                target.removeEventListener(event_type, callback)
                reject('Timeout reached before waited event.')
            }, timeout)
        }
        target.addEventListener(event_type, callback)
    })
}