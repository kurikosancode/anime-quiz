const home = "/home";
const about = "/about";
const play = "/play";
const playResults = "/play/results";
const lobby = "/lobby";
const userSearch = "/users";
const login = "/login";
const register = "/register";
const profile = "/profile";
const profileUser = (uid: string) => `/profile/${uid}`;
const leaderboard = "/leaderboard";
const settings = "/settings";

export default { home, about, play, playResults, lobby, userSearch, login, register, profile, profileUser, leaderboard, settings };