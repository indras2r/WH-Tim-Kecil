import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Terjadi kesalahan tak terduga" };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center border border-gray-200 rounded-sm bg-white p-8">
            <h1 className="font-display text-2xl font-bold text-gray-900">Ups, terjadi kesalahan</h1>
            <p className="text-sm text-gray-500 mt-2">
              Halaman gagal dimuat. Coba muat ulang. Jika masih bermasalah, periksa koneksi ke server.
            </p>
            <p className="font-mono text-xs text-gray-400 mt-3 break-words">{this.state.message}</p>
            <button
              data-testid="error-reload-btn"
              onClick={() => window.location.reload()}
              className="mt-5 px-4 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
