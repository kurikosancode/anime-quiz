import styles from "./StatCard.module.css";

type StatCardProps = {
    label: string;
    value: string | number;
};

export default function StatCard({ label, value }: StatCardProps) {
    return (
        <div className={styles.card}>
            <p className={styles.label}>{label}</p>
            <p className={styles.value}>{value}</p>
        </div>
    );
}
