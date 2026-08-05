export interface AuditEvent {
  id: string;
  entityType: 'patient' | 'visit' | 'subscription';
  entityId: string;
  action: string;
  performedBy: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface NewAuditEventInput {
  entityType: AuditEvent['entityType'];
  entityId: string;
  action: string;
  performedBy: string;
  details?: Record<string, unknown>;
}
