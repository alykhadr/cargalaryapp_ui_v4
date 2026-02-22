import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessControlService } from '../core/services/access-control.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: false
})
export class HasPermissionDirective implements OnChanges {
  @Input('appHasPermission') permission!: string | string[];
  @Input() appHasPermissionMode: 'any' | 'all' = 'any';

  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private accessControlService: AccessControlService
  ) {}

  ngOnChanges(): void {
    const requireAll = this.appHasPermissionMode === 'all';
    const canShow = this.accessControlService.hasPermission(this.permission, requireAll);

    if (canShow && !this.isVisible) {
      this.viewContainerRef.clear();
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.isVisible = true;
      return;
    }

    if (!canShow && this.isVisible) {
      this.viewContainerRef.clear();
      this.isVisible = false;
    }
  }
}
