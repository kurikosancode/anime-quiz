
const getRandom = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default { getRandom };