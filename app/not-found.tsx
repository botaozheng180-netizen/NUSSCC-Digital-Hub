import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page empty-state">
      <div className="error-code">404</div>
      <h1>This route is off the roadmap</h1>
      <p>The page may have moved, or it has not been built yet.</p>
      <Link className="button primary" href="/">
        Return to dashboard
      </Link>
    </div>
  );
}
