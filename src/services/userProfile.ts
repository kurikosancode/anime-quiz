import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit as limitQuery } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/firebaseClient";

export type UserProfileGame = {
    id: string;
    animeTitle: string;
    score: number;
    timestamp: number;
    totalRounds?: number;
    rounds?: UserProfileGame[];
};

export type UserProfileDocument = {
    uid: string;
    username: string;
    usernameLower: string;
    email: string;
    provider: "password" | "google";
    createdAt: number;
    totalQuizzesPlayed: number;
    totalQuestionsAttempted: number;
    totalCorrectAnswers: number;
    currentStreak: number;
    bestStreak: number;
    lastPlayedAt: number | null;
    recentGames: UserProfileGame[];
    favoriteAnime: string[];
    activityDays: string[];
    dailyActivityCounts: Record<string, number>;
};

export type UserProfileView = UserProfileDocument & {
    averageScore: number;
};

type SeedProfileInput = {
    uid: string;
    username: string;
    email: string;
    provider: "password" | "google";
};

type RecordQuizRoundInput = {
    uid: string;
    username: string;
    email: string;
    provider?: "password" | "google";
    animeTitle: string;
    score: number;
    timestamp?: number;
};

function toDayKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function dayKeyToTimestamp(dayKey: string): number {
    const [year, month, day] = dayKey.split("-").map((value) => Number(value));
    return new Date(year, (month || 1) - 1, day || 1).getTime();
}

function normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
}

async function readProfileSnapshot(uid: string) {
    if (!isFirebaseConfigured || !db) return null;

    try {
        const ref = doc(db, "users", uid);
        return await getDoc(ref);
    } catch {
        return null;
    }
}

function uniqueDays(activityDays: string[]): string[] {
    return [...new Set(activityDays)].sort();
}

function calculateStreaks(activityDays: string[]): { currentStreak: number; bestStreak: number } {
    const days = uniqueDays(activityDays);
    if (days.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    const dayNumbers = days.map((dayKey) => dayKeyToTimestamp(dayKey)).sort((a, b) => a - b);
    const oneDay = 24 * 60 * 60 * 1000;

    let bestStreak = 1;
    let runLength = 1;

    for (let index = 1; index < dayNumbers.length; index += 1) {
        if (dayNumbers[index] - dayNumbers[index - 1] === oneDay) {
            runLength += 1;
        } else {
            bestStreak = Math.max(bestStreak, runLength);
            runLength = 1;
        }
    }

    bestStreak = Math.max(bestStreak, runLength);

    let currentStreak = 1;
    for (let index = dayNumbers.length - 1; index > 0; index -= 1) {
        if (dayNumbers[index] - dayNumbers[index - 1] === oneDay) {
            currentStreak += 1;
        } else {
            break;
        }
    }

    return { currentStreak, bestStreak };
}

function buildFavoriteAnime(recentGames: UserProfileGame[]): string[] {
    const frequency = new Map<string, number>();
    const firstSeenOrder = new Map<string, number>();

    recentGames.forEach((game, index) => {
        frequency.set(game.animeTitle, (frequency.get(game.animeTitle) ?? 0) + 1);
        if (!firstSeenOrder.has(game.animeTitle)) {
            firstSeenOrder.set(game.animeTitle, index);
        }
    });

    return [...frequency.entries()]
        .sort((first, second) => {
            if (second[1] !== first[1]) return second[1] - first[1];
            return (firstSeenOrder.get(first[0]) ?? 0) - (firstSeenOrder.get(second[0]) ?? 0);
        })
        .map(([animeTitle]) => animeTitle)
        .slice(0, 10);
}

function normalizeProfileDocument(data: Partial<UserProfileDocument>, fallback: SeedProfileInput): UserProfileDocument {
    const recentGames = Array.isArray(data.recentGames) ? data.recentGames : [];
    const activityDays = Array.isArray(data.activityDays) ? data.activityDays : [];
    const inferredTotalGames = recentGames.length;
    const inferredTotalQuestions = recentGames.reduce((sum, game) => {
        if (typeof game.totalRounds === "number") return sum + game.totalRounds;
        if (Array.isArray(game.rounds)) return sum + game.rounds.length;
        return sum + 1;
    }, 0);
    const totalQuizzesPlayed = typeof data.totalQuizzesPlayed === "number" ? data.totalQuizzesPlayed : inferredTotalGames;
    const totalQuestionsAttempted = typeof data.totalQuestionsAttempted === "number" ? data.totalQuestionsAttempted : inferredTotalQuestions;
    const inferredTotalCorrect = recentGames.reduce((sum, game) => {
        if (typeof game.score === "number") return sum + game.score;
        if (Array.isArray(game.rounds)) return sum + game.rounds.reduce((s, r) => s + (r.score > 0 ? 1 : 0), 0);
        return sum + (game.score > 0 ? 1 : 0);
    }, 0);
    const totalCorrectAnswers = typeof data.totalCorrectAnswers === "number"
        ? data.totalCorrectAnswers
        : inferredTotalCorrect;
    const createdAt = typeof data.createdAt === "number" ? data.createdAt : Date.now();
    const streaks = calculateStreaks(activityDays);

    return {
        uid: data.uid ?? fallback.uid,
        username: data.username ?? fallback.username,
        usernameLower: data.usernameLower ?? normalizeUsername(data.username ?? fallback.username),
        email: data.email ?? fallback.email,
        provider: data.provider ?? fallback.provider,
        createdAt,
        totalQuizzesPlayed,
        totalQuestionsAttempted,
        totalCorrectAnswers,
        currentStreak: typeof data.currentStreak === "number" ? data.currentStreak : streaks.currentStreak,
        bestStreak: typeof data.bestStreak === "number" ? data.bestStreak : streaks.bestStreak,
        lastPlayedAt: typeof data.lastPlayedAt === "number" ? data.lastPlayedAt : null,
        recentGames,
        favoriteAnime: Array.isArray(data.favoriteAnime) ? data.favoriteAnime : buildFavoriteAnime(recentGames),
        activityDays,
        dailyActivityCounts: data.dailyActivityCounts ?? {},
    };
}

export async function seedUserProfileDocument(input: SeedProfileInput): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    const ref = doc(db, "users", input.uid);
    const snapshot = await readProfileSnapshot(input.uid);
    const existing = snapshot?.exists() ? (snapshot.data() as Partial<UserProfileDocument>) : {};
    const createdAt = typeof existing.createdAt === "number" ? existing.createdAt : Date.now();
    const merged = normalizeProfileDocument({ ...existing, ...input, usernameLower: normalizeUsername(input.username), createdAt }, input);

    try {
        await setDoc(ref, merged, { merge: true });
    } catch {
        return;
    }
}

