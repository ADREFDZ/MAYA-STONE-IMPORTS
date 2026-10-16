"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "./actions";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country_code: string | null;
  role: string;
  created_at: string;
}

export default function UsersManagerClient({
  initialUsers,
}: {
  initialUsers: Profile[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const roleOptions = [
    { label: "Cliente", value: "client" },
    { label: "Administrador", value: "admin" },
    { label: "Agente de Ventas", value: "sales_agent" },
    { label: "Arquitecto", value: "architect" },
  ];

  const columns: Column<Profile>[] = [
    {
      header: "Nombre",
      accessorKey: (row) => (
        <span className="font-sans font-medium text-black-neutral text-maya-small">
          {row.name || "Sin Nombre"}
        </span>
      ),
    },
    {
      header: "Correo Electrónico",
      accessorKey: (row) => (
        <span className="font-mono text-maya-small text-black-neutral/80">
          {row.email}
        </span>
      ),
    },
    {
      header: "Teléfono",
      accessorKey: (row) => {
        if (!row.phone)
          return <span className="font-mono text-black-neutral/40">N/A</span>;
        return (
          <span className="font-mono text-maya-small text-black-neutral/70">
            {row.country_code ? `${row.country_code} ${row.phone}` : row.phone}
          </span>
        );
      },
    },
    {
      header: "Rol",
      accessorKey: (row) => (
        <span className="px-2.5 py-1 text-maya-label uppercase tracking-data bg-accent-soft border border-accent/25 text-black-neutral font-mono font-semibold rounded-3xs">
          {row.role}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createUserAction(formData);

    if (res.success) {
      setIsCreateOpen(false);
      router.refresh();
    } else {
      setError(res.error || "Error al crear usuario.");
    }
    setLoading(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateUserAction(editingUser.id, formData);

    if (res.success) {
      setEditingUser(null);
      router.refresh();
    } else {
      setError(res.error || "Error al actualizar usuario.");
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setLoading(true);

    const res = await deleteUserAction(deletingUser.id);
    if (res.success) {
      setDeletingUser(null);
      router.refresh();
    } else {
      setError(res.error || "Error al eliminar.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-end">
        <Button
          variant="primary"
          className="font-mono text-maya-label uppercase tracking-data py-2.5 px-5 rounded-3xs shadow-xs"
          onClick={() => setIsCreateOpen(true)}
        >
          + Nuevo Usuario
        </Button>
      </div>

      <div className="bg-surface border border-border-light rounded-2xs shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          onEdit={(row) => setEditingUser(row)}
          onDelete={(row) => setDeletingUser(row)}
        />
      </div>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Usuario"
      >
        <form
          onSubmit={handleCreateSubmit}
          className="space-y-4 font-sans text-maya-small"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-mono text-maya-small rounded-3xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
              Contraseña Inicial *
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Cód. País
              </label>
              <input
                type="text"
                name="country_code"
                placeholder="+52"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="4771234567"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
              Rol de Usuario
            </label>
            <select
              name="role"
              defaultValue="client"
              className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono cursor-pointer"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full font-mono text-maya-label uppercase tracking-data py-3 rounded-3xs shadow-xs"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuario"
      >
        {editingUser && (
          <form
            onSubmit={handleUpdateSubmit}
            className="space-y-4 font-sans text-maya-small"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-mono text-maya-small rounded-3xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editingUser.name || ""}
                required
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                defaultValue={editingUser.email}
                required
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  Cód. País
                </label>
                <input
                  type="text"
                  name="country_code"
                  defaultValue={editingUser.country_code || ""}
                  placeholder="+52"
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingUser.phone || ""}
                  placeholder="4771234567"
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Rol de Usuario
              </label>
              <select
                name="role"
                defaultValue={editingUser.role}
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono cursor-pointer"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-border-light space-y-1">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                Cambiar Contraseña (Opcional)
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Dejar en blanco para no modificar"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent font-mono"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full font-mono text-maya-label uppercase tracking-data py-3 rounded-3xs shadow-xs"
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4 font-sans text-maya-small">
          <p className="text-black-neutral/80 leading-relaxed font-light">
            ¿Estás seguro de que deseas eliminar al usuario{" "}
            <strong className="font-mono font-bold text-black-neutral">
              {deletingUser?.email}
            </strong>
            ? Esta acción borrará permanentemente sus credenciales de acceso.
          </p>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-mono text-maya-small rounded-3xs">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2 font-mono text-maya-label uppercase tracking-data">
            <button
              type="button"
              className="w-1/2 py-2.5 border border-border-light text-black-neutral/70 hover:bg-surface-secondary rounded-3xs cursor-pointer"
              onClick={() => setDeletingUser(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="w-1/2 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-3xs cursor-pointer font-bold shadow-xs"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
