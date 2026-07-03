export function InstallPanel() {
  return <section className="card full installPanel">
    <h2>Install on Phone</h2>
    <div className="installGrid">
      <div>
        <h3>iPhone</h3>
        <p>Open Bear Tracker in Safari, tap Share, then tap <b>Add to Home Screen</b>.</p>
      </div>
      <div>
        <h3>Android</h3>
        <p>Open Bear Tracker in Chrome, tap the menu, then tap <b>Install app</b> or <b>Add to Home screen</b>.</p>
      </div>
      <div>
        <h3>Offline note</h3>
        <p>The app shell can open offline after installation, but shared live scoring will require the future Supabase connection.</p>
      </div>
    </div>
  </section>;
}
