import Image from 'next/image'
import Link from 'next/link'

export default function EmailUpdatedPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Image
          src="/logo.png"
          alt="Ooma Wellness"
          width={120}
          height={48}
          style={{ objectFit: 'contain', marginBottom: 32 }}
        />

        <div style={styles.iconCircle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F7F3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={styles.title}>Email Updated Successfully</h1>
        <p style={styles.body}>
          Your email address has been updated. You can now close this page and go back to the Ooma App.
        </p>

        <a href="ooma://" style={styles.button}>
          Back to Ooma
        </a>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F7F3EE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    backgroundColor: '#FAFAF7',
    border: '1px solid #E0D8D0',
    borderRadius: '8px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#6B1D2E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1A1512',
    margin: '0 0 12px',
    lineHeight: '1.3',
  },
  body: {
    fontSize: '15px',
    color: '#9A8F87',
    lineHeight: '1.6',
    margin: '0 0 32px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#6B1D2E',
    color: '#F7F3EE',
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '2px',
    fontSize: '12px',
    fontWeight: '500',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
}
