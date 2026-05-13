import xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { logger } from '../utils/logger';

export interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  dueDate: Date;
  status: string;
  paymentMethod?: string;
  category?: string;
  client?: string;
  reference?: string;
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedTransaction[];
  errors: string[];
  summary: {
    total: number;
    processed: number;
    income: number;
    expense: number;
    totalIncome: number;
    totalExpense: number;
  };
}

// Mapeamento de categorias por palavras-chave
const categoryKeywords: Record<string, string[]> = {
  'Salários': ['salario', 'salário', 'folha', 'pagamento funcionario', 'remuneracao'],
  'Fornecedores': ['fornecedor', 'compra', 'aquisicao', 'estoque', 'produto'],
  'Aluguel': ['aluguel', 'locacao', 'locação', 'arrendamento'],
  'Utilidades': ['energia', 'agua', 'luz', 'telefone', 'internet', 'gas'],
  'Impostos': ['imposto', 'taxa', 'tributo', 'inss', 'fgts', 'ir ', 'iss', 'pis', 'cofins'],
  'Logística': ['frete', 'transporte', 'entrega', 'logistica', 'logística'],
  'Marketing': ['marketing', 'publicidade', 'propaganda', 'anuncio', 'google', 'facebook'],
  'Manutenção': ['manutencao', 'manutenção', 'reparo', 'conserto'],
  'Vendas de Produtos': ['venda', 'receita', 'faturamento', 'pedido', 'nf', 'nota fiscal'],
};

function detectCategory(description: string): string | undefined {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => desc.includes(kw))) return category;
  }
  return undefined;
}

function detectType(description: string, amount: number): 'INCOME' | 'EXPENSE' {
  const desc = description.toLowerCase();
  const incomeWords = ['receita', 'venda', 'recebimento', 'entrada', 'credito', 'crédito', 'faturamento'];
  const expenseWords = ['despesa', 'pagamento', 'debito', 'débito', 'saida', 'saída', 'custo', 'compra'];

  if (incomeWords.some(w => desc.includes(w))) return 'INCOME';
  if (expenseWords.some(w => desc.includes(w))) return 'EXPENSE';

  // Se o valor é negativo, é despesa
  return amount < 0 ? 'EXPENSE' : 'INCOME';
}

function parseDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const str = String(value);

  // Formato DD/MM/YYYY
  const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}`);

  // Formato YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(str);

  // Excel serial date
  if (!isNaN(Number(str))) {
    const excelDate = xlsx.SSF.parse_date_code(Number(str));
    if (excelDate) return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
  }

  return new Date(str) || new Date();
}

function parseAmount(value: any): number {
  if (typeof value === 'number') return Math.abs(value);
  const str = String(value)
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  return Math.abs(parseFloat(str) || 0);
}

function normalizeHeaders(row: Record<string, any>): Record<string, string> {
  const normalized: Record<string, string> = {};
  const mappings: Record<string, string[]> = {
    description: ['descricao', 'descrição', 'description', 'historico', 'histórico', 'lancamento', 'lançamento', 'nome', 'detalhes'],
    amount: ['valor', 'amount', 'value', 'montante', 'quantia', 'vl ', 'vl_'],
    date: ['data', 'date', 'vencimento', 'data_vencimento', 'data vencimento', 'competencia', 'competência'],
    type: ['tipo', 'type', 'natureza', 'operacao'],
    status: ['status', 'situacao', 'situação'],
    client: ['cliente', 'client', 'sacado', 'pagador', 'beneficiario'],
    reference: ['referencia', 'referência', 'ref', 'numero', 'número', 'nf', 'doc'],
    paymentMethod: ['forma_pagamento', 'forma pagamento', 'payment', 'pagamento'],
  };

  for (const [key, headers] of Object.entries(row)) {
    const normalKey = key.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const [field, variants] of Object.entries(mappings)) {
      if (variants.some(v => normalKey.includes(v.normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
        normalized[field] = String(headers || '');
      }
    }
  }

  return normalized;
}

export async function parseExcel(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const data: ParsedTransaction[] = [];

  try {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' }) as Record<string, any>[];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const norm = normalizeHeaders(row);

        if (!norm.description && !norm.amount) continue;

        const amount = parseAmount(norm.amount || Object.values(row).find(v => !isNaN(parseFloat(String(v).replace(',', '.').replace(/[R$\s.]/g, '')))) || 0);
        if (amount === 0) continue;

        const description = norm.description || `Linha ${i + 2}`;
        const type = norm.type
          ? (norm.type.toLowerCase().includes('receit') || norm.type.toLowerCase().includes('cred') || norm.type.toLowerCase() === 'c' ? 'INCOME' : 'EXPENSE')
          : detectType(description, amount);

        data.push({
          description: description.substring(0, 255),
          amount,
          type,
          dueDate: parseDate(norm.date),
          status: norm.status?.toLowerCase().includes('pag') ? 'PAID' : 'PENDING',
          category: detectCategory(description),
          client: norm.client?.substring(0, 100),
          reference: norm.reference?.substring(0, 50),
          paymentMethod: norm.paymentMethod ? mapPaymentMethod(norm.paymentMethod) : undefined,
        });
      } catch (e) {
        errors.push(`Linha ${i + 2}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Erro ao ler Excel: ${e}`);
  }

  return buildResult(data, errors);
}

export async function parseCsv(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const data: ParsedTransaction[] = [];

  try {
    const text = buffer.toString('utf-8');
    const rows = csvParse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }) as Record<string, any>[];

    for (let i = 0; i < rows.length; i++) {
      try {
        const norm = normalizeHeaders(rows[i]);
        if (!norm.description && !norm.amount) continue;

        const amount = parseAmount(norm.amount || 0);
        if (amount === 0) continue;

        const description = norm.description || `Linha ${i + 2}`;
        const type = norm.type
          ? (norm.type.toLowerCase().includes('receit') || norm.type === 'C' ? 'INCOME' : 'EXPENSE')
          : detectType(description, amount);

        data.push({
          description: description.substring(0, 255),
          amount,
          type,
          dueDate: parseDate(norm.date),
          status: norm.status?.toLowerCase().includes('pag') ? 'PAID' : 'PENDING',
          category: detectCategory(description),
          client: norm.client?.substring(0, 100),
          reference: norm.reference?.substring(0, 50),
        });
      } catch (e) {
        errors.push(`Linha ${i + 2}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Erro ao parsear CSV: ${e}`);
  }

  return buildResult(data, errors);
}

function mapPaymentMethod(value: string): string | undefined {
  const v = value.toLowerCase();
  if (v.includes('pix')) return 'PIX';
  if (v.includes('credito') || v.includes('crédito') || v.includes('credit')) return 'CREDIT_CARD';
  if (v.includes('debito') || v.includes('débito') || v.includes('debit')) return 'DEBIT_CARD';
  if (v.includes('boleto')) return 'BOLETO';
  if (v.includes('cheque')) return 'CHECK';
  if (v.includes('transfer') || v.includes('ted') || v.includes('doc')) return 'BANK_TRANSFER';
  if (v.includes('dinheiro') || v.includes('especie') || v.includes('espécie') || v.includes('cash')) return 'CASH';
  return undefined;
}

function buildResult(data: ParsedTransaction[], errors: string[]): ParseResult {
  const income = data.filter(d => d.type === 'INCOME');
  const expense = data.filter(d => d.type === 'EXPENSE');

  return {
    success: errors.length === 0,
    data,
    errors,
    summary: {
      total: data.length + errors.length,
      processed: data.length,
      income: income.length,
      expense: expense.length,
      totalIncome: income.reduce((s, d) => s + d.amount, 0),
      totalExpense: expense.reduce((s, d) => s + d.amount, 0),
    },
  };
}
