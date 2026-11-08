const nomesPerfil: Record<string, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gerente',
  USER: 'Funcionário',
  CLIENTE: 'Cliente',
  FORNECEDOR: 'Fornecedor',
};

export function nomePerfil(role: string): string {
  return nomesPerfil[role] ?? role;
}