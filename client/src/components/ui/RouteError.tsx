import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const status = isRouteErrorResponse(error) ? error.status : null;
  return <div className="grid min-h-[60vh] place-items-center p-5 text-ink" role="alert">
    <section className="w-full max-w-md rounded-lg border border-line bg-paper p-7 text-center">
      <FiAlertTriangle className="mx-auto mb-4 text-3xl text-danger" />
      <h1 className="text-xl font-semibold">{status === 404 ? "Page not found" : "This page couldn’t load"}</h1>
      <p className="mt-2 text-sm text-muted">{status ? `Request failed with status ${status}.` : "Try loading the page again. If the problem continues, return to the previous screen."}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-xs font-semibold" onClick={() => navigate(-1)}><FiArrowLeft /> Go back</button>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-xs font-semibold text-white" onClick={() => window.location.reload()}><FiRefreshCw /> Retry</button>
      </div>
    </section>
  </div>;
}