export async function getUserProfile(uid: string, fallback?: SeedProfileInput): Promise<UserProfileView | null> {
    if (!isFirebaseConfigured || !db) return null;

    const snapshot = await readProfileSnapshot(uid);
    if (!snapshot?.exists()) return null;

    const raw = snapshot.data() as Partial<UserProfileDocument>;
    // fetch recent games from subcollection
    let fetchedRecent: UserProfileGame[] = [];
    try {
        const gamesColl = collection(db, "users", uid, "games");
        const q = query(gamesColl, orderBy("timestamp", "desc"), limitQuery(50));
        const docs = await getDocs(q);
        fetchedRecent = docs.docs.map((d) => d.data() as UserProfileGame);
    } catch {
        fetchedRecent = Array.isArray(raw.recentGames) ? raw.recentGames as UserProfileGame[] : [];
    }
    const derivedFallback = fallback ?? {
        uid,
        username: raw.username ?? "Player",
        email: raw.email ?? "",
        provider: raw.provider ?? "password",
    };
    const profile = normalizeProfileDocument({ ...raw, uid, recentGames: fetchedRecent }, derivedFallback);
    const averageScore = profile.totalQuizzesPlayed > 0
        ? (profile.totalCorrectAnswers / Math.max(profile.totalQuestionsAttempted, 1)) * 100
        : 0;

    return { ...profile, averageScore };
}

export async function recordQuizRound(input: RecordQuizRoundInput): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    const ref = doc(db, "users", input.uid);
    const snapshot = await readProfileSnapshot(input.uid);
    const existing = snapshot?.exists() ? (snapshot.data() as Partial<UserProfileDocument>) : {};
    const seed = normalizeProfileDocument(
        {
            ...existing,
            uid: input.uid,
            username: input.username,
            usernameLower: normalizeUsername(input.username),
            email: input.email,
            provider: input.provider ?? existing.provider ?? "password",
        },
        {
            uid: input.uid,
            username: input.username,
            email: input.email,
            provider: input.provider ?? existing.provider ?? "password",
        },
    );

    const timestamp = input.timestamp ?? Date.now();
    const dayKey = toDayKey(timestamp);

    // Update aggregates on the profile doc without storing full per-round history here.
    const activityDays = [...seed.activityDays, dayKey];
    const dailyActivityCounts = {
        ...seed.dailyActivityCounts,
        [dayKey]: (seed.dailyActivityCounts[dayKey] ?? 0) + 1,
    };
    const totalQuizzesPlayed = seed.totalQuizzesPlayed + 1;
    const totalQuestionsAttempted = seed.totalQuestionsAttempted + 1;
    const totalCorrectAnswers = seed.totalCorrectAnswers + input.score;
    const streaks = calculateStreaks(activityDays);

    // Optionally write single-round record into the games subcollection for more granular history
    const roundEntry: UserProfileGame = {
        id: `${timestamp}-${input.animeTitle}`,
        animeTitle: input.animeTitle,
        score: input.score,
        timestamp,
    };

    try {
        const roundRef = doc(db, "users", input.uid, "games", roundEntry.id);
        await setDoc(roundRef, roundEntry);
    } catch {
        // ignore failure to write per-round doc; still update aggregates
    }

    // Refresh recent games to compute favoriteAnime
    let recentGamesFromCollection: UserProfileGame[] = [];
    try {
        const gamesColl = collection(db, "users", input.uid, "games");
        const q = query(gamesColl, orderBy("timestamp", "desc"), limitQuery(50));
        const docs = await getDocs(q);
        recentGamesFromCollection = docs.docs.map((d) => d.data() as UserProfileGame);
    } catch {
        recentGamesFromCollection = seed.recentGames;
    }

    const nextProfile: Partial<UserProfileDocument> = {
        totalQuizzesPlayed,
        totalQuestionsAttempted,
        totalCorrectAnswers,
        currentStreak: streaks.currentStreak,
        bestStreak: Math.max(seed.bestStreak, streaks.bestStreak),
        lastPlayedAt: timestamp,
        favoriteAnime: buildFavoriteAnime(recentGamesFromCollection),
        activityDays,
        dailyActivityCounts,
    };

    try {
        await setDoc(ref, nextProfile, { merge: true });
    } catch {
        return;
    }
}

