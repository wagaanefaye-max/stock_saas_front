export interface Invoice {
  id: number;
  clientId: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  status: string;
  statusLabel: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string | null;
  lines: any[];
  createdById?: number | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** URL publique pour télécharger le PDF (générée pour les factures payées) */
  publicDownloadUrl?: string | null;
}

