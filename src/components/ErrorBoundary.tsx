import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'אירעה שגיאה בלתי צפויה באפליקציה.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CleanPesach ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] flex items-center justify-center p-6"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 p-7 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              משהו השתבש בדרך
            </h1>
            <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
              הנתונים המקומיים שלכם שמורים. ניתן לרענן את המסך כדי להמשיך בהכנות לחג.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>טען מחדש את קליןפסח</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
