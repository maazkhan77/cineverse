import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>
        Made with <span className={styles.heart}>❤️</span> by{" "}
        <a
          href="https://iammaaz.in"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Maaz
        </a>
        {" "}and{" "}
        <span className={styles.link}>
          Antigravity
        </span>
      </span>
    </footer>
  );
}
