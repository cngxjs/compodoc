import { Component } from '@angular/core';

/**
 * Displays system audit log entries.
 *
 * @since 1.2.0
 */
@Component({
    selector: 'app-audit-log',
    standalone: true,
    template: `<table><thead><tr><th>Time</th><th>Action</th></tr></thead></table>`,
})
export class AuditLogComponent {}
