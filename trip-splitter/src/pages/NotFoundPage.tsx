import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section>
      <h1>Page Not Found</h1>
      <p>The page you were looking for does not exist.</p>
      <Link to="/">Return home</Link>
    </section>
  );
}