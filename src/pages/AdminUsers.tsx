import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Zap,
  Building
} from "lucide-react";
import { useAdminUsers, useUpdateUserPlan, useToggleAdminStatus } from "@/hooks/useAdmin";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const planBadgeStyles: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  business: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
};

const planIcons: Record<string, React.ReactNode> = {
  free: <User className="h-3 w-3" />,
  pro: <Zap className="h-3 w-3" />,
  business: <Building className="h-3 w-3" />,
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading } = useAdminUsers(page, limit);
  const updatePlan = useUpdateUserPlan();
  const toggleAdmin = useToggleAdminStatus();

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const filteredUsers = data?.users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Usuarios</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los usuarios de PayTrack
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {data?.total || 0} usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pagos</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {user.full_name?.[0] || user.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {user.full_name || "Sin nombre"}
                                    {user.is_admin && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={planBadgeStyles[user.plan_id] || planBadgeStyles.free}>
                                <span className="mr-1">{planIcons[user.plan_id]}</span>
                                {user.plan_id.charAt(0).toUpperCase() + user.plan_id.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                {user.status === "active" ? "Activo" : user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{user.payments_count}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(user.created_at), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => toggleAdmin.mutate({
                                      userId: user.id,
                                      isAdmin: !user.is_admin
                                    })}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    {user.is_admin ? "Quitar admin" : "Hacer admin"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Cambiar plan
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => updatePlan.mutate({ userId: user.id, planId: "free" })}
                                    disabled={user.plan_id === "free"}
                                  >
                                    Free
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updatePlan.mutate({ userId: user.id, planId: "pro" })}
                                    disabled={user.plan_id === "pro"}
                                  >
                                    Pro
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updatePlan.mutate({ userId: user.id, planId: "business" })}
                                    disabled={user.plan_id === "business"}
                                  >
                                    Business
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
