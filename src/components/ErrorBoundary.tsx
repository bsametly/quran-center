import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        });
      }
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-sand-50 p-4" dir="rtl">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-sand-200 shadow-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-xl font-bold text-sand-900 mb-2">حدث خطأ غير متوقع أثناء تحميل الصفحة</h1>
            <p className="text-sm text-sand-500 mb-6 leading-relaxed">
              نعتذر عن هذا العطل، تم حصر الخطأ لمنع الشاشة البيضاء. يمكنك إعادة تحميل الصفحة أو إعادة تعيين الذاكرة المؤقتة.
            </p>

            {this.state.error && (
              <div className="text-left bg-red-50/70 border border-red-200 rounded-xl p-3 mb-6 overflow-x-auto text-[12px] font-mono text-red-800 dir-ltr">
                <div className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-red-600 whitespace-pre-wrap line-clamp-4">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                <RefreshCcw size={16} /> إعادة تحميل الصفحة
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                <Trash2 size={16} /> مسح الكاش والبيانات المؤقتة
              </button>
              <button
                onClick={() => { window.location.href = '#/login'; window.location.reload(); }}
                className="inline-flex items-center justify-center gap-2 border border-sand-300 bg-white hover:bg-sand-50 text-sand-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
              >
                <Home size={16} /> الذهاب للدخول
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
