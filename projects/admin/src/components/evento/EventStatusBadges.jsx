import { useEffect, useState } from "react";
import constants from "../../constants";
import styles from "./EventStatusBadges.module.css";

export function EventStatusBadges({ exchangeName }) {
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, withErrors: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${constants.apiEvents}/stats?exchangeName=${exchangeName}`);
      const data = await res.json();
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, [exchangeName]);

  return (
    <div className={styles.badges}>
      <div className={`${styles.badge} ${styles.pending}`}>
        <span className={styles.count}>{stats.pending}</span>
        <span className={styles.label}>En cola</span>
      </div>
      <div className={`${styles.badge} ${styles.inProgress}`}>
        <span className={styles.count}>{stats.inProgress}</span>
        <span className={styles.label}>En proceso</span>
      </div>
      <div className={`${styles.badge} ${styles.completed}`}>
        <span className={styles.count}>{stats.completed}</span>
        <span className={styles.label}>Completado</span>
      </div>
      <div className={`${styles.badge} ${styles.withErrors}`}>
        <span className={styles.count}>{stats.withErrors}</span>
        <span className={styles.label}>Con error</span>
      </div>
    </div>
  );
}
