import { ToastProvider } from './components/ui/toast';
import { RobotInit } from './components/robot-init/robot-init';

function App() {
  return (
    <ToastProvider>
      <div className="flex flex-col h-screen">
        {/* Top navbar */}
        <header className="flex items-center justify-between h-12 px-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary" />
            <span className="text-primary font-semibold text-base">Autall</span>
          </div>
          <span className="text-sm text-muted-foreground">サンプル店舗</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <RobotInit />
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
