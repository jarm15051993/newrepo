export default async function WalletApplePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const passUrl = token ? `/api/wallet/apple?token=${token}` : null

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ooma — Add to Wallet</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, sans-serif;
            background: #F7F3EE;
            color: #1A1512;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px 24px;
            gap: 24px;
          }
          .logo {
            font-size: 48px;
            font-weight: 700;
            color: #6B1D2E;
            letter-spacing: -1px;
          }
          .message {
            font-size: 17px;
            text-align: center;
            color: #4A3F38;
            line-height: 1.5;
          }
          .btn {
            display: inline-block;
            background: #6B1D2E;
            color: #F7F3EE;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 16px 40px;
            border-radius: 2px;
            text-decoration: none;
            margin-top: 8px;
          }
          .btn-secondary {
            background: transparent;
            color: #6B1D2E;
            border: 1px solid #6B1D2E;
          }
        `}</style>
      </head>
      <body>
        {passUrl ? (
          <>
            <div className="logo">O</div>
            <p className="message">
              Your class pass is being added to Apple Wallet.
            </p>
            <a href={passUrl} className="btn">Add to Wallet</a>
            <a href="ooma://" className="btn btn-secondary">Return to Ooma</a>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Auto-trigger the pass download
                  setTimeout(function() {
                    window.location.href = '${passUrl}';
                  }, 300);
                  // After wallet sheet appears, offer redirect
                `,
              }}
            />
          </>
        ) : (
          <p className="message">Invalid or expired link. Please try again from the app.</p>
        )}
      </body>
    </html>
  )
}
