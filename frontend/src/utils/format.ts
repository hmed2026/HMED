export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
  PARTIAL: 'Parcial',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
  CHECK: 'Cheque',
  OTHER: 'Outro',
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Pessoa Física',
  COMPANY: 'Empresa',
  HOSPITAL: 'Hospital',
  CLINIC: 'Clínica',
  PHARMACY: 'Farmácia',
  DISTRIBUTOR: 'Distribuidora',
  OTHER: 'Outro',
};