type RecordGameSessionInput = {
    uid: string;
    username: string;
    email: string;
    provider?: "password" | "google";
    animeTitle?: string;
    score: number;
    totalRounds?: number;
    rounds?: UserProfileGame[];
    timestamp?: number;
};

export async function recordGameSession(input: RecordGameSessionInput): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    const timestamp = input.timestamp ?? Date.now();
    const sessionEntry: UserProfileGame = {
        id: `${timestamp}-session`,
        animeTitle: input.animeTitle ?? (input.rounds && input.rounds[0]?.animeTitle) ?? "Session",
        score: input.score,
        timestamp,
        totalRounds: input.totalRounds,
        rounds: input.rounds,
    };

    // Write session to the subcollection
    try {
        const gameRef = doc(db, "users", input.uid, "games", sessionEntry.id);
        await setDoc(gameRef, sessionEntry);
    } catch {
        return; // abort if we cannot persist the session
    }

    // Update profile aggregates (do not store full recentGames in the profile doc)
    const ref = doc(db, "users", input.uid);
    const snapshot = await readProfileSnapshot(input.uid);
    const existing = snapshot?.exists() ? (snapshot.data() as Partial<UserProfileDocument>) : {};
    const seed = normalizeProfileDocument(
        {
            ...existing,
            uid: input.uid,
            username: input.username,
            usernameLower: normalizeUsername(input.username),
            email: input.email,
            provider: input.provider ?? existing.provider ?? "password",
        },
        {
            uid: input.uid,
            username: input.username,
            email: input.email,
            provider: input.provider ?? existing.provider ?? "password",
        },
    );

    const dayKey = toDayKey(timestamp);
    const activityDays = [...seed.activityDays, dayKey];
    const dailyActivityCounts = {
        ...seed.dailyActivityCounts,
        [dayKey]: (seed.dailyActivityCounts[dayKey] ?? 0) + 1,
    };
    const sessionRoundsCount = typeof input.totalRounds === "number" ? input.totalRounds : (Array.isArray(input.rounds) ? input.rounds.length : 1);
    const totalQuizzesPlayed = seed.totalQuizzesPlayed + 1;
    const totalQuestionsAttempted = seed.totalQuestionsAttempted + sessionRoundsCount;
    const totalCorrectAnswers = seed.totalCorrectAnswers + input.score;
    const streaks = calculateStreaks(activityDays);

    // derive favoriteAnime from the games subcollection
    let recentGamesFromCollection: UserProfileGame[] = [];
    try {
        const gamesColl = collection(db, "users", input.uid, "games");
        const q = query(gamesColl, orderBy("timestamp", "desc"), limitQuery(50));
        const docs = await getDocs(q);
        recentGamesFromCollection = docs.docs.map((d) => d.data() as UserProfileGame);
    } catch {
        recentGamesFromCollection = seed.recentGames;
    }

    const nextProfile: Partial<UserProfileDocument> = {
        totalQuizzesPlayed,
        totalQuestionsAttempted,
        totalCorrectAnswers,
        currentStreak: streaks.currentStreak,
        bestStreak: Math.max(seed.bestStreak, streaks.bestStreak),
        lastPlayedAt: timestamp,
        favoriteAnime: buildFavoriteAnime(recentGamesFromCollection),
        activityDays,
        dailyActivityCounts,
    };

    try {
        await setDoc(ref, nextProfile, { merge: true });
    } catch {
        return;
    }
}