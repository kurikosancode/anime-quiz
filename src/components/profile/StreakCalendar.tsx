import styles from "./StreakCalendar.module.css";

type StreakCalendarProps = {
    currentStreak: number;
    bestStreak: number;
    dailyActivityCounts: Record<string, number>;
};

export default function StreakCalendar({ currentStreak, bestStreak, dailyActivityCounts }: StreakCalendarProps) {
    const toDayKey = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const weeks = Array.from({ length: 52 }, (_, weekIndex) => {
        return Array.from({ length: 7 }, (_, dayIndex) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - ((51 - weekIndex) * 7 + (6 - dayIndex)));
            const key = toDayKey(date);
            return dailyActivityCounts[key] ?? null;
        });
    });

    const getActivityClass = (value: number | null): string => {
        if (value === null || value === undefined) return styles.empty;
        if (value <= 1) return styles.level0;
        if (value === 2) return styles.level1;
        if (value === 3) return styles.level2;
        return styles.level3;
    };

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.streakStats}>
                <div className={styles.streakStat}>
                    <span className={styles.streakLabel}>Current Streak</span>
                    <span className={styles.streakValue}>{currentStreak} days</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.streakStat}>
                    <span className={styles.streakLabel}>Best Streak</span>
                    <span className={styles.streakValue}>{bestStreak} days</span>
                </div>
            </div>

            <div className={styles.calendarWrapper}>
                <div className={styles.dayLabelsColumn}>
                    {dayLabels.map((day) => (
                        <div key={day} className={styles.dayLabel}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className={styles.calendar}>
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className={styles.week}>
                            {week.map((value, dayIdx) => (
                                <div
                                    key={`${weekIdx}-${dayIdx}`}
                                    className={`${styles.day} ${getActivityClass(value)}`}
                                    title={value === null ? "No activity" : `${value} quiz${value === 1 ? "" : "zes"}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.legend}>
                <span className={styles.legendLabel}>Less</span>
                <div className={`${styles.legendSquare} ${styles.empty}`} />
                <div className={`${styles.legendSquare} ${styles.level0}`} />
                <div className={`${styles.legendSquare} ${styles.level1}`} />
                <div className={`${styles.legendSquare} ${styles.level2}`} />
                <div className={`${styles.legendSquare} ${styles.level3}`} />
                <span className={styles.legendLabel}>More</span>
            </div>
        </div>
    );
}
