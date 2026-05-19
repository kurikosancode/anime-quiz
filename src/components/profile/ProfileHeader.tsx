import styles from "./ProfileHeader.module.css";
import type { ReactNode } from "react";

type ProfileHeaderProps = {
    username: string;
    joinedDate: number | null;
    action?: ReactNode;
};

export default function ProfileHeader({ username, joinedDate, action }: ProfileHeaderProps) {
    const formatDate = (timestamp: number | null): string => {
        if (!timestamp) return "Recently joined";
        const date = new Date(timestamp);
        return `Joined ${date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
    };

    return (
        <div className={styles.header}>
            <div className={styles.identityWrap}>
                <div className={styles.avatarPlaceholder}>
                    <span>{username.charAt(0).toUpperCase()}</span>
                </div>
                <div className={styles.headerContent}>
                    <h1 className={styles.username}>{username}</h1>
                    <p className={styles.joinedDate}>{formatDate(joinedDate)}</p>
                </div>
            </div>
            {action && <div className={styles.actionWrap}>{action}</div>}
        </div>
    );
}
