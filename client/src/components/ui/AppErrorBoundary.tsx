import { Component, type ErrorInfo, type ReactNode } from "react";
import { FiAlertTriangle, FiHome, FiRefreshCw } from "react-icons/fi";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Application render failure", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="grid min-h-dvh place-items-center bg-bg p-5 text-ink">
      <section className="w-full max-w-md rounded-lg border border-line bg-paper p-7 text-center shadow-sm" role="alert">
        <FiAlertTriangle className="mx-auto mb-4 text-3xl text-danger" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">Your account data is safe. Reload this view or return to your dashboard.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-xs font-semibold text-white" onClick={() => { this.reset(); window.location.reload(); }}><FiRefreshCw /> Reload</button>
          <a className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-xs font-semibold" href="/dashboard"><FiHome /> Dashboard</a>
        </div>
        {import.meta.env.DEV && <details className="mt-5 text-left text-xs text-muted"><summary className="cursor-pointer">Developer details</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-tint p-3">{this.state.error.message}</pre></details>}
      </section>
    </main>;
  }
}
