/** Runs before paint to avoid light flash when dark mode is saved. */
export function ThemeScript({ nonce }: { nonce?: string }) {
  const script = `(function(){try{var k="codkabukaanka-theme";var t=localStorage.getItem(k);var d=t==="dark"||(!t||t!=="light");document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
  return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}
