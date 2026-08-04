export interface AuditEvent {
  id: string;
  entityType: 'patient' | 'visit' | 'subscription';
  entityId: string;
  action: string;
  performedBy: string;
  createdAt: string;
  details?: Record<string, unknown>;
}
