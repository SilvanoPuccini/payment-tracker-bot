import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pt-bg)] p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-8xl font-bold bg-gradient-to-r from-[var(--pt-primary)] to-blue-400 bg-clip-text text-transparent">
            404
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Página no encontrada
        </h1>
        <p className="text-[var(--pt-text-muted)] mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-[var(--pt-border)] text-white hover:bg-[var(--pt-surface)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>
          <Link to="/">
            <Button className="w-full gradient-primary text-white">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
